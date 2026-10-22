// server/api/ask/index.get.ts
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

    const dbAsks = await db
      .select()
      .from(pulseStories)
      .where(eq(pulseStories.type, 'ask'))
      .orderBy(desc(pulseStories.createdAt))
      .limit(limit + 1)
      .offset(offset)

    const hasMore = dbAsks.length > limit
    const items = hasMore ? dbAsks.slice(0, limit) : dbAsks

    const formattedAsks = items.map((a: any) => ({
      id: a.id,
      title: a.title,
      url: a.url || `/item/${a.id}`,
      domain: a.domain || 'devkernelpulse.org',
      author: typeof a.author === 'object' ? a.author?.username : (a.author || 'community'),
      points: a.points || 1,
      createdAt: a.createdAt || new Date()
    }))

    return {
      success: true,
      data: formattedAsks,
      pagination: {
        page,
        limit,
        hasMore
      }
    }
  } catch (err) {
    console.warn('⚠️ [ASK API WARN] Errore lettura DB:', err)
    return {
      success: true,
      data: [],
      pagination: { page: 1, limit: 15, hasMore: false }
    }
  }
})