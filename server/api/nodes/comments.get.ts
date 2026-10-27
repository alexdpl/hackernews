// server/api/nodes/comments.get.ts
import { defineEventHandler, getQuery, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const postId = Number(query.postId)

  if (!postId || isNaN(postId)) {
    throw createError({ statusCode: 400, statusMessage: 'ID post non valido.' })
  }

  try {
    const db = await getDb()
    if (!db) return { success: true, comments: [] }

    const result: any = await db.execute(sql`
      SELECT 
        c.id,
        c.post_id AS "postId",
        c.author_id AS "authorId",
        c.parent_id AS "parentId",
        c.content,
        c.karma_score AS "karmaScore",
        c.created_at AS "createdAt",
        u.username AS "authorUsername",
        u.avatar_url AS "authorAvatar"
      FROM node_comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.post_id = ${postId}
      ORDER BY c.created_at ASC;
    `)

    const rows = Array.isArray(result) ? result : (result?.rows || [])

    return {
      success: true,
      count: rows.length,
      comments: rows
    }
  } catch (err: any) {
    console.error('❌ [NODE COMMENTS GET ERROR]:', err?.message)
    return { success: false, message: 'Errore nel recupero dei commenti.', comments: [] }
  }
})