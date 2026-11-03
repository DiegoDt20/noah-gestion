"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { Recordatorio } from "@/lib/recordatorios";
interface Estado { recordatorios: Recordatorio[]; cargando: boolean; error: string; recargar: () => Promise<void> }
const Contexto = createContext<Estado | null>(null);
export function RecordatoriosProvider({ children }: { children: React.ReactNode }) {
  const ruta = usePathname();
  const [recordatorios, setRecordatorios] = useState<Recordatorio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const solicitud = useRef<AbortController | null>(null);
  const recargar = useCallback(async () => {
    solicitud.current?.abort();
    const control = new AbortController(); solicitud.current = control;
    setCargando(true);
    try {
      const r = await fetch("/api/recordatorios", { cache: "no-store", signal: control.signal });
      if (!r.ok) throw new Error();
      const d = await r.json();
      if (!control.signal.aborted) { setRecordatorios(d.recordatorios); setError(""); }
    } catch { if (!control.signal.aborted) setError("No se pudieron actualizar los recordatorios. Inténtalo de nuevo."); }
    finally { if (!control.signal.aborted) setCargando(false); }
  }, []);
  useEffect(() => {
    void recargar();
    const actualizar = () => { if (document.visibilityState === "visible") void recargar(); };
    const intervalo = window.setInterval(actualizar, 60000);
    window.addEventListener("focus", actualizar);
    window.addEventListener("noah:recordatorios", actualizar);
    document.addEventListener("visibilitychange", actualizar);
    return () => { window.clearInterval(intervalo); window.removeEventListener("focus", actualizar); window.removeEventListener("noah:recordatorios", actualizar); document.removeEventListener("visibilitychange", actualizar); solicitud.current?.abort(); };
  }, [ruta, recargar]);
  return <Contexto.Provider value={{ recordatorios, cargando, error, recargar }}>{children}</Contexto.Provider>;
}
export function useRecordatorios() {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error("Falta el proveedor de recordatorios");
  return contexto;
}
export function ContadorRecordatorios() {
  const { recordatorios, error } = useRecordatorios();
  const sinVer = recordatorios.filter(r => !r.visto).length;
  return error ? <span className="ml-auto text-xs" title="No se pudieron actualizar los recordatorios" aria-label="No se pudieron actualizar los recordatorios">!</span> : sinVer > 0 ? <span className="reminder-count" aria-label={`${sinVer} recordatorios sin ver`}>{sinVer > 99 ? "99+" : sinVer}</span> : null;
}
