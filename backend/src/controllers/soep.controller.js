import { pool } from '../config/db.js'
import { validarAdenda, validarNota } from '../validators/soep.validator.js'

const HORAS_BLOQUEO = Number(process.env.NOTAS_SOEP_HORAS_BLOQUEO ?? 24)
const parsearId = (valor) => {
  const id = Number(valor)
  return Number.isInteger(id) && id > 0 ? id : null
}

const SELECT_NOTAS = `
  SELECT n.id, n.paciente_id, n.subjetivo, n.objetivo, n.evaluacion, n.plan,
         n.profesional, to_char(n.firmado_en, 'YYYY-MM-DD HH24:MI') AS firmado_en,
         to_char(n.created_at, 'YYYY-MM-DD HH24:MI') AS fecha,
         (n.created_at <= NOW() - ($2 * INTERVAL '1 hour')) AS bloqueada,
         COALESCE((SELECT json_agg(json_build_object(
           'id', a.id, 'contenido', a.contenido, 'profesional', a.profesional,
           'firma', a.firma, 'fecha', to_char(a.created_at, 'YYYY-MM-DD HH24:MI')
         ) ORDER BY a.created_at ASC) FROM adendas_soep a WHERE a.nota_id = n.id), '[]'::json) AS adendas
  FROM notas_soep n
`

async function pacienteExiste(pacienteId) {
  return pacienteId && (await pool.query('SELECT id FROM pacientes WHERE id = $1', [pacienteId])).rows[0]
}

export async function obtenerNotasSoep(req, res) {
  const pacienteId = parsearId(req.params.pacienteId)
  if (!await pacienteExiste(pacienteId)) return res.status(404).json({ mensaje: 'Paciente no encontrado' })
  const { rows } = await pool.query(`${SELECT_NOTAS} WHERE n.paciente_id = $1 ORDER BY n.created_at DESC, n.id DESC`, [pacienteId, HORAS_BLOQUEO])
  res.json({ horas_bloqueo: HORAS_BLOQUEO, notas: rows })
}

export async function crearNotaSoep(req, res) {
  const pacienteId = parsearId(req.params.pacienteId)
  if (!await pacienteExiste(pacienteId)) return res.status(404).json({ mensaje: 'Paciente no encontrado' })
  const { errores, nota } = validarNota(req.body)
  if (Object.keys(errores).length > 0) return res.status(400).json({ mensaje: 'Datos inválidos', errores })
  const { rows } = await pool.query(
    `INSERT INTO notas_soep (paciente_id, subjetivo, objetivo, evaluacion, plan, profesional, firma)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [pacienteId, nota.subjetivo, nota.objetivo, nota.evaluacion, nota.plan, nota.profesional, nota.firma],
  )
  const creada = await pool.query(`${SELECT_NOTAS} WHERE n.id = $1`, [rows[0].id, HORAS_BLOQUEO])
  res.status(201).json(creada.rows[0])
}

export async function crearAdendaSoep(req, res) {
  const notaId = parsearId(req.params.notaId)
  const nota = notaId && (await pool.query('SELECT id FROM notas_soep WHERE id = $1', [notaId])).rows[0]
  if (!nota) return res.status(404).json({ mensaje: 'Nota SOEP no encontrada' })
  const { errores, adenda } = validarAdenda(req.body)
  if (Object.keys(errores).length > 0) return res.status(400).json({ mensaje: 'Datos inválidos', errores })
  const { rows } = await pool.query(
    `INSERT INTO adendas_soep (nota_id, contenido, profesional, firma)
     VALUES ($1, $2, $3, $4)
     RETURNING id, contenido, profesional, firma, to_char(created_at, 'YYYY-MM-DD HH24:MI') AS fecha`,
    [notaId, adenda.contenido, adenda.profesional, adenda.firma],
  )
  res.status(201).json(rows[0])
}
