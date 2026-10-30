
import { readFile } from 'node:fs/promises'
import { pool } from '../config/db.js'

async function aplicarAuth() {
  try {
    const sql = await readFile(
      new URL('./auth.sql', import.meta.url),
      'utf8',
    )

    await pool.query(sql)

    const resultado = await pool.query(
      "SELECT to_regclass('public.usuarios') AS tabla",
    )

    console.log('Resultado:', resultado.rows[0].tabla)
  } catch (error) {
    console.error('Error al aplicar auth.sql:', error.message)
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}

aplicarAuth()
