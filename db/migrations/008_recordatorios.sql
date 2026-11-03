-- RF-08: la condición pendiente se calcula con los reportes actuales.
-- Solo se persiste la lectura, por persona y ocurrencia; no se borra información.
CREATE TABLE IF NOT EXISTS recordatorio_lectura (
    id_usuario INTEGER NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    id_tarea INTEGER NOT NULL REFERENCES tarea(id_tarea) ON DELETE CASCADE,
    id_responsable INTEGER NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    momento VARCHAR(12) NOT NULL CHECK (momento IN ('inicio_dia','fin_dia','cada_3_dias')),
    fecha DATE NOT NULL,
    leido_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_usuario,id_tarea,id_responsable,momento,fecha)
);
