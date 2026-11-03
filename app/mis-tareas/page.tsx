import Link from "next/link";
import { sesionActual } from "@/lib/auth";
import { query } from "@/lib/db";
import ListaTrabajo from "@/components/ListaTrabajo";
import Cabecera from "@/components/Cabecera";

export const dynamic = "force-dynamic";

export default async function MisTareas() {
  const s = (await sesionActual())!;
  const tareas = await query<any>(
    `SELECT t.*, p.nombre proyecto FROM tarea t JOIN proyecto p ON p.id_proyecto=t.id_proyecto WHERE t.id_responsable=$1 ORDER BY t.fecha_entrega`, [s.id]);
  return (
    <>
      <Cabecera titulo="Mis tareas" subtitulo="Organiza tus entregas, actualiza estados y registra tus avances."><Link href="/proyectos" className="btn-suave">Explorar proyectos</Link></Cabecera>
      <div className="panel p-5"><ListaTrabajo tareas={tareas.map(t=>({...t,editable:true,verReportes:true}))} personal /></div>
    </>
  );
}
