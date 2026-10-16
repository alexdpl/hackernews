// server/api/comments/index.post.ts
import { defineEventHandler, readBody, getCookie, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { users, xpTransactions } from '~~/drizzle/schema'

export default defineEventHandler(async (event) => {
  const body = await readBody(event) || {}
  const { postId, text, userId } = body
  const numericPostId = Number(postId)
  
  // Estrazione sicura dell'autore (cookie di sessione o fallback)
  let author = body.author || 'alexdpl'
  let targetUserId = userId ? Number(userId) : 1

  const sessionCookie = getCookie(event, 'dkp_session')
  if (sessionCookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(sessionCookie))
      if (parsed.username) author = parsed.username
      if (parsed.id) targetUserId = Number(parsed.id)
    } catch (_) {}
  }

  if (!postId || isNaN(numericPostId) || !text || text.trim().length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'postId e testo del commento sono obbligatori.'
    })
  }

  try {
    // Correzione v2.5-GOLD: getDb() è asincrono
    const db = await getDb()
    if (!db) {
      throw createError({ statusCode: 500, statusMessage: 'Database Neon non disponibile.' })
    }

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

    // 4. GAMIFICATION v2.5-GOLD: Assegnazione +10 XP all'utente per il commento pubblicato
    const rewardXp = 10
    await db.execute(sql`
      UPDATE users SET xp = COALESCE(xp, 0) + ${rewardXp} WHERE id = ${targetUserId}
    `)

    await db.insert(xpTransactions).values({
      userId: targetUserId,
      action: `Comment on Post ID #${numericPostId}`,
      points: rewardXp
    }).catch(() => {})

    return {
      success: true,
      message: 'Commento aggiunto con successo! +10 XP ⚡',
      data: newComment,
      xpAwarded: rewardXp
    }
  } catch (err: any) {
    if (err.statusCode) throw err
    throw createError({
      statusCode: 500,
      statusMessage: err.message || 'Errore durante il salvataggio del commento'
    })
  }
})