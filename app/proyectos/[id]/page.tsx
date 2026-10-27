import { notFound } from "next/navigation";
import Link from "next/link";
import { sesionActual } from "@/lib/auth";
import { query } from "@/lib/db";
import { cargarProyecto, fmt, puedeGestionar, puedeVer } from "@/lib/acceso";
import Formulario from "@/components/Formulario";
import EstadoSelect from "@/components/EstadoSelect";
import { Progreso } from "@/components/Estado";

export const dynamic = "force-dynamic";

export default async function Proyecto({ params }: { params: Promise<{ id: string }> }) {
  const s = (await sesionActual())!;
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const p = await cargarProyecto(id);
  if (!p || !(await puedeVer(s, p))) notFound();
  const gestiona = puedeGestionar(s, p);
  const info = (await query<any>(
    `SELECT p.nombre, p.descripcion, ar.nombre area, (u.nombres||' '||u.apellidos) jefe FROM proyecto p
       JOIN area ar ON ar.id_area=p.id_area JOIN usuario u ON u.id_usuario=p.id_jefe WHERE p.id_proyecto=$1`, [id]))[0];
  const miembros = await query<any>(
    `SELECT m.id_usuario, m.rol_en_proyecto, u.nombres||' '||u.apellidos nombre FROM proyecto_miembro m JOIN usuario u ON u.id_usuario=m.id_usuario WHERE m.id_proyecto=$1 ORDER BY nombre`, [id]);
  const tareas = await query<any>(
    `SELECT t.*, u.nombres||' '||u.apellidos responsable FROM tarea t JOIN usuario u ON u.id_usuario=t.id_responsable WHERE t.id_proyecto=$1 ORDER BY t.fecha_entrega`, [id]);
  const candidatos = gestiona ? await query<any>(
    `SELECT u.id_usuario, u.nombres||' '||u.apellidos nombre FROM usuario u JOIN rol r ON r.id_rol=u.id_rol
      WHERE r.nombre='colaborador' AND u.activo AND u.id_usuario NOT IN (SELECT id_usuario FROM proyecto_miembro WHERE id_proyecto=$1) ORDER BY nombre`, [id]) : [];
  const hechas = tareas.filter(t => t.estado === "entregada").length;
  const ini = (n: string) => n.split(" ").map(x => x[0]).slice(0, 2).join("").toUpperCase();
  return (
    <>
      <Link href="/proyectos" className="enlace mb-3 inline-block text-sm">← Volver a proyectos</Link>
      <div className="panel mb-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-bold tracking-tight">{info.nombre}</h1>
            {info.descripcion && <p className="mt-2 text-sm text-suave">{info.descripcion}</p>}
          </div>
          <Progreso hechas={hechas} total={tareas.length} />
        </div>
        <dl className="mt-5 grid gap-4 border-t border-linea pt-4 text-sm sm:grid-cols-4">
          <div><dt className="text-xs text-suave">Área</dt><dd className="font-medium">{info.area}</dd></div>
          <div><dt className="text-xs text-suave">Jefe del proyecto</dt><dd className="font-medium">{info.jefe}</dd></div>
          <div><dt className="text-xs text-suave">Inicio</dt><dd className="font-medium">{fmt(p.fecha_inicio)}</dd></div>
          <div><dt className="text-xs text-suave">Entrega</dt><dd className="font-medium">{fmt(p.fecha_entrega)}</dd></div>
        </dl>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="panel h-fit">
          <div className="panel-cab"><h2 className="panel-tit">Equipo ({miembros.length})</h2></div>
          <ul className="divide-y divide-linea">{miembros.map(m => (
            <li key={m.id_usuario} className="flex items-center gap-3 px-5 py-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-marca/10 text-xs font-semibold text-marca">{ini(m.nombre)}</div>
              <div className="min-w-0 text-sm leading-tight"><div className="truncate font-medium">{m.nombre}</div><div className="text-xs text-suave">{m.rol_en_proyecto}</div></div>
            </li>))}</ul>
          {gestiona && (
            <div className="border-t border-linea p-5">
              <h3 className="mb-3 text-sm font-semibold">Asignar miembro</h3>
              <Formulario url={`/api/proyectos/${id}/miembros`} boton="Asignar al proyecto">
                <div><label className="etiqueta">Colaborador</label><select name="id_usuario" required className="campo" defaultValue=""><option value="" disabled>Elige un colaborador</option>
                  {candidatos.map(c => <option key={c.id_usuario} value={c.id_usuario}>{c.nombre}</option>)}</select></div>
                <div><label className="etiqueta">Rol en el proyecto</label><input name="rol_en_proyecto" placeholder="Ej. Desarrollador" required className="campo" /></div>
              </Formulario>
            </div>)}
        </div>
        <div className="panel overflow-hidden lg:col-span-2">
          <div className="panel-cab"><h2 className="panel-tit">Tareas ({tareas.length})</h2></div>
          {tareas.length === 0 ? <p className="panel-cuerpo text-sm text-suave">Este proyecto aún no tiene tareas.{gestiona ? " Asigna la primera con el formulario de abajo." : ""}</p> : (
            <div className="overflow-x-auto"><table className="tabla">
              <thead><tr><th className="th">Tarea</th><th className="th">Responsable</th><th className="th">Rol</th><th className="th">Entrega</th><th className="th">Estado</th></tr></thead>
              <tbody>{tareas.map(t => (
                <tr key={t.id_tarea}><td className="td font-medium">{t.titulo}</td><td className="td">{t.responsable}</td><td className="td text-suave">{t.rol_asignado}</td><td className="td">{fmt(t.fecha_entrega)}</td>
                  <td className="td"><EstadoSelect id={t.id_tarea} estado={t.estado} editable={s.rol === "administrador" || t.id_responsable === s.id || (s.rol === "jefe_area" && p.id_jefe === s.id)} /></td></tr>))}</tbody></table></div>)}
          {gestiona && (
            <div className="border-t border-linea p-5">
              <h3 className="mb-3 text-sm font-semibold">Asignar tarea</h3>
              <Formulario url={`/api/proyectos/${id}/tareas`} boton="Asignar tarea">
                <div><label className="etiqueta">Título</label><input name="titulo" required className="campo" /></div>
                <div><label className="etiqueta">Descripción</label><textarea name="descripcion" rows={2} className="campo" /></div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div><label className="etiqueta">Responsable</label><select name="id_responsable" required className="campo" defaultValue=""><option value="" disabled>Elige</option>
                    {miembros.map(m => <option key={m.id_usuario} value={m.id_usuario}>{m.nombre}</option>)}</select></div>
                  <div><label className="etiqueta">Rol asignado</label><input name="rol_asignado" required className="campo" /></div>
                  <div><label className="etiqueta">Fecha de entrega</label><input name="fecha_entrega" type="date" required min={p.fecha_inicio} max={p.fecha_entrega} className="campo" /></div>
                </div>
              </Formulario>
            </div>)}
        </div>
      </div>
    </>
  );
}
