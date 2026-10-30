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
