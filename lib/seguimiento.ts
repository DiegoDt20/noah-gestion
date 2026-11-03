import type { Sesion } from "./auth";
import { query } from "./db";
import { resumenPanel, responsablesPanel, type ProyectoPanel, type TareaSeguimiento } from "./panel";
export interface DatosSeguimiento { hoy: string; actualizadoEn: string; proyectos: ProyectoPanel[]; tareas: TareaSeguimiento[] }
// Una sola sentencia obtiene el catálogo, los conteos y el último reporte bajo la misma instantánea.
export async function datosSeguimiento(s: Sesion, proyecto: number | null = null): Promise<DatosSeguimiento> {
  const [datos] = await query<DatosSeguimiento>(`WITH proyectos_visibles AS (
    SELECT p.id_proyecto,p.nombre,p.fecha_entrega FROM proyecto p
     WHERE (($2='colaborador' AND EXISTS(SELECT 1 FROM proyecto_miembro m WHERE m.id_proyecto=p.id_proyecto AND m.id_usuario=$1))
         OR ($2='jefe_area' AND p.id_jefe=$1) OR $2 IN ('administrador','gerencia'))
       AND ($3::int IS NULL OR p.id_proyecto=$3)
       AND EXISTS(SELECT 1 FROM usuario u JOIN rol r ON r.id_rol=u.id_rol WHERE u.id_usuario=$1 AND u.activo AND r.nombre=$2)
  ), proyectos_panel AS (
    SELECT p.id_proyecto,p.nombre,p.fecha_entrega::text,count(t.id_tarea)::int total,
           count(t.id_tarea) FILTER(WHERE t.estado='entregada')::int entregadas,
           count(t.id_tarea) FILTER(WHERE t.estado='en_curso')::int en_curso
      FROM proyectos_visibles p LEFT JOIN tarea t ON t.id_proyecto=p.id_proyecto GROUP BY p.id_proyecto,p.nombre,p.fecha_entrega
  ), tareas_panel AS (
    SELECT t.id_tarea,t.titulo,t.estado,t.id_proyecto,p.nombre proyecto,t.fecha_entrega::text,
           t.fecha_entrega-(CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date dias,
           t.id_responsable,u.nombres||' '||u.apellidos responsable,
           ultimo.porcentaje_avance avance,ultimo.fecha_reporte::text fecha_ultimo_reporte
      FROM tarea t JOIN proyectos_visibles p ON p.id_proyecto=t.id_proyecto JOIN usuario u ON u.id_usuario=t.id_responsable
      LEFT JOIN LATERAL (SELECT r.porcentaje_avance,r.fecha_reporte FROM reporte_avance r
          WHERE r.id_tarea=t.id_tarea AND r.id_usuario=t.id_responsable ORDER BY r.fecha_hora DESC,r.id_reporte DESC LIMIT 1) ultimo ON true
     WHERE $2<>'colaborador' OR t.id_responsable=$1
  ) SELECT (CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date::text hoy,
       CURRENT_TIMESTAMP::text "actualizadoEn",
       COALESCE((SELECT json_agg(proyectos_panel ORDER BY fecha_entrega,id_proyecto) FROM proyectos_panel),'[]'::json) proyectos,
       COALESCE((SELECT json_agg(tareas_panel ORDER BY (estado='entregada'),fecha_entrega,id_tarea) FROM tareas_panel),'[]'::json) tareas`,[s.id,s.rol,proyecto]);
  return { ...datos, actualizadoEn: new Date(datos.actualizadoEn).toISOString() };
}
export async function consultarSeguimiento(s: Sesion, proyecto: number | null = null) {
  const datos = await datosSeguimiento(s, proyecto);
  return { ...datos, resumen: resumenPanel(datos.proyectos, datos.tareas), responsables: responsablesPanel(datos.tareas) };
}
