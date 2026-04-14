import 'dotenv/config'
import pg from 'pg'

const { Pool } = pg

/**
 * pg puede parsear contraseñas solo numéricas (ej. 123456789) como número al usar
 * solo `connectionString`, lo que provoca: "client password must be a string" (SCRAM).
 * Aquí construimos el config explícitamente y forzamos password como string.
 */
function buildPoolConfig() {
  const rawUrl = process.env.DATABASE_URL?.trim()

  if (rawUrl) {
    const u = new URL(rawUrl)
    const dbName = u.pathname.replace(/^\//, '').split('/')[0] || 'postgres'
    return {
      user: u.username ? decodeURIComponent(u.username) : 'postgres',
      password: String(u.password ?? ''),
      host: u.hostname || 'localhost',
      port: u.port ? Number(u.port) : 5432,
      database: decodeURIComponent(dbName),
    }
  }

  return {
    user: String(process.env.PGUSER ?? 'postgres'),
    password: String(process.env.PGPASSWORD ?? ''),
    host: process.env.PGHOST ?? 'localhost',
    port: Number(process.env.PGPORT ?? 5432),
    database: process.env.PGDATABASE ?? 'euphoria_lashes',
  }
}

export const pool = new Pool(buildPoolConfig())
