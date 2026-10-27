import { NextRequest, NextResponse } from "next/server";
import { verificar } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const publica = pathname === "/login" || pathname.startsWith("/api/auth");
  const token = req.cookies.get("token")?.value;
  const s = token ? await verificar(token) : null;

  if (!s && !publica) {
    if (pathname.startsWith("/api")) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (s && pathname === "/login") return NextResponse.redirect(new URL("/", req.url));
  // RF-02: control de acceso por rol a nivel de rutas
  if (s && pathname.startsWith("/usuarios") && s.rol !== "administrador") return NextResponse.redirect(new URL("/", req.url));
  if (s && pathname.startsWith("/mis-tareas") && s.rol === "gerencia") return NextResponse.redirect(new URL("/", req.url));
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
