"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { Sesion } from "@/lib/auth";

const ROL: Record<string, string> = { gerencia: "Gerencia", jefe_area: "Jefe de área", colaborador: "Colaborador", administrador: "Administrador" };

const I = {
  inicio: "M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10",
  proyectos: "M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z",
  tareas: "M9 11l3 3 8-8M20 12v6a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h9",
  usuarios: "M16 20v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M9.5 10a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM21 20v-2a4 4 0 00-3-3.87M16 3.13a3.5 3.5 0 010 6.74",
};

function Icono({ d }: { d: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
  );
}

export default function Navbar({ s }: { s: Sesion }) {
  const router = useRouter();
  const ruta = usePathname();
  async function salir() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }
  const enlaces = [
    { href: "/", t: "Inicio", i: I.inicio },
    { href: "/proyectos", t: "Proyectos", i: I.proyectos },
    ...(s.rol !== "gerencia" ? [{ href: "/mis-tareas", t: "Mis tareas", i: I.tareas }] : []),
    ...(s.rol === "administrador" ? [{ href: "/usuarios", t: "Usuarios y roles", i: I.usuarios }] : []),
  ];
  const activo = (h: string) => (h === "/" ? ruta === "/" : ruta.startsWith(h));
  const iniciales = s.nombre.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <aside className="bg-marca-oscuro text-white lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col">
      <div className="flex items-center gap-3 px-5 py-4 lg:py-6">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-acento text-sm font-bold">NT</div>
        <div className="leading-tight">
          <div className="text-sm font-bold tracking-wide">NOAH TECH</div>
          <div className="text-xs text-white/60">Seguimiento de proyectos</div>
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:overflow-visible lg:pb-0">
        {enlaces.map(e => (
          <Link key={e.href} href={e.href}
            className={`flex items-center gap-3 whitespace-nowrap rounded-md px-3 py-2.5 text-sm transition ${activo(e.href) ? "bg-white/12 font-semibold text-white" : "text-white/70 hover:bg-white/8 hover:text-white"}`}>
            <Icono d={e.i} />{e.t}
          </Link>
        ))}
      </nav>
      <div className="hidden border-t border-white/10 p-4 lg:block">
        <div className="mb-3 flex items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 text-xs font-semibold">{iniciales}</div>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-medium">{s.nombre}</div>
            <div className="text-xs text-white/60">{ROL[s.rol]}</div>
          </div>
        </div>
        <button onClick={salir} className="w-full rounded-md border border-white/25 px-3 py-2 text-sm text-white/85 transition hover:bg-white/10">Cerrar sesión</button>
      </div>
      <button onClick={salir} className="absolute right-4 top-4 rounded-md border border-white/25 px-3 py-1.5 text-xs lg:hidden">Salir</button>
    </aside>
  );
}
