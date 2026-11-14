// server/api/admin/cron/trigger.post.ts
import { defineEventHandler, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { verifyAdminOrCronAuth } from '~~/server/utils/cronAuth'

export const runHnTrigger = async (event: any) => {
  const db = await getDb()
  if (!db) throw createError({ statusCode: 500, statusMessage: 'Database offline' })

  await verifyAdminOrCronAuth(event, db)

  const config = useRuntimeConfig(event)
  let imported = 0
  let cachePurged = false

  try {
    const topIds: number[] = await $fetch<number[]>('https://hacker-news.firebaseio.com/v0/topstories.json')
      .then(ids => (Array.isArray(ids) ? ids.slice(0, 15) : []))
      .catch(() => [])

    // Fetch parallelo non bloccante (ottimizzato per Cloud Run)
    const settledItems = await Promise.allSettled(
      topIds.map(hnId => $fetch<any>(`https://hacker-news.firebaseio.com/v0/item/${hnId}.json`))
    )

    for (const res of settledItems) {
      if (res.status !== 'fulfilled' || !res.value) continue
      const item = res.value
      if (!item.title || item.type !== 'story') continue

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
        console.error(`Errore insert HN_ID ${item.id}:`, err.message)
        return []
      })

      const rows = inserted?.rows || inserted
      if (Array.isArray(rows) && rows.length > 0) {
        imported++
      }
    }

    const cfZoneId = config.cloudflareZoneId || process.env.CLOUDFLARE_ZONE_ID
    const cfApiToken = config.cloudflareApiToken || process.env.CLOUDFLARE_API_TOKEN

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
    if (err.statusCode) throw err
    throw createError({ statusCode: 500, statusMessage: err?.message || 'Errore interno trigger' })
  }
}

export default defineEventHandler(runHnTrigger)