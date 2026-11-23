import assert from 'node:assert/strict';
import {mkdtempSync,cpSync,symlinkSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawn,spawnSync} from 'node:child_process';
import {setTimeout as esperar} from 'node:timers/promises';
import {secretoSesion} from '../lib/session-secret.mjs';

assert.equal(secretoSesion(undefined,'development'),'dev-secreto-cambiar-en-produccion-123456');
assert.equal(secretoSesion('corta','development'),'corta');
for(const clave of [undefined,'','   ','corta','dev-secreto-cambiar-en-produccion-123456','cambia-esto-por-un-texto-largo-y-secreto-de-32-caracteres'])assert.throws(()=>secretoSesion(clave,'production'),/JWT_SECRET/);
const clavePrueba='solo-prueba-no-usar-en-produccion-123456789';assert.equal(secretoSesion(clavePrueba,'production'),clavePrueba);
const root=process.cwd(),dir=mkdtempSync(path.join(tmpdir(),'noah-secreto-'));let proceso;
try {
 for(const nombre of ['app','components','lib','scripts','middleware.ts','next.config.ts','tsconfig.json','postcss.config.mjs','package.json','next-env.d.ts'])cpSync(path.join(root,nombre),path.join(dir,nombre),{recursive:true});
 symlinkSync(path.join(root,'node_modules'),path.join(dir,'node_modules'),'dir');
 const env={...process.env,NEXT_TELEMETRY_DISABLED:'1'};delete env.JWT_SECRET;delete env.NODE_OPTIONS;
 const compilacion=spawnSync(process.execPath,[path.join(root,'node_modules/next/dist/bin/next'),'build'],{cwd:dir,env,encoding:'utf8',timeout:120000});assert.equal(compilacion.status,0,`Error de compilación: ${compilacion.stderr}`);
 for(const valor of [undefined,'corta']){
  const e={...env};if(valor!==undefined)e.JWT_SECRET=valor;
  const r=spawnSync(process.execPath,[path.join(root,'node_modules/next/dist/bin/next'),'start','-H','127.0.0.1','-p','32175'],{cwd:dir,env:e,encoding:'utf8',timeout:10000});
  assert.notEqual(r.status,0,'El servidor debe rechazar una clave inválida');assert.match(r.stderr+r.stdout,/JWT_SECRET/);
 }
 proceso=spawn(process.execPath,[path.join(root,'node_modules/next/dist/bin/next'),'start','-H','127.0.0.1','-p','32175'],{cwd:dir,env:{...env,JWT_SECRET:clavePrueba},stdio:['ignore','pipe','pipe']});let salida='';proceso.stdout.on('data',x=>salida+=x);proceso.stderr.on('data',x=>salida+=x);
 let activo=false;for(let i=0;i<40;i++){if(proceso.exitCode!==null)throw new Error('El servidor de prueba se detuvo: '+salida);if(salida.includes('Ready')){activo=true;break;}await esperar(250);}
 assert.ok(activo,'El servidor no inició con una clave válida');const r=await fetch('http://127.0.0.1:32175/login',{redirect:'manual'});assert.equal(r.status,200);
 console.log('JWT_SECRET: desarrollo, claves inválidas, arranque de producción y clave válida verificados.');
}finally{if(proceso){proceso.kill('SIGTERM');await Promise.race([new Promise(resolve=>proceso.once('exit',resolve)),esperar(3000)]);if(proceso.exitCode===null)proceso.kill('SIGKILL');}rmSync(dir,{recursive:true,force:true});}
