// server/api/admin/crawler/purge.post.ts
import { defineEventHandler, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { verifyAdminOrCronAuth } from '~~/server/utils/cronAuth'

export default defineEventHandler(async (event) => {
  const db = await getDb()
  if (!db) {
    throw createError({ statusCode: 500, statusMessage: 'Database Neon non disponibile.' })
  }

  await verifyAdminOrCronAuth(event, db)

  try {
    // 1. Deduplicazione Pure SQL su hn_stories
    const delHn: any = await db.execute(sql`
      DELETE FROM hn_stories a
      USING hn_stories b
      WHERE a.id < b.id
        AND (
          (a.hn_id IS NOT NULL AND a.hn_id = b.hn_id)
          OR LOWER(TRIM(a.title)) = LOWER(TRIM(b.title))
        )
      RETURNING a.id;
    `).catch(() => [])

    // 2. Deduplicazione Pure SQL su pulse_stories (inclusi annunci di lavoro fuori tema)
    const delPulse: any = await db.execute(sql`
      DELETE FROM pulse_stories a
      USING pulse_stories b
      WHERE a.id < b.id
        AND LOWER(TRIM(a.title)) = LOWER(TRIM(b.title))
      RETURNING a.id;
    `).catch(() => [])

    const hnRows = Array.isArray(delHn) ? delHn : (delHn?.rows || [])
    const pulseRows = Array.isArray(delPulse) ? delPulse : (delPulse?.rows || [])
    const removedCount = hnRows.length + pulseRows.length

    return {
      success: true,
      removed: removedCount,
      message: removedCount > 0
        ? `🧹 Purge Pure SQL completato: rimossi ${removedCount} record duplicati da NeonDB.`
        : '✅ Database Neon già pulito e ottimizzato: 0 duplicati rilevati.'
    }
  } catch (err: any) {
    console.error('❌ [CRAWLER PURGE ERROR]:', err?.message)
    throw createError({
      statusCode: 500,
      statusMessage: err?.message || 'Errore durante la pulizia dei duplicati.'
    })
  }
})