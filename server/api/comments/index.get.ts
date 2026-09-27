// server/api/comments/index.get.ts
import { defineEventHandler, getQuery, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const postId = query.postId ? Number(query.postId) : null

  if (!postId || isNaN(postId) || postId <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'postId obbligatorio e deve essere un numero valido.'
    })
  }

  const db = getDb()

  try {
    // 1. Assicura che la tabella 'comments' esista nel Neon DB
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        post_id INT NOT NULL,
        author VARCHAR(255) NOT NULL,
        text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // 2. Fetch dei commenti per il post specificato
    const res: any = await db.execute(sql`
      SELECT id, post_id AS "postId", author, text, created_at AS "createdAt"
      FROM comments
      WHERE post_id = ${postId}
      ORDER BY created_at ASC
    `)

    const comments = Array.isArray(res) ? res : (res?.rows || [])

    return {
      success: true,
      comments
    }
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage: err.message || 'Errore nel recupero dei commenti'
    })
  }
})