// server/api/pulse/user-stories.get.ts
import { defineEventHandler, getQuery } from 'h3'
import { eq, desc } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { posts } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const userId = query.userId ? Number(query.userId) : 1

  try {
    const db = getDb()
    if (!db) throw new Error('Database non disponibile.')

    const userPosts = await db.select({
      id: posts.id,
      title: posts.title,
      type: posts.type,
      url: posts.url,
      points: posts.points,
      createdAt: posts.createdAt
    })
    .from(posts)
    .where(eq(posts.userId, userId))
    .orderBy(desc(posts.createdAt))

    return {
      success: true,
      data: userPosts
    }
  } catch (err: any) {
    console.error('❌ Errore fetch user-stories:', err?.message)
    return { success: false, message: 'Errore nel recupero dei post.', data: [] }
  }
})