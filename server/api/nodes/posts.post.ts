import { KnowledgeDependabotService } from '~~/server/utils/knowledgeDependabot'
// server/api/nodes/posts.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { xpTransactions } from '~~/server/db/schema'
import { extractDkpUserFromEvent } from '~~/server/utils/session'
import { VaultService } from '~~/server/services/vault.service'

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

export default defineEventHandler(async (event) => {
  // Autenticazione obbligatoria dalla sessione server (nessun fallback su body.userId o userId = 1)
  const sessionUser = extractDkpUserFromEvent(event)
  if (!sessionUser?.id || Number(sessionUser.id) <= 0) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Devi effettuare il login per pubblicare una discussione.'
    })
  }

  const body = (await readBody(event).catch(() => ({}))) || {}
  const { nodeId, title, content, vaultHash, isPinned, tags } = body
  const cleanTags = Array.isArray(tags) ? tags.map((t: any) => String(t).trim().replace(/^#/, '')).filter(Boolean).slice(0, 12) : []
  const tagsJson = JSON.stringify(cleanTags)

  const numericNodeId = Number(nodeId)
  const cleanTitle = String(title || '').trim()
  const cleanContent = String(content || '').trim()

  if (!nodeId || Number.isNaN(numericNodeId) || numericNodeId <= 0 || cleanTitle.length < 3 || cleanContent.length < 5) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Nodo, titolo (min 3 caratteri) e contenuto (min 5 caratteri) sono obbligatori.'
    })
  }

  if (cleanTitle.length > 255) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Il titolo del thread non può superare i 255 caratteri.'
    })
  }

  if (cleanContent.length > 50000) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Il contenuto supera il limite massimo di 50.000 caratteri.'
    })
  }

  const normalizedVaultHash =
    typeof vaultHash === 'string' && /^[a-f0-9]{64}$/i.test(vaultHash.trim())
      ? vaultHash.trim().toLowerCase()
      : null

  try {
    const db = await getDb()
    if (!db) {
      throw createError({ statusCode: 500, statusMessage: 'Database Neon non disponibile.' })
    }

    // Verifica utente reale e ruolo su DB
    const userRes = await db.execute(sql`
      SELECT id, role FROM users WHERE id = ${Number(sessionUser.id)} LIMIT 1;
    `)
    const dbUser = extractRows(userRes)[0]
    if (!dbUser?.id) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Sessione non valida o utente inesistente.'
      })
    }

    const targetUserId = Number(dbUser.id)
    const canPin = String(dbUser.role || '').toUpperCase() === 'ADMIN' && Boolean(isPinned)

    // Assicura collegamento Forum <-> Blockchain Vault e nodo pubblico 'blockchain-vault'
    await VaultService.ensureForumVaultConnection()

    // Verifica esistenza del nodo destinazione
    const nodeRes = await db.execute(sql`
      SELECT id FROM nodes WHERE id = ${numericNodeId} LIMIT 1;
    `)
    if (!extractRows(nodeRes)[0]) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Il nodo selezionato non esiste.'
      })
    }

    // 1. Inserimento del nuovo Thread nel nodo
    await db.execute(sql`ALTER TABLE node_posts ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;`).catch(() => {})
    const postResult: any = await db.execute(sql`
      INSERT INTO node_posts (node_id, author_id, title, content, tags, vault_hash, is_pinned, karma_score) VALUES (${numericNodeId}, ${targetUserId}, ${cleanTitle}, ${cleanContent}, ${tagsJson}::jsonb, ${normalizedVaultHash}, ${canPin}, 1)
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

    const newPost = extractRows(postResult)[0] || null

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

    // 2B. Sentinel Network — Knowledge Dependabot (DocKeeper + ArchGuard auto-review)
    if (newPost?.id) {
      void KnowledgeDependabotService.inspectAndAutoComment({
        entityType: 'forum',
        entityId: Number(newPost.id),
        title: cleanTitle,
        content: cleanContent,
        authorUsername: String(dbUser.username || '')
      }).catch(() => null)
    }

    // 3. Reward Gamification (+25 XP) per la creazione del thread
    const rewardXp = 25
    await db.execute(sql`
      UPDATE users SET xp = COALESCE(xp, 0) + ${rewardXp} WHERE id = ${targetUserId};
    `).catch(() => {})

    await db.insert(xpTransactions).values({
      userId: targetUserId,
      action: `Published Thread in DKP Node #${numericNodeId}: ${cleanTitle.substring(0, 30)}...`,
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