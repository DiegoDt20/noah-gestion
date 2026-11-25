import { query } from "./db";
import type { Sesion } from "./auth";
export interface ActividadDia { dia: string; id_proyecto: number; n: number }
/** Reportes por día de los últimos 30 días, con el mismo alcance que el panel de inicio. */
export function actividadReportes(s: Sesion) {
  return query<ActividadDia>(`SELECT r.fecha_reporte::text dia,t.id_proyecto,count(*)::int n
    FROM reporte_avance r JOIN tarea t ON t.id_tarea=r.id_tarea JOIN proyecto p ON p.id_proyecto=t.id_proyecto
   WHERE r.fecha_reporte>(CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date-30
     AND (($2='colaborador' AND t.id_responsable=$1 AND EXISTS(SELECT 1 FROM proyecto_miembro m WHERE m.id_proyecto=p.id_proyecto AND m.id_usuario=$1))
       OR ($2='jefe_area' AND p.id_jefe=$1) OR $2 IN ('administrador','gerencia'))
     AND EXISTS(SELECT 1 FROM usuario u JOIN rol ro ON ro.id_rol=u.id_rol WHERE u.id_usuario=$1 AND u.activo AND ro.nombre=$2)
   GROUP BY r.fecha_reporte,t.id_proyecto`, [s.id, s.rol]);
}