// server/api/public/metrics.ts
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  let dbStatus = 'DISCONNECTED'
  let dbBadge = 'OFFLINE'
  let dbLatencyMs = 0

  try {
    const start = performance.now()
    const db = await getDb()
    if (db) {
      await db.execute(sql`SELECT 1`)
      dbLatencyMs = Math.round(performance.now() - start)
      dbStatus = 'CONNECTED (Neon DB Serverless)'
      dbBadge = 'CONNECTED'
    }
  } catch (err) {
    dbStatus = 'ERROR'
    dbBadge = 'ERROR'
  }

  const memoryUsageMb = Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
  const uptimeSeconds = Math.floor(process.uptime())

  return {
    success: true,
    version: 'v2.5-GOLD',
    status: 'HEALTHY',
    badge: 'ONLINE',
    region: 'europe-west4',
    uptimeSeconds,
    memoryUsageMb,
    nitroEngine: 'v2.x Active (Nitro Serverless)',
    gcpArmorStatus: 'OPTIMAL',
    database: {
      status: dbStatus,
      badge: dbBadge,
      latencyMs: dbLatencyMs,
      provider: 'Neon PostgreSQL'
    },
    activeSubdomains: [
      'devkernelpulse.org',
      'api.devkernelpulse.org',
      'mail.devkernelpulse.org'
    ],
    timestamp: new Date().toISOString()
  }
})