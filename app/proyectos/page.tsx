import Link from "next/link";
import { sesionActual } from "@/lib/auth";
import { query } from "@/lib/db";
import { fmt } from "@/lib/acceso";
import Formulario from "@/components/Formulario";
import Cabecera from "@/components/Cabecera";
import { Progreso } from "@/components/Estado";

export const dynamic = "force-dynamic";

export default async function Proyectos() {
  const s = (await sesionActual())!;
  const v: unknown[] = []; let f = "";
  if (s.rol === "jefe_area") { v.push(s.id); f = "WHERE p.id_jefe=$1"; }
  if (s.rol === "colaborador") { v.push(s.id); f = "WHERE EXISTS (SELECT 1 FROM proyecto_miembro m WHERE m.id_proyecto=p.id_proyecto AND m.id_usuario=$1)"; }
  const proys = await query<any>(
    `SELECT p.*, ar.nombre area, (u.nombres||' '||u.apellidos) jefe,
       (SELECT count(*) FROM tarea t WHERE t.id_proyecto=p.id_proyecto)::int total,
       (SELECT count(*) FROM tarea t WHERE t.id_proyecto=p.id_proyecto AND t.estado='entregada')::int entregadas
       FROM proyecto p JOIN area ar ON ar.id_area=p.id_area JOIN usuario u ON u.id_usuario=p.id_jefe ${f} ORDER BY p.fecha_entrega`, v);
  const puedeCrear = s.rol === "jefe_area" || s.rol === "administrador";
  const jefes = s.rol === "administrador"
    ? await query<any>("SELECT u.id_usuario, u.nombres||' '||u.apellidos nombre FROM usuario u JOIN rol r ON r.id_rol=u.id_rol WHERE r.nombre='jefe_area' AND u.activo AND u.id_area IS NOT NULL") : [];
  return (
    <>
      <Cabecera titulo="Proyectos" subtitulo={s.rol === "colaborador" ? "Proyectos en los que participas." : "Registra proyectos y sigue su avance."} />
      <div className="panel mb-6 overflow-hidden">
        {proys.length === 0 ? <p className="panel-cuerpo text-sm text-suave">Todavía no hay proyectos. {puedeCrear ? "Registra el primero con el formulario de abajo." : ""}</p> : (
          <div className="overflow-x-auto"><table className="tabla">
            <thead><tr><th className="th">Proyecto</th><th className="th">Área</th><th className="th">Jefe</th><th className="th">Inicio</th><th className="th">Entrega</th><th className="th">Avance</th></tr></thead>
            <tbody>{proys.map(p => (
              <tr key={p.id_proyecto}>
                <td className="td"><Link className="enlace" href={`/proyectos/${p.id_proyecto}`}>{p.nombre}</Link></td>
                <td className="td">{p.area}</td><td className="td">{p.jefe}</td>
                <td className="td">{fmt(p.fecha_inicio)}</td><td className="td">{fmt(p.fecha_entrega)}</td>
                <td className="td"><Progreso hechas={p.entregadas} total={p.total} /></td></tr>))}</tbody></table></div>)}
      </div>
      {puedeCrear && (
        <div className="panel max-w-2xl">
          <div className="panel-cab"><h2 className="panel-tit">Registrar proyecto</h2></div>
          <div className="panel-cuerpo">
            <Formulario url="/api/proyectos" boton="Registrar proyecto">
              <div><label className="etiqueta">Nombre del proyecto</label><input name="nombre" required className="campo" /></div>
              <div><label className="etiqueta">Descripción</label><textarea name="descripcion" className="campo" rows={3} /></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className="etiqueta">Fecha de inicio</label><input name="fecha_inicio" type="date" required className="campo" /></div>
                <div><label className="etiqueta">Fecha de entrega</label><input name="fecha_entrega" type="date" required className="campo" /></div>
              </div>
              {s.rol === "administrador" && (
                <div><label className="etiqueta">Jefe de área responsable</label>
                  <select name="id_jefe" required className="campo" defaultValue=""><option value="" disabled>Elige un jefe</option>
                    {jefes.map(j => <option key={j.id_usuario} value={j.id_usuario}>{j.nombre}</option>)}</select></div>)}
            </Formulario>
          </div>
        </div>)}
    </>
  );
}
