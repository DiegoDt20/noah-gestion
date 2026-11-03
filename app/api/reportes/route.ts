import { NextResponse } from "next/server";
import { error, requerir } from "@/lib/acceso";
import { consultarReportes, filtrosReportes } from "@/lib/consulta-reportes";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const a = await requerir(); if ("r" in a) return a.r;
  let filtros;
  try { filtros = filtrosReportes(new URL(req.url).searchParams); }
  catch (e) { return error(e instanceof Error ? e.message : "Filtros no válidos"); }
  return NextResponse.json(await consultarReportes(a.s, filtros), { headers: { "Cache-Control": "private, no-store" } });
}
