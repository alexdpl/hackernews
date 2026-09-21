// server/api/admin/health.get.ts
import { defineEventHandler, getHeader, getQuery, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  const headerSecret = getHeader(event, 'x-admin-secret')
  const providedSecret = (headerSecret || query.secret || '') as string

  // In locale usa 'admin' come chiave di default se non impostata in .env
  const expectedSecret = (config.adminSecret || process.env.NUXT_ADMIN_SECRET || process.env.ADMIN_SECRET || 'admin') as string

  // Controllo autenticazione
  if (expectedSecret && providedSecret !== expectedSecret) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Chiave Admin non valida. (In locale la chiave di default è: admin)'
    })
  }

  // 1. Test di Connessione e Latenza a Neon Postgres
  const dbStart = performance.now()
  let dbStatus = 'healthy'
  let dbLatencyMs = 0

  try {
    const db = getDb()
    await db.execute(sql`SELECT 1`)
    dbLatencyMs = Math.round(performance.now() - dbStart)
  } catch (err) {
    console.error('Errore Health Check DB:', err)
    dbStatus = 'unhealthy'
  }

  // 2. Metriche Memoria Processo Node.js / Nitro
  const memoryUsage = process.memoryUsage()

  return {
    status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
      provider: 'Neon PostgreSQL'
    },
    memory: {
      rssMB: +(memoryUsage.rss / 1024 / 1024).toFixed(2),
      heapTotalMB: +(memoryUsage.heapTotal / 1024 / 1024).toFixed(2),
      heapUsedMB: +(memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
      externalMB: +(memoryUsage.external / 1024 / 1024).toFixed(2)
    },
    system: {
      nodeVersion: process.version,
      env: process.env.NODE_ENV || 'development'
    }
  }
})