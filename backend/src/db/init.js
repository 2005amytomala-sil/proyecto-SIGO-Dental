import { readFile } from 'node:fs/promises'
import pg from 'pg'
import { dbConfig } from '../config/db.js'

const leerSql = (archivo) => readFile(new URL(archivo, import.meta.url), 'utf8')

async function crearBaseSiNoExiste() {
  const admin = new pg.Client({ ...dbConfig, database: 'postgres' })
  await admin.connect()
  const { rowCount } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbConfig.database])
  if (rowCount === 0) {
    await admin.query(`CREATE DATABASE "${dbConfig.database}"`)
    console.log(`Base de datos "${dbConfig.database}" creada`)
  }
  await admin.end()
}

async function main() {
  await crearBaseSiNoExiste()

  const client = new pg.Client(dbConfig)
  await client.connect()
  await client.query(await leerSql('./schema.sql'))
  console.log('Tablas creadas/actualizadas')

  if (process.argv.includes('--seed')) {
    await client.query(await leerSql('./seed.sql'))
    console.log('Datos de prueba insertados')
  }
  await client.end()
}

main().catch((error) => {
  console.error('Error al inicializar la base de datos:', error.message)
  process.exit(1)
})
