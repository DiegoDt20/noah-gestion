"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PLAZOS, coincidePlazo } from "@/lib/panel";
import Icono from "./Icono";
import ResumenTareas, { type TareaResumen } from "./ResumenTareas";

type Proyecto = { id_proyecto: number; nombre: string; fecha_entrega: string; total: number; entregadas: number; en_curso: number };
const estados = [
  { id: "pendiente", nombre: "Pendientes", color: "#94a3b8" },
  { id: "en_curso", nombre: "En curso", color: "#d99115" },
  { id: "entregada", nombre: "Entregadas", color: "#0f8b8d" },
];

export default function DashboardInteractivo({ tareas, proyectos, mostrarMisTareas, colaborador, actualizadoEn }: {
  tareas: TareaResumen[]; proyectos: Proyecto[]; mostrarMisTareas: boolean; colaborador: boolean; actualizadoEn: string;
}) {
  const router = useRouter();
  const [actualizando, actualizar] = useTransition();
  const [proyectoFiltro, setProyectoFiltro] = useState("todos");
  const [plazo, setPlazo] = useState("todas");
  const tareasProyecto = tareas.filter(t => proyectoFiltro === "todos" || t.id_proyecto === Number(proyectoFiltro));
  const tareasEnPlazo = tareasProyecto.filter(t => coincidePlazo(t, plazo));
  const plazos = PLAZOS.map(p => ({ ...p, total: tareasProyecto.filter(t => coincidePlazo(t, p.id)).length }));
  const maxPlazo = Math.max(1, ...plazos.map(p => p.total));
  const proyectosVisibles = proyectos.filter(p => proyectoFiltro === "todos" || p.id_proyecto === Number(proyectoFiltro));
  const limpiar = () => { setProyectoFiltro("todos"); setPlazo("todas"); setFiltro("todas"); };
  const [filtro, setFiltro] = useState("todas");
  const [modo, setModo] = useState("avance");
  const [seleccionado, setSeleccionado] = useState<number | null>(proyectos[0]?.id_proyecto ?? null);
  const proyecto = proyectosVisibles.find(p => p.id_proyecto === seleccionado) ?? proyectosVisibles[0];
  const counts = estados.map(e => ({ ...e, valor: tareasEnPlazo.filter(t => t.estado === e.id).length }));
  const seleccion = counts.find(e => e.id === filtro);
  const total = tareasEnPlazo.length;
  const vencidas = tareasEnPlazo.filter(t => t.dias < 0 && t.estado !== "entregada").length;
  const centro = filtro === "vencida" ? vencidas : seleccion?.valor ?? total;
  const escala = modo === "avance" ? 100 : Math.max(4, Math.ceil(Math.max(0, ...proyectosVisibles.map(p => p.total)) / 4) * 4);
  let offset = 0;
  return <>
    <section className="explore-toolbar" aria-label="Filtros del panel"><div><h2 className="text-lg font-semibold tracking-tight">Explora el trabajo</h2><p className="mt-1 text-xs text-suave">Filtra los gráficos y las tareas por proyecto y fecha de entrega.</p></div><div className="flex flex-wrap items-end gap-3"><label className="project-selector"><span>Proyecto</span><select value={proyectoFiltro} onChange={e => { setProyectoFiltro(e.target.value); setSeleccionado(Number(e.target.value) || null); setFiltro("todas"); }}><option value="todos">Todos los proyectos</option>{proyectos.map(p => <option key={p.id_proyecto} value={p.id_proyecto}>{p.nombre}</option>)}</select></label><button type="button" className="btn-suave gap-2" disabled={actualizando} onClick={() => actualizar(() => router.refresh())}><Icono nombre="actualizar" className={actualizando ? "refreshing" : ""} />{actualizando ? "Actualizando…" : "Actualizar"}</button></div></section>
    <div className="scope-strip"><span>Estado y tareas: <strong>{proyectoFiltro === "todos" ? "todos los proyectos" : proyectos.find(p => p.id_proyecto === Number(proyectoFiltro))?.nombre}</strong>{plazo !== "todas" && <> · {PLAZOS.find(p => p.id === plazo)?.nombre}</>}</span><span className="flex items-center gap-3">{(proyectoFiltro !== "todos" || plazo !== "todas") && <button onClick={limpiar} className="enlace">Restablecer</button>}<span role="status">Datos a las {new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date(actualizadoEn))}</span></span></div>
    <div className="analytics-grid">
      <section className="panel analytics-panel" aria-labelledby="grafico-estados">
        <div className="panel-cab"><div><h2 id="grafico-estados" className="panel-tit">Estado de las tareas</h2><p className="chart-description">Selecciona un estado para filtrar las tareas.</p></div><span className="chart-symbol"><Icono nombre="tareas" /></span></div>
        <div className="donut-layout">
          <div className="donut-figure">
            <svg viewBox="0 0 220 220" role="img" aria-label={`Distribución: ${counts.map(e => `${e.valor} ${e.nombre.toLowerCase()}`).join(", ")}`}>
              <circle cx="110" cy="110" r="82" fill="none" stroke="#edf1f5" strokeWidth="25" />
              {counts.map(e => {
                const parte = total ? e.valor / total * 100 : 0;
                const inicio = offset; offset += parte;
                return parte > 0 && <circle key={e.id} cx="110" cy="110" r="82" fill="none" stroke={e.color} strokeWidth="25" pathLength="100" strokeDasharray={`${Math.max(0, parte - (parte < 100 ? 1.5 : 0))} ${100 - Math.max(0, parte - (parte < 100 ? 1.5 : 0))}`} strokeDashoffset={-inicio} transform="rotate(-90 110 110)" className="donut-segment" style={{ opacity: !seleccion || seleccion.id === e.id ? 1 : 0.2 }} />;
              })}
            </svg>
            <div className="donut-center" aria-live="polite"><strong>{centro}</strong><span>{filtro === "vencida" ? "vencidas" : seleccion?.nombre.toLowerCase() || "tareas en total"}</span></div>
          </div>
          <div className="chart-legend" role="group" aria-label="Seleccionar estado del gráfico">{counts.map(e => <button key={e.id} type="button" aria-pressed={filtro === e.id} onClick={() => setFiltro(filtro === e.id ? "todas" : e.id)} className={`legend-button ${filtro === e.id ? "selected" : ""}`}><span className="legend-dot" style={{ background: e.color }} /><span>{e.nombre}</span><strong>{e.valor}</strong><span className="legend-percent">{total ? Math.round(e.valor / total * 100) : 0}%</span></button>)}<button type="button" className="chart-reset" onClick={() => setFiltro("todas")} disabled={filtro === "todas"}>Mostrar todos los estados</button></div>
        </div>
        <div className="chart-footnote"><span className="h-2 w-2 rounded-full bg-acento" />{colaborador ? "Distribución de tus tareas asignadas" : "Distribución de las tareas de tu equipo"}</div>
      </section>
      <section className="panel analytics-panel" aria-labelledby="grafico-proyectos">
        <div className="panel-cab"><div><h2 id="grafico-proyectos" className="panel-tit">Comparativa de proyectos</h2><p className="chart-description">{modo === "avance" ? "Porcentaje de tareas entregadas por proyecto." : "Distribución de tareas de cada proyecto."} Incluye todas las tareas del proyecto, sin filtro de fecha.{colaborador ? " Incluye todo el equipo." : ""}</p></div><div className="view-switch" role="group" aria-label="Medida del gráfico de proyectos"><button aria-pressed={modo === "avance"} onClick={() => setModo("avance")}>Avance</button><button aria-pressed={modo === "carga"} onClick={() => setModo("carga")}>Carga</button></div></div>
        <div className="project-chart">
          <div className="chart-axis" aria-hidden="true">{[0, 25, 50, 75, 100].map(v => <span key={v}>{modo === "avance" ? `${v}%` : Number((escala * v / 100).toFixed(1))}</span>)}</div>
          {proyectosVisibles.length ? <div className="chart-rows">{proyectosVisibles.map(p => {
            const pct = p.total ? Math.round(p.entregadas / p.total * 100) : 0;
            const values = [p.entregadas, p.en_curso, p.total - p.entregadas - p.en_curso];
            return <button key={p.id_proyecto} type="button" className={`project-chart-row ${proyecto?.id_proyecto === p.id_proyecto ? "selected" : ""}`} aria-pressed={proyecto?.id_proyecto === p.id_proyecto} aria-label={`${p.nombre}: ${modo === "avance" ? `${pct}% de avance` : `${p.total} tareas`}. Ver detalle`} onClick={() => setSeleccionado(p.id_proyecto)}><span className="chart-row-heading"><span className="truncate">{p.nombre}</span><strong>{modo === "avance" ? `${pct}%` : `${p.total} tareas`}</strong></span><span className="project-chart-track">{modo === "avance" ? <span className="chart-bar" style={{ width: `${pct}%`, background: "#0f8b8d" }} /> : values.map((v, i) => <span className="chart-bar" key={i} style={{ width: `${v / escala * 100}%`, background: ["#0f8b8d", "#d99115", "#94a3b8"][i] }} />)}</span></button>;
          })}</div> : <p className="py-6 text-sm text-suave">Los proyectos aparecerán aquí cuando se registren.</p>}
          {modo === "carga" && <div className="mt-3 flex flex-wrap gap-4 text-xs text-suave">{counts.map(e => <span key={e.id} className="flex items-center gap-1.5"><span className="legend-dot" style={{ background: e.color }} />{e.nombre}</span>)}</div>}
        </div>
        <div className="project-chart-detail" aria-live="polite">{proyecto ? <><div><strong className="block text-sm">{proyecto.entregadas} de {proyecto.total} tareas entregadas</strong><span className="mt-1 block text-xs text-suave">Entrega: {proyecto.fecha_entrega.split("-").reverse().join("/")}</span></div><Link className="btn-suave gap-2" href={`/proyectos/${proyecto.id_proyecto}`}>Abrir proyecto <Icono nombre="flecha" /></Link></> : <Link className="enlace text-sm" href="/proyectos">Explorar proyectos</Link>}</div>
      </section>
    </div>
    <section className="panel" aria-labelledby="titulo-plazos"><div className="panel-cab"><div><h2 id="titulo-plazos" className="panel-tit">¿Cuándo vencen las tareas?</h2><p className="chart-description">Entregas pendientes del proyecto seleccionado. Pulsa una columna para revisar sus tareas.</p></div><button className="btn-suave" aria-pressed={plazo === "todas"} onClick={() => setPlazo("todas")}>Todas las fechas</button></div><div className="deadline-chart" role="group" aria-label="Filtrar por fecha de entrega">{plazos.map(p => <button type="button" key={p.id} aria-pressed={plazo === p.id} aria-label={`${p.nombre}: ${p.total} tareas pendientes`} className={`deadline-column ${plazo === p.id ? "selected" : ""}`} onClick={() => { setPlazo(plazo === p.id ? "todas" : p.id); setFiltro("todas"); }}><strong>{p.total}</strong><span className="deadline-bar-space"><span className="deadline-bar" style={{ height: `${p.total / maxPlazo * 100}%`, background: p.color }} /></span><span>{p.corto}</span></button>)}</div></section>
    <ResumenTareas tareas={tareasEnPlazo} hayFiltrosExternos={proyectoFiltro !== "todos" || plazo !== "todas"} alLimpiarExternos={limpiar} mostrarMisTareas={mostrarMisTareas} filtroSeleccionado={filtro} alFiltrar={setFiltro} />
  </>;
}
