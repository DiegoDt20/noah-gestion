BEGIN;
CREATE TABLE IF NOT EXISTS login_intento (
    clave CHAR(64) PRIMARY KEY,
    ventana UUID NOT NULL,
    intentos SMALLINT NOT NULL CHECK (intentos BETWEEN 1 AND 5),
    vence_en TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_login_intento_expira ON login_intento(vence_en);
ALTER TABLE login_intento ENABLE ROW LEVEL SECURITY;
COMMIT;
