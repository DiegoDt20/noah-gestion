"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [err, setErr] = useState(""); const [cargando, setCargando] = useState(false);
  async function entrar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setErr(""); setCargando(true);
    const d = Object.fromEntries(new FormData(e.currentTarget).entries());
    const r = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) });
    const j = await r.json().catch(() => ({}));
    setCargando(false);
    if (!r.ok) { setErr(j.error || "No se pudo iniciar sesión"); return; }
    router.push("/"); router.refresh();
  }
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden overflow-hidden bg-marca-oscuro p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="relative flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-acento font-bold">NT</div>
          <span className="font-bold tracking-wide">NOAH TECH SOLUTIONS S.A.C.</span>
        </div>
        <div className="relative max-w-md">
          <h2 className="text-4xl font-bold leading-tight tracking-tight">Cada proyecto, cada tarea, en un solo lugar.</h2>
          <p className="mt-4 text-white/70">Registra proyectos, asigna responsables y sigue el estado de cada entrega con tu equipo.</p>
        </div>
        <p className="relative text-xs text-white/50">Sistema web de seguimiento de proyectos y tareas</p>
      </section>
      <section className="grid place-items-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-marca font-bold text-white">NT</div>
            <span className="font-bold text-marca">NOAH TECH</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Iniciar sesión</h1>
          <p className="mb-6 mt-1 text-sm text-suave">Ingresa con tu correo corporativo.</p>
          <form onSubmit={entrar} className="space-y-4">
            <div><label className="etiqueta" htmlFor="correo">Correo</label><input id="correo" name="correo" type="email" required autoFocus className="campo" placeholder="nombre@noahtech.pe" /></div>
            <div><label className="etiqueta" htmlFor="clave">Contraseña</label><input id="clave" name="clave" type="password" required className="campo" /></div>
            {err && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
            <button className="btn w-full py-2.5" disabled={cargando}>{cargando ? "Ingresando…" : "Iniciar sesión"}</button>
          </form>
        </div>
      </section>
    </div>
  );
}
