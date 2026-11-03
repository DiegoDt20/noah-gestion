"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Icono from "@/components/Icono";

export default function Login() {
  const router = useRouter();
  const [visible,setVisible] = useState(false);
  const [err, setErr] = useState(""); const [cargando, setCargando] = useState(false);
  async function entrar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setErr(""); setCargando(true);
    const d = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const r = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setErr(r.status >= 500 ? "El servicio no está disponible. Inténtalo de nuevo en unos momentos." : j.error || "No se pudo iniciar sesión"); return; }
      router.push("/"); router.refresh();
    } catch { setErr("No se pudo conectar. Revisa tu conexión y vuelve a intentarlo."); }
    finally { setCargando(false); }
  }
  return (
    <div className="login-shell">
      <section className="login-brand">
        <div className="relative flex items-center gap-3">
          <span className="marca-simbolo">N<span className="text-teal-300">.</span></span>
          <span className="font-bold tracking-wide">NOAH TECH SOLUTIONS S.A.C.</span>
        </div>
        <div className="relative max-w-md">
          <h2 className="text-4xl font-bold leading-tight tracking-tight">Cada proyecto, cada tarea, en un solo lugar.</h2>
          <p className="mt-4 leading-7 text-slate-200">Registra proyectos, asigna responsables y sigue el estado de cada entrega con tu equipo.</p>
          <ul className="login-benefits"><li><Icono nombre="proyectos"/><span>Proyectos y responsables en una misma vista</span></li><li><Icono nombre="tareas"/><span>Tareas, estados y reportes de avance</span></li><li><Icono nombre="usuarios"/><span>Acceso según el rol de cada integrante</span></li></ul>
        </div>
        <p className="relative text-xs text-slate-300">Sistema web de seguimiento de proyectos y tareas</p>
      </section>
      <section className="login-form-area">
        <div className="login-form-card">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-marca font-bold text-white">NT</div>
            <span className="font-bold text-marca">NOAH TECH</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-marca-oscuro">Bienvenido de nuevo</h1>
          <p className="mb-6 mt-1 text-sm text-suave">Ingresa con tu correo corporativo.</p>
          <form aria-busy={cargando} onSubmit={entrar} className="space-y-4">
            <div><label className="etiqueta" htmlFor="correo">Correo</label><input id="correo" name="correo" type="email" autoComplete="username" required autoFocus className="campo" placeholder="nombre@noahtech.pe" /></div>
            <div><label className="etiqueta" htmlFor="clave">Contraseña</label><div className="password-field"><input id="clave" name="clave" type={visible?"text":"password"} autoComplete="current-password" required className="campo" /><button type="button" onClick={()=>setVisible(v=>!v)} aria-controls="clave" aria-pressed={visible}>{visible?"Ocultar":"Mostrar"}</button></div></div>
            {err && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
            <button className="btn w-full py-2.5" disabled={cargando}>{cargando ? "Ingresando…" : "Iniciar sesión"}</button>
          </form><p className="mt-6 text-xs leading-5 text-suave">Tu cuenta y tus permisos son administrados por la organización.</p>
        </div>
      </section>
    </div>
  );
}
