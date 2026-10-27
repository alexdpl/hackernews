// server/api/comments/user.get.ts
import { defineEventHandler, getQuery } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const username = query.username as string

  if (!username || username === 'undefined' || username === '') {
    return { success: true, comments: [] }
  }

  try {
    const db = await getDb()
    if (!db) throw new Error('Database non disponibile.')

    // Usiamo c.content al posto di c.text per allinearci esattamente al DB Neon
    const result: any = await db.execute(sql`
      SELECT c.id, c.post_id AS "postId", c.content AS "text", c.created_at AS "createdAt"
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE u.username = ${username}
      ORDER BY c.created_at DESC;
    `)

    const rows = Array.isArray(result) ? result : (result?.rows || [])

    return {
      success: true,
      comments: rows
    }
  } catch (err: any) {
    console.error('❌ Errore fetch user comments:', err?.message)
    return { success: false, message: 'Errore nel recupero dei commenti.', comments: [] }
  }
})