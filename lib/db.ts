import { Pool, types } from "pg";
import { configDBDesdeEntorno } from "./db-config.mjs";

// Las fechas (DATE) se devuelven como texto "AAAA-MM-DD" para evitar problemas de zona horaria.
types.setTypeParser(1082, (v: string) => v);

declare global {
  // eslint-disable-next-line no-var
  var _pool: Pool | undefined;
}

export const pool: Pool =
  globalThis._pool ??
  new Pool({
    ...configDBDesdeEntorno(),
    max: 5,
  });
if (process.env.NODE_ENV !== "production") globalThis._pool = pool;

export async function query<T = any>(text: string, params: unknown[] = []): Promise<T[]> {
  const r = await pool.query(text, params as any[]);
  return r.rows as T[];
}
