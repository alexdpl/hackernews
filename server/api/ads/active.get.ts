// server/api/ads/active.get.ts
import { defineEventHandler } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async () => {
  try {
    const db = await getDb()
    if (!db) return { success: false }

    // Cerca 1 annuncio attivo a caso con budget > 0
    const res: any = await db.execute(sql`
      SELECT id, title, snippet, target_url AS "targetUrl", category_tag AS "categoryTag"
      FROM dkp_ads
      WHERE status = 'ACTIVE' AND budget_credits > 0
      ORDER BY RANDOM()
      LIMIT 1;
    `)
    
    const row = Array.isArray(res) ? res[0] : res?.rows?.[0]
    
    if (row) {
      // Aggiorna le impression in background (fire and forget)
      db.execute(sql`UPDATE dkp_ads SET impressions_count = COALESCE(impressions_count, 0) + 1 WHERE id = ${row.id}`).catch(() => {})
      
      return { success: true, data: row }
    }
    
    return { success: false, message: 'Nessun annuncio attivo.' }
  } catch (err: any) {
    console.error('❌ Errore Ads API:', err?.message)
    return { success: false }
  }
})