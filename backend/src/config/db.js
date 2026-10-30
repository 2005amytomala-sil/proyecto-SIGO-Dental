import pg from 'pg'

const { Pool } = pg

// Las columnas DATE y TIMESTAMP (sin zona) se devuelven como texto para evitar desfases de zona horaria
pg.types.setTypeParser(1082, (value) => value)
pg.types.setTypeParser(1114, (value) => value)

export const dbConfig = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'sigo_dental',
}

export const pool = new Pool(dbConfig)
