import assert from 'node:assert/strict';
import pg from 'pg';
const db=new pg.Client({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_SSL==='false'?false:{rejectUnauthorized:false}});
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3000';let proyecto;
async function login(rol){const r=await fetch(base+'/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({correo:rol+'@noahtech.pe',clave:process.env.DEMO_PASSWORD||'Demo2026!'})});assert.equal(r.status,200);return r.headers.get('set-cookie').split(';')[0];}
try {
 await db.connect();const users=(await db.query('SELECT id_usuario,correo FROM usuario')).rows;const id=n=>users.find(u=>u.correo===n+'@noahtech.pe').id_usuario;
 proyecto=(await db.query("INSERT INTO proyecto(id_area,id_jefe,nombre,fecha_inicio,fecha_entrega) VALUES(3,$1,'Prueba temporal KPI',CURRENT_DATE-30,CURRENT_DATE+30) RETURNING id_proyecto",[id('jefe')])).rows[0].id_proyecto;
 const cookies={};for(const rol of ['admin','gerencia','jefe','carlos'])cookies[rol]=await login(rol);
 async function page(rol){const r=await fetch(`${base}/proyectos/${proyecto}`,{headers:{cookie:cookies[rol]}});return {status:r.status,html:(await r.text()).replaceAll("<!-- -->", "")};}
 let html=(await page('gerencia')).html;assert.match(html,/Indicadores del proyecto/);assert.ok((html.match(/Sin datos suficientes/g)||[]).length>=3);
 const t=(await db.query("INSERT INTO tarea(id_proyecto,id_responsable,titulo,rol_asignado,fecha_entrega,estado) VALUES($1,$2,'Prueba KPI','Desarrollador',CURRENT_DATE-3,'entregada') RETURNING id_tarea,fecha_entrega::text",[proyecto,id('carlos')])).rows[0];
 html=(await page('gerencia')).html;assert.match(html,/Falta historial de entrega/);assert.match(html,/0 reportes/);
 await db.query("INSERT INTO historial_estado(id_tarea,id_usuario,estado_anterior,estado_nuevo,fecha_hora) VALUES($1,$2,'pendiente','entregada',CURRENT_DATE-4)",[t.id_tarea,id('carlos')]);
 await db.query("INSERT INTO reporte_avance(id_tarea,id_usuario,momento,contenido,porcentaje_avance) VALUES($1,$2,'inicio_dia','avance prueba',50)",[t.id_tarea,id('carlos')]);
 await db.query("INSERT INTO alerta(id_tarea,tipo,mensaje,referencia,generada_en) VALUES($1,'tarea_vencida','prueba',$2,CURRENT_DATE-1)",[t.id_tarea,id('carlos')+':'+t.fecha_entrega]);
 html=(await page('gerencia')).html;assert.match(html,/100\s*%/);assert.match(html,/1 reportes/);assert.match(html,/2 días/);
 assert.match((await page('jefe')).html,/Indicadores del proyecto/);assert.doesNotMatch((await page('admin')).html,/Indicadores del proyecto/);assert.equal((await page('carlos')).status,404);
 await db.query("UPDATE tarea SET estado='en_curso' WHERE id_tarea=$1",[t.id_tarea]);html=(await page('gerencia')).html;assert.match(html,/0 de 1 tareas vencidas o entregadas/);
 console.log('RF-15: sin datos, historial, fórmulas, reapertura y permisos verificados.');
} finally {if(proyecto)await db.query('DELETE FROM proyecto WHERE id_proyecto=$1',[proyecto]);await db.end();}
