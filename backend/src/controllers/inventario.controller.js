import { pool } from '../config/db.js'
import { validarConfiguracion, validarConsumo, validarEntrada, validarInsumo } from '../validators/inventario.validator.js'

const parsearId = (valor) => {
  const id = Number(valor)
  return Number.isInteger(id) && id > 0 ? id : null
}

export async function listarInsumos(req, res) {
  const { rows } = await pool.query(`SELECT i.*, (i.stock_actual <= i.stock_minimo) AS stock_bajo FROM insumos i WHERE i.activo ORDER BY i.nombre`)
  res.json(rows)
}

export async function crearInsumo(req, res) {
  const { errores, insumo } = validarInsumo(req.body)
  if (Object.keys(errores).length > 0) return res.status(400).json({ mensaje: 'Datos inválidos', errores })
  try {
    const { rows } = await pool.query(`INSERT INTO insumos (codigo, nombre, unidad, stock_minimo) VALUES ($1, $2, $3, $4) RETURNING *`, [insumo.codigo, insumo.nombre, insumo.unidad, insumo.stock_minimo])
    res.status(201).json(rows[0])
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ mensaje: 'Ya existe un insumo con ese código' })
    throw error
  }
}

export async function registrarEntrada(req, res) {
  const insumoId = parsearId(req.params.insumoId)
  const { errores, entrada } = validarEntrada(req.body)
  if (!insumoId) errores.insumo_id = 'Insumo inválido'
  if (Object.keys(errores).length > 0) return res.status(400).json({ mensaje: 'Datos inválidos', errores })
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const insumo = (await client.query('SELECT * FROM insumos WHERE id = $1 AND activo FOR UPDATE', [insumoId])).rows[0]
    if (!insumo) {
      await client.query('ROLLBACK')
      return res.status(404).json({ mensaje: 'Insumo no encontrado' })
    }
    const nuevoStock = Number(insumo.stock_actual) + entrada.cantidad
    await client.query('UPDATE insumos SET stock_actual = $1, updated_at = NOW() WHERE id = $2', [nuevoStock, insumoId])
    const { rows } = await client.query(`INSERT INTO movimientos_insumos (insumo_id, tipo, cantidad, stock_anterior, stock_posterior, referencia) VALUES ($1, 'Entrada', $2, $3, $4, $5) RETURNING *`, [insumoId, entrada.cantidad, insumo.stock_actual, nuevoStock, entrada.referencia])
    await client.query('COMMIT')
    res.status(201).json(rows[0])
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally { client.release() }
}

export async function obtenerConfiguracion(req, res) {
  const tratamientoId = parsearId(req.params.tratamientoId)
  const { rows } = tratamientoId ? await pool.query(`SELECT c.insumo_id, c.cantidad, i.nombre, i.unidad FROM consumos_configurados c JOIN insumos i ON i.id = c.insumo_id WHERE c.tratamiento_id = $1 ORDER BY i.nombre`, [tratamientoId]) : { rows: [] }
  res.json(rows)
}

export async function guardarConfiguracion(req, res) {
  const tratamientoId = parsearId(req.params.tratamientoId)
  const { errores, items } = validarConfiguracion(req.body)
  if (!tratamientoId) errores.tratamiento_id = 'Tratamiento inválido'
  if (Object.keys(errores).length > 0) return res.status(400).json({ mensaje: 'Datos inválidos', errores })
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const tratamiento = (await client.query('SELECT id FROM tratamientos WHERE id = $1', [tratamientoId])).rows[0]
    if (!tratamiento) {
      await client.query('ROLLBACK')
      return res.status(404).json({ mensaje: 'Tratamiento no encontrado' })
    }
    await client.query('DELETE FROM consumos_configurados WHERE tratamiento_id = $1', [tratamientoId])
    for (const item of items) await client.query('INSERT INTO consumos_configurados (tratamiento_id, insumo_id, cantidad) VALUES ($1, $2, $3)', [tratamientoId, item.insumo_id, item.cantidad])
    await client.query('COMMIT')
    res.status(201).json(items)
  } catch (error) {
    await client.query('ROLLBACK')
    if (error.code === '23503') return res.status(400).json({ mensaje: 'Uno de los insumos no existe' })
    throw error
  } finally { client.release() }
}

export async function registrarConsumo(req, res) {
  const { errores, consumo } = validarConsumo(req.body)
  if (Object.keys(errores).length > 0) return res.status(400).json({ mensaje: 'Datos inválidos', errores })
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const tratamiento = (await client.query('SELECT id, nombre FROM tratamientos WHERE id = $1 AND activo', [consumo.tratamiento_id])).rows[0]
    if (!tratamiento) {
      await client.query('ROLLBACK')
      return res.status(404).json({ mensaje: 'Tratamiento no encontrado' })
    }
    const configuracion = (await client.query(`SELECT c.insumo_id, c.cantidad, i.nombre, i.unidad, i.stock_actual FROM consumos_configurados c JOIN insumos i ON i.id = c.insumo_id WHERE c.tratamiento_id = $1 FOR UPDATE OF i`, [consumo.tratamiento_id])).rows
    if (configuracion.length === 0) {
      await client.query('ROLLBACK')
      return res.status(400).json({ mensaje: 'El tratamiento no tiene receta estándar de consumo' })
    }
    const faltantes = configuracion.filter((item) => Number(item.stock_actual) < Number(item.cantidad) * consumo.unidades)
    if (faltantes.length > 0) {
      await client.query('ROLLBACK')
      return res.status(409).json({ mensaje: `Stock insuficiente: ${faltantes.map((item) => item.nombre).join(', ')}` })
    }
    for (const item of configuracion) {
      const cantidad = Number(item.cantidad) * consumo.unidades
      const anterior = Number(item.stock_actual)
      const posterior = anterior - cantidad
      await client.query('UPDATE insumos SET stock_actual = $1, updated_at = NOW() WHERE id = $2', [posterior, item.insumo_id])
      await client.query(`INSERT INTO movimientos_insumos (insumo_id, tipo, cantidad, stock_anterior, stock_posterior, referencia) VALUES ($1, 'Consumo', $2, $3, $4, $5)`, [item.insumo_id, cantidad, anterior, posterior, consumo.referencia ?? `Procedimiento: ${tratamiento.nombre}`])
    }
    await client.query('COMMIT')
    res.status(201).json({ mensaje: 'Consumo descargado correctamente', tratamiento: tratamiento.nombre, unidades: consumo.unidades, insumos: configuracion.map((item) => ({ nombre: item.nombre, cantidad: Number(item.cantidad) * consumo.unidades, unidad: item.unidad })) })
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally { client.release() }
}

export async function listarMovimientos(req, res) {
  const { rows } = await pool.query(`SELECT m.id, m.tipo, m.cantidad, m.stock_anterior, m.stock_posterior, m.referencia, i.nombre, i.unidad, to_char(m.created_at, 'YYYY-MM-DD HH24:MI') AS fecha FROM movimientos_insumos m JOIN insumos i ON i.id = m.insumo_id ORDER BY m.created_at DESC, m.id DESC LIMIT 100`)
  res.json(rows)
}
