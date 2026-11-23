import { configDBDesdeEntorno } from '../lib/db-config.mjs';
import fs from "node:fs";
import pg from "pg";
if (!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL en .env.local");
const c = new pg.Client(configDBDesdeEntorno());
try { await c.connect(); await c.query(fs.readFileSync(new URL("../db/migrations/013_repositorio_github.sql", import.meta.url), "utf8")); console.log("Repositorio de GitHub: migración aplicada sin borrar datos."); } finally { await c.end(); }
