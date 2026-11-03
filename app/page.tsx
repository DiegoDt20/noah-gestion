import Link from "next/link";
import { sesionActual } from "@/lib/auth";
import { query } from "@/lib/db";
import { fmt } from "@/lib/acceso";
import Icono from "@/components/Icono";
import DashboardInteractivo from "@/components/DashboardInteractivo";

export const dynamic = "force-dynamic";
type Tarea = { id_tarea:number; titulo:string; id_proyecto:number; proyecto:string; estado:string; fecha_entrega:string; dias:number; avance:number|null };
type Proyecto = { id_proyecto:number; nombre:string; fecha_entrega:string; total:number; entregadas:number; en_curso:number };
export default async function Inicio() {
 const s=(await sesionActual())!;
 const v:unknown[]=s.rol==="jefe_area"||s.rol==="colaborador"?[s.id]:[];
 const fp=s.rol==="jefe_area"?"WHERE p.id_jefe=$1":s.rol==="colaborador"?"WHERE EXISTS (SELECT 1 FROM proyecto_miembro m WHERE m.id_proyecto=p.id_proyecto AND m.id_usuario=$1)":"";
 const ft=s.rol==="jefe_area"?"WHERE p.id_jefe=$1":s.rol==="colaborador"?"WHERE t.id_responsable=$1":"";
 const [proyectos,tareas]=await Promise.all([
  query<Proyecto>(`SELECT p.id_proyecto,p.nombre,p.fecha_entrega,count(t.id_tarea)::int total,
    count(t.id_tarea) FILTER (WHERE t.estado='entregada')::int entregadas,
    count(t.id_tarea) FILTER (WHERE t.estado='en_curso')::int en_curso
    FROM proyecto p LEFT JOIN tarea t ON t.id_proyecto=p.id_proyecto ${fp}
    GROUP BY p.id_proyecto ORDER BY p.fecha_entrega,p.id_proyecto`,v),
  query<Tarea>(`SELECT t.id_tarea,t.titulo,t.estado,t.fecha_entrega,p.id_proyecto,p.nombre proyecto,
    t.fecha_entrega-(CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date dias,
    (SELECT r.porcentaje_avance FROM reporte_avance r WHERE r.id_tarea=t.id_tarea AND r.id_usuario=t.id_responsable ORDER BY r.fecha_hora DESC,r.id_reporte DESC LIMIT 1) avance
    FROM tarea t JOIN proyecto p ON p.id_proyecto=t.id_proyecto ${ft} ORDER BY t.fecha_entrega,t.id_tarea`,v),
 ]);
 const total=tareas.length;
 const n=(estado:string)=>tareas.filter(t=>t.estado===estado).length;
 const entregadas=n("entregada");
 const porcentaje=total?Math.round(entregadas/total*100):0;
 const vencidas=tareas.filter(t=>t.dias<0&&t.estado!=="entregada").length;
 const completos=proyectos.filter(p=>p.total>0&&p.total===p.entregadas).length;
 const fecha=new Intl.DateTimeFormat("es-PE",{timeZone:"America/Lima",day:"numeric",month:"long",year:"numeric"}).format(new Date());
 const alcance=s.rol==="colaborador"?"Tus tareas asignadas y los proyectos en los que participas.":s.rol==="jefe_area"?"El avance de los proyectos que diriges y las tareas de tu equipo.":"Una vista general de los proyectos y las tareas de la organización.";
 const cards=[
  {t:"Proyectos",v:proyectos.length,sub:`${completos} con todas sus tareas entregadas`,icon:0},
  {t:s.rol==="colaborador"?"Mis tareas":"Tareas del equipo",v:total,sub:`${n("en_curso")} en curso · ${n("pendiente")} pendientes`,icon:1},
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
  <dl className="summary-grid">{cards.map(c => <div key={c.t} className={`summary-stat summary-${c.icon}`}><div className="flex items-center justify-between gap-3"><dt>{c.t}</dt><span className="stat-symbol"><Icono nombre={(["proyectos", "tareas", "check", "reloj"] as const)[c.icon]} /></span></div><dd className="stat-value">{c.v}</dd><dd className="stat-caption">{c.sub}</dd></div>)}</dl>
  <DashboardInteractivo actualizadoEn={new Date().toISOString()} tareas={[...pendientes,...tareas.filter(t=>t.estado==="entregada")]} proyectos={proyectos} mostrarMisTareas={s.rol!=="gerencia"} colaborador={s.rol==="colaborador"} />
  <section className="panel"><div className="panel-cab"><div><h2 className="panel-tit">Agenda de entregas</h2><p className="chart-description">Próximas tareas pendientes, ordenadas por fecha.</p></div><Icono nombre="calendario" className="text-suave" /></div>{pendientes.length ? <ol className="delivery-agenda">{pendientes.slice(0,4).map(t => <li key={t.id_tarea}><div className="agenda-date"><strong>{t.fecha_entrega.slice(8,10)}</strong><span>{new Intl.DateTimeFormat("es-PE",{month:"short",timeZone:"UTC"}).format(new Date(t.fecha_entrega+"T12:00:00Z"))}</span></div><div className="min-w-0 flex-1"><Link href={`/tareas/${t.id_tarea}/reportes`} className="enlace break-words text-sm">{t.titulo}</Link><p className="mt-1 text-xs text-suave">{t.proyecto}</p><span className={`mt-2 block text-xs ${t.dias < 0 ? "text-red-700" : "text-suave"}`}>{t.dias < 0 ? `Vencida hace ${-t.dias} días` : t.dias === 0 ? "Vence hoy" : `En ${t.dias} días`}</span></div><Link href={`/tareas/${t.id_tarea}/reportes`} className="row-action" aria-label={`Abrir reportes de ${t.titulo}`}><Icono nombre="flecha" /></Link></li>)}</ol> : <p className="panel-cuerpo text-sm text-suave">No hay entregas pendientes por programar.</p>}</section>
 </div>;
}
