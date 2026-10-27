import Link from "next/link";
import { sesionActual } from "@/lib/auth";
import { query } from "@/lib/db";
import { fmt } from "@/lib/acceso";
import EstadoSelect from "@/components/EstadoSelect";
import Cabecera from "@/components/Cabecera";

export const dynamic = "force-dynamic";

export default async function MisTareas() {
  const s = (await sesionActual())!;
  const tareas = await query<any>(
    `SELECT t.*, p.nombre proyecto FROM tarea t JOIN proyecto p ON p.id_proyecto=t.id_proyecto WHERE t.id_responsable=$1 ORDER BY t.fecha_entrega`, [s.id]);
  return (
    <>
      <Cabecera titulo="Mis tareas" subtitulo="Cambia el estado de tus tareas a medida que avanzas." />
      <div className="panel overflow-hidden">
        {tareas.length === 0 ? <p className="panel-cuerpo text-sm text-suave">No tienes tareas asignadas por ahora.</p> : (
          <div className="overflow-x-auto"><table className="tabla">
            <thead><tr><th className="th">Tarea</th><th className="th">Proyecto</th><th className="th">Mi rol</th><th className="th">Entrega</th><th className="th">Estado</th></tr></thead>
            <tbody>{tareas.map(t => (
              <tr key={t.id_tarea}><td className="td font-medium">{t.titulo}</td>
                <td className="td"><Link className="enlace" href={`/proyectos/${t.id_proyecto}`}>{t.proyecto}</Link></td>
                <td className="td text-suave">{t.rol_asignado}</td><td className="td">{fmt(t.fecha_entrega)}</td>
                <td className="td"><EstadoSelect id={t.id_tarea} estado={t.estado} editable /></td></tr>))}</tbody></table></div>)}
      </div>
    </>
  );
}
