import { configDBDesdeEntorno } from '../lib/db-config.mjs';
import assert from "node:assert/strict";
import pg from "pg";
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
const db = new pg.Client(configDBDesdeEntorno());
const ids=[];
try {
 await db.connect();
 const login = await fetch(`${base}/api/auth/login`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({correo:"jefe@noahtech.pe",clave:process.env.DEMO_PASSWORD || "Demo2026!"})});
 assert.equal(login.status,200); const cookie=login.headers.get("set-cookie").split(";")[0];
 const crear=async repo=>fetch(`${base}/api/proyectos`,{method:"POST",headers:{"content-type":"application/json",cookie},body:JSON.stringify({nombre:"Prueba repositorio GitHub",fecha_inicio:"2026-01-01",fecha_entrega:"2026-12-31",...(repo===undefined?{}:{repositorio_github:repo})})});
 for (const repo of [undefined,"https://github.com/DiegoDt20/noah-gestion"]) {const r=await crear(repo);assert.equal(r.status,201);const {id_proyecto}=await r.json();ids.push(id_proyecto);const p=await db.query("SELECT repositorio_github FROM proyecto WHERE id_proyecto=$1",[id_proyecto]);assert.equal(p.rows[0].repositorio_github,repo??null);const detalle=await fetch(`${base}/proyectos/${id_proyecto}`,{headers:{cookie}});assert.equal(detalle.status,200);const html=await detalle.text();assert.equal(html.includes('Repositorio de GitHub ↗'),!!repo);if(repo)assert.ok(html.includes(repo));}
 for(const invalida of ["http://github.com/a/b","https://github.com.evil.test/a/b","https://github.com/a","https://github.com/a/b?x=1","javascript:alert(1)",123]) assert.equal((await crear(invalida)).status,400);
 console.log("Repositorio GitHub: registro opcional, persistencia, detalle y validación verificados.");
} finally {if(ids.length) await db.query("DELETE FROM proyecto WHERE id_proyecto=ANY($1::int[])",[ids]);await db.end();}
