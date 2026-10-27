import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requerir } from "@/lib/acceso";

// Tareas del usuario conectado (para "Mis tareas")
export async function GET() {
  const a = await requerir();
  if ("r" in a) return a.r;
  const filas = await query(
    `SELECT t.*, p.nombre AS proyecto FROM tarea t JOIN proyecto p ON p.id_proyecto=t.id_proyecto
      WHERE t.id_responsable=$1 ORDER BY t.fecha_entrega`, [a.s.id]);
  return NextResponse.json(filas);
}
