// server/api/nodes/posts.post.ts
import { defineEventHandler, readBody, getCookie, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { xpTransactions } from '~~/drizzle/schema'

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) || {}
  const { nodeId, title, content, vaultHash, userId } = body

  const numericNodeId = Number(nodeId)
  let targetUserId = userId ? Number(userId) : 1

  // Recupero sessione utente dal cookie se disponibile
  const sessionCookie = getCookie(event, 'dkp_session')
  if (sessionCookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(sessionCookie))
      if (parsed.id) targetUserId = Number(parsed.id)
    } catch (_) {}
  }

  if (!nodeId || isNaN(numericNodeId) || !title || title.trim().length < 3 || !content || content.trim().length < 5) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Nodo, titolo (min 3 caratteri) e contenuto (min 5 caratteri) sono obbligatori.'
    })
  }

  try {
    const db = await getDb()
    if (!db) {
      throw createError({ statusCode: 500, statusMessage: 'Database Neon non disponibile.' })
    }

    // 1. Inserimento del nuovo Thread nel nodo
    const postResult: any = await db.execute(sql`
      INSERT INTO node_posts (node_id, author_id, title, content, vault_hash, karma_score)
      VALUES (${numericNodeId}, ${targetUserId}, ${title.trim()}, ${content.trim()}, ${vaultHash || null}, 1)
      RETURNING 
        id, 
        node_id AS "nodeId", 
        author_id AS "authorId", 
        title, 
        content, 
        karma_score AS "karmaScore", 
        comments_count AS "commentsCount", 
        vault_hash AS "vaultHash", 
        created_at AS "createdAt";
    `)

    const newPost = Array.isArray(postResult) ? postResult[0] : (postResult?.rows?.[0] || null)

    // 2. Reward Gamification (+25 XP) per la creazione del thread
    const rewardXp = 25
    await db.execute(sql`
      UPDATE users SET xp = COALESCE(xp, 0) + ${rewardXp} WHERE id = ${targetUserId};
    `).catch(() => {})

    // Registrazione della transazione nel ledger
    await db.insert(xpTransactions).values({
      userId: targetUserId,
      action: `Published Thread in DKP Node #${numericNodeId}: ${title.trim().substring(0, 30)}...`,
      points: rewardXp
    }).catch(() => {})

    return {
      success: true,
      message: 'Thread pubblicato con successo! +25 XP ⚡',
      data: newPost,
      xpAwarded: rewardXp
    }
  } catch (err: any) {
    console.error('❌ [NODE POSTS CREATE ERROR]:', err)
    if (err.statusCode) throw err
    throw createError({
      statusCode: 500,
      statusMessage: err.message || 'Errore durante il salvataggio del thread.'
    })
  }
})