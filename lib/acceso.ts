import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { Sesion, sesionActual } from "@/lib/auth";

export const error = (mensaje: string, status = 400) => NextResponse.json({ error: mensaje }, { status });

/** Devuelve la sesión o una respuesta 401/403 si el rol no está permitido (RF-02). */
export async function requerir(roles?: Sesion["rol"][]): Promise<{ s: Sesion } | { r: NextResponse }> {
  const s = await sesionActual();
  if (!s) return { r: error("No autenticado", 401) };
  if (roles && !roles.includes(s.rol)) return { r: error("No tienes permiso para esta acción", 403) };
  return { s };
}

export interface ProyectoFila {
  id_proyecto: number;
  id_area: number;
  id_jefe: number;
  nombre: string;
  descripcion: string | null;
  fecha_inicio: string;
  fecha_entrega: string;
  estado: string;
}

export async function cargarProyecto(id: number): Promise<ProyectoFila | null> {
  const r = await query<ProyectoFila>("SELECT * FROM proyecto WHERE id_proyecto = $1", [id]);
  return r[0] ?? null;
}

export async function esMiembro(id_proyecto: number, id_usuario: number): Promise<boolean> {
  const r = await query("SELECT 1 FROM proyecto_miembro WHERE id_proyecto=$1 AND id_usuario=$2", [id_proyecto, id_usuario]);
  return r.length > 0;
}

export async function puedeVer(s: Sesion, p: ProyectoFila): Promise<boolean> {
  if (s.rol === "administrador" || s.rol === "gerencia") return true;
  if (s.rol === "jefe_area") return p.id_jefe === s.id;
  return esMiembro(p.id_proyecto, s.id);
}

export function puedeGestionar(s: Sesion, p: ProyectoFila): boolean {
  return s.rol === "administrador" || (s.rol === "jefe_area" && p.id_jefe === s.id);
}

export const ESTADOS = ["pendiente", "en_curso", "entregada"] as const;
export const ESTADO_TEXTO: Record<string, string> = { pendiente: "Pendiente", en_curso: "En curso", entregada: "Entregada" };

export function fechaOk(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v));
}
export function fmt(f: string | null | undefined): string {
  if (!f) return "-";
  const [a, m, d] = f.slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
}
