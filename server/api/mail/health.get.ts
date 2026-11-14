// server/api/mail/health.get.ts
import { defineEventHandler } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async () => {
  const db = await getDb()
  let dbConnected = false
  if (db) {
    await db.execute(sql`SELECT 1;`).then(() => { dbConnected = true }).catch(() => {})
  }

  return {
    success: true,
    status: 'NEXUS_ONLINE',
    host: 'mail.devkernelpulse.org',
    version: 'v2.6-PURE-SQL',
    dbConnected,
    timestamp: new Date().toISOString()
  }
})