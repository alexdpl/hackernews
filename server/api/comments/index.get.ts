// server/api/comments/index.get.ts
import { defineEventHandler, getQuery } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { ensureUnifiedCommentsSchema, extractSqlRows } from '~~/server/utils/dkpComments'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const rawId = query.postId ?? query.itemId ?? query.storyId
  const postId = rawId ? Number(rawId) : null
  const targetType = query.targetType ? String(query.targetType).trim().toLowerCase() : null

  if (!postId || Number.isNaN(postId) || postId <= 0) {
    return { success: true, comments: [] }
  }

  try {
    const db = await getDb()
    if (!db) return { success: true, comments: [] }

    await ensureUnifiedCommentsSchema(db)

    const res: any = targetType
      ? await db.execute(sql`
          SELECT
            c.id,
            c.post_id AS "postId",
            c.user_id AS "userId",
            c.parent_id AS "parentId",
            COALESCE(NULLIF(c.target_type, ''), 'post') AS "targetType",
            COALESCE(NULLIF(c.author, ''), u.username, 'community') AS author,
            COALESCE(NULLIF(c.text, ''), c.content, '') AS text,
            c.created_at AS "createdAt",
            c.updated_at AS "updatedAt"
          FROM comments c
          LEFT JOIN users u ON c.user_id = u.id
          WHERE c.post_id = ${postId}
            AND COALESCE(NULLIF(c.target_type, ''), 'post') = ${targetType}
          ORDER BY c.created_at ASC;
        `)
      : await db.execute(sql`
          SELECT
            c.id,
            c.post_id AS "postId",
            c.user_id AS "userId",
            c.parent_id AS "parentId",
            COALESCE(NULLIF(c.target_type, ''), 'post') AS "targetType",
            COALESCE(NULLIF(c.author, ''), u.username, 'community') AS author,
            COALESCE(NULLIF(c.text, ''), c.content, '') AS text,
            c.created_at AS "createdAt",
            c.updated_at AS "updatedAt"
          FROM comments c
          LEFT JOIN users u ON c.user_id = u.id
          WHERE c.post_id = ${postId}
          ORDER BY c.created_at ASC;
        `)

    const rows = extractSqlRows(res)

    const comments = rows.map((c: any) => ({
      id: Number(c.id),
      postId: Number(c.postId),
      userId: c.userId ? Number(c.userId) : null,
      parentId: c.parentId !== null && c.parentId !== undefined ? Number(c.parentId) : null,
      targetType: c.targetType || 'post',
      author: typeof c.author === 'object' ? c.author?.username : (c.author || 'community'),
      text: c.text || '',
      createdAt: c.createdAt || new Date(),
      updatedAt: c.updatedAt || null
    }))

    return {
      success: true,
      comments
    }
  } catch (err: any) {
    console.warn('⚠️ [COMMENTS GET WARN]:', err?.message)
    return {
      success: true,
      comments: []
    }
  }
})