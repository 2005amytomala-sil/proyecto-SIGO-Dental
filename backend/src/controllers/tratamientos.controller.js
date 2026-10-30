import { pool } from '../config/db.js'
import { CATEGORIAS_TRATAMIENTO, validarTratamiento } from '../validators/tratamiento.validator.js'

const COLUMNAS = ['codigo', 'nombre', 'categoria', 'descripcion', 'precio', 'duracion_min', 'grava_iva']

const parsearId = (valor) => {
  const id = Number(valor)
  return Number.isInteger(id) && id > 0 ? id : null
}

export function listarCategorias(req, res) {
  res.json(CATEGORIAS_TRATAMIENTO)
}

export async function listarTratamientos(req, res) {
  const condiciones = []
  const params = []
  const buscar = (req.query.buscar ?? '').trim()

  if (buscar) {
    params.push(`%${buscar}%`)
    condiciones.push(`(codigo ILIKE $${params.length} OR nombre ILIKE $${params.length})`)
  }
  if (req.query.categoria) {
    params.push(req.query.categoria)
    condiciones.push(`categoria = $${params.length}`)
  }
  if (req.query.incluir_inactivos !== 'true') condiciones.push('activo')

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : ''
  const { rows } = await pool.query(`SELECT * FROM tratamientos ${where} ORDER BY categoria, codigo`, params)
  res.json(rows)
}

export async function obtenerTratamiento(req, res) {
  const id = parsearId(req.params.id)
  const { rows } = id ? await pool.query('SELECT * FROM tratamientos WHERE id = $1', [id]) : { rows: [] }
  if (!rows[0]) return res.status(404).json({ mensaje: 'Tratamiento no encontrado' })
  res.json(rows[0])
}

export async function crearTratamiento(req, res) {
  const { errores, tratamiento } = validarTratamiento(req.body)
  if (Object.keys(errores).length > 0) return res.status(400).json({ mensaje: 'Datos inválidos', errores })

  const { rows } = await pool.query(
    `INSERT INTO tratamientos (${COLUMNAS.join(', ')})
     VALUES (${COLUMNAS.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *`,
    COLUMNAS.map((columna) => tratamiento[columna]),
  )
  res.status(201).json(rows[0])
}

export async function actualizarTratamiento(req, res) {
  const id = parsearId(req.params.id)
  if (!id) return res.status(404).json({ mensaje: 'Tratamiento no encontrado' })

  const { errores, tratamiento } = validarTratamiento(req.body)
  if (Object.keys(errores).length > 0) return res.status(400).json({ mensaje: 'Datos inválidos', errores })

  const { rows } = await pool.query(
    `UPDATE tratamientos SET
       ${COLUMNAS.map((columna, i) => `${columna} = $${i + 1}`).join(', ')}, updated_at = NOW()
     WHERE id = $${COLUMNAS.length + 1} RETURNING *`,
    [...COLUMNAS.map((columna) => tratamiento[columna]), id],
  )
  if (!rows[0]) return res.status(404).json({ mensaje: 'Tratamiento no encontrado' })
  res.json(rows[0])
}

// Los tratamientos no se borran para conservar el historial de citas y facturas: solo se desactivan
export async function cambiarActivoTratamiento(req, res) {
  const id = parsearId(req.params.id)
  if (typeof req.body?.activo !== 'boolean') {
    return res.status(400).json({ mensaje: 'Indique si el tratamiento queda activo (true/false)' })
  }
  const { rows } = id
    ? await pool.query(
      'UPDATE tratamientos SET activo = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [req.body.activo, id],
    )
    : { rows: [] }
  if (!rows[0]) return res.status(404).json({ mensaje: 'Tratamiento no encontrado' })
  res.json(rows[0])
}
