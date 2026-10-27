// server/api/nodes/posts.get.ts
import { defineEventHandler, getQuery } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const nodeSlug = query.nodeSlug ? String(query.nodeSlug).trim() : null
  const sort = query.sort ? String(query.sort).toLowerCase() : 'hot'

  try {
    const db = await getDb()
    if (!db) {
      return { success: true, posts: [] }
    }

    // Definizione dinamica dell'ordinamento
    let orderByClause = sql`p.is_pinned DESC, p.created_at DESC`
    if (sort === 'top') {
      orderByClause = sql`p.is_pinned DESC, p.karma_score DESC, p.created_at DESC`
    } else if (sort === 'hot') {
      // Algoritmo Hot: bilancia karma e freschezza temporale
      orderByClause = sql`p.is_pinned DESC, (p.karma_score + 1) / POWER(EXTRACT(EPOCH FROM (NOW() - p.created_at))/3600 + 2, 1.5) DESC`
    }

    // Query con Join su users e nodes
    const result: any = await db.execute(sql`
      SELECT 
        p.id,
        p.title,
        p.content,
        p.karma_score AS "karmaScore",
        p.comments_count AS "commentsCount",
        p.vault_hash AS "vaultHash",
        p.is_pinned AS "isPinned",
        p.is_locked AS "isLocked",
        p.created_at AS "createdAt",
        n.id AS "nodeId",
        n.name AS "nodeName",
        n.slug AS "nodeSlug",
        n.icon AS "nodeIcon",
        n.color AS "nodeColor",
        u.id AS "authorId",
        u.username AS "authorUsername",
        u.avatar_url AS "authorAvatar"
      FROM node_posts p
      JOIN nodes n ON p.node_id = n.id
      JOIN users u ON p.author_id = u.id
      ${nodeSlug ? sql`WHERE n.slug = ${nodeSlug}` : sql``}
      ORDER BY ${orderByClause};
    `)

    const rows = Array.isArray(result) ? result : (result?.rows || [])

    return {
      success: true,
      count: rows.length,
      posts: rows
    }
  } catch (err: any) {
    console.error('❌ [NODE POSTS GET ERROR]:', err?.message)
    return {
      success: false,
      message: 'Errore nel recupero dei thread.',
      posts: []
    }
  }
})