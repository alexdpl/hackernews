// server/api/admin/nodes/posts/index.get.ts
import { defineEventHandler, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { BlockchainService } from '~~/server/utils/blockchainService'

export default defineEventHandler(async () => {
  try {
    const db = await getDb()
    if (!db) throw createError({ statusCode: 500, statusMessage: 'Database offline' })

    await BlockchainService.ensureSchema(db)

    const result: any = await db.execute(sql`
      SELECT 
        p.id,
        p.title,
        p.content,
        p.karma_score AS "karmaScore",
        p.comments_count AS "commentsCount",
        p.vault_hash AS "vaultHash",
        p.vault_block_number AS "vaultBlockNumber",
        p.is_pinned AS "isPinned",
        p.is_locked AS "isLocked",
        p.created_at AS "createdAt",
        n.id AS "nodeId",
        n.name AS "nodeName",
        n.slug AS "nodeSlug",
        n.icon AS "nodeIcon",
        n.color AS "nodeColor",
        n.parent_id AS "nodeParentId",
        COALESCE(u.username, 'community') AS "authorName"
      FROM node_posts p
      LEFT JOIN nodes n ON p.node_id = n.id
      LEFT JOIN users u ON p.author_id = u.id
      ORDER BY p.is_pinned DESC, p.created_at DESC;
    `)
    const rows = Array.isArray(result) ? result : (result?.rows || [])
    return { success: true, data: rows }
  } catch (err: any) {
    throw createError({ statusCode: 500, statusMessage: err.message })
  }
})
2.