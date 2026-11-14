// server/api/nodes/posts.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { xpTransactions } from '~~/drizzle/schema'
import { extractDkpUserFromEvent } from '~~/server/utils/session'
import { VaultService } from '~~/server/services/vault.service'

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) || {}
  const { nodeId, title, content, vaultHash, isPinned, userId } = body

  const numericNodeId = Number(nodeId)
  let targetUserId = userId ? Number(userId) : 1

  // Recupero sessione utente unificata (.devkernelpulse.org)
  const sessionUser = extractDkpUserFromEvent(event)
  if (sessionUser?.id) {
    targetUserId = Number(sessionUser.id)
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

    // Assicura collegamento Forum <-> Blockchain Vault e nodo pubblico 'blockchain-vault'
    await VaultService.ensureForumVaultConnection()

    // 1. Inserimento del nuovo Thread nel nodo
    const postResult: any = await db.execute(sql`
      INSERT INTO node_posts (node_id, author_id, title, content, vault_hash, is_pinned, karma_score)
      VALUES (${numericNodeId}, ${targetUserId}, ${title.trim()}, ${content.trim()}, ${vaultHash || null}, ${Boolean(isPinned)}, 1)
      RETURNING
        id,
        node_id AS "nodeId",
        author_id AS "authorId",
        title,
        content,
        karma_score AS "karmaScore",
        comments_count AS "commentsCount",
        vault_hash AS "vaultHash",
        is_pinned AS "isPinned",
        created_at AS "createdAt";
    `)

    const newPost = Array.isArray(postResult) ? postResult[0] : (postResult?.rows?.[0] || null)

    // 2. Notarizzazione crittografica SHA-256 On-Chain sul Proof-of-Code Vault
    let vaultProof = null
    if (newPost?.id) {
      vaultProof = await VaultService.notarizePost(Number(newPost.id)).catch((err: any) => {
        console.warn('⚠️ [VAULT NOTARIZE WARN]:', err?.message)
        return null
      })

      if (vaultProof?.vaultHash) {
        newPost.vaultHash = vaultProof.vaultHash
        newPost.vaultBlockNumber = vaultProof.blockNumber
        newPost.vaultNetwork = vaultProof.chainNetwork
      }
    }

    // Aggiorna contatore post del nodo (best-effort)
    await db.execute(sql`
      UPDATE nodes SET posts_count = COALESCE(posts_count, 0) + 1 WHERE id = ${numericNodeId};
    `).catch(() => {})

    // 3. Reward Gamification (+25 XP) per la creazione del thread
    const rewardXp = 25
    await db.execute(sql`
      UPDATE users SET xp = COALESCE(xp, 0) + ${rewardXp} WHERE id = ${targetUserId};
    `).catch(() => {})

    await db.insert(xpTransactions).values({
      userId: targetUserId,
      action: `Published Thread in DKP Node #${numericNodeId}: ${title.trim().substring(0, 30)}...`,
      points: rewardXp
    }).catch(() => {})

    return {
      success: true,
      message: vaultProof
        ? `Thread pubblicato e notarizzato On-Chain (Block #${vaultProof.blockNumber})! +25 XP ⚡`
        : 'Thread pubblicato con successo! +25 XP ⚡',
      data: newPost,
      vaultProof,
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