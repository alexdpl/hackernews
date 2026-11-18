// server/api/admin/cron/trigger.post.ts
import { defineEventHandler, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { verifyAdminOrCronAuth } from '~~/server/utils/cronAuth'
import { processUnprocessedStories } from '~~/server/utils/hnAiPipeline'

function buildStorySlug(title: string, hnId: number): string {
  const cleanTitle = String(title || 'story')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80)

  return `${cleanTitle || 'story'}-${hnId}`
}

export const runHnTrigger = async (event: any) => {
  const db = await getDb()
  if (!db) throw createError({ statusCode: 500, statusMessage: 'Database offline' })

  await verifyAdminOrCronAuth(event, db)

  const config = useRuntimeConfig(event)
  let imported = 0
  let cachePurged = false

  try {
    const topIds: number[] = await $fetch<number[]>('https://hacker-news.firebaseio.com/v0/topstories.json')
      .then(ids => (Array.isArray(ids) ? ids.slice(0, 18) : []))
      .catch(() => [])

    const settledItems = await Promise.allSettled(
      topIds.map(hnId => $fetch<any>(`https://hacker-news.firebaseio.com/v0/item/${hnId}.json`))
    )

    for (const res of settledItems) {
      if (res.status !== 'fulfilled' || !res.value) continue
      const item = res.value
      if (!item.title || item.type !== 'story') continue

      const storySlug = buildStorySlug(item.title, Number(item.id))
      const originalUrl = item.url || `https://news.ycombinator.com/item?id=${item.id}`
      const titleLower = String(item.title).toLowerCase()
      const categoryName = titleLower.startsWith('show hn')
        ? 'Show HN'
        : titleLower.startsWith('ask hn')
          ? 'Ask HN'
          : 'Tech'

      const inserted: any = await db.execute(sql`
        INSERT INTO hn_stories (
          hn_id, title, original_url, slug, hn_points, hn_by, category, processed_by_ai
        )
        VALUES (
          ${Number(item.id)},
          ${String(item.title)},
          ${originalUrl},
          ${storySlug},
          ${Number(item.score || 1)},
          ${String(item.by || 'kernel_bot')},
          ${categoryName},
          FALSE
        )
        ON CONFLICT (hn_id) DO UPDATE SET
          hn_points = EXCLUDED.hn_points
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

    // Arricchisce subito fino a 3 nuove storie con Trinity AI
    const aiResult = await processUnprocessedStories(3).catch(() => ({ processedCount: 0 }))

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

    return {
      success: true,
      imported,
      aiProcessed: aiResult?.processedCount || 0,
      cachePurged,
      message: `Sync completata: ${imported} notizie sincronizzate su NeonDB (${aiResult?.processedCount || 0} arricchite da Trinity AI).`,
      timestamp: new Date().toISOString()
    }
  } catch (err: any) {
    if (err.statusCode) throw err
    throw createError({ statusCode: 500, statusMessage: err?.message || 'Errore interno trigger' })
  }
}

export default defineEventHandler(runHnTrigger)