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
  const parentId = body.parentId ? Number(body.parentId) : null
  const targetType = String(body.targetType || 'post').trim().toLowerCase().slice(0, 50)
  const cleanText = String(body.text || body.content || '').trim()

  const session = parseSessionUser(event)
  const author = (session?.username || String(body.author || 'community').trim()).slice(0, 255)
  const targetUserId = session?.id || (body.userId ? Number(body.userId) : 0)

  if (!rawPostId || Number.isNaN(numericPostId) || numericPostId <= 0 || cleanText.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'postId e testo del commento sono obbligatori.'
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

    // Risolve l'ID utente dal DB se abbiamo lo username ma non l'ID numerico
    let resolvedUserId: number | null = targetUserId > 0 ? targetUserId : null
    if (!resolvedUserId && author && author !== 'community') {
      const userRes = await db.execute(sql`
        SELECT id FROM users WHERE LOWER(username) = LOWER(${author}) LIMIT 1;
      `).catch(() => null)
      const foundUser = extractSqlRows(userRes)[0]
      if (foundUser?.id) resolvedUserId = Number(foundUser.id)
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
        ${parentId && !Number.isNaN(parentId) ? parentId : null},
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
        created_at AS "createdAt";
    `)

    const newComment = extractSqlRows(result)[0] || null

    // Incremento contatore commenti sul modulo di appartenenza
    if (targetType === 'blog') {
      await db.execute(sql`
        UPDATE blog_posts SET comments_count = COALESCE(comments_count, 0) + 1 WHERE id = ${numericPostId};
      `).catch(() => {})
    } else if (targetType === 'node' || targetType === 'thread') {
      await db.execute(sql`
        UPDATE node_threads SET replies_count = COALESCE(replies_count, 0) + 1 WHERE id = ${numericPostId};
      `).catch(() => {})
    } else {
      await db.execute(sql`
        UPDATE posts SET comments_count = COALESCE(comments_count, 0) + 1 WHERE id = ${numericPostId};
      `).catch(() => {})
      await db.execute(sql`
        UPDATE news SET comments_count = COALESCE(comments_count, 0) + 1 WHERE id = ${numericPostId};
      `).catch(() => {})
    }

    // Gamification Pure-SQL (+10 XP)
    const rewardXp = 10
    if (resolvedUserId && resolvedUserId > 0) {
      await db.execute(sql`
        UPDATE users SET xp = COALESCE(xp, 0) + ${rewardXp} WHERE id = ${resolvedUserId};
      `).catch(() => {})

      await db.execute(sql`
        INSERT INTO xp_transactions (user_id, action, points, created_at)
        VALUES (${resolvedUserId}, ${`Comment on ${targetType.toUpperCase()} ID #${numericPostId}`}, ${rewardXp}, NOW());
      `).catch(() => {})
    }

    return {
      success: true,
      message: 'Commento aggiunto con successo! +10 XP ⚡',
      data: newComment,
      comment: newComment,
      xpAwarded: resolvedUserId ? rewardXp : 0
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