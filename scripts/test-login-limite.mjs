import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import {configDBDesdeEntorno} from '../lib/db-config.mjs';
import {claveIntento,reservarIntento,completarAcceso,limpiarIntentos} from '../lib/login-limite.mjs';
const db=new pg.Pool(configDBDesdeEntorno());
const consultar=async(sql,params=[]) => (await db.query(sql,params)).rows;
let checks=0;const eq=(a,b,m)=>{assert.deepEqual(a,b,m);checks++;};
const sufijo=crypto.randomBytes(10).toString('hex');const correo=`limite-${sufijo}@example.test`;const claves=new Set([claveIntento(correo)]);let usuario;
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3002';
async function login(body){return fetch(base+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});}
try {
 eq(claveIntento('  '+correo.toUpperCase()+' '),claveIntento(correo),'Normaliza identidad');eq(claveIntento(correo).includes(correo),false,'No guarda el correo');
 const reservas=await Promise.all(Array.from({length:12},()=>reservarIntento(correo,consultar)));
 eq(reservas.filter(r=>r.permitido).length,5,'Cupo atómico entre solicitudes concurrentes');eq(reservas.filter(r=>!r.permitido).length,7);
 eq((await consultar('SELECT intentos FROM login_intento WHERE clave=$1',[claveIntento(correo)]))[0].intentos,5,'Contador acotado');
 const bloqueo=await reservarIntento(correo,consultar);eq(bloqueo.permitido,false);eq(bloqueo.segundos>0&&bloqueo.segundos<=900,true);
 await consultar("UPDATE login_intento SET vence_en=clock_timestamp()-interval '1 second' WHERE clave=$1",[claveIntento(correo)]);
 const nueva=await reservarIntento(correo,consultar);eq(nueva.permitido,true);eq(nueva.intentos,1);eq(reservas.some(r=>r.ventana===nueva.ventana),false,'Ventana nueva');
 await completarAcceso(reservas.find(r=>r.permitido),consultar);eq((await consultar('SELECT count(*)::int n FROM login_intento WHERE clave=$1',[nueva.clave]))[0].n,1,'Acceso viejo no libera ventana nueva');
 const posterior=await reservarIntento(correo,consultar);await completarAcceso(nueva,consultar);eq((await consultar('SELECT intentos FROM login_intento WHERE clave=$1',[nueva.clave]))[0].intentos,2,'No borra solicitudes posteriores');
 await completarAcceso(posterior,consultar);eq((await consultar('SELECT count(*)::int n FROM login_intento WHERE clave=$1',[nueva.clave]))[0].n,0,'Acceso válido libera su cupo');
 await reservarIntento(correo,consultar);await consultar("UPDATE login_intento SET vence_en=clock_timestamp()-interval '1 second' WHERE clave=$1",[nueva.clave]);await limpiarIntentos(consultar);eq((await consultar('SELECT count(*)::int n FROM login_intento WHERE clave=$1',[nueva.clave]))[0].n,0);
 for(const body of [null,[],{}, {correo:' ',clave:'x'},{correo:'x'.repeat(255),clave:'x'}])eq((await login(body)).status,400,'Entrada inválida');
 const pass=crypto.randomBytes(20).toString('hex');usuario=(await consultar("INSERT INTO usuario(id_rol,id_area,nombres,apellidos,correo,clave_hash) VALUES(3,3,'Prueba','Temporal',$1,$2) RETURNING id_usuario",[correo,await bcrypt.hash(pass,10)]))[0].id_usuario;
 eq((await login({correo,clave:'incorrecta'})).status,401);
 eq((await login({correo:' '+correo.toUpperCase()+' ',clave:pass})).status,200,'Acceso correcto restablece');
 for(let i=0;i<5;i++)eq((await login({correo,clave:'incorrecta'})).status,401);
 const r=await login({correo,clave:pass});eq(r.status,429,'API bloquea incluso credencial correcta tras alcanzar el límite');eq(Number(r.headers.get('retry-after'))>0,true);eq(r.headers.get('set-cookie'),null);eq(r.headers.get('cache-control'),'no-store');
 await consultar("UPDATE login_intento SET vence_en=clock_timestamp()-interval '1 second' WHERE clave=$1",[nueva.clave]);eq((await login({correo,clave:pass})).status,200,'Acceso se recupera al vencer plazo');
 const inexistente=`ausente-${sufijo}@example.test`;claves.add(claveIntento(inexistente));for(let i=0;i<5;i++)eq((await login({correo:inexistente,clave:pass})).status,401);eq((await login({correo:inexistente,clave:pass})).status,429,'Mismo límite sin revelar existencia de cuenta');
 console.log(`Acceso: ${checks} verificaciones correctas.`);
}finally{if(usuario)await consultar('DELETE FROM usuario WHERE id_usuario=$1',[usuario]);for(const clave of claves)await consultar('DELETE FROM login_intento WHERE clave=$1',[clave]);await db.end();}
