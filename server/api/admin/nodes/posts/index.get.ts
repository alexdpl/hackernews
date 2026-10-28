// server/api/admin/nodes/posts/index.get.ts
import { defineEventHandler, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async () => {
  try {
    const db = await getDb()
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
        u.username AS "authorName"
      FROM node_posts p
      JOIN nodes n ON p.node_id = n.id
      JOIN users u ON p.author_id = u.id
      ORDER BY p.is_pinned DESC, p.created_at DESC;
    `)
    const rows = Array.isArray(result) ? result : (result?.rows || [])
    return { success: true, data: rows }
  } catch (err: any) {
    throw createError({ statusCode: 500, statusMessage: err.message })
  }
})