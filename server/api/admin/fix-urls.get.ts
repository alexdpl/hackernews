// server/api/admin/fix-urls.ts
import { defineEventHandler } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async () => {
  const db = getDb()

  try {
    // Converte in post interni (url = NULL) tutti i post che puntano a news.ycombinator.com
    await db.execute(sql`
      UPDATE posts 
      SET url = NULL 
      WHERE url LIKE '%news.ycombinator.com%'
    `)

    return { 
      success: true, 
      message: 'Tutti i link di Hacker News sono stati convertiti in post interni di DevKernelPulse!' 
    }
  } catch (err: any) {
    console.error('Errore durante la pulizia degli URL:', err)
    return { 
      success: false, 
      error: err.message 
    }
  }
})