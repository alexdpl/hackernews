// server/api/user/contents.get.ts
import { defineEventHandler, getCookie } from 'h3'
import { eq, desc } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { users, posts } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const username = getCookie(event, 'dkp_user') || 'alexdpl'
  const db = getDb() 

  try {
    const userRecords = await db.select().from(users).where(eq(users.username, username)).limit(1)
    if (userRecords.length === 0) {
      return { success: true, hnPosts: [] }
    }
    const userId = userRecords[0].id

    // Peschiamo solo i post reali scritti dall'utente dal database Neon
    const hnPosts = await db.select({
      id: posts.id,
      title: posts.title,
      url: posts.url,
      type: posts.type,
      points: posts.points,
      commentsCount: posts.commentsCount,
      createdAt: posts.createdAt
    })
    .from(posts)
    .where(eq(posts.userId, userId))
    .orderBy(desc(posts.createdAt))

    return {
      success: true,
      hnPosts: hnPosts.map(p => ({
        ...p,
        createdAt: p.createdAt ? p.createdAt.toISOString().split('T')[0] : '2026-10-12'
      }))
    }
  } catch (err: any) {
    console.error('Errore API contents:', err)
    return { success: false, error: err.message, hnPosts: [] }
  }
})