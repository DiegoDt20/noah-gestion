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
      <section className="login-brand" aria-label="NOAH TECH SOLUTIONS">
        <div className="login-brand-top"><span className="marca-simbolo">N<span className="opacity-60">.</span></span><div className="login-brand-name"><strong>noah<span className="text-[#4fd1b5]">.</span></strong><span>TECH SOLUTIONS S.A.C.</span></div></div>
        <div className="login-story">
          <h2>El próximo avance<br /><em>empieza aquí.</em></h2>
          <svg className="login-grafico" viewBox="0 0 420 200" aria-hidden="true"><path d="M0 170C60 160 80 120 130 125S210 90 250 95s70-60 170-75V200H0Z" fill="#fff" opacity=".08"/><path d="M0 170C60 160 80 120 130 125S210 90 250 95s70-60 170-75" fill="none" stroke="#4fd1b5" strokeWidth="4" strokeLinecap="round"/>{[[130,125],[250,95],[412,21]].map(([x,y])=><circle key={x} cx={x} cy={y} r="7" fill="#4fd1b5" stroke="#1d1a3d" strokeWidth="4"/>)}</svg>
        </div>
        <div className="login-brand-bottom"><span>Gestión de proyectos · Área de TI</span><span>NOAH TECH SOLUTIONS</span></div>
      </section>
      <section className="login-form-area" aria-labelledby="titulo-login">
        <div className="login-form-card">

          <h1 id="titulo-login">Bienvenido de nuevo</h1>
          
          <form aria-busy={cargando} onSubmit={entrar} className="space-y-5">
            <div><label className="etiqueta" htmlFor="correo">Correo corporativo</label><input id="correo" name="correo" type="email" autoComplete="username" required autoFocus className="campo" placeholder="nombre@noahtech.pe" /></div>
            <div><label className="etiqueta" htmlFor="clave">Contraseña</label><div className="password-field"><input id="clave" name="clave" type={visible ? "text" : "password"} autoComplete="current-password" required className="campo" placeholder="Ingresa tu contraseña" /><button type="button" onClick={() => setVisible(v => !v)} aria-controls="clave" aria-pressed={visible}>{visible ? "Ocultar" : "Mostrar"}</button></div></div>
            {err && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">{err}</p>}
            <button className="btn w-full gap-3" disabled={cargando}>{cargando ? "Ingresando…" : "Iniciar sesión"}<Icono nombre="flecha" /></button>
          </form>
          <p className="login-security-note"><Icono nombre="usuarios" /><span>¿Sin acceso? Contacta a tu administrador.</span></p>
        </div>
      </section>
    </div>
  );
}
