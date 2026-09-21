// server/api/admin/health.ts
import { defineEventHandler, getHeader, getQuery, readBody } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const method = event.node.req.method
  const query = getQuery(event)
  const body = method === 'POST' ? await readBody(event).catch(() => ({})) : {}
  const headerSecret = getHeader(event, 'x-admin-secret')

  const providedSecret = (headerSecret || query.secret || body?.secret || '') as string
  const config = useRuntimeConfig()
  const expectedSecret = (config.adminSecret || process.env.NUXT_ADMIN_SECRET || process.env.ADMIN_SECRET || 'admin') as string

  if (process.env.NODE_ENV === 'production' && expectedSecret && providedSecret !== expectedSecret) {
    return {
      success: false,
      error: 'Chiave segreta Admin non valida'
    }
  }

  const start = performance.now()
  let dbStatus = 'healthy'
  let dbLatencyMs = 0

  try {
    const db = getDb()
    await db.execute(sql`SELECT 1`)
    dbLatencyMs = Math.round(performance.now() - start)
  } catch (err) {
    dbStatus = 'unhealthy'
  }

  const mem = process.memoryUsage()

  return {
    success: true,
    status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
      provider: 'Neon PostgreSQL'
    },
    memory: {
      rssMB: +(mem.rss / 1024 / 1024).toFixed(2),
      heapTotalMB: +(mem.heapTotal / 1024 / 1024).toFixed(2),
      heapUsedMB: +(mem.heapUsed / 1024 / 1024).toFixed(2),
      externalMB: +(mem.external / 1024 / 1024).toFixed(2)
    },
    system: {
      nodeVersion: process.version,
      env: process.env.NODE_ENV || 'development'
    }
  }
})