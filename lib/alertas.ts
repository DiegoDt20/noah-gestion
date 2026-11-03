import type { PoolClient } from "pg";
import { pool } from "./db";
import type { Sesion } from "./auth";
export const TIPOS_ALERTA=["tarea_vencida","sin_actualizar","sin_reporte"] as const;
export const ESTADOS_ALERTA=["abierta","atendida","resuelta"] as const;
export type TipoAlerta=typeof TIPOS_ALERTA[number];
export interface FiltrosAlertas { proyecto?:number; tipo?:TipoAlerta; estado:typeof ESTADOS_ALERTA[number]|"todas"; pagina:number }
export interface AlertaFila { id_alerta:number;id_tarea:number;titulo:string;id_proyecto:number;proyecto:string;responsable:string;responsable_generacion:string|null;tipo:TipoAlerta;mensaje:string;estado:string;vigente:boolean;generada_en:string;accion_tomada:string|null;atendida_en:string|null;atendido_por:string|null;resuelta_en:string|null;motivo_resolucion:string|null }
export interface ConsultaAlertas { alertas:AlertaFila[];total:number;pagina:number;paginas:number;conteos:{abierta:number;atendida:number;resuelta:number};proyectos:{id:number;nombre:string}[] }
export class ErrorAlerta extends Error { constructor(mensaje:string,public status:number){super(mensaje);} }
export function filtrosAlertas(p:URLSearchParams):FiltrosAlertas {
 for(const k of p.keys()) if(!["proyecto","tipo","estado","pagina"].includes(k)||p.getAll(k).length>1)throw new Error("Filtros de alertas no válidos");
 const f:FiltrosAlertas={estado:"abierta",pagina:1};
 for(const k of ["proyecto","pagina"] as const){const v=p.get(k);if(!v)continue;if(!/^\d+$/.test(v)||!Number.isSafeInteger(Number(v))||Number(v)<1||Number(v)>(k==="pagina"?1000000:2147483647))throw new Error("Identificador o página no válidos");f[k]=Number(v);}
 const tipo=p.get("tipo");if(tipo){if(!TIPOS_ALERTA.includes(tipo as TipoAlerta))throw new Error("Tipo de alerta no válido");f.tipo=tipo as TipoAlerta;}
 const estado=p.get("estado");if(estado){if(![...ESTADOS_ALERTA,"todas"].includes(estado as FiltrosAlertas["estado"]))throw new Error("Estado de alerta no válido");f.estado=estado as FiltrosAlertas["estado"];}
 return f;
}
const alcance=`(($2='colaborador' AND t.id_responsable=$1 AND EXISTS(SELECT 1 FROM proyecto_miembro m WHERE m.id_proyecto=t.id_proyecto AND m.id_usuario=$1)) OR ($2='jefe_area' AND p.id_jefe=$1) OR $2 IN ('administrador','gerencia')) AND EXISTS(SELECT 1 FROM usuario lector JOIN rol rl ON rl.id_rol=lector.id_rol WHERE lector.id_usuario=$1 AND lector.activo AND rl.nombre=$2)`;
const alcanceProyecto=`(($2='colaborador' AND EXISTS(SELECT 1 FROM proyecto_miembro m WHERE m.id_proyecto=p.id_proyecto AND m.id_usuario=$1)) OR ($2='jefe_area' AND p.id_jefe=$1) OR $2 IN ('administrador','gerencia')) AND EXISTS(SELECT 1 FROM usuario lector JOIN rol rl ON rl.id_rol=lector.id_rol WHERE lector.id_usuario=$1 AND lector.activo AND rl.nombre=$2)`;
interface Riesgo {id_tarea:number;id_responsable:number;tipo:TipoAlerta;referencia:string;mensaje:string}
async function sincronizar(c:PoolClient,s:Sesion,proyecto:number|null=null,tarea:number|null=null){
 // Orden fijo y tarea antes de alerta, igual que la atención. Serializa las consultas concurrentes.
 const tareas=(await c.query(`SELECT t.id_tarea FROM tarea t JOIN proyecto p ON p.id_proyecto=t.id_proyecto WHERE ${alcance} AND ($3::int IS NULL OR t.id_proyecto=$3) AND ($4::int IS NULL OR t.id_tarea=$4) ORDER BY t.id_tarea FOR UPDATE OF t`,[s.id,s.rol,proyecto,tarea])).rows.map(r=>r.id_tarea as number);
 if(!tareas.length)return;
 const riesgos=(await c.query<Riesgo>(`WITH base AS (
   SELECT t.*,u.activo,r.nombre rol,ultimo.fecha_hora ultimo_reporte,
          (CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date hoy,
          GREATEST(t.creado_en,t.actualizado_en,ultimo.fecha_hora)::date ultima_actividad
    FROM tarea t JOIN usuario u ON u.id_usuario=t.id_responsable JOIN rol r ON r.id_rol=u.id_rol
    LEFT JOIN LATERAL(SELECT fecha_hora FROM reporte_avance WHERE id_tarea=t.id_tarea AND id_usuario=t.id_responsable ORDER BY fecha_hora DESC,id_reporte DESC LIMIT 1)ultimo ON true
    WHERE t.id_tarea=ANY($1::int[]) AND t.estado<>'entregada' AND t.creado_en::date<=(CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date
 ) SELECT b.id_tarea,b.id_responsable,v.tipo,b.id_responsable||':'||v.base referencia,v.mensaje FROM base b CROSS JOIN LATERAL(VALUES
   ('tarea_vencida',b.fecha_entrega::text,'La fecha de entrega ('||b.fecha_entrega::text||') ya pasó y la tarea sigue sin entregar.',b.fecha_entrega<b.hoy),
   ('sin_reporte',b.creado_en::date::text,'La tarea lleva al menos tres días desde su creación sin reportes del responsable actual.',b.activo AND b.rol='colaborador' AND b.ultimo_reporte IS NULL AND b.hoy-b.creado_en::date>=3),
   ('sin_actualizar',b.ultima_actividad::text,'No se registra actividad en la tarea desde el '||b.ultima_actividad::text||' (al menos tres días).',b.activo AND b.rol='colaborador' AND b.ultimo_reporte IS NOT NULL AND b.hoy-b.ultima_actividad>=3)
 )v(tipo,base,mensaje,aplica)WHERE v.aplica`,[tareas])).rows;
 const actuales=(await c.query<{id_alerta:number;id_tarea:number;tipo:TipoAlerta;referencia:string|null}>("SELECT id_alerta,id_tarea,tipo,referencia FROM alerta WHERE id_tarea=ANY($1::int[]) AND vigente ORDER BY id_alerta FOR UPDATE",[tareas])).rows;
 for(const a of actuales){if(!riesgos.some(r=>r.id_tarea===a.id_tarea&&r.tipo===a.tipo&&r.referencia===a.referencia))await c.query("UPDATE alerta SET vigente=false,estado=CASE WHEN estado='abierta' THEN 'resuelta' ELSE estado END,resuelta_en=(CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima'),motivo_resolucion='La condición original dejó de cumplirse o cambió su referencia durante la revisión automática.' WHERE id_alerta=$1",[a.id_alerta]);}
 for(const r of riesgos){if(!actuales.some(a=>a.id_tarea===r.id_tarea&&a.tipo===r.tipo&&a.referencia===r.referencia))await c.query("INSERT INTO alerta(id_tarea,tipo,mensaje,referencia,id_responsable_generacion,generada_en) VALUES($1,$2,$3,$4,$5,(CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')) ON CONFLICT(id_tarea,tipo) WHERE vigente AND referencia IS NOT NULL DO NOTHING",[r.id_tarea,r.tipo,r.mensaje,r.referencia,r.id_responsable]);}
}
const joins=`FROM alerta a JOIN tarea t ON t.id_tarea=a.id_tarea JOIN proyecto p ON p.id_proyecto=t.id_proyecto`;
export async function consultarAlertas(s:Sesion,f:FiltrosAlertas):Promise<ConsultaAlertas>{
 const c=await pool.connect();
 try{
  await c.query("BEGIN");await c.query("SET LOCAL lock_timeout='5s'");await sincronizar(c,s,f.proyecto??null);
  const valores:unknown[]=[s.id,s.rol];const condiciones=[alcance];
  if(f.proyecto){valores.push(f.proyecto);condiciones.push(`p.id_proyecto=$${valores.length}`);}
  if(f.tipo){valores.push(f.tipo);condiciones.push(`a.tipo=$${valores.length}`);}
  const conteos={abierta:0,atendida:0,resuelta:0};
  for(const r of (await c.query<{estado:keyof typeof conteos;n:number}>(`SELECT a.estado,count(*)::int n ${joins} WHERE ${condiciones.join(" AND ")} GROUP BY a.estado`,valores)).rows)conteos[r.estado]=r.n;
  if(f.estado!=="todas"){valores.push(f.estado);condiciones.push(`a.estado=$${valores.length}`);}
  const total=(await c.query<{n:number}>(`SELECT count(*)::int n ${joins} WHERE ${condiciones.join(" AND ")}`,valores)).rows[0].n;
  valores.push((f.pagina-1)*20);
  const alertas=(await c.query<AlertaFila>(`SELECT a.id_alerta,a.id_tarea,t.titulo,p.id_proyecto,p.nombre proyecto,u.nombres||' '||u.apellidos responsable,
    ug.nombres||' '||ug.apellidos responsable_generacion,a.tipo,a.mensaje,a.estado,a.vigente,
    to_char(a.generada_en,'YYYY-MM-DD HH24:MI') generada_en,a.accion_tomada,to_char(a.atendida_en,'YYYY-MM-DD HH24:MI') atendida_en,
    ua.nombres||' '||ua.apellidos atendido_por,to_char(a.resuelta_en,'YYYY-MM-DD HH24:MI') resuelta_en,a.motivo_resolucion
    ${joins} JOIN usuario u ON u.id_usuario=t.id_responsable LEFT JOIN usuario ug ON ug.id_usuario=a.id_responsable_generacion LEFT JOIN usuario ua ON ua.id_usuario=a.id_atendido_por
    WHERE ${condiciones.join(" AND ")} ORDER BY a.generada_en DESC,a.id_alerta DESC LIMIT 20 OFFSET $${valores.length}`,valores)).rows;
  const proyectos=(await c.query<{id:number;nombre:string}>(`SELECT p.id_proyecto id,p.nombre FROM proyecto p WHERE ${alcanceProyecto} ORDER BY p.nombre,p.id_proyecto`,[s.id,s.rol])).rows;
  await c.query("COMMIT");return {alertas,total,pagina:f.pagina,paginas:Math.ceil(total/20),conteos,proyectos};
 }catch(e){await c.query("ROLLBACK").catch(()=>{});throw e;}finally{c.release();}
}
export async function atenderAlerta(s:Sesion,id:number,accion:string){
 if(!["administrador","jefe_area"].includes(s.rol))throw new ErrorAlerta("Tu rol solo puede consultar las alertas",403);
 const c=await pool.connect();
 try{
  await c.query("BEGIN");await c.query("SET LOCAL lock_timeout='5s'");
  const t=(await c.query<{id_tarea:number}>(`SELECT t.id_tarea ${joins} WHERE a.id_alerta=$3 AND ${alcance} FOR UPDATE OF t`,[s.id,s.rol,id])).rows[0];
  if(!t)throw new ErrorAlerta("Alerta no encontrada o sin permiso para atenderla",404);
  await sincronizar(c,s,null,t.id_tarea);
  const a=(await c.query<{estado:string;vigente:boolean}>("SELECT estado,vigente FROM alerta WHERE id_alerta=$1 FOR UPDATE",[id])).rows[0];
  if(a.estado!=="abierta"||!a.vigente)throw new ErrorAlerta("La alerta ya fue atendida o su condición ya no está activa",409);
  await c.query("UPDATE alerta SET estado='atendida',accion_tomada=$1,id_atendido_por=$2,atendida_en=(CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima') WHERE id_alerta=$3",[accion,s.id,id]);
  await c.query("COMMIT");
 }catch(e){if(e instanceof ErrorAlerta&&e.status===409)await c.query("COMMIT");else await c.query("ROLLBACK").catch(()=>{});throw e;}finally{c.release();}
}
export function urlAlertas(f:FiltrosAlertas,pagina=1){const p=new URLSearchParams();if(f.proyecto)p.set("proyecto",String(f.proyecto));if(f.tipo)p.set("tipo",f.tipo);if(f.estado!=="abierta")p.set("estado",f.estado);if(pagina>1)p.set("pagina",String(pagina));return "/alertas"+(p.size?"?"+p.toString():"");}
