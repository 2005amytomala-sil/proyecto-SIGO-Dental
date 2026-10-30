import { pool } from '../config/db.js'

export async function listarOdontologos(req, res) {
  const { rows } = await pool.query(
    `SELECT id, nombres, apellidos, especialidad, color FROM odontologos
     WHERE activo ORDER BY apellidos, nombres`,
  )
  res.json(rows)
}

export async function listarSillones(req, res) {
  const { rows } = await pool.query(
    'SELECT id, nombre, consultorio FROM sillones WHERE activo ORDER BY nombre',
  )
  res.json(rows)
}
