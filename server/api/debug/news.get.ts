// server/api/debug/news.get.ts
import { defineEventHandler } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async () => {
  try {
    const db = await getDb()
    if (!db) {
      return { success: false, error: 'Database non disponibile o connessione fallita' }
    }

    // Selezioniamo solo le colonne che sappiamo esistere nella tabella pulse_stories
    const result: any = await db.execute(sql`
      SELECT id, title, url, type, created_at 
      FROM pulse_stories 
      ORDER BY id DESC 
      LIMIT 20
    `)
    
    const rows = result.rows || result
    
    return {
      success: true,
      total_found: rows.length,
      data: rows
    }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
})