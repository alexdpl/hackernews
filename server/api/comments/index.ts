// server/api/comments/index.ts
import { defineEventHandler, getQuery, readBody, getCookie } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const method = event.node.req.method
  const db = getDb()

  // Assicura che la tabella comments esista
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      post_id INT NOT NULL,
      author VARCHAR(255) NOT NULL,
      text TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `)

  if (method === 'GET') {
    const query = getQuery(event)
    const postId = query.postId

    if (!postId) {
      return { success: false, error: 'postId obbligatorio' }
    }

    try {
      const res: any = await db.execute(sql`
        SELECT id, post_id, author, text, created_at AS "createdAt"
        FROM comments
        WHERE post_id = ${Number(postId)}
        ORDER BY created_at ASC
      `)
      const comments = Array.isArray(res) ? res : (res?.rows || [])
      return { success: true, comments }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  if (method === 'POST') {
    const body = await readBody(event)
    const { postId, text } = body
    const author = getCookie(event, 'dkp_user') || body.author || 'alexdpl'

    if (!postId || !text) {
      return { success: false, error: 'postId e testo del commento obbligatori' }
    }

    try {
      await db.execute(sql`
        INSERT INTO comments (post_id, author, text)
        VALUES (${Number(postId)}, ${author}, ${text})
      `)

      // Aggiorna il contatore dei commenti nel post
      await db.execute(sql`
        UPDATE posts 
        SET comments_count = COALESCE(comments_count, 0) + 1
        WHERE id = ${Number(postId)}
      `)

      return { success: true, message: 'Commento aggiunto con successo' }
    } catch (err: any) {
      console.error('Errore inserimento commento:', err)
      return { success: false, error: err.message }
    }
  }
})