import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { error, requerir } from "@/lib/acceso";

// RF-03: cambiar rol, área, estado activo o contraseña
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await requerir(["administrador"]);
  if ("r" in a) return a.r;
  const id = Number((await params).id);
  const b = await req.json().catch(() => ({}));
  if (id === a.s.id && (b.activo === false || (b.id_rol && Number(b.id_rol) !== 4)))
    return error("No puedes desactivarte ni quitarte el rol de administrador a ti mismo");

  const sets: string[] = [];
  const vals: unknown[] = [];
  const add = (col: string, v: unknown) => { vals.push(v); sets.push(`${col}=$${vals.length}`); };
  if (b.id_rol !== undefined) add("id_rol", Number(b.id_rol));
  if (b.id_area !== undefined) add("id_area", b.id_area ? Number(b.id_area) : null);
  if (b.activo !== undefined) add("activo", Boolean(b.activo));
  if (b.clave) {
    if (String(b.clave).length < 8) return error("La contraseña debe tener al menos 8 caracteres");
    add("clave_hash", await bcrypt.hash(String(b.clave), 10));
  }
  if (!sets.length) return error("No hay cambios que guardar");
  vals.push(id);
  const r = await query(`UPDATE usuario SET ${sets.join(", ")} WHERE id_usuario=$${vals.length} RETURNING id_usuario`, vals);
  if (!r.length) return error("Usuario no encontrado", 404);
  return NextResponse.json({ ok: true });
}
