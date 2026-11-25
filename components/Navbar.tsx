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
    { href: "/documentos", t: "Documentos", i: "documento" },
    { href: "/reportes", t: "Reportes", i: "reportes" },
    { href: "/alertas", t: "Alertas", i: "alerta" },
    { href: "/recordatorios", t: "Recordatorios", i: "campana" },
    ...(s.rol === "administrador" ? [{ href: "/usuarios", t: "Usuarios y roles", i: "usuarios" as const }] : []),
  ];
  const activo = (h: string) => h === "/" ? ruta === "/" : ruta.startsWith(h);
  const iniciales = s.nombre.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase();
  const grupos = [
    { titulo: "Trabajo", enlaces: enlaces.filter(e => ["/", "/proyectos", "/mis-tareas"].includes(e.href)) },
    { titulo: "Seguimiento", enlaces: enlaces.filter(e => ["/documentos", "/reportes", "/alertas", "/recordatorios"].includes(e.href)) },
    { titulo: "Equipo", enlaces: enlaces.filter(e => e.href === "/usuarios") },
  ].filter(g => g.enlaces.length);
  return <>
    <a className="saltar" href="#contenido">Ir al contenido</a>
    <aside className="app-nav">
      <div className="nav-marca"><Link href="/" className="flex min-w-0 items-center gap-3" aria-label="NOAH TECH, inicio"><span className="marca-simbolo">N<span className="opacity-60">.</span></span><span><strong className="brand-wordmark">noah<span className="text-marca">.</span></strong><span className="brand-subtitle">TECH SOLUTIONS</span></span></Link><button onClick={salir} disabled={saliendo} className="nav-salir nav-salir-mobile" aria-label="Cerrar sesión"><Icono nombre="salir" /></button></div>
      <div className="nav-groups">{grupos.map(g => <div className="nav-group" key={g.titulo}><p className="nav-group-title">{g.titulo}</p><nav aria-label={g.titulo} className="nav-enlaces">{g.enlaces.map(e => <Link key={e.href} href={e.href} aria-current={activo(e.href) ? "page" : undefined} className={`nav-enlace ${activo(e.href) ? "seleccionado" : ""}`}><Icono nombre={e.i} /><span>{e.t}</span>{e.href === "/recordatorios" && <ContadorRecordatorios />}{e.href === "/alertas" && <AvisoAlertas />}</Link>)}</nav></div>)}</div>
      <div className="nav-perfil"><span className="avatar">{iniciales}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{s.nombre}</p><p className="text-xs text-suave">{ROL[s.rol]}</p></div><button onClick={salir} disabled={saliendo} className="nav-salir" title="Cerrar sesión" aria-label={saliendo ? "Cerrando sesión…" : "Cerrar sesión"}><Icono nombre="salir" /></button></div>
      {error && <p role="alert" className="px-4 pb-4 text-xs text-red-700">{error}</p>}
    </aside>
  </>;
}
