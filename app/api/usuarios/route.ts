import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { error, requerir } from "@/lib/acceso";

// RF-03: gestión de usuarios y roles (solo administrador)
export async function GET() {
  const a = await requerir(["administrador"]);
  if ("r" in a) return a.r;
  const filas = await query(
    `SELECT u.id_usuario, u.nombres, u.apellidos, u.correo, u.activo, u.id_rol, r.nombre AS rol, u.id_area, ar.nombre AS area
       FROM usuario u JOIN rol r ON r.id_rol=u.id_rol LEFT JOIN area ar ON ar.id_area=u.id_area
      ORDER BY u.id_usuario`
  );
  return NextResponse.json(filas);
}

export async function POST(req: Request) {
  const a = await requerir(["administrador"]);
  if ("r" in a) return a.r;
  const b = await req.json().catch(() => ({}));
  const { nombres, apellidos, correo, clave, id_rol, id_area } = b;
  if (!nombres || !apellidos || !correo || !clave || !id_rol) return error("Completa nombres, apellidos, correo, contraseña y rol");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return error("El correo no es válido");
  if (String(clave).length < 8) return error("La contraseña debe tener al menos 8 caracteres");
  const existe = await query("SELECT 1 FROM usuario WHERE lower(correo)=lower($1)", [correo]);
  if (existe.length) return error("Ya existe un usuario con ese correo", 409);
  const hash = await bcrypt.hash(String(clave), 10);
  const r = await query(
    `INSERT INTO usuario (id_rol,id_area,nombres,apellidos,correo,clave_hash)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING id_usuario`,
    [Number(id_rol), id_area ? Number(id_area) : null, String(nombres).trim(), String(apellidos).trim(), String(correo).trim(), hash]
  );
  return NextResponse.json({ ok: true, id_usuario: r[0].id_usuario }, { status: 201 });
}
