import Link from "next/link";
import { sesionActual } from "@/lib/auth";
import { query } from "@/lib/db";
import ListaTrabajo from "@/components/ListaTrabajo";
import Cabecera from "@/components/Cabecera";
import { Columnas, Dona } from "@/components/Graficos";
import { estadosGrafico, plazosGrafico } from "@/lib/panel";
import Icono from "@/components/Icono";

export const dynamic = "force-dynamic";

export default async function MisTareas() {
  const s = (await sesionActual())!;
  const tareas = await query<any>(
    `SELECT t.*,t.fecha_entrega-(CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date dias, p.nombre proyecto FROM tarea t JOIN proyecto p ON p.id_proyecto=t.id_proyecto WHERE t.id_responsable=$1 ORDER BY t.fecha_entrega`, [s.id]);
  const pendientes=tareas.filter(t=>t.estado!=="entregada");
  const siguiente=pendientes[0];
  return (
    <>
      <Cabecera titulo="Mis tareas"/>
      <div className="rejilla-3 mb-5">
        <section className="panel"><div className="panel-cab"><h2 className="panel-tit">Mi avance</h2></div><Dona datos={estadosGrafico(tareas)} etiqueta="tareas"/></section>
        <section className="panel"><div className="panel-cab"><h2 className="panel-tit">Vencimientos</h2></div><Columnas datos={plazosGrafico(tareas)}/></section>
        {siguiente?<Link href={`/tareas/${siguiente.id_tarea}/reportes`} className="tarjeta-siguiente"><span>Siguiente entrega</span><strong>{siguiente.titulo}</strong><small>{siguiente.proyecto}</small><em>{siguiente.dias<0?`${-siguiente.dias} d de retraso`:siguiente.dias===0?"Vence hoy":siguiente.dias===1?"Vence mañana":`En ${siguiente.dias} días`}<Icono nombre="flecha"/></em></Link>:<div className="tarjeta-siguiente"><span>Estás al día</span><strong>{tareas.length?"Todo entregado":"Sin tareas asignadas"}</strong><em><Link href="/proyectos">Ver proyectos</Link></em></div>}
      </div>
      <div className="panel p-5"><ListaTrabajo tareas={tareas.map(t=>({...t,editable:true,verReportes:true}))} personal /></div>
    </>
  );
}
