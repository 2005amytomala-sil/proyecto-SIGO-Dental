import { pool } from '../config/db.js'
import { calcularAlertas } from '../validators/paciente.validator.js'
import { ESTADOS_CITA, ESTADOS_EDITABLES, TRANSICIONES, validarCita } from '../validators/cita.validator.js'

const SELECT_CITA = `
  SELECT c.id, c.paciente_id, c.odontologo_id, c.sillon_id, c.motivo, c.observaciones,
         c.estado, c.motivo_cancelacion,
         to_char(c.inicio, 'YYYY-MM-DD') AS fecha,
         to_char(c.inicio, 'HH24:MI') AS hora_inicio,
         to_char(c.fin, 'HH24:MI') AS hora_fin,
         (EXTRACT(EPOCH FROM c.fin - c.inicio) / 60)::int AS duracion_min,
         p.nombres || ' ' || p.apellidos AS paciente_nombre,
         p.cedula AS paciente_cedula,
         p.telefono AS paciente_telefono,
         to_jsonb(a) - 'paciente_id' AS anamnesis,
         o.nombres || ' ' || o.apellidos AS odontologo_nombre,
         o.color AS odontologo_color,
         s.nombre AS sillon_nombre
  FROM citas c
  JOIN pacientes p ON p.id = c.paciente_id
  LEFT JOIN anamnesis a ON a.paciente_id = p.id
  JOIN odontologos o ON o.id = c.odontologo_id
  JOIN sillones s ON s.id = c.sillon_id
`

const FECHA_REGEX = /^\d{4}-\d{2}-\d{2}$/

const formatearCita = ({ anamnesis, ...cita }) => ({ ...cita, alertas: calcularAlertas(anamnesis) })

const parsearId = (valor) => {
  const id = Number(valor)
  return Number.isInteger(id) && id > 0 ? id : null
}

async function buscarPorId(id) {
  const { rows } = await pool.query(`${SELECT_CITA} WHERE c.id = $1`, [id])
  return rows[0] ? formatearCita(rows[0]) : null
}

export async function listarCitas(req, res) {
  const { desde, hasta, sillon_id: sillonId, odontologo_id: odontologoId, paciente_id: pacienteId } = req.query
  if (!FECHA_REGEX.test(desde ?? '') || !FECHA_REGEX.test(hasta ?? '')) {
    return res.status(400).json({ mensaje: 'Indique el rango de fechas (desde y hasta, formato AAAA-MM-DD)' })
  }

  const condiciones = ['c.inicio >= $1::date', "c.inicio < $2::date + INTERVAL '1 day'"]
  const params = [desde, hasta]
  const filtros = { 'c.sillon_id': sillonId, 'c.odontologo_id': odontologoId, 'c.paciente_id': pacienteId }
  for (const [columna, valor] of Object.entries(filtros)) {
    if (parsearId(valor)) {
      params.push(parsearId(valor))
      condiciones.push(`${columna} = $${params.length}`)
    }
  }

  const { rows } = await pool.query(
    `${SELECT_CITA} WHERE ${condiciones.join(' AND ')} ORDER BY c.inicio, s.nombre`,
    params,
  )
  res.json(rows.map(formatearCita))
}

export async function obtenerCita(req, res) {
  const id = parsearId(req.params.id)
  const cita = id && (await buscarPorId(id))
  if (!cita) return res.status(404).json({ mensaje: 'Cita no encontrada' })
  res.json(cita)
}

export async function crearCita(req, res) {
  const { errores, cita } = validarCita(req.body)
  if (Object.keys(errores).length > 0) {
    return res.status(400).json({ mensaje: 'Datos inválidos', errores })
  }

  const { rows } = await pool.query(
    `INSERT INTO citas (paciente_id, odontologo_id, sillon_id, inicio, fin, motivo, observaciones)
     VALUES ($1, $2, $3, $4::timestamp, $4::timestamp + $5 * INTERVAL '1 minute', $6, $7)
     RETURNING id`,
    [cita.paciente_id, cita.odontologo_id, cita.sillon_id, cita.inicio, cita.duracion_min, cita.motivo, cita.observaciones],
  )
  res.status(201).json(await buscarPorId(rows[0].id))
}

export async function actualizarCita(req, res) {
  const id = parsearId(req.params.id)
  const actual = id && (await buscarPorId(id))
  if (!actual) return res.status(404).json({ mensaje: 'Cita no encontrada' })
  if (!ESTADOS_EDITABLES.includes(actual.estado)) {
    return res.status(409).json({ mensaje: `No se puede modificar una cita en estado "${actual.estado}"` })
  }

  const { errores, cita } = validarCita(req.body)
  if (Object.keys(errores).length > 0) {
    return res.status(400).json({ mensaje: 'Datos inválidos', errores })
  }

  await pool.query(
    `UPDATE citas SET
       paciente_id = $1, odontologo_id = $2, sillon_id = $3,
       inicio = $4::timestamp, fin = $4::timestamp + $5 * INTERVAL '1 minute',
       motivo = $6, observaciones = $7, updated_at = NOW()
     WHERE id = $8`,
    [cita.paciente_id, cita.odontologo_id, cita.sillon_id, cita.inicio, cita.duracion_min, cita.motivo, cita.observaciones, id],
  )
  res.json(await buscarPorId(id))
}

export async function cambiarEstadoCita(req, res) {
  const id = parsearId(req.params.id)
  const actual = id && (await buscarPorId(id))
  if (!actual) return res.status(404).json({ mensaje: 'Cita no encontrada' })

  const { estado } = req.body ?? {}
  if (!ESTADOS_CITA.includes(estado)) {
    return res.status(400).json({ mensaje: 'Estado inválido' })
  }
  if (!TRANSICIONES[actual.estado].includes(estado)) {
    return res.status(409).json({ mensaje: `No se puede pasar de "${actual.estado}" a "${estado}"` })
  }

  const motivoCancelacion = String(req.body.motivo_cancelacion ?? '').trim() || null
  if (estado === 'Cancelado' && !motivoCancelacion) {
    return res.status(400).json({ mensaje: 'Indique el motivo de la cancelación', errores: { motivo_cancelacion: 'Obligatorio' } })
  }

  await pool.query(
    'UPDATE citas SET estado = $1, motivo_cancelacion = $2, updated_at = NOW() WHERE id = $3',
    [estado, estado === 'Cancelado' ? motivoCancelacion : actual.motivo_cancelacion, id],
  )
  res.json(await buscarPorId(id))
}
