INSERT INTO pacientes (cedula, nombres, apellidos, fecha_nacimiento, sexo, telefono, email, direccion,
  contacto_emergencia_nombre, contacto_emergencia_telefono, contacto_emergencia_parentesco,
  tutor_nombre, tutor_cedula, tutor_telefono, tutor_parentesco, seguro_nombre, seguro_numero_poliza)
VALUES
  ('0912345678', 'María', 'González', '1990-04-12', 'F', '0991234567', 'maria.gonzalez@correo.com', 'Av. 9 de Octubre 123',
   'Pedro González', '0987654321', 'Esposo', NULL, NULL, NULL, NULL, 'Salud S.A.', 'POL-1001'),
  ('0923456789', 'Carlos', 'Rodríguez', '1985-09-30', 'M', '0992345678', 'carlos.rodriguez@correo.com', 'Cdla. Kennedy Mz 5',
   'Ana Rodríguez', '0976543210', 'Hermana', NULL, NULL, NULL, NULL, NULL, NULL),
  ('0934567890', 'Sofía', 'Martínez', '2014-02-18', 'F', '0993456789', NULL, 'Urdesa Central',
   'Laura Martínez', '0965432109', 'Madre', 'Laura Martínez', '0911111111', '0965432109', 'Madre', 'Ecuasanitas', 'POL-2044')
ON CONFLICT (cedula) DO NOTHING;

INSERT INTO anamnesis (paciente_id, enfermedades_sistemicas, alergias_farmacos, antecedentes_quirurgicos,
  medicamentos_actuales, coagulopatia, anticoagulado, observaciones)
SELECT id, datos.enfermedades, datos.alergias, datos.cirugias, datos.medicamentos, datos.coagulopatia, datos.anticoagulado, NULL
FROM pacientes
JOIN (VALUES
  ('0912345678', 'Hipertensión', 'Penicilina', NULL, 'Losartán 50 mg', FALSE, FALSE),
  ('0923456789', 'Fibrilación auricular', NULL, 'Apendicectomía (2010)', 'Warfarina', FALSE, TRUE),
  ('0934567890', NULL, NULL, NULL, NULL, FALSE, FALSE)
) AS datos(cedula, enfermedades, alergias, cirugias, medicamentos, coagulopatia, anticoagulado)
  ON datos.cedula = pacientes.cedula
ON CONFLICT (paciente_id) DO NOTHING;
