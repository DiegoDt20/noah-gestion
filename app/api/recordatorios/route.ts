import { NextResponse } from "next/server";
import { error, requerir } from "@/lib/acceso";
import { listarRecordatorios, verRecordatorios } from "@/lib/recordatorios";
import { MOMENTOS } from "@/lib/reportes";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
export async function GET() {
  const a = await requerir(); if ("r" in a) return a.r;
  const recordatorios = await listarRecordatorios(a.s);
  return NextResponse.json({ recordatorios, pendientes: recordatorios.length, sin_ver: recordatorios.filter(r => !r.visto).length }, { headers });
}
export async function PATCH(req: Request) {
  const a = await requerir(); if ("r" in a) return a.r;
  const b = await req.json().catch(() => null);
  if (!b || typeof b !== "object" || Array.isArray(b)) return error("Indica el recordatorio que deseas marcar como visto");
  if (b.todos === true) {
    await verRecordatorios(a.s);
    return NextResponse.json({ ok: true }, { headers });
  }
  if (!Number.isSafeInteger(b.id_tarea) || b.id_tarea<=0 || !Number.isSafeInteger(b.id_responsable) || b.id_responsable<=0 ||
      !MOMENTOS.includes(b.momento) || typeof b.fecha !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(b.fecha))
    return error("Recordatorio no válido");
  // La comparación es textual en esta validación para rechazar también fechas imposibles.
  const actuales = await listarRecordatorios(a.s);
  if (!actuales.some(r => r.id_tarea===b.id_tarea && r.id_responsable===b.id_responsable && r.momento===b.momento && r.fecha===b.fecha))
    return error("El recordatorio ya no está pendiente o no tienes acceso",404);
  const marcados = await verRecordatorios(a.s, b);
  if (!marcados.length) return error("El recordatorio ya no está pendiente o no tienes acceso",404);
  return NextResponse.json({ ok: true }, { headers });
}
