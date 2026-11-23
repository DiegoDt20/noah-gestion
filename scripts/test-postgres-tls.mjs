import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import net from 'node:net';import {spawnSync} from 'node:child_process';import pg from 'pg';import {configDB} from '../lib/db-config.mjs';
const base='postgresql://noah@localhost:5432/postgres';
assert.equal(configDB({url:base,ssl:'false',entorno:'development'}).ssl,false);
for(const opts of [{url:base,ssl:'false',entorno:'production'},{url:'postgresql://noah@remote.example/db',ssl:'false',entorno:'development'},{url:base+'?sslmode=no-verify'},{url:base+'?ssl=false'},{url:base+'?host=example.com'},{url:base+'?sslrootcert=/tmp/x'},{url:base,ssl:'no'}])assert.throws(()=>configDB(opts));
assert.equal(configDB({url:base,ssl:'true'}).ssl.rejectUnauthorized,true);
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'noah-tls-'));let started=false;let pgctl='';
function run(cmd,args){const r=spawnSync(cmd,args,{encoding:'utf8'});if(r.status!==0)throw new Error(`${cmd} falló: ${r.stderr||r.stdout}`);return r.stdout.trim();}
function escribirCert(){
 fs.writeFileSync(path.join(dir,'ext.cnf'),'subjectAltName=DNS:localhost\nextendedKeyUsage=serverAuth\n');
 run('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-keyout',path.join(dir,'ca.key'),'-out',path.join(dir,'ca.crt'),'-subj','/CN=NOAH Test CA','-days','1']);
 run('openssl',['req','-newkey','rsa:2048','-nodes','-keyout',path.join(dir,'server.key'),'-out',path.join(dir,'server.csr'),'-subj','/CN=localhost']);
 run('openssl',['x509','-req','-in',path.join(dir,'server.csr'),'-CA',path.join(dir,'ca.crt'),'-CAkey',path.join(dir,'ca.key'),'-CAcreateserial','-out',path.join(dir,'server.crt'),'-days','1','-extfile',path.join(dir,'ext.cnf')]);fs.chmodSync(path.join(dir,'server.key'),0o600);
}
async function conectar(config){const c=new pg.Client(config);try{await c.connect();const r=await c.query('SELECT 1 AS valor');assert.equal(r.rows[0].valor,1);}finally{await c.end().catch(()=>{});}}
try{
 const bindir=run('pg_config',['--bindir']);pgctl=path.join(bindir,'pg_ctl');escribirCert();run(path.join(bindir,'initdb'),['-D',path.join(dir,'db'),'-U','noah','-A','trust','--no-locale']);
 const puerto=await new Promise((resolve,reject)=>{const s=net.createServer();s.once('error',reject);s.listen(0,'127.0.0.1',()=>{const n=s.address().port;s.close(()=>resolve(n));});});
 const parametros=`-h localhost -p ${puerto} -k ${dir} -c ssl=on -c ssl_cert_file=${dir}/server.crt -c ssl_key_file=${dir}/server.key`;
 run(pgctl,['-D',path.join(dir,'db'),'-l',path.join(dir,'postgres.log'),'-o',parametros,'start']);started=true;
 const local=`postgresql://noah@localhost:${puerto}/postgres`;const ca=fs.readFileSync(path.join(dir,'ca.crt'),'utf8');
 await conectar(configDB({url:local,ssl:'false',entorno:'development'}));
 await conectar(configDB({url:local,ssl:'true',ca,entorno:'production'}));
 await assert.rejects(conectar(configDB({url:local,ssl:'true',entorno:'production'})),e=>['UNABLE_TO_VERIFY_LEAF_SIGNATURE','SELF_SIGNED_CERT_IN_CHAIN','UNABLE_TO_GET_ISSUER_CERT_LOCALLY'].includes(e.code));
 await assert.rejects(conectar(configDB({url:`postgresql://noah@127.0.0.1:${puerto}/postgres`,ssl:'true',ca,entorno:'production'})),e=>e.code==='ERR_TLS_CERT_ALTNAME_INVALID');
 console.log('PostgreSQL: conexión local, TLS confiable, CA no confiable y nombre incorrecto verificados.');
}finally{if(started)run(pgctl,['-D',path.join(dir,'db'),'stop','-m','fast']);fs.rmSync(dir,{recursive:true,force:true});}
