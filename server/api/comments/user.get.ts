// server/api/comments/user.get.ts
import { defineEventHandler, getQuery } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const username = query.username as string

  // Ignora le chiamate inviate erroneamente durante il caricamento
  if (!username || username === 'undefined' || username === '') {
    return { success: true, comments: [] }
  }

  try {
    const db = await getDb()
    if (!db) throw new Error('Database non disponibile.')

    // Recupera tutti i commenti scritti da questo username
    const result: any = await db.execute(sql`
      SELECT id, post_id AS "postId", text, created_at AS "createdAt"
      FROM comments
      WHERE author = ${username}
      ORDER BY created_at DESC;
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