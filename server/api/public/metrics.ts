// server/api/public/metrics.ts
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  let dbStatus = 'DISCONNECTED'
  let dbLatencyMs = 0

  try {
    const start = performance.now()
    const db = await getDb()
    if (db) {
      await db.execute(sql`SELECT 1`)
      dbLatencyMs = Math.round(performance.now() - start)
      dbStatus = 'CONNECTED (Neon DB Serverless)'
    }
  } catch (err) {
    dbStatus = 'ERROR'
  }

  return {
    success: true,
    version: 'v2.5-GOLD',
    uptimeSeconds: Math.floor(process.uptime()),
    memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    nitroEngine: 'v2.x Active (Nitro Serverless)',
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs
    },
    activeSubdomains: [
      'devkernelpulse.org',
      'api.devkernelpulse.org',
      'mail.devkernelpulse.org'
    ]
  }
})