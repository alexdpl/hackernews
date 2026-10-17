// server/api/admin/crawler/wipe.post.ts
import { getDb } from '~~/server/utils/db'
import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const db = await getDb()
    if (!db) throw createError({ statusCode: 500, statusMessage: 'Database Neon non disponibile' })

    // Esegue una TRUNCATE sulla tabella del crawler (Sostituisci "dkp_stories" col nome reale della tua tabella)
    await db.execute(sql`TRUNCATE TABLE dkp_stories RESTART IDENTITY CASCADE;`)

    return {
      success: true,
      message: 'Wipe completato: Tutti i dati ingestiti dal Crawler sono stati eliminati definitivamente.'
    }
  } catch (err: any) {
    console.error('[CRAWLER WIPE ERROR]:', err?.message)
    throw createError({
      statusCode: 500,
      statusMessage: err?.message || 'Impossibile svuotare la tabella del database'
    })
  }
})