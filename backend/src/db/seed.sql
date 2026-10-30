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

INSERT INTO tratamientos (codigo, nombre, categoria, descripcion, precio, duracion_min) VALUES
  ('DIA-001', 'Consulta y diagnóstico', 'Diagnóstico', 'Examen clínico, odontograma y plan de tratamiento', 20.00, 30),
  ('DIA-002', 'Radiografía periapical', 'Diagnóstico', NULL, 10.00, 15),
  ('DIA-003', 'Radiografía panorámica', 'Diagnóstico', NULL, 35.00, 15),
  ('PRE-001', 'Profilaxis (limpieza dental)', 'Prevención', 'Limpieza con ultrasonido y pulido', 30.00, 45),
  ('PRE-002', 'Aplicación de flúor', 'Prevención', NULL, 15.00, 15),
  ('PRE-003', 'Sellante de fosas y fisuras', 'Prevención', 'Precio por pieza', 20.00, 15),
  ('OPE-001', 'Restauración con resina (1 superficie)', 'Operatoria', NULL, 35.00, 45),
  ('OPE-002', 'Restauración con resina (2 o más superficies)', 'Operatoria', NULL, 50.00, 60),
  ('END-001', 'Endodoncia unirradicular', 'Endodoncia', NULL, 150.00, 90),
  ('END-002', 'Endodoncia multirradicular', 'Endodoncia', NULL, 250.00, 120),
  ('PER-001', 'Raspado y alisado radicular (por cuadrante)', 'Periodoncia', NULL, 60.00, 60),
  ('CIR-001', 'Exodoncia simple', 'Cirugía', NULL, 40.00, 30),
  ('CIR-002', 'Exodoncia de tercer molar', 'Cirugía', NULL, 120.00, 60),
  ('ORT-001', 'Control de ortodoncia', 'Ortodoncia', 'Ajuste mensual', 40.00, 30),
  ('PRO-001', 'Corona de porcelana', 'Prótesis', 'Incluye costo de laboratorio', 300.00, 60),
  ('IMP-001', 'Implante dental', 'Implantología', 'No incluye corona', 900.00, 120),
  ('EST-001', 'Blanqueamiento dental', 'Estética', 'Sesión en consultorio', 180.00, 90)
ON CONFLICT (codigo) DO NOTHING;

-- Odontograma de ejemplo (solo si la paciente aún no tiene registros)
INSERT INTO odontograma_registros (paciente_id, diente, superficie, hallazgo, estado, notas)
SELECT p.id, v.diente, v.superficie, v.hallazgo, v.estado, v.notas
FROM pacientes p
CROSS JOIN (VALUES
  (16, 'O'::char, 'caries', 'Requerido', 'Caries oclusal profunda'),
  (26, 'O'::char, 'restauracion', 'Existente', NULL),
  (26, 'M'::char, 'restauracion', 'Existente', NULL),
  (36, NULL::char, 'endodoncia', 'Requerido', 'Dolor a la percusión'),
  (48, NULL::char, 'ausente', 'Existente', NULL),
  (11, NULL::char, 'corona', 'Existente', 'Corona de porcelana')
) AS v(diente, superficie, hallazgo, estado, notas)
WHERE p.cedula = '0912345678'
  AND NOT EXISTS (SELECT 1 FROM odontograma_registros o WHERE o.paciente_id = p.id);
