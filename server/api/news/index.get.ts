// server/api/news/index.get.ts
import { defineEventHandler, getQuery } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.max(1, Number(query.limit) || 15)
  const offset = (page - 1) * limit

  const db = await getDb()
  if (!db) {
    return query.paginated === 'true' ? { page, limit, total: 0, data: [] } : []
  }

  try {
    // 1. Conteggio totale delle news nel DB Neon
    const countResult: any = await db.execute(sql`
      SELECT COUNT(*)::int as total FROM pulse_stories WHERE type = 'news';
    `)
    const total = countResult?.rows?.[0]?.total || countResult?.[0]?.total || 0

    // 2. Fetch delle news reali dal database
    const result: any = await db.execute(sql`
      SELECT id, title, url, domain, points, author, comments_count, created_at
      FROM pulse_stories
      WHERE type = 'news'
      ORDER BY created_at DESC, points DESC
      LIMIT ${limit} OFFSET ${offset};
    `)

    const stories = result?.rows || result || []

    // Mappatura pulita dei campi per il frontend
    const formattedStories = stories.map((item: any) => ({
      id: item.id,
      title: item.title,
      domain: item.domain || 'devkernelpulse.org',
      url: item.url || `/item/${item.id}`,
      user: typeof item.author === 'object' ? item.author?.username || 'community' : (item.author || 'community'),
      points: item.points || 1,
      time_ago: 'Recente',
      comments_count: item.comments_count || 0
    }))

    if (query.paginated === 'true') {
      return {
        page,
        limit,
        total,
        data: formattedStories
      }
    }

    return formattedStories
  } catch (err: any) {
    console.error('[NEWS API ERROR]:', err?.message)
    return query.paginated === 'true' ? { page, limit, total: 0, data: [] } : []
  }
})