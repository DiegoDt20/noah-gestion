import type { Sesion } from "./auth";
import { query } from "./db";
import type { Momento } from "./reportes";

export interface Recordatorio {
  id_tarea: number;
  id_responsable: number;
  id_proyecto: number;
  titulo: string;
  proyecto: string;
  responsable: string;
  momento: Momento;
  fecha: string;
  hoy: string;
  visto: boolean;
}

// $1: persona que consulta; $2: rol. La fecha se obtiene de PostgreSQL en Lima.
// Se utiliza el mismo intervalo que RF-07, incluso al cambiar el responsable.
const pendientes = `WITH base AS (
  SELECT t.id_tarea,t.id_responsable,t.titulo,p.id_proyecto,p.nombre proyecto,
         u.nombres||' '||u.apellidos responsable,
         (CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date hoy,
         COALESCE(max(r.fecha_reporte) FILTER (WHERE r.momento='cada_3_dias'),t.creado_en::date)+3 proximo,
         COALESCE(bool_or(r.momento='inicio_dia' AND r.fecha_reporte=(CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date),false) inicio,
         COALESCE(bool_or(r.momento='fin_dia' AND r.fecha_reporte=(CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date),false) cierre
    FROM tarea t JOIN proyecto p ON p.id_proyecto=t.id_proyecto
    JOIN usuario u ON u.id_usuario=t.id_responsable JOIN rol ru ON ru.id_rol=u.id_rol
    LEFT JOIN reporte_avance r ON r.id_tarea=t.id_tarea AND r.id_usuario=t.id_responsable
   WHERE t.estado<>'entregada' AND u.activo AND ru.nombre='colaborador'
     AND t.creado_en::date<=(CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date
     AND (($2='colaborador' AND t.id_responsable=$1) OR ($2='jefe_area' AND p.id_jefe=$1) OR $2 IN ('administrador','gerencia'))
     AND EXISTS (SELECT 1 FROM usuario lector JOIN rol rl ON rl.id_rol=lector.id_rol
                  WHERE lector.id_usuario=$1 AND lector.activo AND rl.nombre=$2)
   GROUP BY t.id_tarea,p.id_proyecto,u.id_usuario
), pendientes AS (
  SELECT b.*,v.momento,v.fecha
    FROM base b CROSS JOIN LATERAL (VALUES
      ('inicio_dia',b.hoy,NOT b.inicio),
      ('fin_dia',b.hoy,b.inicio AND NOT b.cierre),
      ('cada_3_dias',b.proximo,b.proximo<=b.hoy)
    ) v(momento,fecha,pendiente) WHERE v.pendiente
)`;

export async function listarRecordatorios(s: Sesion) {
  return query<Recordatorio>(`${pendientes}
    SELECT p.id_tarea,p.id_responsable,p.id_proyecto,p.titulo,p.proyecto,p.responsable,
           p.momento,p.fecha::text,p.hoy::text,(l.id_usuario IS NOT NULL) visto
      FROM pendientes p LEFT JOIN recordatorio_lectura l
        ON l.id_usuario=$1 AND l.id_tarea=p.id_tarea AND l.id_responsable=p.id_responsable
        AND l.momento=p.momento AND l.fecha=p.fecha
     ORDER BY p.fecha,p.id_tarea,p.momento`, [s.id, s.rol]);
}

export async function verRecordatorios(s: Sesion, clave?: { id_tarea: number; id_responsable: number; momento: Momento; fecha: string }) {
  const valores: unknown[] = [s.id, s.rol];
  if (clave) valores.push(clave.id_tarea, clave.id_responsable, clave.momento, clave.fecha);
  return query(`${pendientes}
    INSERT INTO recordatorio_lectura(id_usuario,id_tarea,id_responsable,momento,fecha)
    SELECT $1,p.id_tarea,p.id_responsable,p.momento,p.fecha FROM pendientes p
    ${clave ? "WHERE p.id_tarea=$3 AND p.id_responsable=$4 AND p.momento=$5 AND p.fecha=$6::date" : ""}
    ON CONFLICT (id_usuario,id_tarea,id_responsable,momento,fecha)
    DO UPDATE SET leido_en=recordatorio_lectura.leido_en
    RETURNING id_tarea`, valores);
}
