"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AvisoAlertas } from "./AlertasControl";
import { ContadorRecordatorios } from "./RecordatoriosContext";
import type { Sesion } from "@/lib/auth";
import Icono, { type NombreIcono } from "./Icono";

const ROL: Record<string, string> = { gerencia: "Gerencia", jefe_area: "Jefe de área", colaborador: "Colaborador", administrador: "Administrador" };
export default function Navbar({ s }: { s: Sesion }) {
  const router = useRouter();
  const ruta = usePathname();
  const [saliendo, setSaliendo] = useState(false);
  const [error, setError] = useState("");
  async function salir() {
    setSaliendo(true); setError("");
    try {
      const r = await fetch("/api/auth/logout", { method: "POST" });
      if (!r.ok) throw new Error();
      router.push("/login"); router.refresh();
    } catch { setError("No se pudo cerrar sesión. Inténtalo de nuevo."); setSaliendo(false); }
  }
  const enlaces: { href: string; t: string; i: NombreIcono }[] = [
    { href: "/", t: "Inicio", i: "inicio" },
    { href: "/proyectos", t: "Proyectos", i: "proyectos" },
    ...(s.rol !== "gerencia" ? [{ href: "/mis-tareas", t: "Mis tareas", i: "tareas" as const }] : []),
    { href: "/documentos", t: "Documentos", i: "reportes" },
    { href: "/reportes", t: "Reportes", i: "reportes" },
    { href: "/alertas", t: "Alertas", i: "alerta" },
    { href: "/recordatorios", t: "Recordatorios", i: "campana" },
    ...(s.rol === "administrador" ? [{ href: "/usuarios", t: "Usuarios y roles", i: "usuarios" as const }] : []),
  ];
  const activo = (h: string) => h === "/" ? ruta === "/" : ruta.startsWith(h);
  const iniciales = s.nombre.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase();
  return <>
    <a className="saltar" href="#contenido">Ir al contenido</a>
    <aside className="app-nav">
      <div className="nav-marca"><Link href="/" className="flex min-w-0 items-center gap-3" aria-label="NOAH TECH, inicio"><span className="marca-simbolo">N<span className="text-teal-300">.</span></span><span><strong className="block text-sm tracking-wide">NOAH TECH</strong><span className="text-xs text-slate-300">Gestión de proyectos</span></span></Link><button onClick={salir} disabled={saliendo} className="nav-salir nav-salir-mobile" aria-label="Cerrar sesión"><Icono nombre="salir" /></button></div>
      <nav aria-label="Navegación principal" className="nav-enlaces">{enlaces.map(e => <Link key={e.href} href={e.href} aria-current={activo(e.href) ? "page" : undefined} className={`nav-enlace ${activo(e.href) ? "seleccionado" : ""}`}><Icono nombre={e.i} /><span>{e.t}</span>{e.href === "/recordatorios" && <ContadorRecordatorios/>}{e.href === "/alertas" && <AvisoAlertas/>}{activo(e.href) && <span className="ml-auto hidden h-1.5 w-1.5 rounded-full bg-teal-300 lg:block" />}</Link>)}</nav>
      <div className="mt-auto hidden px-6 pb-6 lg:block"><p className="text-sm font-medium text-slate-200">Un equipo. Un mismo rumbo.</p><p className="mt-2 text-xs leading-5 text-slate-300">Proyectos, tareas y avances en un solo lugar.</p></div>
      <div className="nav-perfil"><div className="flex min-w-0 items-center gap-3"><span className="avatar">{iniciales}</span><div className="min-w-0"><p className="truncate text-sm font-medium">{s.nombre}</p><p className="mt-0.5 text-xs text-slate-300">{ROL[s.rol]}</p></div></div><button onClick={salir} disabled={saliendo} className="nav-salir mt-4 w-full"><Icono nombre="salir" />{saliendo ? "Cerrando sesión…" : "Cerrar sesión"}</button></div>
      {error && <p role="alert" className="px-4 pb-4 text-sm text-red-200">{error}</p>}
    </aside>
    <header className="app-topbar"><div className="flex min-w-0 items-center gap-2 text-sm"><span className="hidden text-suave sm:inline">Espacio de trabajo</span><span className="hidden text-slate-300 sm:inline">/</span><span className="truncate font-medium">{enlaces.find(e => activo(e.href))?.t || "Detalle de tarea"}</span></div><span className="flex items-center gap-2 text-xs text-suave"><span className="h-1.5 w-1.5 rounded-full bg-acento" />{ROL[s.rol]}</span></header>
  </>;
}
