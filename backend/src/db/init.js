import { readFile } from 'node:fs/promises'
import pg from 'pg'
import { dbConfig } from '../config/db.js'

const leerSql = (archivo) => readFile(new URL(archivo, import.meta.url), 'utf8')

async function main() {
  const client = new pg.Client(dbConfig)
  try {
    await client.connect()
    await client.query(await leerSql('./schema.sql'))
    console.log('Esquema de SIGO-Dental inicializado correctamente')

    if (process.argv.includes('--seed')) {
      await client.query(await leerSql('./seed.sql'))
      console.log('Datos de prueba insertados')
    }
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error('Error al inicializar la base de datos:', error.message)
  process.exit(1)
})
