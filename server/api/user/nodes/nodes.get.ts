// server/api/user/nodes.get.ts
import { defineEventHandler, getCookie } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const sessionCookie = getCookie(event, 'dkp_session')
  let userId = null
  
  if (sessionCookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(sessionCookie))
      userId = parsed.id ? Number(parsed.id) : null
    } catch (_) {}
  }

  // Fallback a ID 1 per test se la sessione non è presente
  if (!userId) userId = 1 

  try {
    const db = await getDb()
    if (!db) return { success: false, threads: [], comments: [] }

    // 1. Recupero Thread dell'utente
    const threadsRes: any = await db.execute(sql`
      SELECT p.id, p.title, p.karma_score AS "karmaScore", p.comments_count AS "commentsCount", p.created_at AS "createdAt", n.slug AS "nodeSlug"
      FROM node_posts p
      JOIN nodes n ON p.node_id = n.id
      WHERE p.author_id = ${userId}
      ORDER BY p.created_at DESC;
    `)

    // 2. Recupero Risposte/Commenti dell'utente
    const commentsRes: any = await db.execute(sql`
      SELECT id, post_id AS "postId", content, karma_score AS "karmaScore", created_at AS "createdAt"
      FROM node_comments
      WHERE author_id = ${userId}
      ORDER BY created_at DESC;
    `)

    return {
      success: true,
      threads: Array.isArray(threadsRes) ? threadsRes : (threadsRes?.rows || []),
      comments: Array.isArray(commentsRes) ? commentsRes : (commentsRes?.rows || [])
    }
  } catch (err: any) {
    console.error('❌ [USER NODES ERROR]:', err)
    return { success: false, threads: [], comments: [] }
  }
})