// server/api/news/cron.get.ts
import { defineEventHandler, createError, getHeader } from 'h3'
import { sql } from 'drizzle-orm'
import { ingestHnFeed } from '~~/server/utils/hnFetcher'
import { processUnprocessedStories } from '~~/server/utils/hnAiPipeline'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'authorization') || ''
  const xApiKey = getHeader(event, 'x-api-key') || ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim() || xApiKey.trim()

  const expectedSecret = String(process.env.CRON_SECRET || '').trim()

  if (!expectedSecret || token !== expectedSecret) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized: Invalid CRON_SECRET'
    })
  }

  const db = await getDb()
  console.log('[HN Auto-Sync] Avvio ciclo automatico di sincronizzazione...')

  try {
    const topResult = await ingestHnFeed('top', 15)
    const showResult = await ingestHnFeed('show', 10)

    let insertedCount = 0
    const allNewStories = [...topResult.newStories, ...showResult.newStories]

    for (const story of allNewStories) {
      const cleanTitle = story.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .slice(0, 80)
      
      const storySlug = `${cleanTitle}-${story.id}`
      const categoryName = story.type === 'show' ? 'Show HN' : 'Tech'

      const res = await db.execute(sql`
        INSERT INTO hn_stories (
          hn_id, title, original_url, slug, hn_points, hn_by, category, processed_by_ai
        )
        VALUES (
          ${story.id}, ${story.title}, ${story.url || null}, ${storySlug}, 
          ${story.score || 0}, ${story.by || 'anonymous'}, ${categoryName}, FALSE
        )
        ON CONFLICT (hn_id) DO NOTHING
        RETURNING id
      `)

      const rows: any[] = Array.isArray(res) ? res : (res.rows || [])
      if (rows.length > 0) insertedCount++
    }

    const aiResult = await processUnprocessedStories(5)

    return {
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        fetchedFromHn: topResult.totalFetched + showResult.totalFetched,
        newInsertedToDb: insertedCount,
        processedByTrinityAi: aiResult.processedCount
      }
    }
  } catch (err: any) {
    console.error('[HN Auto-Sync Error]:', err)
    throw createError({
      statusCode: 500,
      statusMessage: `Errore nella cron job: ${err.message}`
    })
  }
})