// server/api/user/comments.get.ts
import { defineEventHandler, getQuery, getCookie, setResponseHeaders } from 'h3'
import { eq, desc } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { users, comments, posts } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  setResponseHeaders(event, {
    'X-Cloud-Region': 'europe-west4',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  })

  const query = getQuery(event)
  const usernameParam = query.username ? String(query.username) : null
  const cookieUsername = getCookie(event, 'dkp_user')
  const username = usernameParam || cookieUsername || 'alexdpl'

  const db = getDb()

  try {
    // 1. Individuazione utente per username o query param userId
    let userId: number | null = query.userId ? Number(query.userId) : null

    if (!userId) {
      const userRecords = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1)
      if (userRecords.length === 0) return { success: true, data: [] }
      userId = userRecords[0].id
    }

    // 2. Recupero commenti dell'utente con leftJoin per non scartare commenti a post orfani
    const userComments = await db.select({
      id: comments.id,
      content: comments.content,
      postId: comments.postId,
      postTitle: posts.title,
      createdAt: comments.createdAt
    })
    .from(comments)
    .leftJoin(posts, eq(comments.postId, posts.id))
    .where(eq(comments.userId, userId))
    .orderBy(desc(comments.createdAt))

    // 3. Formattazione sicura delle date senza eccezioni di tipo
    const formattedData = userComments.map(c => {
      let dateStr = '2026-10-12'
      if (c.createdAt) {
        if (c.createdAt instanceof Date) {
          dateStr = c.createdAt.toISOString().split('T')[0]
        } else {
          dateStr = String(c.createdAt).split('T')[0]
        }
      }

      return {
        id: c.id,
        content: c.content,
        postId: c.postId,
        postTitle: c.postTitle || 'Post non più disponibile',
        createdAt: c.createdAt,
        date: dateStr
      }
    })

    return {
      success: true,
      data: formattedData
    }
  } catch (err: any) {
    console.error('❌ Errore fetch commenti utente:', err?.message || err)
    return { success: false, data: [] }
  }
})