import assert from 'node:assert/strict';
import pg from 'pg';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3000';
const db=new pg.Client({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_SSL==='false'?false:{rejectUnauthorized:false}});
const cookies={};const proyectos=[];let checks=0;
const eq=(a,b,msg)=>{assert.deepEqual(a,b,msg);checks++;};
async function req(rol,path,opts={}){return fetch(base+path,{...opts,headers:{...opts.headers,...(rol?{cookie:cookies[rol]}:{})}});}
async function upload(rol,p,text='Documento de prueba',nombre='acuerdos.txt'){const f=new FormData();f.set('proyecto',String(p));f.set('archivo',new File([text],nombre));return req(rol,'/api/documentos',{method:'POST',body:f});}
try{await db.connect();const users=(await db.query('SELECT id_usuario,correo FROM usuario')).rows;const uid=n=>users.find(u=>u.correo===n+'@noahtech.pe').id_usuario;
 for(const rol of ['admin','jefe','gerencia','carlos','maria']){const r=await req(null,'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({correo:rol+'@noahtech.pe',clave:process.env.DEMO_PASSWORD||'Demo2026!'})});eq(r.status,200,'Login '+rol);cookies[rol]=r.headers.get('set-cookie').split(';')[0];}
 async function proyecto(jefe){const p=(await db.query("INSERT INTO proyecto(id_area,id_jefe,nombre,fecha_inicio,fecha_entrega) VALUES(3,$1,'Prueba temporal RF12',CURRENT_DATE,CURRENT_DATE+10) RETURNING id_proyecto",[uid(jefe)])).rows[0].id_proyecto;proyectos.push(p);return p;}
 const p=await proyecto('jefe'),ajeno=await proyecto('admin');await db.query("INSERT INTO proyecto_miembro VALUES($1,$2,'Desarrollador')",[p,uid('carlos')]);
 eq((await req(null,'/api/documentos?proyecto='+p)).status,401);
 for(const rol of ['gerencia','carlos','maria'])eq((await upload(rol,p)).status,403,'Sin permiso de carga '+rol);
 eq((await upload('jefe',ajeno)).status,404,'Jefe fuera de alcance');
 const texto='Árbol 🌳 y acuerdos\r\n'+ 'Contenido de prueba. '.repeat(400)+'<script>alert(1)</script>';
 const r=await upload('jefe',p,texto,'acuerdos.md');eq(r.status,201);const d=await r.json();eq(d.fragmentos,Math.ceil(Array.from(texto.replace(/\r\n?/g,'\n').trim()).length/2000));
 const leer=await req('carlos','/api/documentos/'+d.id_documento);eq(leer.status,200);eq(leer.headers.get('cache-control'),'no-store');const contenido=await leer.json();eq(contenido.fragmentos.map(f=>f.texto).join(''),texto.replace(/\r\n?/g,'\n').trim(),'Texto íntegro y Unicode');eq(contenido.fragmentos.map(f=>f.orden),contenido.fragmentos.map((_,i)=>i+1));
 const download=await req('carlos',`/api/documentos/${d.id_documento}?descargar=1`);eq(download.status,200);eq(await download.text(),texto,'Original sin modificar');eq(download.headers.get('content-type'),'application/octet-stream');
 for(const rol of ['admin','jefe','gerencia','carlos']){const l=await req(rol,'/api/documentos?proyecto='+p);eq(l.status,200);eq((await l.json()).length,1);}
 eq((await req('maria','/api/documentos?proyecto='+p)).status,404);eq((await req('maria','/api/documentos/'+d.id_documento)).status,404);eq((await req('maria',`/api/documentos/${d.id_documento}?descargar=1`)).status,404);
 eq((await upload('admin',p,texto,'otro.md')).status,409,'Duplicado por contenido');
 eq((await upload('admin',p,'   \n')).status,400);eq((await upload('admin',p,'texto','archivo.pdf')).status,400);eq((await upload('admin',p,'texto','../secreto.txt')).status,400);eq((await upload('admin',p,new Uint8Array([0xff,0xfe]))).status,400);eq((await upload('admin',p,'abc\0def')).status,400);eq((await upload('admin',p,'x'.repeat(1024*1024+1))).status,413);
 const simultaneos=await Promise.all([upload('admin',p,'Documento concurrente'),upload('admin',p,'Documento concurrente')]);eq(simultaneos.map(r=>r.status).sort(),[201,409]);
 for(const qs of ['','proyecto=0','proyecto=abc','proyecto=2147483648',`proyecto=${p}&proyecto=${p}`,`proyecto=${p}&otro=1`])eq((await req('admin','/api/documentos?'+qs)).status,400);
 eq((await req('admin','/api/documentos/abc')).status,400);eq((await req('admin',`/api/documentos/${d.id_documento}?descargar=0`)).status,400);
 const estado=(await db.query('SELECT activo FROM usuario WHERE id_usuario=$1',[uid('carlos')])).rows[0].activo;
 try{await db.query('UPDATE usuario SET activo=false WHERE id_usuario=$1',[uid('carlos')]);eq((await req('carlos','/api/documentos/'+d.id_documento)).status,404);}finally{await db.query('UPDATE usuario SET activo=$1 WHERE id_usuario=$2',[estado,uid('carlos')]);}
 eq((await req('admin','/documentos')).status,200);
 console.log(`RF-12: ${checks} verificaciones correctas.`);
}finally{for(const p of proyectos)await db.query('DELETE FROM proyecto WHERE id_proyecto=$1',[p]);await db.end();}
