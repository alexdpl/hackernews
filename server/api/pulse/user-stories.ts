// server/api/pulse/user-stories.get.ts
import { defineEventHandler, getQuery } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  
  // Gestione sicura del parametro
  if (!query.userId || query.userId === 'undefined' || query.userId === '') {
    return { success: true, data: [] }
  }

  const userId = Number(query.userId)
  const username = query.username as string

  try {
    const db = await getDb()
    if (!db) throw new Error('Database non disponibile.')

    // Recupera i post creati dall'utente (escludiamo quelli del blog interno per questa tab)
    const result: any = await db.execute(sql`
      SELECT id, title, type, url, domain, points, created_at
      FROM posts
      WHERE author_id = ${userId} OR author = ${username}
      ORDER BY created_at DESC;
    `)

    const rows = Array.isArray(result) ? result : (result?.rows || [])

    return {
      success: true,
      data: rows
    }
  } catch (err: any) {
    console.error('❌ Errore fetch user-stories:', err?.message)
    return { success: false, message: 'Errore nel recupero dei post.', data: [] }
  }
})