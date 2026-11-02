import { NextResponse } from "next/server";
import { error, requerir } from "@/lib/acceso";
import { pool } from "@/lib/db";
import { MOMENTOS, reportesDeTarea, seguimientoDeTarea, tareaParaReportes } from "@/lib/reportes";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await requerir();
  if ("r" in a) return a.r;
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) return error("Tarea no válida");
  const tarea = await tareaParaReportes(a.s, id);
  if (!tarea) return error("Tarea no encontrada o sin permiso para consultarla", 404);
  return NextResponse.json({ tarea, reportes: await reportesDeTarea(id), seguimiento: await seguimientoDeTarea(id,tarea.id_responsable) });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await requerir(["colaborador"]);
  if ("r" in a) return a.r;
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) return error("Tarea no válida");
  const datos = await req.json().catch(() => null);
  if (!datos || typeof datos !== "object" || Array.isArray(datos)) return error("El reporte debe contener datos válidos");
  const { momento, contenido, porcentaje_avance } = datos;
  if (!MOMENTOS.includes(momento)) return error("Selecciona el tipo de reporte");
  if (typeof contenido !== "string" || !contenido.trim() || contenido.trim().length > 5000)
    return error("Escribe el detalle del avance (entre 1 y 5000 caracteres)");
  if (typeof porcentaje_avance !== "number" || !Number.isInteger(porcentaje_avance) || porcentaje_avance < 0 || porcentaje_avance > 100)
    return error("El porcentaje de avance debe ser un número entero entre 0 y 100");

  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    // Bloquear la tarea serializa envíos simultáneos y cambios de responsable.
    const t = (await c.query(
      `SELECT t.estado,t.id_responsable,t.creado_en::date::text fecha_inicio FROM tarea t
        JOIN usuario u ON u.id_usuario=$2 JOIN rol r ON r.id_rol=u.id_rol
        WHERE t.id_tarea=$1 AND u.activo AND r.nombre='colaborador' FOR UPDATE OF t`, [id,a.s.id])).rows[0];
    if (!t) { await c.query("ROLLBACK"); return error("Tarea no encontrada o usuario no habilitado",404); }
    if (t.id_responsable !== a.s.id) { await c.query("ROLLBACK"); return error("Solo puedes registrar reportes de tus propias tareas",403); }
    const hoy = (await c.query("SELECT (CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date::text hoy")).rows[0].hoy;
    const previos = (await c.query(
      "SELECT momento,fecha_reporte::text FROM reporte_avance WHERE id_tarea=$1 AND id_usuario=$2 ORDER BY fecha_reporte DESC", [id,a.s.id])).rows;
    if (previos.some(r => r.fecha_reporte===hoy && r.momento===momento)) {
      await c.query("ROLLBACK"); return error("Ya registraste este tipo de reporte hoy",409);
    }
    if (momento === "fin_dia" && !previos.some(r => r.fecha_reporte===hoy && r.momento==="inicio_dia")) {
      await c.query("ROLLBACK"); return error("Primero registra el reporte de inicio de hoy",409);
    }
    if (momento === "cada_3_dias") {
      const anterior = previos.find(r => r.momento === "cada_3_dias");
      const proxima = (await c.query("SELECT ($1::date+3)::text fecha",[anterior?.fecha_reporte ?? t.fecha_inicio])).rows[0].fecha;
      if (hoy < proxima) { await c.query("ROLLBACK"); return error(`El próximo reporte adicional corresponde al ${proxima.slice(8,10)}/${proxima.slice(5,7)}/${proxima.slice(0,4)}`,409); }
    }
    const reporte = (await c.query(
      `INSERT INTO reporte_avance (id_tarea,id_usuario,momento,contenido,porcentaje_avance,fecha_reporte,fecha_hora)
       VALUES ($1,$2,$3,$4,$5,$6,(CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima'))
       RETURNING id_reporte,momento,porcentaje_avance,fecha_reporte::text`,
      [id,a.s.id,momento,contenido.trim(),porcentaje_avance,hoy])).rows[0];
    const estado = porcentaje_avance === 0 ? "pendiente" : porcentaje_avance === 100 ? "entregada" : "en_curso";
    if (t.estado !== estado) {
      await c.query("UPDATE tarea SET estado=$1,actualizado_en=(CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima') WHERE id_tarea=$2",[estado,id]);
      await c.query(
        "INSERT INTO historial_estado (id_tarea,id_usuario,estado_anterior,estado_nuevo,fecha_hora) VALUES ($1,$2,$3,$4,(CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima'))",
        [id,a.s.id,t.estado,estado]);
    }
    await c.query("COMMIT");
    return NextResponse.json({ ok:true,reporte,estado,estado_anterior:t.estado }, { status:201 });
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    if ((e as {code?:string}).code === "23505") return error("Ya registraste este tipo de reporte hoy",409);
    console.error("No se pudo registrar el reporte",e);
    return error("No se pudo guardar el reporte. Inténtalo nuevamente",500);
  } finally { c.release(); }
}
