import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { ESTADOS, error, requerir } from "@/lib/acceso";

// RF-06: cambio de estado con historial (quién, cuándo, de qué estado a cuál)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await requerir(["colaborador", "jefe_area", "administrador"]);
  if ("r" in a) return a.r;
  const id = Number((await params).id);
  const { estado } = await req.json().catch(() => ({}));
  if (!ESTADOS.includes(estado)) return error("El estado debe ser pendiente, en curso o entregada");

  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    const t = (await c.query(
      `SELECT t.id_tarea, t.id_responsable, t.estado, p.id_jefe FROM tarea t JOIN proyecto p ON p.id_proyecto=t.id_proyecto
        WHERE t.id_tarea=$1 FOR UPDATE OF t`, [id])).rows[0];
    if (!t) { await c.query("ROLLBACK"); return error("Tarea no encontrada", 404); }
    const permitido = a.s.rol === "administrador" || t.id_responsable === a.s.id || (a.s.rol === "jefe_area" && t.id_jefe === a.s.id);
    if (!permitido) { await c.query("ROLLBACK"); return error("Solo el responsable o el jefe del proyecto puede cambiar el estado", 403); }
    if (t.estado === estado) { await c.query("ROLLBACK"); return error("La tarea ya está en ese estado"); }
    await c.query("UPDATE tarea SET estado=$1, actualizado_en=NOW() WHERE id_tarea=$2", [estado, id]);
    await c.query(
      "INSERT INTO historial_estado (id_tarea,id_usuario,estado_anterior,estado_nuevo) VALUES ($1,$2,$3,$4)",
      [id, a.s.id, t.estado, estado]
    );
    await c.query("COMMIT");
    return NextResponse.json({ ok: true, estado_anterior: t.estado, estado_nuevo: estado });
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}
