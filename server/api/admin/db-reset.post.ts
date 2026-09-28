// server/api/admin/db-reset.post.ts
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  try {
    const db = getDb()
    if (!db) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Impossibile connettersi al DB Neon.'
      })
    }

    // 1. Svuota la tabella pulse_stories
    await db.execute(sql`DELETE FROM pulse_stories;`)

    // 2. Tenta il reset della sequenza ID
    try {
      await db.execute(sql`ALTER SEQUENCE pulse_stories_id_seq RESTART WITH 1;`)
    } catch {
      // Ignora se la sequenza usa un altro identificatore nativo
    }

    return {
      success: true,
      message: 'Database Neon svuotato con successo! Tutti i contenuti e doppioni sono stati azzerati.'
    }
  } catch (err: any) {
    console.error('[DB RESET ERROR]:', err?.message)
    throw createError({
      statusCode: 500,
      statusMessage: err?.message || 'Errore durante la pulizia del database.'
    })
  }
})