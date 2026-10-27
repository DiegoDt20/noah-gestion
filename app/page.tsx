import Link from "next/link";
import { sesionActual } from "@/lib/auth";
import { query } from "@/lib/db";
import { fmt } from "@/lib/acceso";
import Cabecera from "@/components/Cabecera";
import { ChipEstado } from "@/components/Estado";

export const dynamic = "force-dynamic";

function dias(f: string) {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const [y, m, d] = f.split("-").map(Number);
  return Math.round((new Date(y, m - 1, d).getTime() - hoy.getTime()) / 86400000);
}

export default async function Inicio() {
  const s = (await sesionActual())!;
  let fp = "", ft = "";
  const v: unknown[] = [];
  if (s.rol === "jefe_area") { v.push(s.id); fp = "WHERE p.id_jefe=$1"; ft = "WHERE p.id_jefe=$1"; }
  if (s.rol === "colaborador") { v.push(s.id); fp = "WHERE EXISTS (SELECT 1 FROM proyecto_miembro m WHERE m.id_proyecto=p.id_proyecto AND m.id_usuario=$1)"; ft = "WHERE t.id_responsable=$1"; }
  const [np] = await query<any>(`SELECT count(*)::int n FROM proyecto p ${fp}`, v);
  const est = await query<any>(`SELECT t.estado, count(*)::int n FROM tarea t JOIN proyecto p ON p.id_proyecto=t.id_proyecto ${ft} GROUP BY t.estado`, v);
  const n = (e: string) => est.find(x => x.estado === e)?.n ?? 0;
  const prox = await query<any>(
    `SELECT t.id_tarea, t.titulo, t.fecha_entrega, t.estado, p.nombre proyecto, p.id_proyecto
       FROM tarea t JOIN proyecto p ON p.id_proyecto=t.id_proyecto ${ft ? ft + " AND" : "WHERE"} t.estado<>'entregada'
      ORDER BY t.fecha_entrega LIMIT 6`, v);
  const cifras = [["Proyectos", np.n], ["Pendientes", n("pendiente")], ["En curso", n("en_curso")], ["Entregadas", n("entregada")]];
  return (
    <>
      <Cabecera titulo={`Hola, ${s.nombre.split(" ")[0]}`} subtitulo="Así va el trabajo de tu equipo." />
      <div className="panel mb-6 grid grid-cols-2 divide-linea md:grid-cols-4 md:divide-x">
        {cifras.map(([t, c]) => (
          <div key={String(t)} className="px-6 py-5">
            <div className="text-xs font-medium text-suave">{t}</div>
            <div className="mt-1 text-3xl font-bold tracking-tight text-marca">{c}</div>
          </div>
        ))}
      </div>
      <div className="panel overflow-hidden">
        <div className="panel-cab"><h2 className="panel-tit">Próximas entregas</h2><Link href="/proyectos" className="enlace text-sm">Ver proyectos</Link></div>
        {prox.length === 0 ? <p className="panel-cuerpo text-sm text-suave">No tienes entregas pendientes. Cuando se asignen tareas aparecerán aquí.</p> : (
          <div className="overflow-x-auto"><table className="tabla">
            <thead><tr><th className="th">Tarea</th><th className="th">Proyecto</th><th className="th">Entrega</th><th className="th">Plazo</th><th className="th">Estado</th></tr></thead>
            <tbody>{prox.map(t => {
              const d = dias(t.fecha_entrega);
              const txt = d < 0 ? `Vencida hace ${-d} d` : d === 0 ? "Vence hoy" : `Faltan ${d} d`;
              return (
                <tr key={t.id_tarea}>
                  <td className="td font-medium">{t.titulo}</td>
                  <td className="td"><Link className="enlace" href={`/proyectos/${t.id_proyecto}`}>{t.proyecto}</Link></td>
                  <td className="td">{fmt(t.fecha_entrega)}</td>
                  <td className={`td text-xs font-medium ${d < 0 ? "text-red-700" : "text-suave"}`}>{txt}</td>
                  <td className="td"><ChipEstado estado={t.estado} /></td>
                </tr>);
            })}</tbody></table></div>)}
      </div>
    </>
  );
}
