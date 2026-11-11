// server/api/user/nodes/index.get.ts
import { defineEventHandler, getQuery, getCookie, setResponseHeaders } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  setResponseHeaders(event, {
    'X-Cloud-Region': 'europe-west4',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  })

  // Estrazione flessibile dell'ID utente da Query Params o Cookie di Sessione
  const query = getQuery(event)
  const sessionCookie = getCookie(event, 'dkp_session')
  const userIdCookie = getCookie(event, 'dkp_user_id') || getCookie(event, 'user_id')

  let userId: number | null = query.userId ? Number(query.userId) : null

  if (!userId && sessionCookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(sessionCookie))
      if (parsed?.id) userId = Number(parsed.id)
    } catch (_) {}
  }

  if (!userId && userIdCookie) {
    userId = parseInt(userIdCookie, 10)
  }

  // Fallback ad ID 1 se la sessione non è presente o non valida
  if (!userId || isNaN(userId)) {
    userId = 1
  }

  try {
    const db = getDb()
    if (!db) return { success: false, threads: [], comments: [] }

    // 1. Recupero dei Thread del Forum creati dall'utente
    const threadsRes: any = await db.execute(sql`
      SELECT 
        p.id, 
        p.title, 
        p.karma_score AS "karmaScore", 
        p.comments_count AS "commentsCount", 
        p.created_at AS "createdAt", 
        n.slug AS "nodeSlug",
        n.name AS "nodeName"
      FROM node_posts p
      LEFT JOIN nodes n ON p.node_id = n.id
      WHERE p.author_id = ${userId}
      ORDER BY p.created_at DESC;
    `)

    // 2. Recupero delle Risposte/Commenti pubblicati dall'utente nei Forum
    const commentsRes: any = await db.execute(sql`
      SELECT 
        c.id, 
        c.post_id AS "postId", 
        c.content, 
        c.karma_score AS "karmaScore", 
        c.created_at AS "createdAt",
        p.title AS "postTitle"
      FROM node_comments c
      LEFT JOIN node_posts p ON c.post_id = p.id
      WHERE c.author_id = ${userId}
      ORDER BY c.created_at DESC;
    `)

    const threads = Array.isArray(threadsRes) ? threadsRes : (threadsRes?.rows || [])
    const comments = Array.isArray(commentsRes) ? commentsRes : (commentsRes?.rows || [])

    return {
      success: true,
      threads,
      comments
    }
  } catch (err: any) {
    console.error('❌ [USER NODES API ERROR]:', err)
    return { 
      success: false, 
      threads: [], 
      comments: [] 
    }
  }
})