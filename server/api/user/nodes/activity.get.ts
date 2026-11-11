// server/api/user/nodes/activity.get.ts
import { defineEventHandler, getQuery, getCookie, setResponseHeaders, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  setResponseHeaders(event, {
    'X-Cloud-Region': 'europe-west4',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  })

  // Estrazione flessibile dell'ID utente da Context, Query o Cookie
  const query = getQuery(event)
  const sessionCookie = getCookie(event, 'dkp_session')
  const userIdCookie = getCookie(event, 'dkp_user_id') || getCookie(event, 'user_id')

  let userId: number | null = (event.context as any).user?.id || (event.context as any).auth?.user?.id || null

  if (!userId && query.userId) {
    userId = Number(query.userId)
  }

  if (!userId && sessionCookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(sessionCookie))
      if (parsed?.id) userId = Number(parsed.id)
    } catch (_) {}
  }

  if (!userId && userIdCookie) {
    userId = parseInt(userIdCookie, 10)
  }

  // Fallback ad ID 1 se l'utente non è autenticato in dev/test
  if (!userId || isNaN(userId)) {
    userId = 1
  }

  try {
    const db = getDb()
    if (!db) {
      return { 
        success: true, 
        data: { threads: [], comments: [] } 
      }
    }

    // 1. Thread aperti dall'utente corrente (con LEFT JOIN di sicurezza)
    const threadsResult: any = await db.execute(sql`
      SELECT 
        p.id,
        p.title,
        p.karma_score AS "karmaScore",
        p.comments_count AS "commentsCount",
        p.created_at AS "createdAt",
        n.name AS "nodeName",
        n.slug AS "nodeSlug"
      FROM node_posts p
      LEFT JOIN nodes n ON p.node_id = n.id
      WHERE p.author_id = ${userId}
      ORDER BY p.created_at DESC;
    `)

    // 2. Commenti/Risposte inviate dall'utente corrente (con titolo post associato)
    const commentsResult: any = await db.execute(sql`
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

    const threads = Array.isArray(threadsResult) ? threadsResult : (threadsResult?.rows || [])
    const comments = Array.isArray(commentsResult) ? commentsResult : (commentsResult?.rows || [])

    return {
      success: true,
      data: {
        threads,
        comments
      }
    }
  } catch (err: any) {
    console.error('❌ [USER NODES ACTIVITY GET ERROR]:', err?.message || err)
    return {
      success: false,
      message: 'Errore durante il recupero delle attività dei nodi utente.',
      data: { threads: [], comments: [] }
    }
  }
})