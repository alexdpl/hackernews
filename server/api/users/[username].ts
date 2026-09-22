// server/api/users/[username].ts
import { defineEventHandler, getRouterParam } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const username = getRouterParam(event, 'username')

  if (!username) {
    return {
      success: false,
      error: 'Username non specificato'
    }
  }

  const db = getDb()

  try {
    // 1. Calcola il Karma (somma dei punti dei post dell'utente) e la data di registrazione (prima attività)
    const statsResult: any = await db.execute(sql`
      SELECT 
        COALESCE(SUM(points), 0) AS karma,
        MIN(created_at) AS "joinedAt",
        COUNT(*) AS "totalSubmissions"
      FROM posts
      WHERE author = ${username}
    `)

    const stats = statsResult[0] || statsResult?.rows?.[0] || { karma: 0, joinedAt: null, totalSubmissions: 0 }

    // 2. Recupera i post sottomessi dall'utente ordinati per data
    const postsResult: any = await db.execute(sql`
      SELECT id, title, url, text, author, type, points, 
             COALESCE(comments_count, 0) AS "commentsCount",
             COALESCE(created_at, NOW()) AS "createdAt"
      FROM posts
      WHERE author = ${username}
      ORDER BY created_at DESC
      LIMIT 50
    `)

    const userPosts = Array.isArray(postsResult) ? postsResult : (postsResult?.rows || [])

    return {
      success: true,
      profile: {
        username,
        karma: Number(stats.karma || 0),
        joinedAt: stats.joinedAt || new Date().toISOString(),
        totalSubmissions: Number(stats.totalSubmissions || 0),
        bio: `Membro della community di DevKernelPulse.`
      },
      posts: userPosts
    }
  } catch (err: any) {
    console.error(`Errore recupero profilo per ${username}:`, err)
    return {
      success: false,
      error: err.message
    }
  }
})