import { sesionActual } from "@/lib/auth";
import { query } from "@/lib/db";
import Formulario from "@/components/Formulario";
import Cabecera from "@/components/Cabecera";
import ColeccionProyectos from "@/components/ColeccionProyectos";

export const dynamic = "force-dynamic";

export default async function Proyectos() {
  const s = (await sesionActual())!;
  const v: unknown[] = []; let f = "";
  if (s.rol === "jefe_area") { v.push(s.id); f = "WHERE p.id_jefe=$1"; }
  if (s.rol === "colaborador") { v.push(s.id); f = "WHERE EXISTS (SELECT 1 FROM proyecto_miembro m WHERE m.id_proyecto=p.id_proyecto AND m.id_usuario=$1)"; }
  const proys = await query<any>(
    `SELECT p.*, p.fecha_entrega-(CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date dias, ar.nombre area, (u.nombres||' '||u.apellidos) jefe,
       (SELECT count(*) FROM tarea t WHERE t.id_proyecto=p.id_proyecto)::int total,
       (SELECT count(*) FROM tarea t WHERE t.id_proyecto=p.id_proyecto AND t.estado='entregada')::int entregadas
       FROM proyecto p JOIN area ar ON ar.id_area=p.id_area JOIN usuario u ON u.id_usuario=p.id_jefe ${f} ORDER BY p.fecha_entrega`, v);
  const puedeCrear = s.rol === "jefe_area" || s.rol === "administrador";
  const jefes = s.rol === "administrador"
    ? await query<any>("SELECT u.id_usuario, u.nombres||' '||u.apellidos nombre FROM usuario u JOIN rol r ON r.id_rol=u.id_rol WHERE r.nombre='jefe_area' AND u.activo AND u.id_area IS NOT NULL") : [];
  return (
    <>
      <Cabecera titulo="Proyectos" subtitulo={s.rol === "colaborador" ? "Proyectos en los que participas." : "Registra proyectos y sigue su avance."}>{puedeCrear && <a href="#registrar-proyecto" className="btn">Registrar proyecto</a>}</Cabecera>
      <ColeccionProyectos proyectos={proys} />
      {puedeCrear && (
        <div id="registrar-proyecto" className="panel mt-8 max-w-3xl scroll-mt-6">
          <div className="panel-cab"><h2 className="panel-tit">Registrar proyecto</h2></div>
          <div className="panel-cuerpo">
            <Formulario url="/api/proyectos" boton="Registrar proyecto">
              <div><label htmlFor="proyecto-nombre" className="etiqueta">Nombre del proyecto</label><input id="proyecto-nombre" name="nombre" required className="campo" /></div>
              <div><label htmlFor="proyecto-descripcion" className="etiqueta">Descripción</label><textarea id="proyecto-descripcion" name="descripcion" className="campo" rows={3} /></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label htmlFor="proyecto-fecha_inicio" className="etiqueta">Fecha de inicio</label><input id="proyecto-fecha_inicio" name="fecha_inicio" type="date" required className="campo" /></div>
                <div><label htmlFor="proyecto-fecha_entrega" className="etiqueta">Fecha de entrega</label><input id="proyecto-fecha_entrega" name="fecha_entrega" type="date" required className="campo" /></div>
              </div>
              {s.rol === "administrador" && (
                <div><label htmlFor="proyecto-jefe" className="etiqueta">Jefe de área responsable</label>
                  <select id="proyecto-jefe" name="id_jefe" required className="campo" defaultValue=""><option value="" disabled>Elige un jefe</option>
                    {jefes.map(j => <option key={j.id_usuario} value={j.id_usuario}>{j.nombre}</option>)}</select></div>)}
            </Formulario>
          </div>
        </div>)}
    </>
  );
}
