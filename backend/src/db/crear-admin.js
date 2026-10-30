import bcrypt from 'bcryptjs'
import { pool } from '../config/db.js'

async function crearAdministrador() {
  const nombre = process.env.ADMIN_NOMBRE
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD

  if (!nombre || !email || !password) {
    throw new Error('Configura ADMIN_NOMBRE, ADMIN_EMAIL y ADMIN_PASSWORD en .env')
  }

  if (password.length < 12) {
    throw new Error('La contraseña debe tener al menos 12 caracteres')
  }

  const hash = await bcrypt.hash(password, 12)

  const resultado = await pool.query(
    `INSERT INTO usuarios (nombre, email, password_hash, rol)
     VALUES ($1, $2, $3, 'administrador')
     ON CONFLICT (email) DO NOTHING`,
    [nombre, email, hash],
  )

  console.log(
    resultado.rowCount
      ? `Administrador creado: ${email}`
      : `El usuario ${email} ya existía. No se modificó su contraseña.`,
  )
}

crearAdministrador()
  .catch((error) => {
    console.error('No se pudo crear el administrador:', error.message)
    process.exitCode = 1
  })
  .finally(async () => {
    await pool.end()
  })