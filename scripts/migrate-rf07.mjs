import { configDBDesdeEntorno } from '../lib/db-config.mjs';
import fs from "node:fs";
import pg from "pg";
const c = new pg.Client(configDBDesdeEntorno());
try {
  await c.connect();
  await c.query(fs.readFileSync(new URL("../db/migrations/007_reportes.sql",import.meta.url),"utf8"));
  console.log("RF-07: migración aplicada sin borrar datos.");
} finally { await c.end(); }
