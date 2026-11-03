import { query } from "@/lib/db";
import Formulario from "@/components/Formulario";
import Cabecera from "@/components/Cabecera";
import DirectorioUsuarios from "@/components/DirectorioUsuarios";

export const dynamic = "force-dynamic";

export default async function Usuarios() {
  const usuarios = await query<any>(`SELECT u.id_usuario, u.nombres, u.apellidos, u.correo, u.activo, u.id_rol, u.id_area FROM usuario u ORDER BY u.id_usuario`);
  const roles = await query<any>("SELECT id_rol, nombre FROM rol ORDER BY id_rol");
  const areas = await query<any>("SELECT id_area, nombre FROM area ORDER BY nombre");
  return (
    <>
      <Cabecera titulo="Usuarios y roles" subtitulo="Administra accesos, áreas y responsabilidades del equipo."><a href="#registrar-usuario" className="btn">Registrar usuario</a></Cabecera>
      <DirectorioUsuarios usuarios={usuarios} roles={roles} areas={areas} />
      <div id="registrar-usuario" className="panel mt-8 max-w-3xl scroll-mt-6">
        <div className="panel-cab"><h2 className="panel-tit">Registrar usuario</h2></div>
        <div className="panel-cuerpo">
          <Formulario url="/api/usuarios" boton="Registrar usuario">
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label htmlFor="usuario-nombres" className="etiqueta">Nombres</label><input id="usuario-nombres" name="nombres" required className="campo" /></div>
              <div><label htmlFor="usuario-apellidos" className="etiqueta">Apellidos</label><input id="usuario-apellidos" name="apellidos" required className="campo" /></div>
            </div>
            <div><label htmlFor="usuario-correo" className="etiqueta">Correo</label><input id="usuario-correo" name="correo" type="email" required className="campo" /></div>
            <div><label htmlFor="usuario-clave" className="etiqueta">Contraseña (mínimo 8 caracteres)</label><input id="usuario-clave" name="clave" type="password" autoComplete="new-password" required minLength={8} className="campo" /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label htmlFor="usuario-id_rol" className="etiqueta">Rol</label><select id="usuario-id_rol" name="id_rol" required className="campo" defaultValue=""><option value="" disabled>Elige un rol</option>{roles.map(r => <option key={r.id_rol} value={r.id_rol}>{r.nombre}</option>)}</select></div>
              <div><label htmlFor="usuario-id_area" className="etiqueta">Área</label><select id="usuario-id_area" name="id_area" className="campo" defaultValue=""><option value="">Sin área</option>{areas.map(a => <option key={a.id_area} value={a.id_area}>{a.nombre}</option>)}</select></div>
            </div>
          </Formulario>
        </div>
      </div>
    </>
  );
}
