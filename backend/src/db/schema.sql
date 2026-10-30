-- RF-01: Ficha única del paciente
CREATE TABLE IF NOT EXISTS pacientes (
  id                            SERIAL PRIMARY KEY,
  cedula                        VARCHAR(20)  NOT NULL UNIQUE,
  nombres                       VARCHAR(100) NOT NULL,
  apellidos                     VARCHAR(100) NOT NULL,
  fecha_nacimiento              DATE         NOT NULL,
  sexo                          VARCHAR(10)  NOT NULL CHECK (sexo IN ('F', 'M', 'Otro')),
  telefono                      VARCHAR(20)  NOT NULL,
  email                         VARCHAR(120),
  direccion                     VARCHAR(255),
  contacto_emergencia_nombre    VARCHAR(150) NOT NULL,
  contacto_emergencia_telefono  VARCHAR(20)  NOT NULL,
  contacto_emergencia_parentesco VARCHAR(50),
  tutor_nombre                  VARCHAR(150),
  tutor_cedula                  VARCHAR(20),
  tutor_telefono                VARCHAR(20),
  tutor_parentesco              VARCHAR(50),
  seguro_nombre                 VARCHAR(100),
  seguro_numero_poliza          VARCHAR(50),
  activo                        BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at                    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- RF-02: Anamnesis (historial médico general), obligatoria por paciente
CREATE TABLE IF NOT EXISTS anamnesis (
  paciente_id               INTEGER PRIMARY KEY REFERENCES pacientes(id) ON DELETE CASCADE,
  enfermedades_sistemicas   TEXT,
  alergias_farmacos         TEXT,
  antecedentes_quirurgicos  TEXT,
  medicamentos_actuales     TEXT,
  coagulopatia              BOOLEAN     NOT NULL DEFAULT FALSE,
  anticoagulado             BOOLEAN     NOT NULL DEFAULT FALSE,
  observaciones             TEXT,
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pacientes_apellidos ON pacientes (apellidos, nombres);

-- Catálogos de agenda
CREATE TABLE IF NOT EXISTS odontologos (
  id            SERIAL PRIMARY KEY,
  nombres       VARCHAR(100) NOT NULL,
  apellidos     VARCHAR(100) NOT NULL,
  especialidad  VARCHAR(100) NOT NULL DEFAULT 'Odontología general',
  color         VARCHAR(20)  NOT NULL DEFAULT 'teal',
  activo        BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS sillones (
  id          SERIAL PRIMARY KEY,
  nombre      VARCHAR(50)  NOT NULL UNIQUE,
  consultorio VARCHAR(100) NOT NULL,
  activo      BOOLEAN      NOT NULL DEFAULT TRUE
);

-- RF-09 / RF-10 / RN-03: Citas por sillón y odontólogo
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS citas (
  id                  SERIAL PRIMARY KEY,
  paciente_id         INTEGER      NOT NULL REFERENCES pacientes(id),
  odontologo_id       INTEGER      NOT NULL REFERENCES odontologos(id),
  sillon_id           INTEGER      NOT NULL REFERENCES sillones(id),
  inicio              TIMESTAMP    NOT NULL,
  fin                 TIMESTAMP    NOT NULL,
  motivo              VARCHAR(255) NOT NULL,
  observaciones       TEXT,
  estado              VARCHAR(30)  NOT NULL DEFAULT 'Programado' CHECK (estado IN (
                        'Programado', 'Confirmado', 'En sala de espera', 'En atención',
                        'Atendido', 'Cancelado', 'No asistió')),
  motivo_cancelacion  TEXT,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT citas_rango_valido CHECK (fin > inicio),
  -- RN-03: un sillón físico no puede tener dos citas que se crucen
  CONSTRAINT citas_sin_cruce_sillon EXCLUDE USING gist (
    sillon_id WITH =, tsrange(inicio, fin) WITH &&
  ) WHERE (estado NOT IN ('Cancelado', 'No asistió')),
  -- Un odontólogo no puede atender dos citas a la vez
  CONSTRAINT citas_sin_cruce_odontologo EXCLUDE USING gist (
    odontologo_id WITH =, tsrange(inicio, fin) WITH &&
  ) WHERE (estado NOT IN ('Cancelado', 'No asistió'))
);

CREATE INDEX IF NOT EXISTS idx_citas_inicio ON citas (inicio);

-- Catálogo de tratamientos (servicios y precios)
CREATE TABLE IF NOT EXISTS tratamientos (
  id            SERIAL PRIMARY KEY,
  codigo        VARCHAR(20)   NOT NULL UNIQUE,
  nombre        VARCHAR(150)  NOT NULL,
  categoria     VARCHAR(40)   NOT NULL,
  descripcion   TEXT,
  precio        NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
  duracion_min  INTEGER       NOT NULL DEFAULT 30 CHECK (duracion_min BETWEEN 15 AND 480),
  grava_iva     BOOLEAN       NOT NULL DEFAULT FALSE,
  activo        BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- RF-12: Facturación básica (comprobante interno con pagos mixtos)
-- Contador transaccional: si la factura falla se revierte y la numeración queda sin saltos
CREATE TABLE IF NOT EXISTS secuenciales (
  nombre  VARCHAR(30) PRIMARY KEY,
  valor   INTEGER     NOT NULL DEFAULT 0
);
INSERT INTO secuenciales (nombre, valor) VALUES ('factura', 0) ON CONFLICT (nombre) DO NOTHING;

CREATE TABLE IF NOT EXISTS facturas (
  id                      SERIAL PRIMARY KEY,
  numero                  VARCHAR(20)   NOT NULL UNIQUE,
  paciente_id             INTEGER       NOT NULL REFERENCES pacientes(id),
  cita_id                 INTEGER       REFERENCES citas(id),
  fecha                   TIMESTAMP     NOT NULL DEFAULT NOW(),
  cliente_nombre          VARCHAR(200)  NOT NULL,
  cliente_identificacion  VARCHAR(20)   NOT NULL,
  cliente_direccion       TEXT,
  cliente_email           VARCHAR(150),
  iva_porcentaje          NUMERIC(5,2)  NOT NULL,
  subtotal_0              NUMERIC(12,2) NOT NULL,
  subtotal_iva            NUMERIC(12,2) NOT NULL,
  descuento               NUMERIC(12,2) NOT NULL,
  iva                     NUMERIC(12,2) NOT NULL,
  total                   NUMERIC(12,2) NOT NULL,
  estado                  VARCHAR(20)   NOT NULL DEFAULT 'Emitida' CHECK (estado IN ('Emitida', 'Anulada')),
  motivo_anulacion        TEXT,
  anulada_en              TIMESTAMP,
  created_at              TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- Una cita solo puede tener una factura vigente
CREATE UNIQUE INDEX IF NOT EXISTS facturas_cita_emitida ON facturas (cita_id)
  WHERE estado = 'Emitida' AND cita_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS factura_detalles (
  id               SERIAL PRIMARY KEY,
  factura_id       INTEGER       NOT NULL REFERENCES facturas(id),
  tratamiento_id   INTEGER       REFERENCES tratamientos(id),
  descripcion      VARCHAR(200)  NOT NULL,
  cantidad         INTEGER       NOT NULL CHECK (cantidad > 0),
  precio_unitario  NUMERIC(10,2) NOT NULL CHECK (precio_unitario >= 0),
  descuento        NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (descuento >= 0),
  grava_iva        BOOLEAN       NOT NULL DEFAULT FALSE,
  subtotal         NUMERIC(12,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS factura_pagos (
  id          SERIAL PRIMARY KEY,
  factura_id  INTEGER       NOT NULL REFERENCES facturas(id),
  metodo      VARCHAR(30)   NOT NULL,
  monto       NUMERIC(12,2) NOT NULL CHECK (monto > 0),
  referencia  VARCHAR(100)
);
