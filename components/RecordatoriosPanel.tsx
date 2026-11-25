"use client";
import Link from "next/link";
import { useState } from "react";
import type { Recordatorio } from "@/lib/recordatorios";
import Ayuda from "./Ayuda";
import { BarrasH, Dona } from "./Graficos";
import Icono from "./Icono";
import { useRecordatorios } from "./RecordatoriosContext";
const titulos = { inicio_dia: "Reporte de inicio pendiente", fin_dia: "Reporte de cierre pendiente", cada_3_dias: "Reporte adicional pendiente" };
const fecha = (s: string) => s.split("-").reverse().join("/");
const clave = (r: Recordatorio) => `${r.id_tarea}:${r.id_responsable}:${r.momento}:${r.fecha}`;
export default function RecordatoriosPanel({ colaborador }: { colaborador: boolean }) {
  const { recordatorios, cargando, error, recargar } = useRecordatorios();
  const [tipo, setTipo] = useState("todos"); const [vista, setVista] = useState("todos"); const [texto, setTexto] = useState("");
  const [guardando, setGuardando] = useState(""); const [fallo, setFallo] = useState("");
  const sinVer = recordatorios.filter(r => !r.visto).length;
  const visibles = recordatorios.filter(r => (tipo === "todos" || r.momento === tipo) && (vista !== "sin_ver" || !r.visto) && `${r.titulo} ${r.proyecto} ${r.responsable}`.toLocaleLowerCase("es").includes(texto.toLocaleLowerCase("es")));
  async function marcar(r?: Recordatorio) {
    if (guardando) return;
    setGuardando(r ? clave(r) : "todos"); setFallo("");
    try {
      const respuesta = await fetch("/api/recordatorios", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(r ? { id_tarea: r.id_tarea, id_responsable: r.id_responsable, momento: r.momento, fecha: r.fecha } : { todos: true }) });
      const datos = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) throw new Error(datos.error || "No se pudo marcar el recordatorio");
      await recargar();
    } catch (e) { setFallo(e instanceof Error ? e.message : "No se pudo conectar. Inténtalo de nuevo."); }
    finally { setGuardando(""); }
  }
  return <div className="space-y-5">
    <div className="rejilla-2"><section className="panel"><div className="panel-cab"><h2 className="panel-tit">Pendientes por tipo</h2><Ayuda>El cierre se habilita después del inicio. Un recordatorio se retira al registrar el reporte o entregar la tarea; marcarlo como visto solo confirma que lo leíste.</Ayuda></div><Dona etiqueta="pendientes" activo={tipo} alElegir={id=>setTipo(tipo===id?"todos":id)} datos={[{id:"inicio_dia",nombre:"Inicio del día",color:"#6250d6"},{id:"fin_dia",nombre:"Cierre del día",color:"#eb8a00"},{id:"cada_3_dias",nombre:"Cada tres días",color:"#0f9f85"}].map(x=>({...x,valor:recordatorios.filter(r=>r.momento===x.id).length}))}/></section><section className="panel"><div className="panel-cab"><h2 className="panel-tit">Por proyecto</h2></div><BarrasH unidad="pendientes" vacio="Sin pendientes" datos={[...new Set(recordatorios.map(r=>r.proyecto))].map(p=>({id:p,nombre:p,color:"#6250d6",valor:recordatorios.filter(r=>r.proyecto===p).length})).sort((a,b)=>b.valor-a.valor).slice(0,5)}/></section></div>
    <div className="module-summary">{[{id:"todos",t:"Pendientes",n:recordatorios.length},{id:"sin_ver",t:"Sin ver",n:sinVer}].map(x => <button key={x.id} aria-pressed={vista===x.id} onClick={() => setVista(x.id)}><span>{x.t}</span><strong>{cargando&&!recordatorios.length?"…":error?"—":x.n}</strong></button>)}</div>
    <div className="panel overflow-hidden"><div className="panel-cab"><div><h2 className="panel-tit">Recordatorios</h2></div><div className="flex flex-wrap gap-2"><button className="btn-suave gap-2" onClick={() => void recargar()} disabled={cargando}><Icono nombre="actualizar"/>{cargando ? "Actualizando…" : "Actualizar"}</button><button className="btn-suave" title="Marca todos tus recordatorios como vistos, incluidos los ocultos por los filtros" onClick={() => void marcar()} disabled={!sinVer || !!guardando || cargando || !!error}>{guardando==="todos" ? "Guardando…" : "Marcar todos"}</button></div></div>
    <div className="task-toolbar"><label className="buscador"><Icono nombre="buscar"/><span className="sr-only">Buscar recordatorios</span><input type="search" value={texto} onChange={e=>setTexto(e.target.value)} placeholder="Tarea, proyecto o responsable…"/></label><label className="flex items-center gap-2 text-xs text-suave">Tipo<select className="campo w-auto" value={tipo} onChange={e=>setTipo(e.target.value)}><option value="todos">Todos</option><option value="inicio_dia">Inicio del día</option><option value="fin_dia">Cierre del día</option><option value="cada_3_dias">Cada tres días</option></select></label></div>
    {(error || fallo) && <p role="alert" className="mx-5 mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error || fallo}</p>}
    <p className="sr-only" role="status">{visibles.length} recordatorios encontrados</p>
    {cargando && !recordatorios.length ? <p role="status" className="panel-cuerpo text-sm text-suave">Consultando los reportes pendientes…</p> : !visibles.length ? <div className="empty-state"><Icono nombre={error ? "reloj" : "check"} className="mx-auto mb-3 text-acento"/><h3 className="font-semibold">{error ? "No pudimos consultar los pendientes" : recordatorios.length ? "No hay recordatorios con estos filtros" : "No hay reportes pendientes"}</h3><p className="mt-2 text-sm text-suave">{error ? "Usa Actualizar para volver a intentarlo." : recordatorios.length ? "Cambia el tipo, la búsqueda o la vista." : "Los nuevos recordatorios aparecerán cuando corresponda registrar un reporte."}</p>{recordatorios.length > 0 && <button className="btn-suave mt-4" onClick={() => { setTipo("todos"); setTexto(""); setVista("todos"); }}>Limpiar filtros</button>}</div> : <ul>{visibles.map(r=><li key={clave(r)} className="reminder-row"><span className={`reminder-symbol ${r.visto ? "seen" : ""}`}><Icono nombre={r.momento==="cada_3_dias" ? "calendario" : "campana"}/></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold">{r.titulo}</h3><span className={`chip ${r.visto ? "bg-slate-100 text-slate-600" : "bg-acento/10 text-acento"}`}>{r.visto ? "Visto" : "Sin ver"}</span></div><p className="mt-1 text-sm text-suave">{titulos[r.momento]}</p><Link className="enlace mt-1 inline-block text-xs" href={`/proyectos/${r.id_proyecto}`}>{r.proyecto}</Link>{!colaborador&&<span className="ml-2 text-xs text-suave">· {r.responsable}</span>}<p className="mt-2 text-xs text-suave">{r.momento==="cada_3_dias" ? `Desde el ${fecha(r.fecha)}` : "Hoy"}</p></div><div className="reminder-actions"><Link href={`/tareas/${r.id_tarea}/reportes`} className="btn gap-2">{colaborador ? "Registrar" : "Ver"}<Icono nombre="flecha"/></Link>{!r.visto&&<button className="btn-suave" disabled={!!guardando || cargando} onClick={()=>void marcar(r)}>{guardando===clave(r) ? "Guardando…" : "Visto"}</button>}</div></li>)}</ul>}
    </div>
  </div>;
}
