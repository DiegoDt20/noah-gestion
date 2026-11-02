import Link from "next/link";
import { sesionActual } from "@/lib/auth";
import { query } from "@/lib/db";
import { fmt } from "@/lib/acceso";
import { ChipEstado } from "@/components/Estado";

export const dynamic = "force-dynamic";
type Tarea = { id_tarea:number; titulo:string; id_proyecto:number; proyecto:string; estado:string; fecha_entrega:string; dias:number; avance:number|null };
type Proyecto = { id_proyecto:number; nombre:string; fecha_entrega:string; total:number; entregadas:number; en_curso:number };
const estados = [
  {id:"entregada",nombre:"Entregadas",color:"#0f8b8d"},
  {id:"en_curso",nombre:"En curso",color:"#f59e0b"},
  {id:"pendiente",nombre:"Pendientes",color:"#94a3b8"},
];
function Barra({valor,label}:{valor:number;label:string}) {
  return <div className="h-2.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={label} aria-valuenow={valor} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-acento transition-all" style={{width:`${valor}%`}} /></div>;
}
function Icono({tipo}:{tipo:number}) {
 const paths=["M3 7h7l2 2h9v11H3V7zm0 0V4h7l2 3","M9 11l3 3 8-8M20 12v8H4V4h10","M4 18l5-5 4 2 7-10M15 5h5v5","M12 8v5m0 3h.01M3 21h18L12 3 3 21z"];
 return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[tipo]} /></svg>;
}
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
 const visibles=[...tareas.filter(t=>t.estado!=="entregada"),...tareas.filter(t=>t.estado==="entregada")].slice(0,8);
 const fecha=new Intl.DateTimeFormat("es-PE",{timeZone:"America/Lima",day:"numeric",month:"long",year:"numeric"}).format(new Date());
 const alcance=s.rol==="colaborador"?"Tus tareas asignadas y los proyectos en los que participas.":s.rol==="jefe_area"?"El avance de los proyectos que diriges y las tareas de tu equipo.":"Una vista general de los proyectos y las tareas de la organización.";
 const cards=[
  {t:"Proyectos",v:proyectos.length,sub:`${completos} con todas sus tareas entregadas`,icon:0},
  {t:s.rol==="colaborador"?"Mis tareas":"Tareas del equipo",v:total,sub:`${n("en_curso")} en curso · ${n("pendiente")} pendientes`,icon:1},
  {t:"Tareas entregadas",v:`${porcentaje} %`,sub:`${entregadas} de ${total} tareas completadas`,icon:2},
  {t:"Tareas vencidas",v:vencidas,sub:vencidas?"Entregas pendientes fuera de plazo":"Sin tareas pendientes fuera de plazo",icon:3},
 ];
 let offset=0;
 return <div className="space-y-6">
  <section className="relative overflow-hidden rounded-2xl p-6 text-white sm:p-8" style={{background:"linear-gradient(125deg, #0d2d4d 0%, #14406b 60%, #0f8b8d 100%)"}}>
    <div className="pointer-events-none absolute -right-10 -top-20 h-72 w-72 rounded-full border-[40px] border-white/5" aria-hidden="true" />
    <div className="relative flex flex-wrap items-start justify-between gap-5">
      <div><p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Panel de seguimiento</p><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Hola, {s.nombre.split(" ")[0]}</h1><p className="mt-2 max-w-xl text-sm leading-relaxed text-white/80">{alcance}</p></div>
      <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm"><p className="text-xs text-white/70">Resumen al día</p><p className="mt-1 font-medium">{fecha}</p></div>
    </div>
    <Link href="/proyectos" className="relative mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-marca hover:bg-white/90">Explorar proyectos <span aria-hidden="true">↗</span></Link>
  </section>
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(c=><section key={c.t} className="panel p-5"><div className="flex items-center justify-between gap-2"><h2 className="text-xs font-semibold text-suave">{c.t}</h2><span className={`rounded-lg p-2 ${c.icon===3&&vencidas?"bg-red-50 text-red-600":"bg-marca/5 text-marca"}`}><Icono tipo={c.icon}/></span></div><p className="mt-2 text-3xl font-bold tracking-tight text-marca-oscuro">{c.v}</p><p className="mt-2 text-xs leading-relaxed text-suave">{c.sub}</p></section>)}</div>
  <div className="grid gap-6 xl:grid-cols-5">
    <section className="panel xl:col-span-2"><div className="panel-cab"><h2 className="panel-tit">Distribución de tareas</h2><span className="text-xs text-suave">{total} en total</span></div><div className="panel-cuerpo">
      <div className="relative mx-auto h-52 w-52"><svg viewBox="0 0 200 200" className="h-full w-full -rotate-90" role="img" aria-label={`Tareas: ${entregadas} entregadas, ${n("en_curso")} en curso y ${n("pendiente")} pendientes`}><circle cx="100" cy="100" r="78" fill="none" stroke="#eef1f5" strokeWidth="23" />{estados.map(e=>{const parte=total?n(e.id)/total*100:0;const inicio=offset;offset+=parte;return <circle key={e.id} cx="100" cy="100" r="78" fill="none" stroke={e.color} strokeWidth="23" pathLength="100" strokeDasharray={`${parte} ${100-parte}`} strokeDashoffset={-inicio}/>;})}</svg><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-4xl font-bold tracking-tight text-marca-oscuro">{porcentaje}%</span><span className="mt-1 text-xs text-suave">entregadas</span></div></div>
      <ul className="mt-5 space-y-3">{estados.map(e=><li key={e.id} className="flex items-center justify-between text-sm"><span className="flex items-center gap-2 text-suave"><span className="h-2.5 w-2.5 rounded-full" style={{background:e.color}}/>{e.nombre}</span><span className="font-semibold">{n(e.id)} <span className="ml-2 font-normal text-suave">{total?Math.round(n(e.id)/total*100):0}%</span></span></li>)}</ul>
      {!total&&<p className="mt-4 text-sm text-suave">Los gráficos se completarán cuando tengas tareas asignadas.</p>}
    </div></section>
    <section className="panel xl:col-span-3"><div className="panel-cab"><h2 className="panel-tit">Avance por proyecto</h2><Link href="/proyectos" className="enlace text-xs">Ver todos →</Link></div><div className="panel-cuerpo"><p className="mb-5 text-xs leading-relaxed text-suave">Porcentaje de tareas entregadas sobre el total de cada proyecto.{s.rol==="colaborador"?" Incluye las tareas de todo el equipo en tus proyectos.":""}</p>
      {!proyectos.length?<p className="py-8 text-center text-sm text-suave">Todavía no hay proyectos para mostrar.</p>:<ul className="max-h-96 space-y-6 overflow-y-auto pr-1">{proyectos.map(p=>{const pct=p.total?Math.round(p.entregadas/p.total*100):0;return <li key={p.id_proyecto}><div className="mb-2 flex items-start justify-between gap-4"><div className="min-w-0"><Link href={`/proyectos/${p.id_proyecto}`} className="enlace break-words text-sm">{p.nombre}</Link><p className="mt-1 text-xs text-suave">{p.total?`${p.entregadas} de ${p.total} tareas entregadas`:"Sin tareas asignadas"}</p></div><span className={`shrink-0 rounded-lg px-2.5 py-1 text-sm font-bold ${pct===100?"bg-emerald-50 text-emerald-700":"bg-marca/5 text-marca"}`}>{pct}%</span></div><Barra valor={pct} label={`Avance de ${p.nombre}`}/><p className="mt-2 text-xs text-suave">Entrega: {fmt(p.fecha_entrega)}</p></li>;})}</ul>}
    </div></section>
  </div>
  <section className="panel overflow-hidden"><div className="panel-cab"><div><h2 className="panel-tit">Tareas y avance reportado</h2><p className="mt-1 text-xs text-suave">Primero las entregas pendientes más próximas. Avance según el último reporte del responsable.</p></div>{s.rol!=="gerencia"&&<Link href="/mis-tareas" className="enlace ml-3 shrink-0 text-xs">Mis tareas →</Link>}</div>
    {!visibles.length?<p className="panel-cuerpo text-sm text-suave">No hay tareas para mostrar por ahora.</p>:<div className="overflow-x-auto"><table className="tabla"><thead><tr><th className="th">Tarea / proyecto</th><th className="th">Avance reportado</th><th className="th">Entrega</th><th className="th">Estado</th></tr></thead><tbody>{visibles.map(t=><tr key={t.id_tarea}><td className="td"><Link href={`/tareas/${t.id_tarea}/reportes`} className="enlace">{t.titulo}</Link><Link href={`/proyectos/${t.id_proyecto}`} className="mt-1 block text-xs text-suave hover:underline">{t.proyecto}</Link></td><td className="td min-w-40">{t.avance===null?<span className="text-xs text-suave">Sin reporte registrado</span>:<div className="space-y-2"><span className="text-xs font-semibold text-marca">{t.avance}%</span><Barra valor={t.avance} label={`Avance reportado de ${t.titulo}`}/></div>}</td><td className="td whitespace-nowrap"><span>{fmt(t.fecha_entrega)}</span>{t.estado!=="entregada"&&<span className={`mt-1 block text-xs ${t.dias<0?"font-medium text-red-600":"text-suave"}`}>{t.dias<0?`Vencida hace ${-t.dias} días`:t.dias===0?"Vence hoy":`En ${t.dias} días`}</span>}</td><td className="td"><ChipEstado estado={t.estado}/></td></tr>)}</tbody></table></div>}
    {total>8&&<p className="border-t border-linea px-5 py-3 text-xs text-suave">Mostrando 8 de {total} tareas. Consulta cada proyecto para ver el detalle completo.</p>}
  </section>
 </div>;
}
