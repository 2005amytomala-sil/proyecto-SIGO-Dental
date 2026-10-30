import { pool } from '../config/db.js'
import { IVA_PORCENTAJE, METODOS_PAGO, validarFactura } from '../validators/factura.validator.js'

const FECHA_REGEX = /^\d{4}-\d{2}-\d{2}$/

const SELECT_FACTURA = `
  SELECT f.*, to_char(f.fecha, 'YYYY-MM-DD HH24:MI') AS fecha,
         to_char(f.anulada_en, 'YYYY-MM-DD HH24:MI') AS anulada_en,
         p.nombres || ' ' || p.apellidos AS paciente_nombre, p.cedula AS paciente_cedula
  FROM facturas f
  JOIN pacientes p ON p.id = f.paciente_id
`

const parsearId = (valor) => {
  const id = Number(valor)
  return Number.isInteger(id) && id > 0 ? id : null
}

async function buscarPorId(id) {
  const { rows } = await pool.query(`${SELECT_FACTURA} WHERE f.id = $1`, [id])
  if (!rows[0]) return null
  const [detalles, pagos] = await Promise.all([
    pool.query('SELECT * FROM factura_detalles WHERE factura_id = $1 ORDER BY id', [id]),
    pool.query('SELECT * FROM factura_pagos WHERE factura_id = $1 ORDER BY id', [id]),
  ])
  return { ...rows[0], detalles: detalles.rows, pagos: pagos.rows }
}

export function obtenerConfiguracion(req, res) {
  res.json({ iva_porcentaje: IVA_PORCENTAJE, metodos_pago: METODOS_PAGO })
}

export async function listarFacturas(req, res) {
  const { desde, hasta, estado } = req.query
  const buscar = (req.query.buscar ?? '').trim()
  const limite = Math.min(Math.max(Number(req.query.limite) || 10, 1), 100)
  const pagina = Math.max(Number(req.query.pagina) || 1, 1)

  const condiciones = []
  const params = []
  if (desde && FECHA_REGEX.test(desde)) {
    params.push(desde)
    condiciones.push(`f.fecha >= $${params.length}::date`)
  }
  if (hasta && FECHA_REGEX.test(hasta)) {
    params.push(hasta)
    condiciones.push(`f.fecha < $${params.length}::date + 1`)
  }
  if (buscar) {
    params.push(`%${buscar}%`)
    const n = params.length
    condiciones.push(`(f.numero ILIKE $${n} OR f.cliente_nombre ILIKE $${n} OR f.cliente_identificacion ILIKE $${n}
      OR (p.nombres || ' ' || p.apellidos) ILIKE $${n})`)
  }
  const condicionesResumen = [...condiciones, "f.estado = 'Emitida'"]
  if (estado) {
    params.push(estado)
    condiciones.push(`f.estado = $${params.length}`)
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : ''
  const whereResumen = `WHERE ${condicionesResumen.join(' AND ')}`
  const paramsResumen = estado ? params.slice(0, -1) : params
  const desdeFacturas = 'FROM facturas f JOIN pacientes p ON p.id = f.paciente_id'

  const [{ rows }, conteo, resumen, porMetodo] = await Promise.all([
    pool.query(
      `${SELECT_FACTURA} ${where} ORDER BY f.fecha DESC, f.id DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limite, (pagina - 1) * limite],
    ),
    pool.query(`SELECT COUNT(*)::int AS total ${desdeFacturas} ${where}`, params),
    pool.query(
      `SELECT COUNT(*)::int AS cantidad, COALESCE(SUM(f.total), 0) AS total ${desdeFacturas} ${whereResumen}`,
      paramsResumen,
    ),
    pool.query(
      `SELECT fp.metodo, SUM(fp.monto) AS monto
       FROM factura_pagos fp JOIN facturas f ON f.id = fp.factura_id JOIN pacientes p ON p.id = f.paciente_id
       ${whereResumen} GROUP BY fp.metodo ORDER BY monto DESC`,
      paramsResumen,
    ),
  ])

  res.json({
    datos: rows,
    total: conteo.rows[0].total,
    pagina,
    limite,
    resumen: { ...resumen.rows[0], por_metodo: porMetodo.rows },
  })
}

export async function obtenerFactura(req, res) {
  const id = parsearId(req.params.id)
  const factura = id && (await buscarPorId(id))
  if (!factura) return res.status(404).json({ mensaje: 'Factura no encontrada' })
  res.json(factura)
}

export async function crearFactura(req, res) {
  const { errores, factura, totales, pagos } = validarFactura(req.body)
  if (Object.keys(errores).length > 0) return res.status(400).json({ mensaje: 'Datos inválidos', errores })

  if (factura.cita_id) {
    const { rows } = await pool.query('SELECT paciente_id, estado FROM citas WHERE id = $1', [factura.cita_id])
    if (!rows[0] || rows[0].paciente_id !== factura.paciente_id) {
      return res.status(400).json({ mensaje: 'La cita no corresponde al paciente seleccionado' })
    }
    if (rows[0].estado !== 'Atendido') {
      return res.status(409).json({ mensaje: 'Solo se pueden facturar citas en estado "Atendido"' })
    }
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const secuencial = await client.query(
      "UPDATE secuenciales SET valor = valor + 1 WHERE nombre = 'factura' RETURNING valor",
    )
    const numero = `001-001-${String(secuencial.rows[0].valor).padStart(9, '0')}`
    const { rows } = await client.query(
      `INSERT INTO facturas (numero, paciente_id, cita_id, cliente_nombre, cliente_identificacion, cliente_direccion,
         cliente_email, iva_porcentaje, subtotal_0, subtotal_iva, descuento, iva, total)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING id`,
      [
        numero, factura.paciente_id, factura.cita_id, factura.cliente_nombre, factura.cliente_identificacion,
        factura.cliente_direccion, factura.cliente_email, IVA_PORCENTAJE, totales.subtotal_0,
        totales.subtotal_iva, totales.descuento, totales.iva, totales.total,
      ],
    )
    const facturaId = rows[0].id
    for (const d of totales.lineas) {
      await client.query(
        `INSERT INTO factura_detalles (factura_id, tratamiento_id, descripcion, cantidad, precio_unitario,
           descuento, grava_iva, subtotal) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [facturaId, d.tratamiento_id, d.descripcion, d.cantidad, d.precio_unitario, d.descuento, d.grava_iva, d.subtotal],
      )
    }
    for (const p of pagos) {
      await client.query(
        'INSERT INTO factura_pagos (factura_id, metodo, monto, referencia) VALUES ($1, $2, $3, $4)',
        [facturaId, p.metodo, p.monto, p.referencia],
      )
    }
    await client.query('COMMIT')
    res.status(201).json(await buscarPorId(facturaId))
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

// Las facturas no se borran: se anulan con motivo para conservar la trazabilidad
export async function anularFactura(req, res) {
  const id = parsearId(req.params.id)
  const motivo = String(req.body?.motivo ?? '').trim()
  if (!motivo) return res.status(400).json({ mensaje: 'Indique el motivo de la anulación' })

  const { rows } = id
    ? await pool.query(
      `UPDATE facturas SET estado = 'Anulada', motivo_anulacion = $1, anulada_en = NOW()
       WHERE id = $2 AND estado = 'Emitida' RETURNING id`,
      [motivo, id],
    )
    : { rows: [] }
  if (!rows[0]) return res.status(409).json({ mensaje: 'La factura no existe o ya está anulada' })
  res.json(await buscarPorId(id))
}
