"use client";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Sesion } from "@/lib/auth";
import type { DatosSeguimiento } from "@/lib/seguimiento";
import type { ActividadDia } from "@/lib/actividad";
import { ESTADOS_GRAFICO, coincidePlazo, estadosGrafico, plazosGrafico, resumenPanel, responsablesPanel } from "@/lib/panel";
import { Anillo, Apiladas, Area, Columnas, Dona } from "./Graficos";
import Icono from "./Icono";
import ResumenTareas from "./ResumenTareas";
const plazoTexto = (d: number) => d < 0 ? `${-d} d de retraso` : d === 0 ? "Hoy" : d === 1 ? "Mañana" : `En ${d} días`;
export default function PanelSeguimiento({ datos, actividad, s }: { datos: DatosSeguimiento; actividad: ActividadDia[]; s: Pick<Sesion, "nombre" | "rol"> }) {
  const router = useRouter();
  const [actualizando, actualizar] = useTransition();
  useEffect(() => {
    const refrescar = () => { if (document.visibilityState === "visible") router.refresh(); };
    const intervalo = window.setInterval(refrescar, 60000);
    window.addEventListener("focus", refrescar); document.addEventListener("visibilitychange", refrescar);
    return () => { window.clearInterval(intervalo); window.removeEventListener("focus", refrescar); document.removeEventListener("visibilitychange", refrescar); };
  }, [router]);
  const [elegido, setElegido] = useState("todos");
  const [plazo, setPlazo] = useState("todas"); const [filtro, setFiltro] = useState("todas");
  const colaborador = s.rol === "colaborador";
  const proyectoFiltro = elegido === "todos" || datos.proyectos.some(p => String(p.id_proyecto) === elegido) ? elegido : "todos";
  const enAlcance = (id: number) => proyectoFiltro === "todos" || id === Number(proyectoFiltro);
  const proyectos = datos.proyectos.filter(p => enAlcance(p.id_proyecto));
  const tareas = datos.tareas.filter(t => enAlcance(t.id_proyecto));
  const enPlazo = tareas.filter(t => coincidePlazo(t, plazo));
  const r = resumenPanel(proyectos, tareas);
  const proximas = tareas.filter(t => t.estado !== "entregada").sort((a, b) => a.dias - b.dias).slice(0, 4);
  const responsables = responsablesPanel(tareas).slice(0, 6);
  const fecha = new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", weekday: "long", day: "numeric", month: "long" }).format(new Date(datos.hoy + "T12:00:00Z"));
  const hora = new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(datos.actualizadoEn));
  const dias = Array.from({ length: 30 }, (_, i) => {
    const dia = new Date(Date.parse(datos.hoy + "T12:00:00Z") - (29 - i) * 864e5).toISOString().slice(0, 10);
    return { dia, n: actividad.filter(a => a.dia === dia && enAlcance(a.id_proyecto)).reduce((n, a) => n + a.n, 0) };
  });
  const limpiar = () => { setElegido("todos"); setPlazo("todas"); setFiltro("todas"); };
  const verTareas = (f: string) => { setPlazo("todas"); setFiltro(f); };
  return <div className="space-y-5">
    <div className="module-heading">
      <div><p className="fecha-hoy">{fecha}</p><h1>Hola, {s.nombre.split(" ")[0]}</h1></div>
      <div className="flex flex-wrap items-center gap-2">
        <label><span className="sr-only">Proyecto</span><select className="campo campo-corto" value={proyectoFiltro} onChange={e => { setElegido(e.target.value); setPlazo("todas"); setFiltro("todas"); }}><option value="todos">Todos los proyectos</option>{datos.proyectos.map(p => <option key={p.id_proyecto} value={p.id_proyecto}>{p.nombre}</option>)}</select></label>
        <button type="button" className="btn-suave gap-2" disabled={actualizando} title={`Datos a las ${hora}`} aria-label={`Actualizar. Datos a las ${hora}`} onClick={() => actualizar(() => router.refresh())}><Icono nombre="actualizar" className={actualizando ? "refreshing" : ""} />{hora}</button>
      </div>
    </div>

    <section className="bento-inicio" aria-label="Resumen">
      <a href="#tareas" className="tarjeta-hero" onClick={() => verTareas("entregada")}>
        <Anillo valor={r.porcentaje_entregado} tam={148} grosor={10} color="#4fd1b5" pista="#ffffff1f"><strong>{r.porcentaje_entregado}%</strong></Anillo>
        <div><span>{colaborador ? "Mi avance" : "Avance del equipo"}</span><p><strong>{r.entregadas}</strong> de {r.tareas}</p><small>tareas entregadas</small></div>
      </a>
      <Link href={proyectoFiltro === "todos" ? "/proyectos" : `/proyectos/${proyectoFiltro}`} className="dato"><span className="dato-icono"><Icono nombre="proyectos" /></span><strong>{r.proyectos}</strong><span>Proyectos</span></Link>
      <a href="#tareas" className="dato dato-curso" onClick={() => verTareas("en_curso")}><span className="dato-icono"><Icono nombre="tareas" /></span><strong>{r.en_curso}</strong><span>En curso</span></a>
      <a href="#tareas" className="dato dato-semana" onClick={() => { setFiltro("todas"); setPlazo("semana"); }}><span className="dato-icono"><Icono nombre="calendario" /></span><strong>{r.proximos_7_dias}</strong><span>Próximos 7 días</span></a>
      <a href="#tareas" className={`dato ${r.vencidas ? "dato-alerta" : ""}`} aria-label={`Ver vencidas: ${r.vencidas}`} onClick={() => verTareas("vencida")}><span className="dato-icono"><Icono nombre="alerta" /></span><strong>{r.vencidas}</strong><span>Ver vencidas</span></a>
    </section>

    <div className="rejilla-3">
      <section className="panel"><div className="panel-cab"><h2 className="panel-tit">Estado de las tareas</h2></div><Dona datos={estadosGrafico(enPlazo)} etiqueta="tareas" activo={filtro} alElegir={id => setFiltro(filtro === id ? "todas" : id)} /></section>
      <section className="panel"><div className="panel-cab"><h2 className="panel-tit">Vencimientos</h2>{plazo !== "todas" && <button className="enlace text-xs" onClick={() => setPlazo("todas")}>Quitar filtro</button>}</div><Columnas datos={plazosGrafico(tareas)} activo={plazo} alElegir={id => { setPlazo(plazo === id ? "todas" : id); setFiltro("todas"); }} /></section>
      <section className="panel"><div className="panel-cab"><h2 className="panel-tit">Lo más urgente</h2><Link href="/alertas" className="enlace text-xs">Alertas</Link></div>
        {proximas.length ? <ol className="urgentes">{proximas.map(t => <li key={t.id_tarea}><Link href={`/tareas/${t.id_tarea}/reportes`}><Anillo valor={t.avance ?? 0} tam={44} grosor={9} color={t.dias < 0 ? "#d03b3b" : "#6250d6"} pista={t.dias < 0 ? "#f8e1e1" : "#e9e6fa"}><strong>{t.avance === null ? "–" : `${t.avance}%`}</strong></Anillo><div><strong>{t.titulo}</strong><span className={t.dias < 0 ? "texto-alerta" : ""}>{plazoTexto(t.dias)}</span></div><Icono nombre="flecha" /></Link></li>)}</ol> : <p className="sin-datos"><Icono nombre="check" />{tareas.length ? "Todo entregado" : "Sin tareas asignadas"}</p>}
      </section>
    </div>

    <div className="rejilla-2">
      <section className="panel"><div className="panel-cab"><h2 className="panel-tit">Reportes registrados <small>30 días</small></h2><strong className="cifra">{dias.reduce((n, d) => n + d.n, 0)}</strong></div><Area puntos={dias} /></section>
      <section className="panel"><div className="panel-cab"><h2 className="panel-tit">Proyectos</h2></div><Apiladas series={ESTADOS_GRAFICO} vacio="Aún no hay proyectos" filas={proyectos.slice(0, 6).map(p => ({ id: p.id_proyecto, nombre: p.nombre, href: `/proyectos/${p.id_proyecto}`, nota: `${p.total ? Math.round(p.entregadas / p.total * 100) : 0}%`, valores: [p.entregadas, p.en_curso, p.total - p.entregadas - p.en_curso] }))} /></section>
    </div>
    <section className="panel"><div className="panel-cab"><h2 className="panel-tit">{colaborador ? "Mi carga de trabajo" : "Carga por responsable"}</h2></div><Apiladas series={[{ nombre: "Entregadas", color: "#0f9f85" }, { nombre: "Por entregar", color: "#6250d6" }, { nombre: "Vencidas", color: "#d03b3b" }]} vacio="Sin tareas para distribuir" filas={responsables.map(p => ({ id: p.id, nombre: p.nombre, nota: p.vencidas ? `${p.vencidas} ${p.vencidas === 1 ? "vencida" : "vencidas"} de ${p.total}` : `${p.total} tareas`, alerta: p.vencidas > 0, valores: [p.entregadas, p.total - p.entregadas - p.vencidas, p.vencidas] }))} /></section>
    <ResumenTareas tareas={enPlazo} hayFiltrosExternos={proyectoFiltro !== "todos" || plazo !== "todas"} alLimpiarExternos={limpiar} mostrarMisTareas={s.rol !== "gerencia"} filtroSeleccionado={filtro} alFiltrar={setFiltro} />
  </div>;
}