import { pool } from '../config/db.js'
import { validarComision } from '../validators/comisiones.validator.js'

const parsearId = (valor) => {
  const id = Number(valor)
  return Number.isInteger(id) && id > 0 ? id : null
}

export async function listarConfiguracion(req, res) {
  const { rows } = await pool.query(`SELECT c.*, o.nombres || ' ' || o.apellidos AS odontologo_nombre, t.codigo AS tratamiento_codigo, t.nombre AS tratamiento_nombre FROM comisiones_configuradas c JOIN odontologos o ON o.id = c.odontologo_id LEFT JOIN tratamientos t ON t.id = c.tratamiento_id WHERE c.activo ORDER BY odontologo_nombre, tratamiento_nombre NULLS FIRST`)
  res.json(rows)
}

export async function guardarConfiguracion(req, res) {
  const { errores, comision } = validarComision(req.body)
  if (Object.keys(errores).length > 0) return res.status(400).json({ mensaje: 'Datos inválidos', errores })
  try {
    const { rows } = await pool.query(`INSERT INTO comisiones_configuradas (odontologo_id, tratamiento_id, tipo, valor, deducir_costos, costo_deducible) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (odontologo_id, tratamiento_id) DO UPDATE SET tipo = EXCLUDED.tipo, valor = EXCLUDED.valor, deducir_costos = EXCLUDED.deducir_costos, costo_deducible = EXCLUDED.costo_deducible, activo = TRUE RETURNING *`, [comision.odontologo_id, comision.tratamiento_id, comision.tipo, comision.valor, comision.deducir_costos, comision.costo_deducible])
    res.status(201).json(rows[0])
  } catch (error) {
    if (error.code === '23503') return res.status(400).json({ mensaje: 'El odontólogo o tratamiento no existe' })
    throw error
  }
}

export async function calcularLiquidacion(req, res) {
  const facturaId = parsearId(req.params.facturaId)
  if (!facturaId) return res.status(404).json({ mensaje: 'Factura inválida' })
  const factura = (await pool.query(`SELECT f.id, f.estado, c.odontologo_id FROM facturas f LEFT JOIN citas c ON c.id = f.cita_id WHERE f.id = $1`, [facturaId])).rows[0]
  if (!factura) return res.status(404).json({ mensaje: 'Factura no encontrada' })
  if (factura.estado !== 'Emitida') return res.status(409).json({ mensaje: 'No se liquida una factura anulada' })
  if (!factura.odontologo_id) return res.status(400).json({ mensaje: 'La factura no está asociada a un odontólogo' })
  const detalles = (await pool.query('SELECT * FROM factura_detalles WHERE factura_id = $1 ORDER BY id', [facturaId])).rows
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const liquidadas = []
    for (const detalle of detalles.filter((item) => item.tratamiento_id)) {
      const regla = (await client.query(`SELECT * FROM comisiones_configuradas WHERE odontologo_id = $1 AND activo AND (tratamiento_id = $2 OR tratamiento_id IS NULL) ORDER BY tratamiento_id NULLS LAST LIMIT 1`, [factura.odontologo_id, detalle.tratamiento_id])).rows[0]
      if (!regla) continue
      const costo = regla.deducir_costos ? Number(regla.costo_deducible) * Number(detalle.cantidad) : 0
      const base = Math.max(0, Number(detalle.subtotal) - costo)
      const monto = regla.tipo === 'Porcentaje' ? base * Number(regla.valor) / 100 : Number(regla.valor) * Number(detalle.cantidad)
      const { rows } = await client.query(`INSERT INTO liquidaciones_honorarios (factura_id, factura_detalle_id, odontologo_id, tipo, valor, base_calculo, costo_deducible, monto) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (factura_detalle_id) DO UPDATE SET tipo = EXCLUDED.tipo, valor = EXCLUDED.valor, base_calculo = EXCLUDED.base_calculo, costo_deducible = EXCLUDED.costo_deducible, monto = EXCLUDED.monto RETURNING *`, [facturaId, detalle.id, factura.odontologo_id, regla.tipo, regla.valor, base, costo, Math.round(monto * 100) / 100])
      liquidadas.push(rows[0])
    }
    await client.query('COMMIT')
    res.json({ factura_id: facturaId, liquidaciones: liquidadas, total_honorarios: liquidadas.reduce((total, item) => total + Number(item.monto), 0) })
  } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
}

export async function listarLiquidaciones(req, res) {
  const condiciones = []
  const params = []
  if (parsearId(req.query.odontologo_id)) { params.push(parsearId(req.query.odontologo_id)); condiciones.push(`l.odontologo_id = $${params.length}`) }
  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : ''
  const { rows } = await pool.query(`SELECT l.*, f.numero AS factura_numero, o.nombres || ' ' || o.apellidos AS odontologo_nombre, p.nombres || ' ' || p.apellidos AS paciente_nombre, to_char(l.created_at, 'YYYY-MM-DD HH24:MI') AS fecha FROM liquidaciones_honorarios l JOIN facturas f ON f.id = l.factura_id JOIN odontologos o ON o.id = l.odontologo_id JOIN pacientes p ON p.id = f.paciente_id ${where} ORDER BY l.created_at DESC`, params)
  res.json(rows)
}
