import { pool } from '../config/db.js'
import { calcularAlertas, calcularEdad, validarPaciente } from '../validators/paciente.validator.js'

const COLUMNAS_PACIENTE = [
  'cedula', 'nombres', 'apellidos', 'fecha_nacimiento', 'sexo', 'telefono', 'email', 'direccion',
  'contacto_emergencia_nombre', 'contacto_emergencia_telefono', 'contacto_emergencia_parentesco',
  'tutor_nombre', 'tutor_cedula', 'tutor_telefono', 'tutor_parentesco',
  'seguro_nombre', 'seguro_numero_poliza',
]

const COLUMNAS_ANAMNESIS = [
  'enfermedades_sistemicas', 'alergias_farmacos', 'antecedentes_quirurgicos',
  'medicamentos_actuales', 'coagulopatia', 'anticoagulado', 'observaciones',
]

const SELECT_PACIENTE = `
  SELECT p.*, to_jsonb(a) - 'paciente_id' AS anamnesis
  FROM pacientes p
  LEFT JOIN anamnesis a ON a.paciente_id = p.id
`

const formatearPaciente = (fila) => ({
  ...fila,
  edad: calcularEdad(fila.fecha_nacimiento),
  alertas: calcularAlertas(fila.anamnesis),
})

const parsearId = (valor) => {
  const id = Number(valor)
  return Number.isInteger(id) && id > 0 ? id : null
}

async function guardarAnamnesis(client, pacienteId, anamnesis) {
  const valores = COLUMNAS_ANAMNESIS.map((columna) => anamnesis[columna])
  await client.query(
    `INSERT INTO anamnesis (paciente_id, ${COLUMNAS_ANAMNESIS.join(', ')})
     VALUES ($1, ${COLUMNAS_ANAMNESIS.map((_, i) => `$${i + 2}`).join(', ')})
     ON CONFLICT (paciente_id) DO UPDATE SET
       ${COLUMNAS_ANAMNESIS.map((columna) => `${columna} = EXCLUDED.${columna}`).join(', ')},
       updated_at = NOW()`,
    [pacienteId, ...valores],
  )
}

async function buscarPorId(id) {
  const { rows } = await pool.query(`${SELECT_PACIENTE} WHERE p.id = $1`, [id])
  return rows[0] ? formatearPaciente(rows[0]) : null
}

export async function listarPacientes(req, res) {
  const buscar = (req.query.buscar ?? '').trim()
  const limite = Math.min(Math.max(Number(req.query.limite) || 10, 1), 100)
  const pagina = Math.max(Number(req.query.pagina) || 1, 1)

  const filtro = buscar
    ? `WHERE p.cedula ILIKE $1 OR p.nombres ILIKE $1 OR p.apellidos ILIKE $1
         OR (p.nombres || ' ' || p.apellidos) ILIKE $1`
    : ''
  const params = buscar ? [`%${buscar}%`] : []

  const [{ rows }, conteo] = await Promise.all([
    pool.query(
      `${SELECT_PACIENTE} ${filtro} ORDER BY p.apellidos, p.nombres
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limite, (pagina - 1) * limite],
    ),
    pool.query(`SELECT COUNT(*)::int AS total FROM pacientes p ${filtro}`, params),
  ])

  res.json({ datos: rows.map(formatearPaciente), total: conteo.rows[0].total, pagina, limite })
}

export async function obtenerPaciente(req, res) {
  const id = parsearId(req.params.id)
  const paciente = id && (await buscarPorId(id))
  if (!paciente) return res.status(404).json({ mensaje: 'Paciente no encontrado' })
  res.json(paciente)
}

export async function crearPaciente(req, res) {
  const { errores, paciente, anamnesis } = validarPaciente(req.body)
  if (Object.keys(errores).length > 0) {
    return res.status(400).json({ mensaje: 'Datos inválidos', errores })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows } = await client.query(
      `INSERT INTO pacientes (${COLUMNAS_PACIENTE.join(', ')})
       VALUES (${COLUMNAS_PACIENTE.map((_, i) => `$${i + 1}`).join(', ')})
       RETURNING id`,
      COLUMNAS_PACIENTE.map((columna) => paciente[columna]),
    )
    await guardarAnamnesis(client, rows[0].id, anamnesis)
    await client.query('COMMIT')
    res.status(201).json(await buscarPorId(rows[0].id))
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function actualizarPaciente(req, res) {
  const id = parsearId(req.params.id)
  if (!id) return res.status(404).json({ mensaje: 'Paciente no encontrado' })

  const { errores, paciente, anamnesis } = validarPaciente(req.body)
  if (Object.keys(errores).length > 0) {
    return res.status(400).json({ mensaje: 'Datos inválidos', errores })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rowCount } = await client.query(
      `UPDATE pacientes SET
         ${COLUMNAS_PACIENTE.map((columna, i) => `${columna} = $${i + 1}`).join(', ')},
         updated_at = NOW()
       WHERE id = $${COLUMNAS_PACIENTE.length + 1}`,
      [...COLUMNAS_PACIENTE.map((columna) => paciente[columna]), id],
    )
    if (rowCount === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ mensaje: 'Paciente no encontrado' })
    }
    await guardarAnamnesis(client, id, anamnesis)
    await client.query('COMMIT')
    res.json(await buscarPorId(id))
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
