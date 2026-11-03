"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Sesion } from "@/lib/auth";
import type { DatosSeguimiento } from "@/lib/seguimiento";
import { resumenPanel, responsablesPanel } from "@/lib/panel";
import Icono from "./Icono";
import DashboardInteractivo from "./DashboardInteractivo";
const fmt = (s:string) => s.split("-").reverse().join("/");
export default function PanelSeguimiento({ datos, s }: { datos: DatosSeguimiento; s: Pick<Sesion,"nombre"|"rol"> }) {
 const router=useRouter();
 useEffect(()=>{
   const actualizar=()=>{if(document.visibilityState==="visible") router.refresh();};
   const intervalo=window.setInterval(actualizar,60000);
   window.addEventListener("focus",actualizar); document.addEventListener("visibilitychange",actualizar);
   return ()=>{window.clearInterval(intervalo);window.removeEventListener("focus",actualizar);document.removeEventListener("visibilitychange",actualizar);};
 },[router]);
 const [elegido,setElegido]=useState("todos");
 const [plazo,setPlazo]=useState("todas"); const [filtro,setFiltro]=useState("todas");
 const proyectoFiltro = elegido === "todos" || datos.proyectos.some(p=>String(p.id_proyecto)===elegido) ? elegido : "todos";
 const cambiarProyecto = (valor:string) => { setElegido(valor); setPlazo("todas"); setFiltro("todas"); };
 const proyectos=datos.proyectos.filter(p=>proyectoFiltro==="todos" || p.id_proyecto===Number(proyectoFiltro));
 const tareas=datos.tareas.filter(t=>proyectoFiltro==="todos" || t.id_proyecto===Number(proyectoFiltro));
 const resumen=resumenPanel(proyectos,tareas);
 const responsables=responsablesPanel(tareas);
 const total=resumen.tareas,entregadas=resumen.entregadas,porcentaje=resumen.porcentaje_entregado,vencidas=resumen.vencidas,completos=resumen.proyectos_completos;
 const fecha=new Intl.DateTimeFormat("es-PE",{timeZone:"America/Lima",day:"numeric",month:"long",year:"numeric"}).format(new Date(datos.hoy+"T12:00:00Z"));
 const alcance=s.rol==="colaborador"?"Tus tareas asignadas y los proyectos en los que participas.":s.rol==="jefe_area"?"El avance de los proyectos que diriges y las tareas de tu equipo.":"Una vista general de los proyectos y las tareas de la organización.";
 const cards=[
  {t:"Proyectos",v:proyectos.length,sub:`${completos} con todas sus tareas entregadas`,icon:0},
  {t:s.rol==="colaborador"?"Mis tareas":"Tareas del equipo",v:total,sub:`${resumen.en_curso} en curso · ${resumen.pendientes} pendientes`,icon:1},
  {t:"Tareas entregadas",v:`${porcentaje} %`,sub:`${entregadas} de ${total} tareas completadas`,icon:2},
  {t:"Tareas vencidas",v:vencidas,sub:vencidas?"Entregas pendientes fuera de plazo":"Sin tareas pendientes fuera de plazo",icon:3},
 ];
 const pendientes=tareas.filter(t=>t.estado!=="entregada");
 const siguiente=pendientes[0];
 return <div className="dashboard-v2 space-y-6">
  <section className="workspace-welcome">
    <div className="welcome-main"><h1>Hola, {s.nombre.split(" ")[0]}.<span>{s.rol === "colaborador" ? "Tu trabajo, en perspectiva." : "Tu equipo, en perspectiva."}</span></h1><p>{alcance}</p><div className="welcome-actions"><Link href="/proyectos" className="welcome-primary">Explorar proyectos <Icono nombre="flecha" /></Link><a href="#tareas" className="welcome-secondary">Revisar tareas <Icono nombre="tareas" /></a></div></div>
    <div className="welcome-agenda"><div className="flex items-center gap-2 text-xs text-teal-100"><Icono nombre="calendario" />{fecha}</div><div className="welcome-agenda-inner"><h2>Próxima entrega pendiente</h2>{siguiente ? <><Link href={`/tareas/${siguiente.id_tarea}/reportes`} className="welcome-task-link">{siguiente.titulo}<Icono nombre="flecha" /></Link><p className="mt-2 text-xs text-slate-300">{siguiente.proyecto}</p><span className="welcome-date">{fmt(siguiente.fecha_entrega)}<span>{siguiente.dias < 0 ? "Vencida" : siguiente.dias === 0 ? "Hoy" : siguiente.dias === 1 ? "Mañana" : `En ${siguiente.dias} días`}</span></span></> : <p className="mt-3 text-sm text-slate-200">{total ? "Todas las tareas están entregadas." : "Las próximas entregas aparecerán al asignar tareas."}</p>}</div></div>
  </section>
  <p className="panel-scope" role="status">Resumen y agenda: <strong>{proyectoFiltro === "todos" ? "todos los proyectos autorizados" : proyectos[0]?.nombre}</strong>. {s.rol === "colaborador" ? "Los indicadores de tareas corresponden solo a tus asignaciones; la comparación de proyectos incluye al equipo." : "Los indicadores corresponden al equipo dentro del alcance indicado."}</p>
  <dl className="summary-grid">{cards.map(c => <div key={c.t} className={`summary-stat summary-${c.icon}`}><div className="flex items-center justify-between gap-3"><dt>{c.t}</dt><span className="stat-symbol"><Icono nombre={(["proyectos", "tareas", "check", "reloj"] as const)[c.icon]} /></span></div><dd className="stat-value">{c.v}</dd><dd className="stat-caption">{c.sub}</dd><dd>{c.icon===0 ? <Link href={proyectoFiltro === "todos" ? "/proyectos" : `/proyectos/${proyectoFiltro}`} className="stat-action">Ver proyectos <Icono nombre="flecha"/></Link> : <a href="#tareas" className="stat-action" onClick={()=>{setPlazo("todas");setFiltro(c.icon===2?"entregada":c.icon===3?"vencida":"todas");}}>Ver {c.icon===2?"entregadas":c.icon===3?"vencidas":"tareas"}<Icono nombre="flecha"/></a>}</dd></div>)}</dl>
  <DashboardInteractivo actualizadoEn={datos.actualizadoEn} tareas={datos.tareas} proyectos={datos.proyectos} mostrarMisTareas={s.rol!=="gerencia"} colaborador={s.rol==="colaborador"} proyectoFiltro={proyectoFiltro} setProyectoFiltro={cambiarProyecto} plazo={plazo} setPlazo={setPlazo} filtro={filtro} setFiltro={setFiltro} />
  <section className="panel"><div className="panel-cab"><div><h2 className="panel-tit">Agenda de entregas</h2><p className="chart-description">Próximas tareas pendientes, ordenadas por fecha.</p></div><Icono nombre="calendario" className="text-suave" /></div>{pendientes.length ? <ol className="delivery-agenda">{pendientes.slice(0,4).map(t => <li key={t.id_tarea}><div className="agenda-date"><strong>{t.fecha_entrega.slice(8,10)}</strong><span>{new Intl.DateTimeFormat("es-PE",{month:"short",timeZone:"UTC"}).format(new Date(t.fecha_entrega+"T12:00:00Z"))}</span></div><div className="min-w-0 flex-1"><Link href={`/tareas/${t.id_tarea}/reportes`} className="enlace break-words text-sm">{t.titulo}</Link><p className="mt-1 text-xs text-suave">{t.proyecto}</p><span className={`mt-2 block text-xs ${t.dias < 0 ? "text-red-700" : "text-suave"}`}>{t.dias < 0 ? `Vencida hace ${-t.dias} días` : t.dias === 0 ? "Vence hoy" : `En ${t.dias} días`}</span></div><Link href={`/tareas/${t.id_tarea}/reportes`} className="row-action" aria-label={`Abrir reportes de ${t.titulo}`}><Icono nombre="flecha" /></Link></li>)}</ol> : <p className="panel-cuerpo text-sm text-suave">No hay entregas pendientes por programar.</p>}</section>
  <section className="panel"><div className="panel-cab"><div><h2 className="panel-tit">{s.rol === "colaborador" ? "Mi carga de trabajo" : "Carga por responsable"}</h2><p className="chart-description">Mismo alcance que los indicadores. Sin reporte significa que el responsable actual todavía no registró un avance.</p></div></div>{responsables.length ? <ul className="responsible-list">{responsables.map(r=><li key={r.id}><span className="person-avatar">{r.nombre.split(" ").map(n=>n[0]).slice(0,2).join("")}</span><div className="min-w-0 flex-1"><h3 className="text-sm font-semibold">{r.nombre}</h3><p className="mt-1 text-xs text-suave">{r.entregadas} de {r.total} tareas entregadas · {r.sin_reporte} sin reporte</p></div><span className={`chip ${r.vencidas ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"}`}>{r.vencidas ? `${r.vencidas} vencidas` : "Sin vencidas"}</span></li>)}</ul> : <p className="panel-cuerpo text-sm text-suave">Todavía no hay tareas para distribuir.</p>}</section>
 </div>;
}
