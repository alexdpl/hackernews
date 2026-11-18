// server/api/comments/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { runSentinelPipeline } from '~~/server/utils/sentinelNetwork'
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

    const userRes = await db.execute(sql`
      SELECT id, username, email, COALESCE(is_bot, FALSE) AS "isBot"
      FROM users WHERE id = ${Number(session.id)} LIMIT 1;
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

    if (newComment?.id) {
      const sentinelTask = runSentinelPipeline({
        targetType: 'comment',
        targetId: Number(newComment.id),
        postId: numericPostId,
        sectionSlug: targetType,
        authorId: resolvedUserId,
        authorUsername: author,
        authorEmail: dbUser.email ? String(dbUser.email) : undefined,
        authorIsBot: Boolean(dbUser.isBot),
        content: cleanText
      }).catch((err) => console.error('[SENTINEL PIPELINE ERROR]:', err?.message))

      if (typeof (event as any).waitUntil === 'function') {
        ;(event as any).waitUntil(sentinelTask)
      }
    }

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
