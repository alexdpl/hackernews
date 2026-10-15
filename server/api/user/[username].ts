// server/api/users/[username].ts
import { defineEventHandler, getRouterParam } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const username = getRouterParam(event, 'username')

  if (!username) {
    return { success: false, error: 'Username non specificato' }
  }

  const db = getDb()

  try {
    // 1. Assicuriamoci che la tabella users esista
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        username VARCHAR(255) PRIMARY KEY,
        bio TEXT DEFAULT '',
        avatar TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // 2. Recupera o inizializza l'utente nella tabella users
    let userResult: any = await db.execute(sql`
      SELECT bio, avatar, created_at AS "dbJoinedAt" FROM users WHERE username = ${username}
    `)
    let userData = userResult[0] || userResult?.rows?.[0]

    if (!userData) {
      // Se non esiste ancora nella tabella users, lo creiamo al volo
      await db.execute(sql`
        INSERT INTO users (username, bio, avatar) 
        VALUES (${username}, 'Membro della community di DevKernelPulse.', '')
        ON CONFLICT (username) DO NOTHING
      `)
      userData = { bio: 'Membro della community di DevKernelPulse.', avatar: '', dbJoinedAt: new Date() }
    }

    // 3. Calcola il Karma (somma dei punti dei post) e le sottomissioni
    const statsResult: any = await db.execute(sql`
      SELECT 
        COALESCE(SUM(points), 0) AS karma,
        MIN(created_at) AS "joinedAt",
        COUNT(*) AS "totalSubmissions"
      FROM posts
      WHERE author = ${username}
    `)
    const stats = statsResult[0] || statsResult?.rows?.[0] || { karma: 0, joinedAt: null, totalSubmissions: 0 }

    // 4. Recupera i post sottomessi dall'utente
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

    // Avatar di fallback automatico (stile developer robot/pixel art basato sul nome)
    const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`

    return {
      success: true,
      profile: {
        username,
        karma: Number(stats.karma || 0),
        joinedAt: stats.joinedAt || userData.dbJoinedAt || new Date().toISOString(),
        totalSubmissions: Number(stats.totalSubmissions || 0),
        bio: userData.bio || 'Membro della community di DevKernelPulse.',
        avatar: userData.avatar || defaultAvatar
      },
      posts: userPosts
    }
  } catch (err: any) {
    console.error(`Errore recupero profilo per ${username}:`, err)
    return { success: false, error: err.message }
  }
})