import { defineEventHandler, getQuery } from 'h3'
import { getDb } from '~~/server/utils/db'
import { pulseStories } from '~~/server/db/schema'
// server/api/ask/index.get.ts
import { eq, desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const page = Math.max(1, parseInt(query.page as string) || 1)
    const limit = Math.max(1, parseInt(query.limit as string) || 30)
    const offset = (page - 1) * limit

    const db = await getDb()
    if (!db) throw new Error('Database non disponibile')

    const dbAsk = await db
      .select()
      .from(pulseStories)
      .where(eq(pulseStories.type, 'ask'))
      .orderBy(desc(pulseStories.createdAt))
      .limit(limit + 1)
      .offset(offset)

    const hasMore = dbAsk.length > limit
    const items = hasMore ? dbAsk.slice(0, limit) : dbAsk

    return {
      success: true,
      data: items,
      pagination: { page, limit, hasMore }
    }
  } catch (err) {
    return { success: true, data: [], pagination: { page: 1, limit: 30, hasMore: false } }
  }
})