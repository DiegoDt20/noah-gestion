import { configDBDesdeEntorno } from '../lib/db-config.mjs';
import assert from 'node:assert/strict';import {mkdtempSync,cpSync,symlinkSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import path from 'node:path';import {spawn} from 'node:child_process';import {setTimeout as esperar} from 'node:timers/promises';import pg from 'pg';
const root=process.cwd(),dir=mkdtempSync(path.join(tmpdir(),'noah-ia-test-')),puerto=32174,base=`http://127.0.0.1:${puerto}`;let servidor,proyecto,privado;let logs='';
const db=new pg.Client(configDBDesdeEntorno());
async function login(n){const r=await fetch(base+'/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({correo:n+'@noahtech.pe',clave:process.env.DEMO_PASSWORD||'Demo2026!'})});assert.equal(r.status,200);return r.headers.get('set-cookie').split(';')[0];}
async function post(pathname,cookie,data){const r=await fetch(base+pathname,{method:'POST',headers:{'content-type':'application/json',...(cookie?{cookie}:{})},body:JSON.stringify(data)});return {status:r.status,body:await r.json()};}
try{
 for(const nombre of ['app','components','lib','middleware.ts','next.config.ts','tsconfig.json','postcss.config.mjs','package.json','next-env.d.ts'])cpSync(path.join(root,nombre),path.join(dir,nombre),{recursive:true});
 symlinkSync(path.join(root,'node_modules'),path.join(dir,'node_modules'),'dir');
 const env={...process.env,ANTHROPIC_API_KEY:'clave-simulada-no-real',NODE_OPTIONS:`--require=${path.join(root,'scripts/fixtures/ia/anthropic-simulado.cjs')}`,NEXT_TELEMETRY_DISABLED:'1'};
 servidor=spawn(process.execPath,[path.join(root,'node_modules/next/dist/bin/next'),'dev','-H','127.0.0.1','-p',String(puerto)],{cwd:dir,env,stdio:['ignore','pipe','pipe']});servidor.stdout.on('data',x=>logs+=x);servidor.stderr.on('data',x=>logs+=x);
 let listo=false;for(let n=0;n<60;n++){if(servidor.exitCode!==null)throw new Error('Servidor de prueba detenido: '+logs);try{await fetch(base+'/login');listo=true;break}catch{await esperar(500)}}if(!listo)throw new Error('No inició servidor de prueba: '+logs);
 await db.connect();const u=(await db.query('SELECT id_usuario,correo FROM usuario')).rows;const id=n=>u.find(x=>x.correo===n+'@noahtech.pe').id_usuario;
 async function crearProyecto(jefe){return (await db.query("INSERT INTO proyecto(id_area,id_jefe,nombre,fecha_inicio,fecha_entrega) VALUES(3,$1,'Prueba simulada IA',CURRENT_DATE-10,CURRENT_DATE+10) RETURNING id_proyecto",[jefe])).rows[0].id_proyecto;}
 proyecto=await crearProyecto(id('jefe'));privado=await crearProyecto(id('admin'));
 const tarea=(await db.query("INSERT INTO tarea(id_proyecto,id_responsable,titulo,rol_asignado,fecha_entrega) VALUES($1,$2,'Prueba IA','desarrollador',CURRENT_DATE+1) RETURNING id_tarea",[proyecto,id('carlos')])).rows[0].id_tarea;
 async function reporte(texto){return (await db.query("INSERT INTO reporte_avance(id_tarea,id_usuario,momento,contenido,porcentaje_avance,fecha_reporte) VALUES($1,$2,'inicio_dia',$3,10,CURRENT_DATE + $4::int) RETURNING id_reporte",[tarea,id('carlos'),texto,reporte.n++])).rows[0].id_reporte}reporte.n=0;
 const rep=await reporte('La entrega será el lunes.');const malo=await reporte('citainventada');const malformado=await reporte('formatoinvalido');const fallo=await reporte('falloexterno');
 const doc=(await db.query("INSERT INTO documento(id_proyecto,subido_por,nombre,ruta_archivo) VALUES($1,$2,'Cronograma.txt','prueba') RETURNING id_documento",[proyecto,id('jefe')])).rows[0].id_documento;await db.query("INSERT INTO fragmento_documento(id_documento,orden,texto) VALUES($1,1,'La entrega será el viernes.')",[doc]);
 const docPrivado=(await db.query("INSERT INTO documento(id_proyecto,subido_por,nombre,ruta_archivo) VALUES($1,$2,'Privado.txt','prueba') RETURNING id_documento",[privado,id('admin')])).rows[0].id_documento;await db.query("INSERT INTO fragmento_documento(id_documento,orden,texto) VALUES($1,1,'La entrega será el viernes.')",[docPrivado]);
 const jefe=await login('jefe'),colaborador=await login('carlos');
 assert.equal((await post('/api/asistente',null,{proyecto,pregunta:'entrega'})).status,401);assert.equal((await post('/api/asistente',colaborador,{proyecto,pregunta:'entrega'})).status,403);assert.equal((await post('/api/asistente',jefe,{proyecto:privado,pregunta:'entrega'})).status,404);
 let a=await post('/api/asistente',jefe,{proyecto,pregunta:'entrega viernes'});assert.equal(a.status,200);assert.match(a.body.respuesta,/Cronograma\.txt · fragmento 1: La entrega será el viernes/);
 for(const palabra of ['citainventada','formatoinvalido','falloexterno','jsonnulo','bloqueinvalido','elementonulo']){a=await post('/api/asistente',jefe,{proyecto,pregunta:'entrega '+palabra});assert.equal(a.status,palabra==='falloexterno'?503:502);}
 const renombrado=await post('/api/asistente',jefe,{proyecto,pregunta:'entrega cambiarnombre'});assert.equal(renombrado.status,409,'No guarda fuentes con metadatos obsoletos');
 await db.query("UPDATE documento SET nombre='Cronograma.txt' WHERE id_documento=$1",[doc]);
 assert.equal((await post('/api/asistente',jefe,{proyecto:2147483648,pregunta:'entrega'})).status,400);
 let c=await post('/api/contrastes',jefe,{reporte:rep,documento:doc});assert.equal(c.status,200);assert.equal(c.body.diferencias.length,1);assert.match(c.body.diferencias[0],/La entrega será el viernes/);
 assert.equal((await post('/api/contrastes',jefe,{reporte:rep,documento:docPrivado})).status,404);for(const idReporte of [malo,malformado,fallo])assert.equal((await post('/api/contrastes',jefe,{reporte:idReporte,documento:doc})).status,idReporte===fallo?503:502);

 for(const palabra of ['jsonnulo','bloqueinvalido','elementonulo']){
  const nuevo=await reporte(palabra);assert.equal((await post('/api/contrastes',jefe,{reporte:nuevo,documento:doc})).status,502,'Respuesta inválida controlada: '+palabra);
 }
 for(const palabra of ['cambiardocumento','cambiarreporte','sindiferencias sinacceso']){
  const nuevo=await reporte(palabra);const resultado=await post('/api/contrastes',jefe,{reporte:nuevo,documento:doc});assert.equal(resultado.status,409,'Descarta resultados si cambian las fuentes o el acceso: '+palabra);
  assert.equal((await db.query('SELECT 1 FROM observacion_ia WHERE id_reporte=$1',[nuevo])).rowCount,0,'No guarda resultados obsoletos');
  await db.query("UPDATE fragmento_documento SET texto='La entrega será el viernes.' WHERE id_documento=$1",[doc]);
  await db.query('UPDATE proyecto SET id_jefe=$1 WHERE id_proyecto=$2',[id('jefe'),proyecto]);
 }
 const compatible=await reporte('sindiferencias');const sinDiferencias=await post('/api/contrastes',jefe,{reporte:compatible,documento:doc});assert.equal(sinDiferencias.status,200);assert.deepEqual(sinDiferencias.body.diferencias,[]);
 assert.equal((await post('/api/contrastes',jefe,{reporte:rep,documento:doc,extra:true})).status,400);
 assert.equal((await post('/api/contrastes',jefe,{reporte:2147483648,documento:doc})).status,400);

 for(const [palabra,estado] of [['limitedeia',429],['credencialinvalida',503],['respuestacortada',502],['tiempoagotado',503]]){
  const a=await post('/api/asistente',jefe,{proyecto,pregunta:'entrega '+palabra});assert.equal(a.status,estado);assert.equal(JSON.stringify(a.body).includes('DETALLE_PRIVADO'),false);
  const nuevo=await reporte(palabra);const c=await post('/api/contrastes',jefe,{reporte:nuevo,documento:doc});assert.equal(c.status,estado);assert.equal(JSON.stringify(c.body).includes('DETALLE_PRIVADO'),false);
 }
 const consultas=await db.query('SELECT respuesta FROM consulta_asistente WHERE id_proyecto=$1',[proyecto]);assert.equal(consultas.rowCount,1);assert.match(consultas.rows[0].respuesta,/Cronograma\.txt/);const obs=await db.query('SELECT id_reporte,id_documento FROM observacion_ia WHERE id_reporte=ANY($1::int[])',[[rep,malo,malformado,fallo]]);assert.equal(obs.rowCount,1);assert.equal(obs.rows[0].id_documento,doc);
 console.log('IA simulada: permisos, citas válidas e inválidas, errores del proveedor, respuestas nulas, cambios concurrentes y persistencia verificados; sin tráfico externo.');
}finally{if(proyecto||privado){await db.query('DELETE FROM consulta_asistente WHERE id_proyecto=ANY($1::int[])',[[proyecto,privado].filter(Boolean)]);await db.query('DELETE FROM proyecto WHERE id_proyecto=ANY($1::int[])',[[proyecto,privado].filter(Boolean)]);}await db.end();if(servidor){servidor.kill('SIGTERM');await Promise.race([new Promise(resolve=>servidor.once('exit',resolve)),esperar(3000)]);if(servidor.exitCode===null)servidor.kill('SIGKILL');}rmSync(dir,{recursive:true,force:true});}
