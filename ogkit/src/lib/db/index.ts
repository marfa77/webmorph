import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from './schema'

function connectionString(): string {
  const u = process.env.DATABASE_URL?.trim()
  if (u) return u
  // `next build` imports server modules; pool connects lazily on first query.
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return 'mysql://build:build@127.0.0.1:3306/build_placeholder'
  }
  throw new Error('DATABASE_URL is required (MySQL connection string, e.g. mysql://user:pass@host:3306/dbname)')
}

const pool = mysql.createPool(connectionString())

export const db = drizzle(pool, { schema, mode: 'default' })

export type Db = typeof db
