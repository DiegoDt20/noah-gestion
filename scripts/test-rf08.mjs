import assert from "node:assert/strict";
import pg from "pg";
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
const db = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false } });
const proyectos = [], usuarios = [], sesiones = {};
let checks = 0;
function ok(valor, texto) { assert.ok(valor, texto); checks++; }
function igual(actual, esperado, texto) { assert.deepEqual(actual, esperado, texto); checks++; }
async function peticion(rol, path = "/api/recordatorios", body, method = body === undefined ? "GET" : "PATCH") {
  const r = await fetch(base + path, { method, headers: { "Content-Type": "application/json", ...(rol ? { cookie: sesiones[rol] } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  return { status: r.status, data: await r.json().catch(() => ({})), headers: r.headers };
}
async function entrar(rol, correo) {
  const r = await peticion(null, "/api/auth/login", { correo, clave: process.env.DEMO_PASSWORD || "Demo2026!" }, "POST");
  igual(r.status, 200, `Login ${rol}`); sesiones[rol] = r.headers.get("set-cookie").split(";")[0];
}
const marca = Date.now();
try {
  await db.connect();
  const demos = (await db.query("SELECT id_usuario,correo FROM usuario")).rows;
  const uid = correo => demos.find(u => u.correo === `${correo}@noahtech.pe`).id_usuario;
  for (const [rol,correo] of Object.entries({ carlos:"carlos", maria:"maria", jefe:"jefe", admin:"admin", gerencia:"gerencia" })) await entrar(rol, `${correo}@noahtech.pe`);
  async function usuario(activo) {
    const correo=`rf08-${marca}-${usuarios.length}@test.invalid`;
    const id=(await db.query("INSERT INTO usuario(id_rol,id_area,nombres,apellidos,correo,clave_hash,activo) SELECT 3,3,'Prueba RF08','Temporal',$1,clave_hash,$2 FROM usuario WHERE correo='carlos@noahtech.pe' RETURNING id_usuario",[correo,activo])).rows[0].id_usuario;
    usuarios.push(id);return {id,correo};
  }
  const propietario=await usuario(true),inactivo=await usuario(false);
  await entrar("propietario",propietario.correo);
  async function proyecto(jefe) {
    const id=(await db.query("INSERT INTO proyecto(id_area,id_jefe,nombre,fecha_inicio,fecha_entrega) VALUES(3,$1,'Prueba temporal RF08',CURRENT_DATE-10,CURRENT_DATE+30) RETURNING id_proyecto",[jefe])).rows[0].id_proyecto;
    proyectos.push(id); return id;
  }
  const p=await proyecto(uid("jefe")),ajeno=await proyecto(uid("admin"));
  async function tarea({proyecto=p,responsable=propietario.id,dias=4,estado="pendiente"}={}) {
    return (await db.query("INSERT INTO tarea(id_proyecto,id_responsable,titulo,rol_asignado,fecha_entrega,estado,creado_en) VALUES($1,$2,'Tarea temporal RF08','Desarrollador',CURRENT_DATE+10,$3,(CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')-($4::int*INTERVAL '1 day')) RETURNING id_tarea",[proyecto,responsable,estado,dias])).rows[0].id_tarea;
  }
  const antigua=await tarea(),nueva=await tarea({dias:0}),completa=await tarea({estado:"entregada"}),sinActivo=await tarea({responsable:inactivo.id}),futura=await tarea({dias:-2}),extranjera=await tarea({proyecto:ajeno});
  const de=async(rol,id)=>{const r=await peticion(rol);igual(r.status,200,`GET ${rol}`);return r.data.recordatorios.filter(x=>x.id_tarea===id);};
  const momentos=rs=>rs.map(r=>r.momento).sort();
  igual((await peticion(null)).status,401,"Consulta sin sesión");
  igual((await peticion(null,"/api/recordatorios",{todos:true})).status,401,"Lectura sin sesión");
  const r=await peticion("propietario");igual(r.status,200);ok(r.headers.get("cache-control").includes("no-store"),"Respuesta privada sin caché");
  const lista=r.data.recordatorios;
  igual(momentos(lista.filter(x=>x.id_tarea===antigua)),["cada_3_dias","inicio_dia"],"Antigua: inicio y periódico, sin cierre adelantado");
  igual(momentos(lista.filter(x=>x.id_tarea===nueva)),["inicio_dia"],"Nueva: solo inicio");
  for(const id of [completa,sinActivo,futura]) igual(lista.filter(x=>x.id_tarea===id),[],"Excluir tareas entregadas, futuras o usuarios inactivos");
  igual(await de("carlos",antigua),[],"Colaborador no consulta tareas ajenas");
  igual(await de("maria",antigua),[],"Otro colaborador no consulta tareas ajenas");
  igual((await de("jefe",antigua)).length,2,"Jefe consulta sus proyectos");
  igual(await de("jefe",extranjera),[],"Jefe no consulta otros proyectos");
  for(const rol of ["admin","gerencia"]) igual((await de(rol,extranjera)).length,2,`${rol} consulta organización`);
  const aviso=lista.find(x=>x.id_tarea===antigua&&x.momento==="inicio_dia");
  const hoy=(await db.query("SELECT (CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date::text hoy")).rows[0].hoy;
  igual(aviso.fecha,hoy,"Inicio usa fecha de Lima");igual(aviso.visto,false,"Nuevo recordatorio sin ver");
  const clave=({id_tarea,id_responsable,momento,fecha})=>({id_tarea,id_responsable,momento,fecha});
  for(const b of [null,[],{}, {...clave(aviso),id_tarea:"1"},{...clave(aviso),momento:"otro"}]) igual((await peticion("propietario","/api/recordatorios",b)).status,400,"Validar cuerpo");
  igual((await peticion("propietario","/api/recordatorios",{...clave(aviso),fecha:"2026-99-99"})).status,404,"Fecha imposible no provoca error SQL");
  igual((await peticion("maria","/api/recordatorios",clave(aviso))).status,404,"No marcar recordatorio ajeno");
  const concurrentes=await Promise.all([peticion("propietario","/api/recordatorios",clave(aviso)),peticion("propietario","/api/recordatorios",clave(aviso))]);
  igual(concurrentes.map(x=>x.status),[200,200],"Marcado concurrente idempotente");
  igual((await db.query("SELECT count(*)::int n FROM recordatorio_lectura WHERE id_usuario=$1 AND id_tarea=$2 AND momento='inicio_dia'",[propietario.id,antigua])).rows[0].n,1,"Sin lecturas duplicadas");
  igual((await de("propietario",antigua)).find(x=>x.momento==="inicio_dia").visto,true,"Lectura persistente");
  igual((await de("admin",antigua)).find(x=>x.momento==="inicio_dia").visto,false,"Lectura independiente por persona");
  igual((await de("propietario",antigua)).length,2,"Ver no equivale a completar");
  await db.query("INSERT INTO recordatorio_lectura(id_usuario,id_tarea,id_responsable,momento,fecha) VALUES($1,$2,$1,'inicio_dia',(CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date-1)",[propietario.id,nueva]);
  igual((await de("propietario",nueva))[0].visto,false,"Lectura del día anterior no oculta la actual");
  async function reportar(id,momento,porcentaje_avance) {
    const r=await peticion("propietario",`/api/tareas/${id}/reportes`,{momento,porcentaje_avance,contenido:"Prueba temporal RF08: verificar resolución del recordatorio"},"POST");igual(r.status,201,"Registrar reporte RF07");
  }
  await reportar(antigua,"inicio_dia",10);
  igual(momentos(await de("propietario",antigua)),["cada_3_dias","fin_dia"],"Inicio resuelto y cierre habilitado");
  igual((await peticion("propietario","/api/recordatorios",clave(aviso))).status,404,"No marcar un pendiente ya resuelto");
  await reportar(antigua,"fin_dia",50);
  igual(momentos(await de("propietario",antigua)),["cada_3_dias"],"Cierre resuelto");
  await reportar(antigua,"cada_3_dias",75);
  igual(await de("propietario",antigua),[],"Periódico resuelto y próximo aún no habilitado");
  await db.query("UPDATE reporte_avance SET fecha_reporte=fecha_reporte-4 WHERE id_tarea=$1 AND momento='cada_3_dias'",[antigua]);
  const vencido=await de("propietario",antigua);igual(momentos(vencido),["cada_3_dias"],"Periódico vencido permanece sin duplicarse");ok(vencido[0].fecha<hoy,"Conserva fecha real de vencimiento");
  await reportar(nueva,"inicio_dia",100);igual(await de("propietario",nueva),[],"Tarea entregada retira todos sus recordatorios");
  await db.query("UPDATE tarea SET estado='en_curso' WHERE id_tarea=$1",[nueva]);igual(momentos(await de("propietario",nueva)),["fin_dia"],"Reabrir tarea vuelve a evaluar pendientes");
  await db.query("UPDATE tarea SET id_responsable=$1 WHERE id_tarea=$2",[uid("carlos"),antigua]);
  igual(await de("propietario",antigua),[],"Responsable anterior pierde el recordatorio");
  const reasignada=await de("carlos",antigua);igual(momentos(reasignada),["cada_3_dias","inicio_dia"],"Reasignar calcula reportes del nuevo responsable");ok(reasignada.every(r=>!r.visto),"No hereda lecturas del responsable anterior");
  igual((await peticion("propietario","/api/recordatorios",{todos:true})).status,200,"Marcar todos los propios");
  igual((await peticion("propietario")).data.sin_ver,0,"Contador sin ver actualizado");
  const pagina=await fetch(base+"/recordatorios",{headers:{cookie:sesiones.propietario}});igual(pagina.status,200,"Página accesible");ok((await pagina.text()).includes("Recordatorios"),"Página renderizada");
  console.log(`RF-08: ${checks} comprobaciones correctas (permisos, calendario, lectura, concurrencia y resolución).`);
} finally {
  if(proyectos.length) await db.query("DELETE FROM proyecto WHERE id_proyecto=ANY($1::int[])",[proyectos]);
  if(usuarios.length) await db.query("DELETE FROM usuario WHERE id_usuario=ANY($1::int[])",[usuarios]);
  await db.end();
}
