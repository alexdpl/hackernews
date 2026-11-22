import { KnowledgeDependabotService } from '~~/server/utils/knowledgeDependabot'
// server/api/nodes/comments.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { xpTransactions } from '~~/server/db/schema'
import { extractSqlRows, parseSessionUser } from '~~/server/utils/dkpComments'

export default defineEventHandler(async (event) => {
  const body = (await readBody(event).catch(() => ({}))) || {}
  const numericPostId = Number(body.postId)
  const numericParentId = body.parentId ? Number(body.parentId) : null
  const cleanContent = String(body.content || '').trim()

  // Identità ricavata SOLO dalla sessione lato server (nessun fallback su userId = 1 o body.userId)
  const session = parseSessionUser(event)
  if (!session?.id || Number(session.id) <= 0) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Devi effettuare il login per rispondere a una discussione.'
    })
  }

  if (!body.postId || Number.isNaN(numericPostId) || numericPostId <= 0 || cleanContent.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'postId e contenuto del commento sono obbligatori.'
    })
  }

  if (numericParentId !== null && (Number.isNaN(numericParentId) || numericParentId <= 0)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'parentId non valido.'
    })
  }

  if (cleanContent.length > 5000) {
    throw createError({
      statusCode: 400,
      statusMessage: 'La risposta supera il limite massimo di 5000 caratteri.'
    })
  }

  try {
    const db = await getDb()
    if (!db) {
      throw createError({ statusCode: 500, statusMessage: 'Database Neon non disponibile.' })
    }

    // Verifica utente autenticato su DB
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

    const targetUserId = Number(dbUser.id)

    // Verifica esistenza del thread e che non sia bloccato
    const postRes = await db.execute(sql`
      SELECT id, is_locked AS "isLocked"
      FROM node_posts
      WHERE id = ${numericPostId}
      LIMIT 1;
    `)
    const targetPost = extractSqlRows(postRes)[0]
    if (!targetPost) {
      throw createError({ statusCode: 404, statusMessage: 'Thread non trovato.' })
    }
    if (targetPost.isLocked) {
      throw createError({ statusCode: 403, statusMessage: 'Questo thread è bloccato e non accetta nuove risposte.' })
    }

    // Se è una risposta nidificata, verifica che il commento padre appartenga allo stesso thread
    if (numericParentId !== null) {
      const parentRes = await db.execute(sql`
        SELECT id FROM node_comments
        WHERE id = ${numericParentId} AND post_id = ${numericPostId}
        LIMIT 1;
      `)
      if (!extractSqlRows(parentRes)[0]) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Il commento padre non appartiene a questo thread.'
        })
      }
    }

    // 1. Inserimento del commento nel nodo
    const result: any = await db.execute(sql`
      INSERT INTO node_comments (post_id, author_id, parent_id, content, karma_score)
      VALUES (${numericPostId}, ${targetUserId}, ${numericParentId}, ${cleanContent}, 1)
      RETURNING
        id,
        post_id AS "postId",
        author_id AS "authorId",
        parent_id AS "parentId",
        content,
        karma_score AS "karmaScore",
        created_at AS "createdAt";
    `)

    const inserted = extractSqlRows(result)[0] || null
    const newComment = inserted
      ? { ...inserted, authorUsername: dbUser.username }
      : null

    // 2. Incremento contatore commenti nel thread
    await db.execute(sql`
      UPDATE node_posts
      SET comments_count = COALESCE(comments_count, 0) + 1
      WHERE id = ${numericPostId};
    `).catch(() => {})

    // 2B. Sentinel Network — Knowledge Dependabot su commento con code block
    if (cleanContent.includes('```')) {
      void KnowledgeDependabotService.inspectAndAutoComment({
        entityType: 'forum',
        entityId: numericPostId,
        title: `Risposta nel thread #${numericPostId}`,
        content: cleanContent,
        authorUsername: String(dbUser.username || '')
      }).catch(() => null)
    }

    // 3. Reward Gamification (+10 XP)
    const rewardXp = 10
    await db.execute(sql`
      UPDATE users SET xp = COALESCE(xp, 0) + ${rewardXp} WHERE id = ${targetUserId};
    `).catch(() => {})

    await db.insert(xpTransactions).values({
      userId: targetUserId,
      action: `Reply in DKP Node Thread #${numericPostId}`,
      points: rewardXp
    }).catch(() => {})

    return {
      success: true,
      message: 'Risposta aggiunta con successo! +10 XP ⚡',
      data: newComment,
      xpAwarded: rewardXp
    }
  } catch (err: any) {
    console.error('❌ [NODE COMMENTS POST ERROR]:', err)
    if (err.statusCode) throw err
    throw createError({
      statusCode: 500,
      statusMessage: err.message || 'Errore durante il salvataggio del commento.'
    })
  }
})