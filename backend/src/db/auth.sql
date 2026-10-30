CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(180) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    rol VARCHAR(30) NOT NULL DEFAULT 'odontologo'
        CHECK (rol IN ('administrador', 'odontologo', 'recepcionista', 'asistente')),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);