import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { sesionActual } from "@/lib/auth";
import { fmt } from "@/lib/acceso";
import { reportesDeTarea, seguimientoDeTarea, tareaParaReportes } from "@/lib/reportes";
import ReporteForm from "@/components/ReporteForm";
import Cabecera from "@/components/Cabecera";
import HistorialReportes from "@/components/HistorialReportes";
import Icono from "@/components/Icono";

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
    <div className="report-context mb-5"><Link href={`/proyectos/${tarea.id_proyecto}`} className="enlace text-sm">{tarea.proyecto}</Link><p className="mt-1 text-sm text-suave">Responsable: {tarea.responsable}</p><p className="mt-1 text-xs text-suave">Fecha de hoy: {fmt(seguimiento.hoy)} · Hora de Perú (Lima)</p></div>
    <div className="mb-6 grid gap-3 sm:grid-cols-3">
      <div className="report-checkpoint"><Icono nombre={seguimiento.inicio_registrado?"check":"reloj"}/><p className="text-xs text-suave">Inicio de hoy</p><p className="mt-1 font-semibold">{seguimiento.inicio_registrado ? "Registrado" : "Pendiente"}</p></div>
      <div className="report-checkpoint"><Icono nombre={seguimiento.cierre_registrado?"check":"reloj"}/><p className="text-xs text-suave">Cierre de hoy</p><p className="mt-1 font-semibold">{seguimiento.cierre_registrado ? "Registrado" : "Pendiente"}</p></div>
      <div className="report-checkpoint"><Icono nombre="calendario"/><p className="text-xs text-suave">Reporte adicional de cada 3 días</p><p className="mt-1 font-semibold">{seguimiento.periodico_habilitado ? "Pendiente de registrar" : "Próximo: " + fmt(seguimiento.proximo_periodico)}</p>{seguimiento.periodico_habilitado && <p className="mt-1 text-xs text-suave">Corresponde desde el {fmt(seguimiento.proximo_periodico)}</p>}</div>
    </div>
    <div className={`grid items-start gap-6 ${editable ? "xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]" : ""}`}>
      {editable && <section className="panel"><div className="panel-cab"><h2 className="panel-tit">Registrar reporte</h2></div><div className="panel-cuerpo"><ReporteForm id={id} seguimiento={seguimiento} avance={reportes[0]?.porcentaje_avance ?? 0} /></div></section>}
      <HistorialReportes reportes={reportes} />
    </div>
  </>;
}
