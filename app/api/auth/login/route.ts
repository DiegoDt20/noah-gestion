import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { firmar, Rol } from "@/lib/auth";

// RF-01: inicio de sesión
export async function POST(req: Request) {
  const { correo, clave } = await req.json().catch(() => ({}));
  if (typeof correo !== "string" || typeof clave !== "string" || !correo || !clave)
    return NextResponse.json({ error: "Ingresa tu correo y tu contraseña" }, { status: 400 });

  const filas = await query<any>(
    `SELECT u.id_usuario, u.nombres, u.apellidos, u.correo, u.clave_hash, u.id_area, u.activo, r.nombre AS rol
       FROM usuario u JOIN rol r ON r.id_rol = u.id_rol
      WHERE lower(u.correo) = lower($1)`,
    [correo.trim()]
  );
  const u = filas[0];
  const ok = u && u.activo && (await bcrypt.compare(clave, u.clave_hash));
  if (!ok) return NextResponse.json({ error: "Correo o contraseña incorrectos" }, { status: 401 });

  const token = await firmar({
    id: u.id_usuario,
    nombre: `${u.nombres} ${u.apellidos}`,
    correo: u.correo,
    rol: u.rol as Rol,
    id_area: u.id_area,
  });
  const res = NextResponse.json({ ok: true, rol: u.rol });
  res.cookies.set("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return res;
}
