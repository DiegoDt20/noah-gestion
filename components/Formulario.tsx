"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Formulario genérico: envía JSON a una API y refresca la página
export default function Formulario({ url, metodo = "POST", boton, children, alOk }: {
  url: string; metodo?: string; boton: string; children: React.ReactNode; alOk?: (d: any) => void;
}) {
  const router = useRouter();
  const [err, setErr] = useState(""); const [ok, setOk] = useState(false); const [cargando, setCargando] = useState(false);
  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setErr(""); setOk(false); setCargando(true);
    const f = e.currentTarget;
    const datos = Object.fromEntries(new FormData(f).entries());
    try {
      const r = await fetch(url, { method: metodo, headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setErr(d.error || "No se pudo guardar. Inténtalo de nuevo."); return; }
      f.reset(); setOk(true); alOk?.(d); router.refresh();
    } catch { setErr("No se pudo conectar. Tus datos siguen en el formulario; vuelve a intentarlo."); }
    finally { setCargando(false); }
  }
  return (
    <form aria-busy={cargando} onSubmit={enviar} className="space-y-3">
      {children}
      {err && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
      {ok && <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Guardado correctamente.</p>}
      <button className="btn" disabled={cargando}>{cargando ? "Guardando…" : boton}</button>
    </form>
  );
}
