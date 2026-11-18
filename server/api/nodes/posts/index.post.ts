// server/api/nodes/posts/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '../../../utils/db'
import { extractDkpUserFromEvent } from '../../../utils/session'
import { scanWithSentinelAI } from '../../../utils/sentinelAi'
import { BlockchainService } from '../../../utils/blockchainService'
import { awardNodeXpAndBadges, GamificationRules } from '../../../utils/gamification'
import { runSentinelPipeline } from '../../../utils/sentinelNetwork'

export default defineEventHandler(async (event) => {
  const db = await getDb()
  if (!db) {
    throw createError({ statusCode: 500, statusMessage: 'Database Neon non disponibile.' })
  }

  const sessionUser = event.context.user || extractDkpUserFromEvent(event)
  const authorId = sessionUser?.id ? Number(sessionUser.id) : null

  if (!authorId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Devi essere loggato per pubblicare.'
    })
  }

  const body = await readBody(event)
  const nodeId = Number(body.nodeId)
  const title = body.title?.trim()
  const content = body.content?.trim()
  const requestVaultProof = body.requestVaultProof !== false

  if (!nodeId || !title || !content) {
    throw createError({ statusCode: 400, statusMessage: 'Compilare tutti i campi obbligatori.' })
  }

  try {
    const scan = await scanWithSentinelAI(title, content)

    if (!scan.isAllowed) {
      throw createError({
        statusCode: 422,
        statusMessage: scan.flagReason || 'Contenuto bloccato da Sentinel AI.'
      })
    }

    const insertResult: any = await db.execute(sql`
      INSERT INTO node_posts (
        node_id, author_id, title, content, karma_score,
        comments_count, is_pinned, is_locked
      )
      VALUES (
        ${nodeId}, ${authorId}, ${title}, ${content}, 1,
        0, false, ${scan.isFlagged}
      )
      RETURNING id, created_at
    `)

    const newPost = insertResult?.rows?.[0] || insertResult?.[0]
    const postId = Number(newPost.id)

    let proof = null
    if (requestVaultProof) {
      proof = await BlockchainService.notarizeEntity(db, {
        entityType: 'forum',
        entityId: postId,
        title,
        content
      })
    }

    if (scan.botComment) {
      const botRes: any = await db.execute(sql`
        SELECT id FROM users WHERE username = 'sentinel_ai' AND is_bot = TRUE LIMIT 1;
      `)
      const sentinelBotId = Number((botRes?.rows?.[0] || botRes?.[0])?.id || 1)
      await db.execute(sql`
        INSERT INTO node_comments (post_id, author_id, content, karma_score)
        VALUES (${postId}, ${sentinelBotId}, ${scan.botComment}, 0)
      `)
      await db.execute(sql`
        UPDATE node_posts SET comments_count = COALESCE(comments_count, 0) + 1 WHERE id = ${postId};
      `).catch(() => {})
    }

    const sentinelTask = runSentinelPipeline({
      targetType: 'node_post',
      targetId: postId,
      postId,
      nodeId,
      authorId,
      authorUsername: sessionUser?.username,
      authorEmail: sessionUser?.email,
      content: `${title}\n${content}`.trim()
    }).catch((err) => console.error('[SENTINEL PIPELINE ERROR]:', err?.message))

    if (typeof (event as any).waitUntil === 'function') {
      ;(event as any).waitUntil(sentinelTask)
    }

    try {
      await awardNodeXpAndBadges(authorId, `Creazione Thread #${postId}`, GamificationRules.NEW_THREAD)
    } catch (xpErr) {
      console.warn('⚠️ Errore erogazione XP:', xpErr)
    }

    return {
      success: true,
      message: 'Thread pubblicato e notarizzato con successo.',
      data: {
        id: postId,
        vaultHash: proof?.vaultHash || null,
        blockNumber: proof?.blockNumber || null,
        isFlagged: scan.isFlagged
      }
    }
  } catch (error: any) {
    console.error('💥 [CREATE NODE POST ERROR]:', error?.message)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Errore durante la pubblicazione del thread.' })
  }
})
