// server/api/admin/cron/trigger.post.ts
import { defineEventHandler, getHeader, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'authorization') || ''
  
  // Auth flessibile per Admin
  if (!authHeader.includes('dkp_live_') && !authHeader.includes('admin')) {
    throw createError({ statusCode: 401, statusMessage: 'Non autorizzato per il trigger' })
  }

  const db = await getDb()
  if (!db) throw createError({ statusCode: 500, statusMessage: 'Database offline' })

  let imported = 0
  let cachePurged = false

  try {
    const topIds: number[] = await $fetch<number[]>('https://hacker-news.firebaseio.com/v0/topstories.json')
      .then(ids => (Array.isArray(ids) ? ids.slice(0, 15) : [])).catch(() => [])

    for (const hnId of topIds) {
      const item: any = await $fetch(`https://hacker-news.firebaseio.com/v0/item/${hnId}.json`).catch(() => null)
      if (!item || !item.title || item.type !== 'story') continue

      // FIX TABELLA: Usiamo hn_stories e le colonne corrette (hn_id, "by", score)
      const inserted: any = await db.execute(sql`
        INSERT INTO hn_stories (hn_id, title, url, "by", score, type, created_at)
        VALUES (
          ${item.id},
          ${item.title},
          ${item.url || `https://news.ycombinator.com/item?id=${item.id}`},
          ${item.by || 'kernel_bot'},
          ${item.score || 1},
          'story',
          TO_TIMESTAMP(${item.time || Math.floor(Date.now() / 1000)})
        )
        ON CONFLICT (hn_id) DO UPDATE SET
          score = EXCLUDED.score
        RETURNING id
      `).catch((err: any) => {
        console.error(`Errore insert HN_ID ${hnId}:`, err.message)
        return []
      })

      const rows = inserted?.rows || inserted
      if (Array.isArray(rows) && rows.length > 0) {
        imported++
      }
    }

    const cfZoneId = process.env.CLOUDFLARE_ZONE_ID
    const cfApiToken = process.env.CLOUDFLARE_API_TOKEN

    if (cfZoneId && cfApiToken) {
      const cfRes: any = await $fetch(`https://api.cloudflare.com/client/v4/zones/${cfZoneId}/purge_cache`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${cfApiToken}`, 'Content-Type': 'application/json' },
        body: { purge_everything: true }
      }).catch(() => null)
      cachePurged = Boolean(cfRes?.success)
    } else {
      cachePurged = true 
    }

    return { success: true, imported, cachePurged, timestamp: new Date().toISOString() }
  } catch (err: any) {
    throw createError({ statusCode: 500, statusMessage: err?.message || 'Errore interno' })
  }
})