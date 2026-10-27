// server/api/nodes/comments.post.ts
import { defineEventHandler, readBody, getCookie, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { xpTransactions } from '~~/drizzle/schema'

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) || {}
  const { postId, parentId, content, userId } = body

  const numericPostId = Number(postId)
  const numericParentId = parentId ? Number(parentId) : null
  let targetUserId = userId ? Number(userId) : 1

  const sessionCookie = getCookie(event, 'dkp_session')
  if (sessionCookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(sessionCookie))
      if (parsed.id) targetUserId = Number(parsed.id)
    } catch (_) {}
  }

  if (!postId || isNaN(numericPostId) || !content || content.trim().length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'postId e contenuto del commento sono obbligatori.'
    })
  }

  try {
    const db = await getDb()
    if (!db) {
      throw createError({ statusCode: 500, statusMessage: 'Database Neon non disponibile.' })
    }

    // 1. Inserimento del commento nel nodo
    const result: any = await db.execute(sql`
      INSERT INTO node_comments (post_id, author_id, parent_id, content, karma_score)
      VALUES (${numericPostId}, ${targetUserId}, ${numericParentId}, ${content.trim()}, 1)
      RETURNING 
        id, 
        post_id AS "postId", 
        author_id AS "authorId", 
        parent_id AS "parentId", 
        content, 
        karma_score AS "karmaScore", 
        created_at AS "createdAt";
    `)

    const newComment = Array.isArray(result) ? result[0] : (result?.rows?.[0] || null)

    // 2. Incremento contatore commenti nel thread
    await db.execute(sql`
      UPDATE node_posts
      SET comments_count = COALESCE(comments_count, 0) + 1
      WHERE id = ${numericPostId};
    `).catch(() => {})

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