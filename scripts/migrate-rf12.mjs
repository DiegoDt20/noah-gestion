import { configDBDesdeEntorno } from '../lib/db-config.mjs';
import fs from "node:fs";
import pg from "pg";
if(!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL en .env.local");
const c=new pg.Client(configDBDesdeEntorno());
try{await c.connect();await c.query(fs.readFileSync(new URL("../db/migrations/012_documentos.sql",import.meta.url),"utf8"));console.log("RF-12: migración aplicada sin borrar registros.");}finally{await c.end();}
