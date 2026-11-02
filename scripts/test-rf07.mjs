import assert from 'node:assert/strict';
import pg from 'pg';
const base=process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
const db=new pg.Client({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_SSL==='false'?false:{rejectUnauthorized:false}});
let checks=0;
const proyectos=[];
const sessions={};
async function call(role,id,body,method=body===undefined?'GET':'POST') {
 const r=await fetch(`${base}/api/tareas/${id}/reportes`,{method,headers:{'Content-Type':'application/json',...(role?{cookie:sessions[role]}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
 return {status:r.status,data:await r.json()};
}
function status(r,expected,label){assert.equal(r.status,expected,`${label}: ${JSON.stringify(r.data)}`);checks++;}
const reporte=(momento='inicio_dia',porcentaje_avance=0,contenido='Detalle de prueba RF-07')=>({momento,porcentaje_avance,contenido});
try {
 await db.connect();
 for(const [role,email] of Object.entries({carlos:'carlos@noahtech.pe',maria:'maria@noahtech.pe',jefe:'jefe@noahtech.pe',admin:'admin@noahtech.pe',gerencia:'gerencia@noahtech.pe'})) {
  const r=await fetch(base+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({correo:email,clave:process.env.DEMO_PASSWORD||'Demo2026!'})});
  assert.equal(r.status,200,`No se pudo autenticar ${role}`);sessions[role]=r.headers.get('set-cookie').split(';')[0];
 }
 const users=(await db.query('SELECT id_usuario,correo FROM usuario')).rows;
 const uid=email=>users.find(u=>u.correo===email+'@noahtech.pe').id_usuario;
 async function project(jefe) {
  const p=(await db.query("INSERT INTO proyecto(id_area,id_jefe,nombre,fecha_inicio,fecha_entrega) VALUES(3,$1,'Prueba temporal RF-07',CURRENT_DATE,CURRENT_DATE+30) RETURNING id_proyecto",[jefe])).rows[0].id_proyecto;
  proyectos.push(p);return p;
 }
 const p=await project(uid('jefe'));
 async function task(project,days) {
  return (await db.query("INSERT INTO tarea(id_proyecto,id_responsable,titulo,rol_asignado,fecha_entrega,creado_en) VALUES($1,$2,'Prueba temporal de reportes','Desarrollador',CURRENT_DATE+10,(CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')-($3::int * INTERVAL '1 day')) RETURNING id_tarea",[project,uid('carlos'),days])).rows[0].id_tarea;
 }
 const id=await task(p,4),fresh=await task(p,0);
 status(await call(null,id),401,'Sin sesión');
 status(await call('maria',id),404,'No leer tareas ajenas');
 status(await call('maria',id,reporte()),403,'No reportar tareas ajenas');
 for(const role of ['admin','gerencia','jefe']) {
  status(await call(role,id),200,`Consulta ${role}`);
  status(await call(role,id,reporte()),403,`Escritura bloqueada ${role}`);
 }
 const foreign=await task(await project(uid('admin')),4);
 status(await call('jefe',foreign),404,'Jefe no consulta proyectos ajenos');
 status(await call('carlos','abc',reporte()),400,'ID inválido');
 status(await call('carlos',99999999,reporte()),404,'Tarea inexistente');
 for(const body of [null,[],reporte('otro'),reporte('inicio_dia',-1),reporte('inicio_dia',101),reporte('inicio_dia',1.5),reporte('inicio_dia','10'),reporte('inicio_dia',null),reporte('inicio_dia',20,'   '),reporte('inicio_dia',20,'x'.repeat(5001))]) status(await call('carlos',id,body),400,'Validación de datos');
 status(await call('carlos',id,reporte('fin_dia')),409,'Cierre requiere inicio de hoy');
 status(await call('carlos',fresh,reporte('cada_3_dias')),409,'No adelantar reporte de 3 días');
 const concurrentes=await Promise.all([call('carlos',id,reporte()),call('carlos',id,reporte())]);
 assert.deepEqual(concurrentes.map(r=>r.status).sort(),[201,409]);checks++;
 const completo=await call('carlos',id,reporte('fin_dia',100,'Terminé el avance de prueba.'));
 status(completo,201,'Cierre con 100 %');assert.equal(completo.data.estado,'entregada');
 assert.equal((await db.query('SELECT estado FROM tarea WHERE id_tarea=$1',[id])).rows[0].estado,'entregada');checks++;
 const proyectoCompleto=await fetch(base+'/proyectos/'+p,{headers:{cookie:sessions.admin}});
 assert.equal(proyectoCompleto.status,200);assert.ok((await proyectoCompleto.text()).includes('1/2'));checks++;
 status(await call('carlos',id,reporte('fin_dia',100)),409,'Cierre duplicado');
 status(await call('carlos',id,reporte('cada_3_dias',75)),201,'Reporte adicional vencido');
 status(await call('carlos',id,reporte('cada_3_dias',75)),409,'Adicional duplicado');
 const hist=await call('carlos',id);status(hist,200,'Historial persistido');
 assert.equal(hist.data.reportes.length,3);assert.equal(hist.data.seguimiento.inicio_registrado,true);assert.equal(hist.data.seguimiento.cierre_registrado,true);assert.equal(hist.data.seguimiento.periodico_habilitado,false);checks++;
 const stored=(await db.query('SELECT * FROM reporte_avance WHERE id_tarea=$1',[id])).rows;
 assert.equal(stored.length,3);assert.ok(stored.every(r=>r.id_usuario===uid('carlos')));assert.ok(stored.some(r=>r.porcentaje_avance===0));assert.ok(stored.some(r=>r.porcentaje_avance===100));checks++;
 const estado=(await db.query('SELECT estado FROM tarea WHERE id_tarea=$1',[id])).rows[0].estado;assert.equal(estado,'en_curso');checks++;
 const cambios=(await db.query('SELECT estado_anterior,estado_nuevo,id_usuario FROM historial_estado WHERE id_tarea=$1 ORDER BY id_historial',[id])).rows;
 assert.deepEqual(cambios.map(c=>[c.estado_anterior,c.estado_nuevo]),[['pendiente','entregada'],['entregada','en_curso']]);assert.ok(cambios.every(c=>c.id_usuario===uid('carlos')));checks++;
 const limite=await task(p,4);
 const uno=await call('carlos',limite,reporte('inicio_dia',1));status(uno,201,'1 % en curso');assert.equal(uno.data.estado,'en_curso');checks++;
 const noventa=await call('carlos',limite,reporte('fin_dia',99));status(noventa,201,'99 % en curso');assert.equal(noventa.data.estado,'en_curso');checks++;
 assert.equal((await db.query('SELECT count(*)::int n FROM historial_estado WHERE id_tarea=$1',[limite])).rows[0].n,1);checks++;
 const cero=await call('carlos',limite,reporte('cada_3_dias',0));status(cero,201,'0 % pendiente');assert.equal(cero.data.estado,'pendiente');checks++;
 assert.equal((await db.query('SELECT estado FROM tarea WHERE id_tarea=$1',[limite])).rows[0].estado,'pendiente');checks++;
 // Un reporte de ayer no sustituye el inicio de hoy, ni bloquea un nuevo inicio.
 await db.query("INSERT INTO reporte_avance(id_tarea,id_usuario,momento,contenido,porcentaje_avance,fecha_reporte,fecha_hora) VALUES($1,$2,'inicio_dia','Inicio de ayer',10,(CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date-1,(CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')-INTERVAL '1 day')",[fresh,uid('carlos')]);
 status(await call('carlos',fresh,reporte('fin_dia',20)),409,'Inicio de ayer no permite cierre de hoy');
 status(await call('carlos',fresh,reporte('inicio_dia',20)),201,'Nuevo inicio en otro día');
 const page=await fetch(`${base}/tareas/${id}/reportes`,{headers:{cookie:sessions.carlos}});assert.equal(page.status,200);const html=await page.text();assert.ok(html.includes('Historial de reportes'));assert.ok(html.includes('Terminé el avance de prueba.'));checks++;
 console.log(`RF-07: ${checks} comprobaciones correctas (permisos, validación, concurrencia, calendario, persistencia e interfaz).`);
} finally {
 if(proyectos.length) await db.query('DELETE FROM proyecto WHERE id_proyecto=ANY($1::int[])',[proyectos]);
 await db.end();
}
