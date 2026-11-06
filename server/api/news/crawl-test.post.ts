// server/api/news/crawl-test.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { ingestHnFeed } from '../../utils/hnFetcher'
import { getDb } from '../../utils/db'
import { sql } from 'drizzle-orm'

function generateSlug(title: string, id: number): string {
  const cleanTitle = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80)

  return `${cleanTitle}-${id}`
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event).catch(() => ({}))
    const type = body?.type === 'show' ? 'show' : 'top'
    const limit = Math.min(Number(body?.limit) || 15, 50)

    console.log(`[Crawl Test] Avvio ingestione HN (${type}, limit: ${limit})...`)

    const result = await ingestHnFeed(type, limit)
    const db = getDb()
    const insertedRecords: any[] = []

    for (const story of result.newStories) {
      const storySlug = generateSlug(story.title, story.id)
      const categoryName = type === 'show' ? 'Show HN' : 'Tech'

      const res = await db.execute(sql`
        INSERT INTO hn_stories (
          hn_id, 
          title, 
          original_url, 
          slug, 
          hn_points, 
          hn_by, 
          category,
          processed_by_ai
        )
        VALUES (
          ${story.id}, 
          ${story.title}, 
          ${story.url || null}, 
          ${storySlug}, 
          ${story.score || 0}, 
          ${story.by || 'anonymous'}, 
          ${categoryName}, 
          FALSE
        )
        ON CONFLICT (hn_id) DO NOTHING
        RETURNING id, hn_id, title, slug, hn_points, original_url
      `)

      const rows: any[] = Array.isArray(res) ? res : (res.rows || [])
      if (rows.length > 0) {
        insertedRecords.push(rows[0])
      }
    }

    return {
      success: true,
      timestamp: new Date().toISOString(),
      metrics: {
        totalCandidateIds: result.totalFetched,
        alreadyInDbSkipped: result.alreadyInDb,
        newStoriesFetched: result.newStories.length,
        insertedToDb: insertedRecords.length
      },
      previewInserted: insertedRecords
    }
  } catch (error: any) {
    console.error('[Crawl Test Error]:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Errore durante il test di crawl: ${error.message}`
    })
  }
})