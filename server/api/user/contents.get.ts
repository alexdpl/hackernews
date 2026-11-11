// server/api/user/contents.get.ts
import { defineEventHandler, getQuery, getCookie, setResponseHeaders } from 'h3'
import { eq, desc } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { users, posts } from '~~/server/db/schema'

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
      if (userRecords.length === 0) {
        return { success: true, hnPosts: [] }
      }
      userId = userRecords[0].id
    }

    // 2. Recupero dei post/condivisioni reali scritti dall'utente dal database Neon
    const userPosts = await db.select({
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

    // 3. Formattazione sicura delle date
    const hnPosts = userPosts.map(p => {
      let dateStr = '2026-10-12'
      if (p.createdAt) {
        if (p.createdAt instanceof Date) {
          dateStr = p.createdAt.toISOString().split('T')[0]
        } else {
          dateStr = String(p.createdAt).split('T')[0]
        }
      }

      return {
        ...p,
        createdAt: dateStr
      }
    })

    return {
      success: true,
      hnPosts
    }
  } catch (err: any) {
    console.error('❌ Errore API contents:', err?.message || err)
    return { 
      success: false, 
      error: err?.message || 'Errore database', 
      hnPosts: [] 
    }
  }
})