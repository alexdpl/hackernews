// server/api/comments/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import {
  ensureUnifiedCommentsSchema,
  extractSqlRows,
  parseSessionUser
} from '~~/server/utils/dkpComments'

export default defineEventHandler(async (event) => {
  const body = (await readBody(event).catch(() => ({}))) || {}
  const rawPostId = body.postId ?? body.itemId ?? body.storyId
  const numericPostId = Number(rawPostId)
  const numericParentId = body.parentId ? Number(body.parentId) : null
  const targetType = String(body.targetType || 'post').trim().toLowerCase().slice(0, 50)
  const cleanText = String(body.text || body.content || '').trim()

  // Identità ricavata SOLO dalla sessione lato server (mai dal body)
  const session = parseSessionUser(event)
  if (!session?.id || Number(session.id) <= 0) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Devi effettuare il login per pubblicare un commento.'
    })
  }

  if (!rawPostId || Number.isNaN(numericPostId) || numericPostId <= 0 || cleanText.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'postId e testo del commento sono obbligatori.'
    })
  }

  if (numericParentId !== null && (Number.isNaN(numericParentId) || numericParentId <= 0)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'parentId non valido.'
    })
  }

  if (cleanText.length > 5000) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Il commento supera il limite massimo di 5000 caratteri.'
    })
  }

  try {
    const db = await getDb()
    if (!db) {
      throw createError({ statusCode: 500, statusMessage: 'Database Neon non disponibile.' })
    }

    await ensureUnifiedCommentsSchema(db)

    // Verifica che l'utente della sessione esista realmente nel DB
    const userRes = await db.execute(sql`
      SELECT id, username FROM users WHERE id = ${Number(session.id)} LIMIT 1;
    `)
    const dbUser = extractSqlRows(userRes)[0]
    if (!dbUser?.id) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Sessione non valida o utente inesistente.'
      })
    }

    const resolvedUserId = Number(dbUser.id)
    const author = String(dbUser.username || session.username || 'member').slice(0, 255)

    // Se il target è un thread dei nodi, verifica esistenza e stato is_locked
    if (targetType === 'node' || targetType === 'thread') {
      const threadRes = await db.execute(sql`
        SELECT id, is_locked AS "isLocked"
        FROM node_posts
        WHERE id = ${numericPostId}
        LIMIT 1;
      `)
      const targetThread = extractSqlRows(threadRes)[0]
      if (!targetThread) {
        throw createError({ statusCode: 404, statusMessage: 'Discussione non trovata.' })
      }
      if (targetThread.isLocked) {
        throw createError({ statusCode: 403, statusMessage: 'Questo thread è bloccato e non accetta nuovi commenti.' })
      }
    }

    // Inserimento sincronizzato su colonne unificate (text + content, author + user_id)
    const result: any = await db.execute(sql`
      INSERT INTO comments (
        post_id,
        user_id,
        parent_id,
        target_type,
        author,
        text,
        content,
        created_at
      )
      VALUES (
        ${numericPostId},
        ${resolvedUserId},
        ${numericParentId},
        ${targetType},
        ${author},
        ${cleanText},
        ${cleanText},
        NOW()
      )
      RETURNING
        id,
        post_id AS "postId",
        user_id AS "userId",
        parent_id AS "parentId",
        target_type AS "targetType",
        author,
        text,
        content,
        created_at AS "createdAt";
    `)

    const newComment = extractSqlRows(result)[0] || null

    // Incremento contatore commenti sulla tabella corretta dello schema
    if (targetType === 'blog') {
      await db.execute(sql`
        UPDATE blog_posts SET comments_count = COALESCE(comments_count, 0) + 1 WHERE id = ${numericPostId};
      `).catch(() => {})
    } else if (targetType === 'node' || targetType === 'thread') {
      await db.execute(sql`
        UPDATE node_posts SET comments_count = COALESCE(comments_count, 0) + 1 WHERE id = ${numericPostId};
      `).catch(() => {})
    } else {
      await db.execute(sql`
        UPDATE posts SET comments_count = COALESCE(comments_count, 0) + 1 WHERE id = ${numericPostId};
      `).catch(() => {})
      await db.execute(sql`
        UPDATE news SET comments_count = COALESCE(comments_count, 0) + 1 WHERE id = ${numericPostId};
      `).catch(() => {})
    }

    // Gamification Pure-SQL (+10 XP solo per utente autenticato verificato)
    const rewardXp = 10
    await db.execute(sql`
      UPDATE users SET xp = COALESCE(xp, 0) + ${rewardXp} WHERE id = ${resolvedUserId};
    `).catch(() => {})

    await db.execute(sql`
      INSERT INTO xp_transactions (user_id, action, points, created_at)
      VALUES (${resolvedUserId}, ${`Comment on ${targetType.toUpperCase()} ID #${numericPostId}`}, ${rewardXp}, NOW());
    `).catch(() => {})

    return {
      success: true,
      message: 'Commento aggiunto con successo! +10 XP ⚡',
      data: newComment,
      comment: newComment,
      xpAwarded: rewardXp
    }
  } catch (err: any) {
    console.error('❌ [COMMENTS POST ERROR]:', err)
    if (err.statusCode) throw err
    throw createError({
      statusCode: 500,
      statusMessage: err.message || 'Errore durante il salvataggio del commento'
    })
  }
})