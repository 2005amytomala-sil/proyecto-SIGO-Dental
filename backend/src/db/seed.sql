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

INSERT INTO odontologos (nombres, apellidos, especialidad, color)
SELECT * FROM (VALUES
  ('Andrea', 'López', 'Ortodoncia', 'teal'),
  ('Miguel', 'Torres', 'Odontología general', 'blue'),
  ('Valeria', 'Castro', 'Endodoncia', 'violet')
) AS v(nombres, apellidos, especialidad, color)
WHERE NOT EXISTS (SELECT 1 FROM odontologos);

INSERT INTO sillones (nombre, consultorio) VALUES
  ('Sillón 1', 'Consultorio A'),
  ('Sillón 2', 'Consultorio A'),
  ('Sillón 3', 'Consultorio B')
ON CONFLICT (nombre) DO NOTHING;

-- Citas de ejemplo para el día en que se ejecuta el seed
INSERT INTO citas (paciente_id, odontologo_id, sillon_id, inicio, fin, motivo, estado)
SELECT p.id, o.id, s.id, CURRENT_DATE + c.hora, CURRENT_DATE + c.hora + c.duracion, c.motivo, c.estado
FROM (VALUES
  ('0912345678', 'López',  'Sillón 1', TIME '09:00', INTERVAL '30 minutes', 'Limpieza dental',  'Confirmado'),
  ('0923456789', 'Torres', 'Sillón 2', TIME '10:00', INTERVAL '45 minutes', 'Consulta general', 'En sala de espera'),
  ('0934567890', 'López',  'Sillón 1', TIME '11:30', INTERVAL '60 minutes', 'Control de ortodoncia', 'Programado')
) AS c(cedula, odontologo, sillon, hora, duracion, motivo, estado)
JOIN pacientes p ON p.cedula = c.cedula
JOIN odontologos o ON o.apellidos = c.odontologo
JOIN sillones s ON s.nombre = c.sillon
WHERE NOT EXISTS (SELECT 1 FROM citas);
