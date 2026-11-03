BEGIN;
ALTER TABLE alerta ADD COLUMN IF NOT EXISTS referencia TEXT;
ALTER TABLE alerta ADD COLUMN IF NOT EXISTS id_responsable_generacion INTEGER REFERENCES usuario(id_usuario);
ALTER TABLE alerta ADD COLUMN IF NOT EXISTS vigente BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE alerta ADD COLUMN IF NOT EXISTS resuelta_en TIMESTAMP;
ALTER TABLE alerta ADD COLUMN IF NOT EXISTS motivo_resolucion VARCHAR(250);
ALTER TABLE alerta DROP CONSTRAINT IF EXISTS alerta_estado_check;
ALTER TABLE alerta ADD CONSTRAINT alerta_estado_check CHECK (estado IN ('abierta','atendida','resuelta'));
-- Los registros anteriores se conservan; no se inventa su responsable histórico.
UPDATE alerta SET vigente=FALSE WHERE referencia IS NULL AND estado='atendida';
CREATE UNIQUE INDEX IF NOT EXISTS idx_alerta_rf11_vigente
    ON alerta(id_tarea,tipo) WHERE vigente AND referencia IS NOT NULL;
COMMIT;
