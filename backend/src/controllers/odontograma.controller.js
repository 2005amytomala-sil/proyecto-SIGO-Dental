import { pool } from '../config/db.js'
import { HALLAZGOS, validarRegistro } from '../validators/odontograma.validator.js'

const parsearId = (valor) => {
  const id = Number(valor)
  return Number.isInteger(id) && id > 0 ? id : null
}

const SELECT_REGISTROS = `
  SELECT id, paciente_id, diente, superficie, hallazgo, estado, notas, anulado, motivo_anulacion,
         to_char(anulado_en, 'YYYY-MM-DD HH24:MI') AS anulado_en,
         to_char(created_at, 'YYYY-MM-DD HH24:MI') AS fecha
  FROM odontograma_registros
`

export function obtenerCatalogo(req, res) {
  res.json(HALLAZGOS)
}

export async function obtenerOdontograma(req, res) {
  const pacienteId = parsearId(req.params.pacienteId)
  const paciente = pacienteId && (await pool.query('SELECT id FROM pacientes WHERE id = $1', [pacienteId])).rows[0]
  if (!paciente) return res.status(404).json({ mensaje: 'Paciente no encontrado' })
  const { rows } = await pool.query(`${SELECT_REGISTROS} WHERE paciente_id = $1 ORDER BY created_at DESC, id DESC`, [pacienteId])
  res.json(rows)
}

export async function crearRegistro(req, res) {
  const pacienteId = parsearId(req.params.pacienteId)
  if (!pacienteId) return res.status(404).json({ mensaje: 'Paciente no encontrado' })
  const { errores, registro } = validarRegistro(req.body)
  if (Object.keys(errores).length > 0) return res.status(400).json({ mensaje: 'Datos inválidos', errores })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const ids = []
    for (const superficie of registro.superficies) {
      const { rows } = await client.query(
        `INSERT INTO odontograma_registros (paciente_id, diente, superficie, hallazgo, estado, notas)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [pacienteId, registro.diente, superficie, registro.hallazgo, registro.estado, registro.notas],
      )
      ids.push(rows[0].id)
    }
    await client.query('COMMIT')
    const { rows } = await pool.query(`${SELECT_REGISTROS} WHERE id = ANY($1) ORDER BY id`, [ids])
    res.status(201).json(rows)
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function anularRegistro(req, res) {
  const id = parsearId(req.params.id)
  const motivo = String(req.body?.motivo ?? '').trim()
  if (!motivo) return res.status(400).json({ mensaje: 'Indique el motivo de la anulación' })

  const { rows } = id
    ? await pool.query(
      `UPDATE odontograma_registros SET anulado = TRUE, motivo_anulacion = $1, anulado_en = NOW()
       WHERE id = $2 AND anulado = FALSE RETURNING id`,
      [motivo, id],
    )
    : { rows: [] }
  if (!rows[0]) return res.status(409).json({ mensaje: 'El registro no existe o ya está anulado' })
  const actualizado = await pool.query(`${SELECT_REGISTROS} WHERE id = $1`, [id])
  res.json(actualizado.rows[0])
}
