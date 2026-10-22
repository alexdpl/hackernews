// server/api/show/index.get.ts
import { defineEventHandler, getQuery } from 'h3'
import { getDb } from '~~/server/utils/db'
import { pulseStories } from '~~/server/db/schema'
import { eq, desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const page = Math.max(1, parseInt(query.page as string) || 1)
    const limit = Math.max(1, parseInt(query.limit as string) || 15)
    const offset = (page - 1) * limit

    const db = await getDb()
    if (!db) throw new Error('Database non disponibile')

    const dbShows = await db
      .select()
      .from(pulseStories)
      .where(eq(pulseStories.type, 'show'))
      .orderBy(desc(pulseStories.createdAt))
      .limit(limit + 1)
      .offset(offset)

    const hasMore = dbShows.length > limit
    const items = hasMore ? dbShows.slice(0, limit) : dbShows

    const formattedShows = items.map((s: any) => ({
      id: s.id,
      title: s.title,
      url: s.url || '#',
      domain: s.domain || 'github.com',
      author: typeof s.author === 'object' ? s.author?.username : (s.author || 'community'),
      points: s.points || 1,
      createdAt: s.createdAt || new Date()
    }))

    return {
      success: true,
      data: formattedShows,
      pagination: {
        page,
        limit,
        hasMore
      }
    }
  } catch (err) {
    console.warn('⚠️ [SHOW API WARN] Errore lettura DB:', err)
    return {
      success: true,
      data: [],
      pagination: { page: 1, limit: 15, hasMore: false }
    }
  }
})
 