import { query } from "./db";
import type { Sesion } from "./auth";
import { MOMENTOS, type ReporteFila, type Momento } from "./reportes";
export interface FiltrosReportes { proyecto?: number; autor?: number; tipo?: Momento; desde?: string; hasta?: string; q?: string; orden: "recientes" | "antiguos"; pagina: number }
export interface ReporteConsulta extends ReporteFila { id_tarea: number; titulo: string; id_proyecto: number; proyecto: string }
export interface ResultadoReportes { reportes: ReporteConsulta[]; total: number; tareas: number; autores: number; pagina: number; paginas: number }
export interface OpcionesReportes { proyectos: { id: number; nombre: string }[]; autores: { id: number; nombre: string }[] }
export const TAMANO_PAGINA = 20;
const claves = ["proyecto", "autor", "tipo", "desde", "hasta", "q", "orden", "pagina"];
function fechaValida(v: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || v.startsWith("0000")) return false;
  const fecha = new Date(v + "T00:00:00Z");
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === v;
}
export function filtrosReportes(params: URLSearchParams): FiltrosReportes {
  for (const clave of params.keys()) {
    if (!claves.includes(clave) || params.getAll(clave).length > 1) throw new Error("Los filtros de consulta no son válidos");
  }
  const f: FiltrosReportes = { orden: "recientes", pagina: 1 };
  for (const campo of ["proyecto", "autor", "pagina"] as const) {
    const valor = params.get(campo);
    if (!valor) continue;
    if (!/^\d+$/.test(valor) || !Number.isSafeInteger(Number(valor)) || Number(valor) < 1 || (campo === "pagina" && Number(valor) > 1000000) || (campo !== "pagina" && Number(valor) > 2147483647)) throw new Error(`El filtro ${campo} no es válido`);
    f[campo] = Number(valor);
  }
  const tipo = params.get("tipo");
  if (tipo) { if (!MOMENTOS.includes(tipo as Momento)) throw new Error("El tipo de reporte no es válido"); f.tipo = tipo as Momento; }
  for (const campo of ["desde", "hasta"] as const) {
    const valor = params.get(campo); if (!valor) continue;
    if (!fechaValida(valor)) throw new Error("Indica fechas válidas para la consulta"); f[campo] = valor;
  }
  if (f.desde && f.hasta && f.desde > f.hasta) throw new Error("La fecha final no puede ser anterior a la inicial");
  const texto = params.get("q")?.trim();
  if (texto && texto.length > 150) throw new Error("La búsqueda admite hasta 150 caracteres");
  if (texto) f.q = texto;
  const orden = params.get("orden");
  if (orden) { if (orden !== "recientes" && orden !== "antiguos") throw new Error("El orden no es válido"); f.orden = orden; }
  return f;
}
// Mismo alcance de consulta que RF-07: el colaborador consulta el historial de sus tareas actuales.
const alcance = `(($2='colaborador' AND t.id_responsable=$1) OR ($2='jefe_area' AND p.id_jefe=$1) OR $2 IN ('administrador','gerencia'))
 AND EXISTS (SELECT 1 FROM usuario lector JOIN rol rl ON rl.id_rol=lector.id_rol WHERE lector.id_usuario=$1 AND lector.activo AND rl.nombre=$2)`;
const uniones = `FROM reporte_avance r JOIN tarea t ON t.id_tarea=r.id_tarea JOIN proyecto p ON p.id_proyecto=t.id_proyecto JOIN usuario u ON u.id_usuario=r.id_usuario`;
export async function consultarReportes(s: Sesion, filtros: FiltrosReportes): Promise<ResultadoReportes> {
  const valores: unknown[] = [s.id, s.rol]; const condiciones = [alcance];
  const agregar = (sql: string, valor: unknown) => { valores.push(valor); condiciones.push(sql.replace("?", `$${valores.length}`)); };
  if (filtros.proyecto) agregar("p.id_proyecto=?", filtros.proyecto);
  if (filtros.autor) agregar("r.id_usuario=?", filtros.autor);
  if (filtros.tipo) agregar("r.momento=?", filtros.tipo);
  if (filtros.desde) agregar("r.fecha_reporte>=?::date", filtros.desde);
  if (filtros.hasta) agregar("r.fecha_reporte<=?::date", filtros.hasta);
  if (filtros.q) {
    valores.push(`%${filtros.q.replace(/[\\%_]/g, "\\$&")}%`);
    const param = `$${valores.length}`;
    condiciones.push(`(r.contenido ILIKE ${param} OR t.titulo ILIKE ${param} OR p.nombre ILIKE ${param} OR (u.nombres||' '||u.apellidos) ILIKE ${param})`);
  }
  valores.push((filtros.pagina - 1) * TAMANO_PAGINA);
  const orden = filtros.orden === "antiguos" ? "ASC" : "DESC";
  const [resultado] = await query<{total:number;tareas:number;autores:number;reportes:ReporteConsulta[]}>(`WITH filtrados AS (
    SELECT r.id_reporte,r.id_usuario,u.nombres||' '||u.apellidos autor,r.momento,r.contenido,r.porcentaje_avance,
           r.fecha_reporte::text fecha_reporte,to_char(r.fecha_hora,'HH24:MI') hora,r.fecha_hora,
           t.id_tarea,t.titulo,p.id_proyecto,p.nombre proyecto ${uniones} WHERE ${condiciones.join(" AND ")}
  ), pagina AS (SELECT * FROM filtrados ORDER BY fecha_hora ${orden},id_reporte ${orden} LIMIT ${TAMANO_PAGINA} OFFSET $${valores.length})
  SELECT (SELECT count(*)::int FROM filtrados) total,(SELECT count(DISTINCT id_tarea)::int FROM filtrados) tareas,
         (SELECT count(DISTINCT id_usuario)::int FROM filtrados) autores,
         COALESCE((SELECT json_agg(to_jsonb(pagina)-'fecha_hora' ORDER BY fecha_hora ${orden},id_reporte ${orden}) FROM pagina),'[]'::json) reportes`, valores);
  return { ...resultado, pagina: filtros.pagina, paginas: Math.ceil(resultado.total / TAMANO_PAGINA) };
}
export async function opcionesReportes(s: Sesion): Promise<OpcionesReportes> {
  const [proyectos, autores] = await Promise.all([
    query<{id:number;nombre:string}>(`SELECT DISTINCT p.id_proyecto id,p.nombre FROM proyecto p LEFT JOIN tarea t ON t.id_proyecto=p.id_proyecto WHERE ${alcance} ORDER BY p.nombre,p.id_proyecto`,[s.id,s.rol]),
    query<{id:number;nombre:string}>(`SELECT DISTINCT u.id_usuario id,u.nombres||' '||u.apellidos nombre ${uniones} WHERE ${alcance} ORDER BY nombre,u.id_usuario`,[s.id,s.rol]),
  ]);
  return { proyectos, autores };
}
export function urlReportes(f: FiltrosReportes, pagina = 1) {
  const params = new URLSearchParams();
  for (const campo of ["proyecto","autor","tipo","desde","hasta","q"] as const) if (f[campo]) params.set(campo, String(f[campo]));
  if (f.orden !== "recientes") params.set("orden", f.orden);
  if (pagina > 1) params.set("pagina", String(pagina));
  return "/reportes" + (params.size ? `?${params}` : "");
}
