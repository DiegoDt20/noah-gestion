import fs from "node:fs";
import pg from "pg";
if(!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL en .env.local");
const c=new pg.Client({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_SSL==="false"?false:{rejectUnauthorized:false}});
try{await c.connect();await c.query(fs.readFileSync(new URL("../db/migrations/011_alertas.sql",import.meta.url),"utf8"));console.log("RF-11: migración aplicada sin borrar registros.");}finally{await c.end();}
