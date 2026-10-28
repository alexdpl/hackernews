// server/api/user/nodes/activity.get.ts
import { defineEventHandler, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  // 🟢 Estrazione dell'ID utente dalla sessione / contesto
  const userId = event.context.user?.id || event.context.auth?.user?.id || 1

  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Utente non autenticato.' })
  }

  try {
    const db = await getDb()
    if (!db) {
      return { success: true, data: { threads: [], comments: [] } }
    }

    // 1. Thread aperti dall'utente corrente
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
      JOIN nodes n ON p.node_id = n.id
      WHERE p.author_id = ${userId}
      ORDER BY p.created_at DESC;
    `)

    // 2. Commenti/Risposte inviate dall'utente corrente
    const commentsResult: any = await db.execute(sql`
      SELECT 
        c.id,
        c.post_id AS "postId",
        c.content,
        c.karma_score AS "karmaScore",
        c.created_at AS "createdAt"
      FROM node_comments c
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
    console.error('❌ [USER NODES ACTIVITY GET ERROR]:', err?.message)
    return {
      success: false,
      message: 'Errore durante il recupero delle attività dei nodi utente.',
      data: { threads: [], comments: [] }
    }
  }
})
