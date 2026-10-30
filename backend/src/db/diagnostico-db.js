import { pool, dbConfig } from '../config/db.js'

try {
  console.log('Configuración:', {
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    user: dbConfig.user,
  })

  const resultado = await pool.query(`
    SELECT
      current_database() AS db,
      current_schema() AS esquema,
      current_user AS usuario,
      inet_server_addr() AS servidor,
      inet_server_port() AS puerto,
      to_regclass('public.usuarios') AS tabla_usuarios
  `)

  console.table(resultado.rows)
} catch (error) {
  console.error('Error:', error.message)
} finally {
  await pool.end()
}
