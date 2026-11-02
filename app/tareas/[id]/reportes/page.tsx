import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { sesionActual } from "@/lib/auth";
import { fmt } from "@/lib/acceso";
import { MOMENTO_TEXTO, reportesDeTarea, seguimientoDeTarea, tareaParaReportes } from "@/lib/reportes";
import ReporteForm from "@/components/ReporteForm";
import Cabecera from "@/components/Cabecera";

export const dynamic = "force-dynamic";
export default async function Reportes({ params }: { params: Promise<{ id:string }> }) {
  const s=await sesionActual();
  if(!s) redirect("/login");
  const id=Number((await params).id);
  if(!Number.isSafeInteger(id) || id<=0) notFound();
  const tarea=await tareaParaReportes(s,id);
  if(!tarea) notFound();
  const reportes=await reportesDeTarea(id);
  const seguimiento=await seguimientoDeTarea(id,tarea.id_responsable);
  const editable=s.rol==="colaborador" && tarea.id_responsable===s.id;
  return <>
    <Link href={s.rol==="colaborador" ? "/mis-tareas" : `/proyectos/${tarea.id_proyecto}`} className="enlace mb-3 inline-block text-sm">← Volver a {s.rol==="colaborador" ? "mis tareas" : "proyecto"}</Link>
    <Cabecera titulo="Reportes de avance" subtitulo={tarea.titulo} />
    <div className="panel mb-5 p-5"><Link href={`/proyectos/${tarea.id_proyecto}`} className="enlace text-sm">{tarea.proyecto}</Link><p className="mt-1 text-sm text-suave">Responsable: {tarea.responsable}</p><p className="mt-1 text-xs text-suave">Fecha de hoy: {fmt(seguimiento.hoy)} · Hora de Perú (Lima)</p></div>
    <div className="mb-6 grid gap-3 sm:grid-cols-3">
      <div className="panel p-4"><p className="text-xs text-suave">Inicio de hoy</p><p className="mt-1 font-semibold">{seguimiento.inicio_registrado ? "Registrado" : "Pendiente"}</p></div>
      <div className="panel p-4"><p className="text-xs text-suave">Cierre de hoy</p><p className="mt-1 font-semibold">{seguimiento.cierre_registrado ? "Registrado" : "Pendiente"}</p></div>
      <div className="panel p-4"><p className="text-xs text-suave">Reporte adicional de cada 3 días</p><p className="mt-1 font-semibold">{seguimiento.periodico_habilitado ? "Pendiente de registrar" : "Próximo: " + fmt(seguimiento.proximo_periodico)}</p>{seguimiento.periodico_habilitado && <p className="mt-1 text-xs text-suave">Corresponde desde el {fmt(seguimiento.proximo_periodico)}</p>}</div>
    </div>
    <div className={`grid items-start gap-6 ${editable ? "lg:grid-cols-2" : ""}`}>
      {editable && <section className="panel"><div className="panel-cab"><h2 className="panel-tit">Registrar reporte</h2></div><div className="panel-cuerpo"><ReporteForm id={id} seguimiento={seguimiento} avance={reportes[0]?.porcentaje_avance ?? 0} /></div></section>}
      <section className="panel overflow-hidden"><div className="panel-cab"><h2 className="panel-tit">Historial de reportes ({reportes.length})</h2></div>
        {!reportes.length ? <p className="panel-cuerpo text-sm text-suave">Aún no se han registrado reportes para esta tarea.</p> : <ol className="divide-y divide-linea">{reportes.map(r=><li key={r.id_reporte} className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="text-sm font-semibold">{MOMENTO_TEXTO[r.momento]}</h3><p className="mt-1 text-xs text-suave">{fmt(r.fecha_reporte)} · {r.hora} · {r.autor}</p></div><span className="chip bg-marca/10 font-semibold text-marca">{r.porcentaje_avance} %</span></div>
          <div className="barra my-3" role="progressbar" aria-label="Porcentaje de avance reportado" aria-valuenow={r.porcentaje_avance} aria-valuemin={0} aria-valuemax={100}><span style={{width:`${r.porcentaje_avance}%`}} /></div>
          <p className="whitespace-pre-wrap break-words text-sm">{r.contenido}</p>
        </li>)}</ol>}
      </section>
    </div>
  </>;
}
