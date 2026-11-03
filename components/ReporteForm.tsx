"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Momento, SeguimientoReporte } from "@/lib/reportes";

export default function ReporteForm({ id, seguimiento, avance }: { id: number; seguimiento: SeguimientoReporte; avance: number }) {
  const router = useRouter();
  const [guardando,setGuardando] = useState(false);
  const [error,setError] = useState("");
  const [ok,setOk] = useState("");
  const [porcentaje,setPorcentaje] = useState(avance);
  const opciones: {valor: Momento; texto:string; habilitada:boolean}[] = [
    {valor:"inicio_dia",texto:"Inicio del día",habilitada:!seguimiento.inicio_registrado},
    {valor:"fin_dia",texto:"Cierre del día",habilitada:seguimiento.inicio_registrado && !seguimiento.cierre_registrado},
    {valor:"cada_3_dias",texto:"Adicional de cada 3 días",habilitada:seguimiento.periodico_habilitado},
  ];
  const disponible = opciones.find(o=>o.habilitada);
  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (guardando) return;
    const form=e.currentTarget;
    const datos=new FormData(form);
    setGuardando(true); setError(""); setOk("");
    try {
      const r=await fetch(`/api/tareas/${id}/reportes`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
        momento:datos.get("momento"),contenido:datos.get("contenido"),porcentaje_avance:Number(datos.get("porcentaje_avance")),
      })});
      const d=await r.json().catch(()=>({}));
      if(!r.ok) { setError(d.error || "No se pudo guardar el reporte"); return; }
      form.reset(); setPorcentaje(Number(datos.get("porcentaje_avance"))); setOk(`Reporte guardado. Estado de la tarea: ${d.estado === "entregada" ? "Entregada" : d.estado === "en_curso" ? "En curso" : "Pendiente"}.`); window.dispatchEvent(new Event("noah:recordatorios")); window.dispatchEvent(new Event("noah:alertas")); router.refresh();
    } catch { setError("No se pudo conectar. Revisa tu conexión y vuelve a intentarlo."); }
    finally { setGuardando(false); }
  }
  return <form onSubmit={enviar} className="space-y-4">
    <p className="text-sm text-suave">Registra el inicio y el cierre de cada día. El reporte adicional se habilita cada tres días; si está pendiente, puedes completarlo después de su fecha.</p>
    {!disponible && <p role="status" className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">Completaste los reportes diarios de hoy. El próximo reporte adicional corresponde al {seguimiento.proximo_periodico.split("-").reverse().join("/")}.</p>}
    <fieldset disabled={guardando || !disponible} className="space-y-4 disabled:opacity-60">
      <div><label htmlFor="momento" className="etiqueta">Tipo de reporte</label>
        <select key={opciones.map(o=>Number(o.habilitada)).join("")} id="momento" name="momento" className="campo" defaultValue={disponible?.valor ?? "inicio_dia"} required>
          {opciones.map(o=><option key={o.valor} value={o.valor} disabled={!o.habilitada}>{o.texto}{!o.habilitada ? " (no disponible)" : ""}</option>)}
        </select>
        {!seguimiento.inicio_registrado && <p className="mt-1 text-xs text-suave">Para registrar el cierre, primero completa el inicio de hoy.</p>}
      </div>
      <div><label htmlFor="reporte-contenido" className="etiqueta">Detalle del avance</label><textarea id="reporte-contenido" name="contenido" rows={5} required minLength={1} maxLength={5000} className="campo" placeholder="Describe lo que vas a realizar, lo que completaste y las dificultades encontradas." /></div>
      <div><label htmlFor="porcentaje" className="etiqueta">Porcentaje de avance de la tarea</label><div className="flex items-center gap-2"><input id="porcentaje" name="porcentaje_avance" type="number" min={0} max={100} step={1} value={porcentaje} onChange={e=>setPorcentaje(Number(e.target.value))} required className="campo max-w-32" /><span aria-hidden="true">%</span><input type="range" min={0} max={100} value={porcentaje} onChange={e=>setPorcentaje(Number(e.target.value))} aria-label="Ajustar porcentaje de avance" className="min-w-0 flex-1 accent-acento"/></div><p className="mt-1 text-xs text-suave">Indica el avance acumulado entre 0 y 100 %. El estado se actualiza automáticamente: 0 % pendiente, 1–99 % en curso y 100 % entregada.</p></div>
      <button type="submit" className="btn" disabled={guardando || !disponible}>{guardando ? "Guardando…" : "Guardar reporte"}</button>
    </fieldset>
    {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {ok && <p role="status" className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">{ok}</p>}
  </form>;
}
