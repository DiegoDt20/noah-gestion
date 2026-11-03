import assert from "node:assert/strict";
import pg from "pg";
const base=process.env.TEST_BASE_URL||"http://127.0.0.1:3000";
const db=new pg.Client({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_SSL==="false"?false:{rejectUnauthorized:false}});
const proyectos=[],sesiones={};let checks=0;const marca=`RF09-${Date.now()}`;
function igual(a,b,t){assert.deepEqual(a,b,t);checks++;}function ok(v,t){assert.ok(v,t);checks++;}
async function pedir(rol,params="",method="GET") { const r=await fetch(base+"/api/reportes"+(params?"?"+params:""),{method,headers:rol?{cookie:sesiones[rol]}:{}});return {status:r.status,headers:r.headers,data:await r.json().catch(()=>({}))}; }
try{
 await db.connect();
 const us=(await db.query("SELECT id_usuario,correo FROM usuario")).rows;const uid=n=>us.find(u=>u.correo===n+"@noahtech.pe").id_usuario;
 for(const rol of ["admin","gerencia","jefe","carlos","maria"]){const r=await fetch(base+"/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({correo:rol+"@noahtech.pe",clave:process.env.DEMO_PASSWORD||"Demo2026!"})});igual(r.status,200,`Login ${rol}`);sesiones[rol]=r.headers.get("set-cookie").split(";")[0];}
 const fechas=(await db.query("SELECT (CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date::text hoy,((CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date-1)::text ayer")).rows[0];
 async function proyecto(jefe,nombre){const id=(await db.query("INSERT INTO proyecto(id_area,id_jefe,nombre,fecha_inicio,fecha_entrega) VALUES(3,$1,$2,CURRENT_DATE-60,CURRENT_DATE+30) RETURNING id_proyecto",[jefe,nombre])).rows[0].id_proyecto;proyectos.push(id);return id;}
 async function tarea(p,responsable){return(await db.query("INSERT INTO tarea(id_proyecto,id_responsable,titulo,rol_asignado,fecha_entrega) VALUES($1,$2,$3,'Desarrollador',CURRENT_DATE+20) RETURNING id_tarea",[p,responsable,marca+" tarea"])).rows[0].id_tarea;}
 const a=await proyecto(uid("jefe"),marca+" autorizado"),b=await proyecto(uid("admin"),marca+" privado");const ta=await tarea(a,uid("carlos")),tm=await tarea(a,uid("maria")),tb=await tarea(b,uid("carlos"));
 async function reporte(id,autor,dias,momento,contenido){return(await db.query("INSERT INTO reporte_avance(id_tarea,id_usuario,momento,contenido,porcentaje_avance,fecha_reporte,fecha_hora) VALUES($1,$2,$3,$4,$5,(CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date-$6::int,((CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date-$6::int)+TIME '10:00') RETURNING id_reporte",[id,autor,momento,contenido,Math.min(100,dias*4),dias])).rows[0].id_reporte;}
 const momentos=["inicio_dia","fin_dia","cada_3_dias"];
 for(let i=0;i<21;i++)await reporte(ta,uid("carlos"),i,momentos[i%3],marca+` detalle ${i}`+(i===0?" avance 100%_literal "+"Texto largo. ".repeat(40):""));
 await reporte(ta,uid("maria"),30,"inicio_dia",marca+" historial del anterior responsable");
 await reporte(tm,uid("maria"),0,"inicio_dia",marca+" exclusivo maria");
 await reporte(tb,uid("carlos"),0,"inicio_dia",marca+" contenido privado");
 igual((await pedir(null)).status,401,"Requiere sesión");igual((await pedir("admin","","POST")).status,405,"Consulta de solo lectura");
 const consulta=async(rol,extra={})=>{const p=new URLSearchParams({proyecto:String(a),...extra});const r=await pedir(rol,p.toString());igual(r.status,200,"Consulta válida");return r;};
 const admin=await consulta("admin");igual(admin.data.total,23,"Conteo total filtrado");igual(admin.data.tareas,2,"Tareas distintas");igual(admin.data.autores,2,"Autores distintos");igual(admin.data.reportes.length,20,"Página de veinte");igual(admin.data.paginas,2,"Total de páginas");ok(admin.headers.get("cache-control").includes("no-store"),"Consulta sin caché compartida");
 const segunda=await consulta("admin",{pagina:"2"});igual(segunda.data.reportes.length,3,"Segunda página completa");const ids=[...admin.data.reportes,...segunda.data.reportes].map(r=>r.id_reporte);igual(new Set(ids).size,23,"Sin duplicados entre páginas");
 const esperado=(await db.query("SELECT r.id_reporte FROM reporte_avance r JOIN tarea t ON t.id_tarea=r.id_tarea WHERE t.id_proyecto=$1 ORDER BY r.fecha_hora DESC,r.id_reporte DESC",[a])).rows.map(r=>r.id_reporte);igual(ids,esperado,"Orden estable con desempate por ID");
 const antigua=await consulta("admin",{orden:"antiguos"});igual(antigua.data.reportes[0].id_reporte,esperado.at(-1),"Orden cronológico inverso");
 igual((await consulta("jefe")).data.total,23,"Jefe consulta sus proyectos");igual((await pedir("jefe",`proyecto=${b}`)).data.total,0,"Jefe no consulta otro proyecto");
 igual((await consulta("gerencia")).data.total,23,"Gerencia consulta sin editar");igual((await pedir("gerencia",`proyecto=${b}`)).data.total,1,"Gerencia consulta organización");
 const carlos=await consulta("carlos");igual(carlos.data.total,22,"Colaborador consulta historial de sus tareas actuales");ok(carlos.data.reportes.every(r=>r.id_tarea===ta),"Sin datos de tareas ajenas");igual((await consulta("maria")).data.total,1,"Otro colaborador solo consulta su tarea");
 const autor=await consulta("carlos",{autor:String(uid("maria"))});igual(autor.data.total,1,"Filtro de autor mantiene permisos por tarea");ok(autor.data.reportes[0].contenido.includes("anterior responsable"),"Se conserva historial de reasignaciones");
 const tipo=await consulta("admin",{tipo:"fin_dia"});igual(tipo.data.total,7,"Filtro por tipo");ok(tipo.data.reportes.every(r=>r.momento==="fin_dia"),"Todos coinciden con el tipo");
 const hoy=await consulta("admin",{desde:fechas.hoy,hasta:fechas.hoy});igual(hoy.data.total,2,"Fechas inclusivas");ok(hoy.data.reportes.every(r=>r.fecha_reporte===fechas.hoy),"Fecha de reporte de Lima");
 igual((await consulta("admin",{q:"%_"})).data.total,1,"Comodines de búsqueda son literales");igual((await consulta("admin",{q:"%' OR true --"})).data.total,0,"Búsqueda parametrizada");igual((await consulta("admin",{q:"HISTORIAL DEL ANTERIOR"})).data.total,1,"Búsqueda sin distinguir mayúsculas");
 igual((await consulta("admin",{autor:String(uid("maria")),tipo:"fin_dia",desde:fechas.hoy,hasta:fechas.hoy})).data.total,0,"Combinación de filtros");
 igual((await consulta("admin",{pagina:"99"})).data.reportes.length,0,"Página fuera del rango conserva total sin registros");
 for(const qs of ["pagina=0","pagina=-1","pagina=1.5","pagina=1000001","proyecto=abc","proyecto=2147483648","autor=9007199254740991","autor=-1","tipo=otro","orden=otro","desde=2026-02-29","desde=2026-13-01","desde=0000-01-01","desde=2026-11-03&hasta=2026-11-01","proyecto=1&proyecto=2","desconocido=x","q="+"x".repeat(151)])igual((await pedir("admin",qs)).status,400,"Validar filtros");
 const pagina=await fetch(base+`/reportes?proyecto=${a}`,{headers:{cookie:sesiones.admin}});igual(pagina.status,200,"Página de consulta");const html=await pagina.text();ok(html.includes("Historial consultado"),"Renderiza resultados");ok(html.includes("Leer detalle completo"),"Detalle largo expandible");ok(html.includes("Siguiente"),"Navegación de páginas");ok(!html.includes(marca+" contenido privado"),"No mezcla proyectos");
 const pageJefe=await fetch(base+`/reportes?q=${marca}`,{headers:{cookie:sesiones.jefe}});const htmlJefe=await pageJefe.text();ok(!htmlJefe.includes(marca+" privado"),"Opciones del formulario no filtran nombres de proyectos ajenos");
 const invalida=await fetch(base+"/reportes?desde=incorrecto",{headers:{cookie:sesiones.admin}});igual(invalida.status,200,"Recuperación de filtros inválidos en interfaz");ok((await invalida.text()).includes("Restablecer consulta"),"Permite restablecer consulta");
 console.log(`RF-09: ${checks} comprobaciones correctas (roles, filtros, fechas, búsqueda, paginación y consulta de solo lectura).`);
} finally {if(proyectos.length)await db.query("DELETE FROM proyecto WHERE id_proyecto=ANY($1::int[])",[proyectos]);await db.end();}
