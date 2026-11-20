import { defineEventHandler, setResponseHeader } from 'h3'
import { sql } from 'drizzle-orm'
import os from 'node:os'
import { getDb } from '~~/server/utils/db'

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store, no-cache, must-revalidate')
  const start = Date.now()
  const db = await getDb()
  let dbStatus = 'OFFLINE'
  let storiesCount = 0
  let threadsCount = 0
  let nodesCount = 0
  let tablesList: string[] = []

  if (db) {
    try {
      await db.execute(sql`SELECT 1 AS ping;`)
      dbStatus = 'CONNECTED'

      const tblRes = await db.execute(sql`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name ASC;
      `).catch(() => null)
      tablesList = extractRows(tblRes).map((r: any) => String(r.table_name))

      const sRes = await db.execute(sql`SELECT COUNT(*)::int AS cnt FROM pulse_stories;`).catch(() => null)
      const tRes = await db.execute(sql`SELECT COUNT(*)::int AS cnt FROM forum_posts;`).catch(() => null)
      const nRes = await db.execute(sql`SELECT COUNT(*)::int AS cnt FROM dkp_nodes;`).catch(() => null)

      storiesCount = Number(extractRows(sRes)[0]?.cnt || 0)
      threadsCount = Number(extractRows(tRes)[0]?.cnt || 0)
      nodesCount = Number(extractRows(nRes)[0]?.cnt || 0)
    } catch {
      dbStatus = 'ERROR'
    }
  }

  const mem = process.memoryUsage()
  const rssMb = Math.round(mem.rss / 1024 / 1024)
  const heapUsedMb = Math.round(mem.heapUsed / 1024 / 1024)
  const heapTotalMb = Math.round(mem.heapTotal / 1024 / 1024)
  const uptimeSec = Math.floor(process.uptime())
  const loadAvg = os.loadavg ? os.loadavg()[0] : 0

  return {
    success: true,
    checkedAt: new Date().toISOString(),
    latencyMs: Date.now() - start,
    dbStatus,
    tablesCount: tablesList.length,
    tables: tablesList,
    server: {
      rssMb,
      heapUsedMb,
      heapTotalMb,
      uptimeSec,
      cpuLoad: Number(loadAvg.toFixed(2)),
      platform: `${os.platform()} (${os.arch()})`,
      nodeVersion: process.version
    },
    runtime: {
      nodeVersion: process.version,
      env: process.env.NODE_ENV || 'production',
      hasBrevoKey: Boolean(process.env.BREVO_API_KEY),
      hasOpenRouterKey: Boolean(process.env.OPENROUTER_API_KEY),
      hasStripeKey: Boolean(process.env.STRIPE_SECRET_KEY)
    },
    counts: {
      stories: storiesCount,
      threads: threadsCount,
      nodes: nodesCount
    }
  }
})