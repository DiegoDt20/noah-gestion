import fs from "node:fs";
import pg from "pg";
if (!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL en .env.local");
const c = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false } });
try {
  await c.connect();
  await c.query(fs.readFileSync(new URL("../db/migrations/008_recordatorios.sql", import.meta.url), "utf8"));
  console.log("RF-08: migración aplicada sin borrar datos.");
} finally { await c.end(); }
