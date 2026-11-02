import type { Sesion } from "@/lib/auth";
import { query } from "@/lib/db";

export const MOMENTOS = ["inicio_dia", "fin_dia", "cada_3_dias"] as const;
export type Momento = (typeof MOMENTOS)[number];
export const MOMENTO_TEXTO: Record<Momento, string> = {
  inicio_dia: "Inicio del día", fin_dia: "Cierre del día", cada_3_dias: "Reporte de cada 3 días",
};
export interface TareaReporte {
  id_tarea: number; id_proyecto: number; id_responsable: number; id_jefe: number;
  titulo: string; proyecto: string; responsable: string; estado: string;
}
export async function tareaParaReportes(s: Sesion, id: number): Promise<TareaReporte | null> {
  const filas = await query<TareaReporte>(
    `SELECT t.id_tarea,t.id_proyecto,t.id_responsable,t.titulo,t.estado,p.id_jefe,p.nombre proyecto,
            u.nombres||' '||u.apellidos responsable
       FROM tarea t JOIN proyecto p ON p.id_proyecto=t.id_proyecto
       JOIN usuario u ON u.id_usuario=t.id_responsable WHERE t.id_tarea=$1`, [id]);
  const t = filas[0];
  if (!t) return null;
  const permitido = s.rol === "administrador" || s.rol === "gerencia" ||
    (s.rol === "jefe_area" && t.id_jefe === s.id) ||
    (s.rol === "colaborador" && t.id_responsable === s.id);
  return permitido ? t : null;
}
export interface ReporteFila {
  id_reporte: number; id_usuario: number; autor: string; momento: Momento;
  contenido: string; porcentaje_avance: number; fecha_reporte: string; hora: string;
}
export async function reportesDeTarea(id: number): Promise<ReporteFila[]> {
  return query<ReporteFila>(
    `SELECT r.id_reporte,r.id_usuario,u.nombres||' '||u.apellidos autor,r.momento,
            r.contenido,r.porcentaje_avance,r.fecha_reporte::text,
            to_char(r.fecha_hora,'HH24:MI') hora
       FROM reporte_avance r JOIN usuario u ON u.id_usuario=r.id_usuario
      WHERE r.id_tarea=$1 ORDER BY r.fecha_hora DESC,r.id_reporte DESC`, [id]);
}
export interface SeguimientoReporte {
  hoy: string; inicio_registrado: boolean; cierre_registrado: boolean;
  proximo_periodico: string; periodico_habilitado: boolean;
}
export async function seguimientoDeTarea(id: number, usuario: number): Promise<SeguimientoReporte> {
  const filas = await query<SeguimientoReporte>(
    `WITH datos AS (
       SELECT (CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date hoy,
              COALESCE(MAX(r.fecha_reporte) FILTER (WHERE r.momento='cada_3_dias'),t.creado_en::date)+3 proximo,
              COALESCE(bool_or(r.momento='inicio_dia' AND r.fecha_reporte=(CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date),false) inicio,
              COALESCE(bool_or(r.momento='fin_dia' AND r.fecha_reporte=(CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date),false) cierre
         FROM tarea t LEFT JOIN reporte_avance r ON r.id_tarea=t.id_tarea AND r.id_usuario=$2
        WHERE t.id_tarea=$1 GROUP BY t.creado_en
     ) SELECT hoy::text,inicio inicio_registrado,cierre cierre_registrado,
              proximo::text proximo_periodico,hoy>=proximo periodico_habilitado FROM datos`, [id, usuario]);
  return filas[0];
}
