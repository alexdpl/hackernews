// server/api/comments/index.post.ts
import { defineEventHandler, readBody, getCookie, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { postId, text } = body
  const numericPostId = Number(postId)
  const author = getCookie(event, 'dkp_user') || body.author || 'alexdpl'

  if (!postId || isNaN(numericPostId) || !text || text.trim().length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'postId e testo del commento sono obbligatori.'
    })
  }

  const db = getDb()

  try {
    // 1. Assicura l'esistenza della tabella
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        post_id INT NOT NULL,
        author VARCHAR(255) NOT NULL,
        text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // 2. Inserimento del nuovo commento
    const result: any = await db.execute(sql`
      INSERT INTO comments (post_id, author, text)
      VALUES (${numericPostId}, ${author}, ${text.trim()})
      RETURNING id, post_id AS "postId", author, text, created_at AS "createdAt"
    `)

    const newComment = Array.isArray(result) ? result[0] : (result?.rows?.[0] || null)

    // 3. Aggiornamento contatore dei commenti nella tabella 'posts'
    await db.execute(sql`
      UPDATE posts
      SET comments_count = COALESCE(comments_count, 0) + 1
      WHERE id = ${numericPostId}
    `)

    return {
      success: true,
      message: 'Commento aggiunto con successo',
      data: newComment
    }
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage: err.message || 'Errore durante il salvataggio del commento'
    })
  }
})