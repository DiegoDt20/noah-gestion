-- RF-07: actualización no destructiva; no ejecutar db:setup sobre datos existentes.
BEGIN;
ALTER TABLE reporte_avance ADD COLUMN IF NOT EXISTS fecha_reporte DATE;
UPDATE reporte_avance SET fecha_reporte=fecha_hora::date WHERE fecha_reporte IS NULL;
ALTER TABLE reporte_avance ALTER COLUMN fecha_reporte SET DEFAULT ((CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date);
ALTER TABLE reporte_avance ALTER COLUMN fecha_reporte SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_reporte_momento_dia
    ON reporte_avance(id_tarea,id_usuario,fecha_reporte,momento);
COMMIT;
