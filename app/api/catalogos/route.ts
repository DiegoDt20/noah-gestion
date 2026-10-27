import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requerir } from "@/lib/acceso";

export async function GET() {
  const a = await requerir();
  if ("r" in a) return a.r;
  const [roles, areas] = await Promise.all([
    query("SELECT id_rol, nombre FROM rol ORDER BY id_rol"),
    query("SELECT id_area, nombre FROM area ORDER BY nombre"),
  ]);
  return NextResponse.json({ roles, areas });
}
