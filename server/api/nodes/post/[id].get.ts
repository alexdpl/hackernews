// server/api/nodes/posts/[id].get.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const db = await getDb()
  const postId = Number(getRouterParam(event, 'id'))

  if (!postId || isNaN(postId)) {
    throw createError({ statusCode: 400, statusMessage: 'ID Thread non valido.' })
  }

  try {
    // 1. Recupera il Post Principale con i dati dell'Autore e del Nodo
    const postResult: any = await db.execute(sql`
      SELECT 
        p.id, p.title, p.content, p.karma_score AS "karmaScore", p.comments_count AS "commentsCount",
        p.vault_hash AS "vaultHash", p.is_locked AS "isLocked", p.created_at AS "createdAt",
        n.id AS "nodeId", n.name AS "nodeName", n.slug AS "nodeSlug", n.color AS "nodeColor",
        u.id AS "authorId", u.username AS "authorUsername", u.avatar_url AS "authorAvatar",
        u.xp AS "authorXp", u.badges AS "authorBadges"
      FROM node_posts p
      JOIN nodes n ON p.node_id = n.id
      JOIN users u ON p.author_id = u.id
      WHERE p.id = ${postId}
      LIMIT 1
    `)

    const post = postResult?.rows?.[0] || postResult?.[0]
    if (!post) {
      throw createError({ statusCode: 404, statusMessage: 'Thread non trovato.' })
    }

    // 2. Recupera tutti i commenti del Thread (ordinati per i più vecchi prima, o per Karma)
    const commentsResult: any = await db.execute(sql`
      SELECT 
        c.id, c.parent_id AS "parentId", c.content, c.karma_score AS "karmaScore", c.created_at AS "createdAt",
        u.id AS "authorId", u.username AS "authorUsername", u.avatar_url AS "authorAvatar", u.badges AS "authorBadges"
      FROM node_comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.post_id = ${postId}
      ORDER BY c.karma_score DESC, c.created_at ASC
    `)

    const comments = Array.isArray(commentsResult) ? commentsResult : (commentsResult?.rows || [])

    return {
      success: true,
      data: {
        post,
        comments // Il frontend si occuperà di raggrupparli ad albero tramite parentId
      }
    }
  } catch (error: any) {
    console.error('💥 [NODE THREAD GET ERROR]:', error?.message)
    if (error.statusCode === 404) throw error
    throw createError({ statusCode: 500, statusMessage: 'Errore nel caricamento del Thread.' })
  }
})