import { pool } from '../config/db.js'
import { PUNTOS, validarRegistro } from '../validators/periodontograma.validator.js'

const parsearId = (valor) => {
  const id = Number(valor)
  return Number.isInteger(id) && id > 0 ? id : null
}

const SELECT_REGISTROS = `
  SELECT id, paciente_id, diente, puntos, furca, movilidad, sangrado_general, notas,
         to_char(created_at, 'YYYY-MM-DD HH24:MI') AS fecha
  FROM periodontograma_registros
`

export async function obtenerPeriodontograma(req, res) {
  const pacienteId = parsearId(req.params.pacienteId)
  const paciente = pacienteId && (await pool.query('SELECT id FROM pacientes WHERE id = $1', [pacienteId])).rows[0]
  if (!paciente) return res.status(404).json({ mensaje: 'Paciente no encontrado' })
  const { rows } = await pool.query(`${SELECT_REGISTROS} WHERE paciente_id = $1 ORDER BY created_at DESC, id DESC`, [pacienteId])
  res.json(rows)
}

export async function crearRegistroPeriodontograma(req, res) {
  const pacienteId = parsearId(req.params.pacienteId)
  if (!pacienteId) return res.status(404).json({ mensaje: 'Paciente no encontrado' })
  const { errores, registro } = validarRegistro(req.body)
  if (Object.keys(errores).length > 0) return res.status(400).json({ mensaje: 'Datos inválidos', errores })

  const sangradoGeneral = PUNTOS.some((punto) => registro.puntos[punto].sangrado)
  const puntosJson = JSON.stringify(registro.puntos)
  const repetido = await pool.query(
    `WITH ultimo AS (
       SELECT *
       FROM periodontograma_registros
       WHERE paciente_id = $1 AND diente = $2
       ORDER BY created_at DESC, id DESC
       LIMIT 1
     )
     SELECT id
     FROM ultimo
     WHERE puntos = $3::jsonb
       AND furca = $4
       AND movilidad = $5
       AND sangrado_general = $6
       AND COALESCE(notas, '') = COALESCE($7, '')`,
    [pacienteId, registro.diente, puntosJson, registro.furca, registro.movilidad, sangradoGeneral, registro.notas],
  )
  if (repetido.rows[0]) {
    const existente = await pool.query(`${SELECT_REGISTROS} WHERE id = $1`, [repetido.rows[0].id])
    return res.status(200).json(existente.rows[0])
  }

  const { rows } = await pool.query(
    `INSERT INTO periodontograma_registros
       (paciente_id, diente, puntos, furca, movilidad, sangrado_general, notas)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [pacienteId, registro.diente, puntosJson, registro.furca, registro.movilidad, sangradoGeneral, registro.notas],
  )
  const creado = await pool.query(`${SELECT_REGISTROS} WHERE id = $1`, [rows[0].id])
  res.status(201).json(creado.rows[0])
}
