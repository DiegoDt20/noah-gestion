-- =====================================================================
-- Sistema web de seguimiento de proyectos y tareas con asistente de IA
-- NOAH TECH SOLUTIONS S.A.C.  |  Motor: PostgreSQL 14 o superior
-- =====================================================================

DROP TABLE IF EXISTS consulta_asistente, observacion_ia, fragmento_documento, documento,
                     alerta, reporte_avance, historial_estado, tarea,
                     proyecto_miembro, proyecto, usuario, area, rol CASCADE;

-- ---------- Seguridad y organización ----------
CREATE TABLE rol (
    id_rol        SMALLINT     PRIMARY KEY,
    nombre        VARCHAR(30)  NOT NULL UNIQUE,
    descripcion   VARCHAR(150)
);

CREATE TABLE area (
    id_area       SMALLINT     PRIMARY KEY,
    nombre        VARCHAR(60)  NOT NULL UNIQUE
);

CREATE TABLE usuario (
    id_usuario    SERIAL       PRIMARY KEY,
    id_rol        SMALLINT     NOT NULL REFERENCES rol(id_rol),
    id_area       SMALLINT     REFERENCES area(id_area),
    nombres       VARCHAR(80)  NOT NULL,
    apellidos     VARCHAR(80)  NOT NULL,
    correo        VARCHAR(120) NOT NULL UNIQUE,
    clave_hash    VARCHAR(255) NOT NULL,
    activo        BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en     TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ---------- Proyectos y tareas ----------
CREATE TABLE proyecto (
    id_proyecto    SERIAL       PRIMARY KEY,
    id_area        SMALLINT     NOT NULL REFERENCES area(id_area),
    id_jefe        INTEGER      NOT NULL REFERENCES usuario(id_usuario),
    nombre         VARCHAR(120) NOT NULL,
    descripcion    TEXT,
    fecha_inicio   DATE         NOT NULL,
    fecha_entrega  DATE         NOT NULL,
    estado         VARCHAR(12)  NOT NULL DEFAULT 'pendiente'
                   CHECK (estado IN ('pendiente','en_curso','entregada')),
    CHECK (fecha_entrega >= fecha_inicio)
);

CREATE TABLE proyecto_miembro (
    id_proyecto    INTEGER      NOT NULL REFERENCES proyecto(id_proyecto) ON DELETE CASCADE,
    id_usuario     INTEGER      NOT NULL REFERENCES usuario(id_usuario),
    rol_en_proyecto VARCHAR(60) NOT NULL,
    PRIMARY KEY (id_proyecto, id_usuario)
);

CREATE TABLE tarea (
    id_tarea        SERIAL       PRIMARY KEY,
    id_proyecto     INTEGER      NOT NULL REFERENCES proyecto(id_proyecto) ON DELETE CASCADE,
    id_responsable  INTEGER      NOT NULL REFERENCES usuario(id_usuario),
    titulo          VARCHAR(150) NOT NULL,
    descripcion     TEXT,
    rol_asignado    VARCHAR(60)  NOT NULL,
    fecha_entrega   DATE         NOT NULL,
    estado          VARCHAR(12)  NOT NULL DEFAULT 'pendiente'
                    CHECK (estado IN ('pendiente','en_curso','entregada')),
    creado_en       TIMESTAMP    NOT NULL DEFAULT NOW(),
    actualizado_en  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE historial_estado (
    id_historial     SERIAL      PRIMARY KEY,
    id_tarea         INTEGER     NOT NULL REFERENCES tarea(id_tarea) ON DELETE CASCADE,
    id_usuario       INTEGER     NOT NULL REFERENCES usuario(id_usuario),
    estado_anterior  VARCHAR(12) NOT NULL,
    estado_nuevo     VARCHAR(12) NOT NULL,
    fecha_hora       TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE TABLE reporte_avance (
    id_reporte       SERIAL      PRIMARY KEY,
    id_tarea         INTEGER     NOT NULL REFERENCES tarea(id_tarea) ON DELETE CASCADE,
    id_usuario       INTEGER     NOT NULL REFERENCES usuario(id_usuario),
    momento          VARCHAR(12) NOT NULL
                     CHECK (momento IN ('inicio_dia','fin_dia','cada_3_dias')),
    contenido        TEXT        NOT NULL,
    porcentaje_avance SMALLINT   NOT NULL CHECK (porcentaje_avance BETWEEN 0 AND 100),
    fecha_hora       TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE TABLE alerta (
    id_alerta        SERIAL      PRIMARY KEY,
    id_tarea         INTEGER     NOT NULL REFERENCES tarea(id_tarea) ON DELETE CASCADE,
    id_atendido_por  INTEGER     REFERENCES usuario(id_usuario),
    tipo             VARCHAR(20) NOT NULL
                     CHECK (tipo IN ('tarea_vencida','sin_actualizar','sin_reporte')),
    mensaje          VARCHAR(250) NOT NULL,
    estado           VARCHAR(10) NOT NULL DEFAULT 'abierta'
                     CHECK (estado IN ('abierta','atendida')),
    accion_tomada    VARCHAR(250),
    generada_en      TIMESTAMP   NOT NULL DEFAULT NOW(),
    atendida_en      TIMESTAMP
);

-- ---------- Documentación y asistente de IA ----------
CREATE TABLE documento (
    id_documento     SERIAL      PRIMARY KEY,
    id_proyecto      INTEGER     NOT NULL REFERENCES proyecto(id_proyecto) ON DELETE CASCADE,
    subido_por       INTEGER     NOT NULL REFERENCES usuario(id_usuario),
    nombre           VARCHAR(150) NOT NULL,
    ruta_archivo     VARCHAR(255) NOT NULL,
    fecha_subida     TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE TABLE fragmento_documento (
    id_fragmento     SERIAL      PRIMARY KEY,
    id_documento     INTEGER     NOT NULL REFERENCES documento(id_documento) ON DELETE CASCADE,
    orden            INTEGER     NOT NULL,
    texto            TEXT        NOT NULL,
    UNIQUE (id_documento, orden)
    -- Para búsqueda semántica se puede añadir una columna "embedding vector(384)" con la extensión pgvector.
);

CREATE TABLE observacion_ia (
    id_observacion   SERIAL      PRIMARY KEY,
    id_reporte       INTEGER     NOT NULL REFERENCES reporte_avance(id_reporte) ON DELETE CASCADE,
    id_documento     INTEGER     REFERENCES documento(id_documento) ON DELETE SET NULL,
    diferencia       TEXT        NOT NULL,
    fecha_hora       TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE TABLE consulta_asistente (
    id_consulta      SERIAL      PRIMARY KEY,
    id_usuario       INTEGER     NOT NULL REFERENCES usuario(id_usuario),
    id_proyecto      INTEGER     REFERENCES proyecto(id_proyecto) ON DELETE SET NULL,
    id_documento     INTEGER     REFERENCES documento(id_documento) ON DELETE SET NULL,
    pregunta         TEXT        NOT NULL,
    respuesta        TEXT        NOT NULL,
    fecha_hora       TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- ---------- Índices para las consultas más frecuentes ----------
CREATE INDEX idx_tarea_proyecto      ON tarea(id_proyecto);
CREATE INDEX idx_tarea_responsable   ON tarea(id_responsable, estado);
CREATE INDEX idx_tarea_entrega       ON tarea(fecha_entrega) WHERE estado <> 'entregada';
CREATE INDEX idx_reporte_tarea       ON reporte_avance(id_tarea, fecha_hora);
CREATE INDEX idx_alerta_abiertas     ON alerta(id_tarea) WHERE estado = 'abierta';
CREATE INDEX idx_documento_proyecto  ON documento(id_proyecto);

-- ---------- Datos iniciales ----------
INSERT INTO rol (id_rol, nombre, descripcion) VALUES
 (1,'gerencia','Consulta el avance general de todos los proyectos'),
 (2,'jefe_area','Asigna roles y tareas y atiende las alertas de su área'),
 (3,'colaborador','Actualiza el estado de sus tareas y registra reportes de avance'),
 (4,'administrador','Gestiona usuarios, roles y parámetros del sistema');
