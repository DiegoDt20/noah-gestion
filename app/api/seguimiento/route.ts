import { NextResponse } from "next/server";
import { error, requerir } from "@/lib/acceso";
import { consultarSeguimiento } from "@/lib/seguimiento";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const a = await requerir(); if ("r" in a) return a.r;
  const params = new URL(req.url).searchParams;
  for (const clave of params.keys()) if (clave!=="proyecto" || params.getAll(clave).length>1) return error("Filtros del panel no válidos");
  const texto = params.get("proyecto"); let proyecto: number | null = null;
  if (texto !== null) {
    if (!/^\d+$/.test(texto) || !Number.isSafeInteger(Number(texto)) || Number(texto)<1 || Number(texto)>2147483647) return error("Proyecto no válido");
    proyecto = Number(texto);
  }
  const datos = await consultarSeguimiento(a.s, proyecto);
  if (proyecto!==null && !datos.proyectos.length) return error("Proyecto no encontrado o sin permiso para consultarlo",404);
  return NextResponse.json(datos, { headers: { "Cache-Control": "private, no-store" } });
}
