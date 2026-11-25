import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { reservarIntento, completarAcceso, limpiarIntentos } from "@/lib/login-limite.mjs";
import { firmar, Rol } from "@/lib/auth";

// RF-01: inicio de sesión
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const { correo, clave } = body && typeof body === 'object' && !Array.isArray(body) ? body : {};

  if (typeof correo !== "string" || typeof clave !== "string" || !correo.trim() || !clave || correo.length > 254 || clave.length > 1024)
    return NextResponse.json({ error: "Ingresa tu correo y tu contraseña" }, { status: 400 });

  try {
  await limpiarIntentos(query);
  const reserva = await reservarIntento(correo, query);
  if (!reserva.permitido) return NextResponse.json(
    { error: "Demasiados intentos. Espera unos minutos antes de volver a iniciar sesión.", reintentar_en: reserva.segundos },
    { status: 429, headers: { "Retry-After": String(reserva.segundos), "Cache-Control": "no-store" } }
  );
  const filas = await query<any>(
    `SELECT u.id_usuario, u.nombres, u.apellidos, u.correo, u.clave_hash, u.id_area, u.activo, r.nombre AS rol
       FROM usuario u JOIN rol r ON r.id_rol = u.id_rol
      WHERE lower(u.correo) = lower($1)`,
    [correo.trim().toLowerCase()]
  );
  const u = filas[0];
  const ok = u && u.activo && (await bcrypt.compare(clave, u.clave_hash));
  if (!ok) return NextResponse.json({ error: "Correo o contraseña incorrectos" }, { status: 401 });

  await completarAcceso(reserva, query);
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
  res.headers.set("Cache-Control", "no-store");
  return res;
  } catch {
    return NextResponse.json({ error: "El servicio de acceso no está disponible. Inténtalo de nuevo en unos momentos." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
