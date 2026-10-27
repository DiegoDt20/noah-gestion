"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChipEstado, ESTADO } from "./Estado";

export default function EstadoSelect({ id, estado, editable }: { id: number; estado: string; editable: boolean }) {
  const router = useRouter();
  const [err, setErr] = useState("");
  const [cargando, setCargando] = useState(false);
  if (!editable) return <ChipEstado estado={estado} />;
  async function cambiar(e: React.ChangeEvent<HTMLSelectElement>) {
    setCargando(true); setErr("");
    const r = await fetch(`/api/tareas/${id}/estado`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ estado: e.target.value }) });
    const d = await r.json().catch(() => ({}));
    setCargando(false);
    if (!r.ok) setErr(d.error || "No se pudo cambiar el estado"); else router.refresh();
  }
  const e = ESTADO[estado];
  return (
    <div>
      <select value={estado} onChange={cambiar} disabled={cargando} aria-label="Estado de la tarea"
        className={`cursor-pointer rounded-full border-0 py-1 pl-3 pr-7 text-xs font-medium ${e.fondo} ${e.texto} disabled:opacity-60`}>
        {Object.entries(ESTADO).map(([v, x]) => <option key={v} value={v}>{x.t}</option>)}
      </select>
      {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
    </div>
  );
}
