import { query } from "./db";
import type { Sesion } from "./auth";

export interface IndicadoresProyecto { tareas: number; reportes: number; elegibles: number; entregadas_a_tiempo: number; entregas_sin_historial: number; alertas: number; pta: number | null; rat: number | null; tdr: number | null }
/** Los indicadores se calculan por proyecto y solo dentro del alcance autorizado. */
export async function indicadoresProyecto(s: Sesion, proyecto: number): Promise<IndicadoresProyecto | null> {
 if (s.rol !== "gerencia" && s.rol !== "jefe_area") return null;
 const filas = await query<IndicadoresProyecto>(`WITH autorizado AS (
  SELECT p.id_proyecto FROM proyecto p WHERE p.id_proyecto=$3
   AND ($2='gerencia' OR ($2='jefe_area' AND p.id_jefe=$1))
   AND EXISTS(SELECT 1 FROM usuario u JOIN rol r ON r.id_rol=u.id_rol WHERE u.id_usuario=$1 AND u.activo AND r.nombre=$2)
 ), datos AS (
  SELECT t.id_tarea,t.estado,t.fecha_entrega, entrega.fecha_hora::date fecha_entregada,
   (SELECT count(*)::int FROM reporte_avance r WHERE r.id_tarea=t.id_tarea) reportes,
   deteccion.generada_en::date-t.fecha_entrega dias_deteccion
  FROM tarea t JOIN autorizado p ON p.id_proyecto=t.id_proyecto
  LEFT JOIN LATERAL (SELECT h.fecha_hora FROM historial_estado h WHERE h.id_tarea=t.id_tarea AND h.estado_nuevo='entregada' ORDER BY h.fecha_hora DESC,h.id_historial DESC LIMIT 1) entrega ON true
  LEFT JOIN LATERAL (SELECT a.generada_en FROM alerta a WHERE a.id_tarea=t.id_tarea AND a.tipo='tarea_vencida' AND split_part(a.referencia,':',2)=t.fecha_entrega::text AND a.generada_en::date>t.fecha_entrega ORDER BY a.generada_en,a.id_alerta LIMIT 1) deteccion ON true
 ), resumen AS (
  SELECT count(*)::int tareas,COALESCE(sum(reportes),0)::int reportes,
    count(*) FILTER (WHERE fecha_entrega < (CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date OR estado='entregada')::int elegibles,
    count(*) FILTER (WHERE estado='entregada' AND fecha_entregada<=fecha_entrega)::int entregadas_a_tiempo,
    count(*) FILTER (WHERE estado='entregada' AND fecha_entregada IS NULL)::int entregas_sin_historial,
    count(dias_deteccion)::int alertas,avg(dias_deteccion)::float8 tdr
  FROM datos
 ) SELECT tareas,reportes,elegibles,entregadas_a_tiempo,entregas_sin_historial,alertas,
  CASE WHEN elegibles=0 OR entregas_sin_historial>0 THEN NULL ELSE 100.0*entregadas_a_tiempo/elegibles END::float8 pta,
  CASE WHEN tareas=0 THEN NULL ELSE reportes::float8/tareas END rat,tdr FROM resumen WHERE EXISTS(SELECT 1 FROM autorizado)`, [s.id,s.rol,proyecto]);
 return filas[0] ?? null;
}
