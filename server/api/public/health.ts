// server/api/public/health.ts
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async () => {
  let dbStatus = 'UNKNOWN'
  try {
    const db = getDb()
    await db.execute(sql`SELECT 1`)
    dbStatus = 'CONNECTED'
  } catch (err) {
    dbStatus = 'DISCONNECTED'
  }

  return {
    status: 'HEALTHY',
    service: 'DevKernelPulse-API-Gateway',
    version: 'v2.5-GOLD',
    region: 'europe-west4',
    database: dbStatus,
    timestamp: new Date().toISOString()
  }
})