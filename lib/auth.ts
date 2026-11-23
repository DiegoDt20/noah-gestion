import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { secretoSesion } from "./session-secret.mjs";

export type Rol = "gerencia" | "jefe_area" | "colaborador" | "administrador";
export interface Sesion {
  id: number;
  nombre: string;
  correo: string;
  rol: Rol;
  id_area: number | null;
}

const secreto = () => new TextEncoder().encode(secretoSesion(process.env.JWT_SECRET, process.env.NODE_ENV));

export async function firmar(s: Sesion): Promise<string> {
  return new SignJWT({ ...s })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secreto());
}

export async function verificar(token: string): Promise<Sesion | null> {
  const clave = secreto();
  try {
    const { payload } = await jwtVerify(token, clave);
    return payload as unknown as Sesion;
  } catch {
    return null;
  }
}

export async function sesionActual(): Promise<Sesion | null> {
  const t = (await cookies()).get("token")?.value;
  return t ? verificar(t) : null;
}

export const ROL_TEXTO: Record<Rol, string> = {
  gerencia: "Gerencia",
  jefe_area: "Jefe de área",
  colaborador: "Colaborador",
  administrador: "Administrador",
};
