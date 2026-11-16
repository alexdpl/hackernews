// server/api/comments/user.get.ts
import { defineEventHandler, getQuery } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { ensureUnifiedCommentsSchema, extractSqlRows } from '~~/server/utils/dkpComments'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const username = String(query.username || '').trim()

  if (!username || username === 'undefined') {
    return { success: true, comments: [] }
  }

  try {
    const db = await getDb()
    if (!db) throw new Error('Database non disponibile.')

    await ensureUnifiedCommentsSchema(db)

    const result: any = await db.execute(sql`
      SELECT
        c.id,
        c.post_id AS "postId",
        COALESCE(NULLIF(c.target_type, ''), 'post') AS "targetType",
        COALESCE(NULLIF(c.text, ''), c.content, '') AS "text",
        c.created_at AS "createdAt"
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE LOWER(u.username) = LOWER(${username})
         OR LOWER(c.author) = LOWER(${username})
      ORDER BY c.created_at DESC
      LIMIT 100;
    `)

    const rows = extractSqlRows(result)

    return {
      success: true,
      comments: rows
    }
  } catch (err: any) {
    console.error('❌ Errore fetch user comments:', err?.message)
    return { success: false, message: 'Errore nel recupero dei commenti.', comments: [] }
  }
})