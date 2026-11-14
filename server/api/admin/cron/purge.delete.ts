// server/api/admin/cron/purge.delete.ts
import { defineEventHandler, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { verifyAdminOrCronAuth } from '~~/server/utils/cronAuth'

export const runPurgeLogs = async (event: any) => {
  const db = await getDb()
  if (!db) throw createError({ statusCode: 500, statusMessage: 'Database offline' })

  await verifyAdminOrCronAuth(event, db)

  try {
    const res: any = await db.execute(sql`
      DELETE FROM ingestion_logs 
      WHERE created_at < NOW() - INTERVAL '1 day'
      RETURNING id
    `).catch(() => [])

    const rows = res?.rows || res || []
    return {
      success: true,
      deletedCount: Array.isArray(rows) ? rows.length : 0,
      message: `Database purificato (${Array.isArray(rows) ? rows.length : 0} log rimossi).`,
      timestamp: new Date().toISOString()
    }
  } catch (error: any) {
    throw createError({ statusCode: 500, statusMessage: `Errore purge: ${error.message}` })
  }
}

export default defineEventHandler(runPurgeLogs)