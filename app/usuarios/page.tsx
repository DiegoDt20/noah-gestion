import { query } from "@/lib/db";
import Formulario from "@/components/Formulario";
import Cabecera from "@/components/Cabecera";
import FilaUsuario from "./FilaUsuario";

export const dynamic = "force-dynamic";

export default async function Usuarios() {
  const usuarios = await query<any>(`SELECT u.id_usuario, u.nombres, u.apellidos, u.correo, u.activo, u.id_rol, u.id_area FROM usuario u ORDER BY u.id_usuario`);
  const roles = await query<any>("SELECT id_rol, nombre FROM rol ORDER BY id_rol");
  const areas = await query<any>("SELECT id_area, nombre FROM area ORDER BY nombre");
  return (
    <>
      <Cabecera titulo="Usuarios y roles" subtitulo="Registra usuarios y define qué puede hacer cada uno." />
      <div className="panel mb-6 overflow-hidden">
        <div className="overflow-x-auto"><table className="tabla">
          <thead><tr><th className="th">Usuario</th><th className="th">Rol</th><th className="th">Área</th><th className="th">Activo</th><th className="th">Nueva contraseña</th><th className="th"></th></tr></thead>
          <tbody>{usuarios.map(u => <FilaUsuario key={u.id_usuario} u={u} roles={roles} areas={areas} />)}</tbody>
        </table></div>
      </div>
      <div className="panel max-w-2xl">
        <div className="panel-cab"><h2 className="panel-tit">Registrar usuario</h2></div>
        <div className="panel-cuerpo">
          <Formulario url="/api/usuarios" boton="Registrar usuario">
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="etiqueta">Nombres</label><input name="nombres" required className="campo" /></div>
              <div><label className="etiqueta">Apellidos</label><input name="apellidos" required className="campo" /></div>
            </div>
            <div><label className="etiqueta">Correo</label><input name="correo" type="email" required className="campo" /></div>
            <div><label className="etiqueta">Contraseña (mínimo 8 caracteres)</label><input name="clave" type="password" required minLength={8} className="campo" /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="etiqueta">Rol</label><select name="id_rol" required className="campo" defaultValue=""><option value="" disabled>Elige un rol</option>{roles.map(r => <option key={r.id_rol} value={r.id_rol}>{r.nombre}</option>)}</select></div>
              <div><label className="etiqueta">Área</label><select name="id_area" className="campo" defaultValue=""><option value="">Sin área</option>{areas.map(a => <option key={a.id_area} value={a.id_area}>{a.nombre}</option>)}</select></div>
            </div>
          </Formulario>
        </div>
      </div>
    </>
  );
}
