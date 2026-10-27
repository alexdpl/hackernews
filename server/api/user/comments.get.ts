// server/api/user/comments.get.ts
import { defineEventHandler, getCookie } from 'h3'
import { eq, desc } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { users, comments, posts } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const username = getCookie(event, 'dkp_user') || 'alexdpl'
  const db = getDb()

  try {
    const userRecords = await db.select().from(users).where(eq(users.username, username)).limit(1)
    if (userRecords.length === 0) return { success: true, data: [] }
    const userId = userRecords[0].id

    // Recuperiamo i commenti dell'utente unendoli al titolo del post collegato
    const userComments = await db.select({
      id: comments.id,
      content: comments.content,
      postId: comments.postId,
      postTitle: posts.title,
      createdAt: comments.createdAt
    })
    .from(comments)
    .innerJoin(posts, eq(comments.postId, posts.id))
    .where(eq(comments.userId, userId))
    .orderBy(desc(comments.createdAt))

    return {
      success: true,
      data: userComments.map(c => ({
        ...c,
        date: c.createdAt ? c.createdAt.toISOString().split('T')[0] : '2026-10-12'
      }))
    }
  } catch (err: any) {
    console.error('❌ Errore fetch commenti utente:', err)
    return { success: false, data: [] }
  }
})