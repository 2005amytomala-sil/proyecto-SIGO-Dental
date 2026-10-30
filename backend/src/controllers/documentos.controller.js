import { pool } from '../config/db.js'
import { validarConsentimiento, validarReceta } from '../validators/documentos.validator.js'

const parsearId = (valor) => {
  const id = Number(valor)
  return Number.isInteger(id) && id > 0 ? id : null
}

async function pacienteExiste(pacienteId) {
  return pacienteId && (await pool.query('SELECT id FROM pacientes WHERE id = $1', [pacienteId])).rows[0]
}

export async function obtenerDocumentos(req, res) {
  const pacienteId = parsearId(req.params.pacienteId)
  if (!await pacienteExiste(pacienteId)) return res.status(404).json({ mensaje: 'Paciente no encontrado' })
  const [recetas, consentimientos] = await Promise.all([
    pool.query(`SELECT id, motivo, indicaciones, medicamentos, profesional, to_char(firmado_en, 'YYYY-MM-DD HH24:MI') AS fecha FROM recetas WHERE paciente_id = $1 ORDER BY created_at DESC, id DESC`, [pacienteId]),
    pool.query(`SELECT id, procedimiento, contenido, firmante, relacion, profesional, to_char(firmado_en, 'YYYY-MM-DD HH24:MI') AS fecha FROM consentimientos WHERE paciente_id = $1 ORDER BY created_at DESC, id DESC`, [pacienteId]),
  ])
  res.json({ recetas: recetas.rows, consentimientos: consentimientos.rows })
}

export async function crearReceta(req, res) {
  const pacienteId = parsearId(req.params.pacienteId)
  if (!await pacienteExiste(pacienteId)) return res.status(404).json({ mensaje: 'Paciente no encontrado' })
  const { errores, receta } = validarReceta(req.body)
  if (Object.keys(errores).length > 0) return res.status(400).json({ mensaje: 'Datos inválidos', errores })
  const { rows } = await pool.query(
    `INSERT INTO recetas (paciente_id, motivo, indicaciones, medicamentos, profesional, firma)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, motivo, indicaciones, medicamentos, profesional, to_char(firmado_en, 'YYYY-MM-DD HH24:MI') AS fecha`,
    [pacienteId, receta.motivo, receta.indicaciones, JSON.stringify(receta.medicamentos), receta.profesional, receta.firma],
  )
  res.status(201).json(rows[0])
}

export async function crearConsentimiento(req, res) {
  const pacienteId = parsearId(req.params.pacienteId)
  if (!await pacienteExiste(pacienteId)) return res.status(404).json({ mensaje: 'Paciente no encontrado' })
  const { errores, consentimiento } = validarConsentimiento(req.body)
  if (Object.keys(errores).length > 0) return res.status(400).json({ mensaje: 'Datos inválidos', errores })
  const { rows } = await pool.query(
    `INSERT INTO consentimientos (paciente_id, procedimiento, contenido, firmante, relacion, firma_paciente, profesional)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, procedimiento, contenido, firmante, relacion, profesional, to_char(firmado_en, 'YYYY-MM-DD HH24:MI') AS fecha`,
    [pacienteId, consentimiento.procedimiento, consentimiento.contenido, consentimiento.firmante, consentimiento.relacion, consentimiento.firmaPaciente, consentimiento.profesional],
  )
  res.status(201).json(rows[0])
}
