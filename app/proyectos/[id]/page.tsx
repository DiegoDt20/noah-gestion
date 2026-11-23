import { notFound } from "next/navigation";
import Link from "next/link";
import { sesionActual } from "@/lib/auth";
import { query } from "@/lib/db";
import { cargarProyecto, fmt, puedeGestionar, puedeVer } from "@/lib/acceso";
import Formulario from "@/components/Formulario";
import ListaTrabajo from "@/components/ListaTrabajo";
import { Progreso } from "@/components/Estado";
import EditarRepositorio from "@/components/EditarRepositorio";
import IssuesGithub from "@/components/IssuesGithub";
import AsistenteIA from "@/components/AsistenteIA";
import ContrasteIA from "@/components/ContrasteIA";
import { indicadoresProyecto } from "@/lib/kpi";
import { repositorioGithub } from "@/lib/github-repositorio";

export const dynamic = "force-dynamic";

export default async function Proyecto({ params }: { params: Promise<{ id: string }> }) {
  const s = (await sesionActual())!;
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const p = await cargarProyecto(id);
  if (!p || !(await puedeVer(s, p))) notFound();
  const gestiona = puedeGestionar(s, p);
  const kpi = await indicadoresProyecto(s, id);
  let github: string | null = null;
  try { github = repositorioGithub(p.repositorio_github); } catch { /* Ignorar enlaces inválidos preexistentes. */ }
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
  const accesoIA = s.rol === "gerencia" || (s.rol === "jefe_area" && p.id_jefe === s.id);
  const [reportesIA, documentosIA, observacionesIA, consultasIA] = accesoIA ? await Promise.all([
    query<{id:number;nombre:string}>(`SELECT r.id_reporte id, t.titulo || ' · ' || r.fecha_reporte::text || ' · ' || r.momento nombre FROM reporte_avance r JOIN tarea t ON t.id_tarea=r.id_tarea WHERE t.id_proyecto=$1 ORDER BY r.fecha_hora DESC LIMIT 100`,[id]),
    query<{id:number;nombre:string}>(`SELECT d.id_documento id,d.nombre FROM documento d WHERE d.id_proyecto=$1 AND EXISTS(SELECT 1 FROM fragmento_documento f WHERE f.id_documento=d.id_documento) ORDER BY d.fecha_subida DESC LIMIT 100`,[id]),
    query<{id:number;diferencia:string;documento:string;reporte:string;fecha:string}>(`SELECT o.id_observacion id,o.diferencia,COALESCE(d.nombre,'Documento no disponible') documento,t.titulo reporte,to_char(o.fecha_hora,'DD/MM/YYYY HH24:MI') fecha FROM observacion_ia o JOIN reporte_avance r ON r.id_reporte=o.id_reporte JOIN tarea t ON t.id_tarea=r.id_tarea LEFT JOIN documento d ON d.id_documento=o.id_documento WHERE t.id_proyecto=$1 ORDER BY o.fecha_hora DESC,o.id_observacion DESC LIMIT 100`,[id]),
    query<{id:number;pregunta:string;respuesta:string;documento:string;fecha:string}>(`SELECT c.id_consulta id,c.pregunta,c.respuesta,COALESCE(d.nombre,'Documentos del proyecto') documento,to_char(c.fecha_hora,'DD/MM/YYYY HH24:MI') fecha FROM consulta_asistente c LEFT JOIN documento d ON d.id_documento=c.id_documento WHERE c.id_proyecto=$1 ORDER BY c.fecha_hora DESC,c.id_consulta DESC LIMIT 100`,[id])
  ]) : [[],[],[],[]];
  const hechas = tareas.filter(t => t.estado === "entregada").length;
  const ini = (n: string) => n.split(" ").map(x => x[0]).slice(0, 2).join("").toUpperCase();
  return (
    <>
      <Link href="/proyectos" className="enlace mb-3 inline-block text-sm">← Volver a proyectos</Link>
      <div className="project-detail-header mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-semibold tracking-tight">{info.nombre}</h1>
            {info.descripcion && <p className="mt-2 text-sm leading-6 text-slate-200">{info.descripcion}</p>}
          </div>
          <Progreso hechas={hechas} total={tareas.length} />
        </div>
        {github && <p className="mt-4 text-sm"><a href={github} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">Repositorio de GitHub ↗</a></p>}
        <dl className="project-facts">
          <div><dt className="text-xs text-slate-300">Área</dt><dd className="font-medium">{info.area}</dd></div>
          <div><dt className="text-xs text-slate-300">Jefe del proyecto</dt><dd className="font-medium">{info.jefe}</dd></div>
          <div><dt className="text-xs text-slate-300">Inicio</dt><dd className="font-medium">{fmt(p.fecha_inicio)}</dd></div>
          <div><dt className="text-xs text-slate-300">Entrega</dt><dd className="font-medium">{fmt(p.fecha_entrega)}</dd></div>
        </dl>
      </div>
      {gestiona && <EditarRepositorio proyecto={id} actual={github} />}
      {github && <IssuesGithub proyecto={id} />}
      {kpi && <section className="panel mb-6" aria-labelledby="indicadores-proyecto"><div className="panel-cab"><div><h2 id="indicadores-proyecto" className="panel-tit">Indicadores del proyecto</h2><p className="chart-description">Calculados con los registros actuales del proyecto</p></div></div><dl className="kpi-grid">
        <div><dt>PTA · Entregas a tiempo</dt><dd>{kpi.pta === null ? "Sin datos suficientes" : `${kpi.pta.toLocaleString("es-PE", {maximumFractionDigits: 1})} %`}</dd><p>{kpi.entregas_sin_historial ? "Falta historial de entrega para una o más tareas." : `${kpi.entregadas_a_tiempo} de ${kpi.elegibles} tareas vencidas o entregadas`}</p></div>
        <div><dt>RAT · Reportes por tarea</dt><dd>{kpi.rat === null ? "Sin datos suficientes" : kpi.rat.toLocaleString("es-PE", {maximumFractionDigits: 2})}</dd><p>{kpi.reportes} reportes · {kpi.tareas} tareas</p></div>
        <div><dt>TDR · Detección de retrasos</dt><dd>{kpi.tdr === null ? "Sin datos suficientes" : `${kpi.tdr.toLocaleString("es-PE", {maximumFractionDigits: 1})} días`}</dd><p>{kpi.alertas} tareas con alerta de retraso registrada</p></div>
      </dl><p className="px-5 pb-5 text-xs leading-5 text-suave">El TDR mide desde el vencimiento hasta la primera alerta registrada para esa fecha; depende de cuándo se revisaron las alertas.</p></section>}
      {accesoIA && <AsistenteIA proyecto={id} documentos={documentosIA} />}
      {accesoIA && <ContrasteIA reportes={reportesIA} documentos={documentosIA} />}
      {accesoIA && consultasIA.length > 0 && <section className="panel mt-6"><div className="panel-cab"><h2 className="panel-tit">Consultas guardadas</h2></div><ul className="divide-y divide-linea">{consultasIA.map(c=><li key={c.id} className="p-5"><p className="text-xs text-suave">{c.fecha} · {c.documento}</p><p className="mt-2 text-sm font-semibold">{c.pregunta}</p><p className="mt-2 whitespace-pre-wrap text-sm">{c.respuesta}</p></li>)}</ul></section>}
      {accesoIA && observacionesIA.length > 0 && <section className="panel mt-6"><div className="panel-cab"><h2 className="panel-tit">Observaciones guardadas</h2></div><ul className="divide-y divide-linea">{observacionesIA.map(o=><li key={o.id} className="p-5"><p className="text-xs text-suave">{o.fecha} · {o.reporte} · {o.documento}</p><p className="mt-2 whitespace-pre-wrap text-sm">{o.diferencia}</p></li>)}</ul></section>}
      <nav className="module-subnav mt-6" aria-label="Secciones del proyecto"><a href="#equipo-proyecto">Equipo · {miembros.length}</a><a href="#tareas-proyecto">Tareas · {tareas.length}</a>{gestiona&&<a href="#asignar-tarea">Asignar tarea</a>}</nav>
      <div className="grid gap-6 xl:grid-cols-3">
        <div id="equipo-proyecto" className="panel h-fit scroll-mt-6">
          <div className="panel-cab"><h2 className="panel-tit">Equipo ({miembros.length})</h2></div>
          <ul className="divide-y divide-linea">{miembros.map(m => (
            <li key={m.id_usuario} className="flex items-center gap-3 px-5 py-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-marca/10 text-xs font-semibold text-marca">{ini(m.nombre)}</div>
              <div className="min-w-0 text-sm leading-tight"><div className="truncate font-medium">{m.nombre}</div><div className="text-xs text-suave">{m.rol_en_proyecto}</div></div>
            </li>))}</ul>
          {gestiona && (
            <div className="border-t border-linea p-5">
              <h3 className="mb-3 text-sm font-semibold">Asignar miembro</h3>
              {candidatos.length === 0 ? <p className="text-xs leading-6 text-suave">No hay colaboradores disponibles para agregar. Todos los colaboradores activos ya pertenecen al proyecto.</p> : <Formulario url={`/api/proyectos/${id}/miembros`} boton="Asignar al proyecto">
                <div><label htmlFor="detalle-id_usuario" className="etiqueta">Colaborador</label><select id="detalle-id_usuario" name="id_usuario" required className="campo" defaultValue=""><option value="" disabled>Elige un colaborador</option>
                  {candidatos.map(c => <option key={c.id_usuario} value={c.id_usuario}>{c.nombre}</option>)}</select></div>
                <div><label htmlFor="detalle-rol_en_proyecto" className="etiqueta">Rol en el proyecto</label><input id="detalle-rol_en_proyecto" name="rol_en_proyecto" placeholder="Ej. Desarrollador" required className="campo" /></div>
              </Formulario>}
            </div>)}
        </div>
        <div id="tareas-proyecto" className="panel min-w-0 overflow-hidden scroll-mt-6 xl:col-span-2">
          <div className="panel-cab"><h2 className="panel-tit">Tareas ({tareas.length})</h2></div>
          <div className="p-5"><ListaTrabajo tareas={tareas.map(t=>({...t,editable:s.rol === "administrador" || t.id_responsable === s.id || (s.rol === "jefe_area" && p.id_jefe === s.id),verReportes:s.rol !== "colaborador" || t.id_responsable === s.id}))} /></div>
          {gestiona && (
            <div className="border-t border-linea p-5">
              <h3 id="asignar-tarea" className="mb-3 scroll-mt-6 text-sm font-semibold">Asignar tarea</h3>
              <Formulario url={`/api/proyectos/${id}/tareas`} boton="Asignar tarea">
                <div><label htmlFor="detalle-titulo" className="etiqueta">Título</label><input id="detalle-titulo" name="titulo" required className="campo" /></div>
                <div><label htmlFor="detalle-descripcion" className="etiqueta">Descripción</label><textarea id="detalle-descripcion" name="descripcion" rows={2} className="campo" /></div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div><label htmlFor="detalle-id_responsable" className="etiqueta">Responsable</label><select id="detalle-id_responsable" name="id_responsable" required className="campo" defaultValue=""><option value="" disabled>Elige</option>
                    {miembros.map(m => <option key={m.id_usuario} value={m.id_usuario}>{m.nombre}</option>)}</select></div>
                  <div><label htmlFor="detalle-rol_asignado" className="etiqueta">Rol asignado</label><input id="detalle-rol_asignado" name="rol_asignado" required className="campo" /></div>
                  <div><label htmlFor="detalle-fecha_entrega" className="etiqueta">Fecha de entrega</label><input id="detalle-fecha_entrega" name="fecha_entrega" type="date" required min={p.fecha_inicio} max={p.fecha_entrega} className="campo" /></div>
                </div>
              </Formulario>
            </div>)}
        </div>
      </div>
    </>
  );
}
