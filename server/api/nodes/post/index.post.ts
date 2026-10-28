// server/api/nodes/posts/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { scanWithSentinelAI } from '~~/server/utils/sentinelAi'
import { generateVaultProof } from '~~/server/utils/vaultCrypto'
import { awardNodeXpAndBadges, GamificationRules } from '~~/server/utils/gamification'

export default defineEventHandler(async (event) => {
  const db = await getDb()
  const body = await readBody(event)

  const authorId = event.context.user?.id || body.userId || 1
  const nodeId = Number(body.nodeId)
  const title = body.title?.trim()
  const content = body.content?.trim()
  const requestVaultProof = Boolean(body.requestVaultProof) // Flag dal frontend

  if (!nodeId || !title || !content) {
    throw createError({ statusCode: 400, statusMessage: 'Compilare tutti i campi obbligatori.' })
  }

  try {
    // 1. Scansione di Sicurezza Sentinel AI
    const scan = await scanWithSentinelAI(title, content)

    if (!scan.isAllowed) {
      throw createError({ 
        statusCode: 422, 
        statusMessage: scan.flagReason || 'Contenuto bloccato da Sentinel AI.' 
      })
    }

    // 2. Generazione Firma Vault SHA-256 (se richiesta dall'utente)
    let vaultHash: string | null = null
    if (requestVaultProof) {
      const proof = generateVaultProof(title, content, authorId)
      vaultHash = proof.hash
    }

    // 3. Inserimento del Thread nel Database
    const insertResult: any = await db.execute(sql`
      INSERT INTO node_posts (
        node_id, author_id, title, content, karma_score, 
        comments_count, vault_hash, is_pinned, is_locked
      )
      VALUES (
        ${nodeId}, ${authorId}, ${title}, ${content}, 1, 
        0, ${vaultHash}, false, ${scan.isFlagged}
      )
      RETURNING id, created_at
    `)

    const newPost = insertResult?.rows?.[0] || insertResult?.[0]
    const postId = newPost.id

    // 4. Se Sentinel AI ha flaggato il post, lascia un commento automatico di moderazione
    if (scan.botComment) {
      await db.execute(sql`
        INSERT INTO node_comments (post_id, author_id, content, karma_score)
        VALUES (${postId}, 1, ${scan.botComment}, 0)
      `)
    }

    // 5. Assegnazione XP per la creazione del Thread (+25 XP)
    try {
      await awardNodeXpAndBadges(authorId, `Creazione Thread #${postId}`, GamificationRules.NEW_THREAD)
    } catch (xpErr) {
      console.warn('⚠️ Errore erogazione XP:', xpErr)
    }

    return {
      success: true,
      message: 'Thread pubblicato con successo.',
      data: {
        id: postId,
        vaultHash,
        isFlagged: scan.isFlagged
      }
    }

  } catch (error: any) {
    console.error('💥 [CREATE NODE POST ERROR]:', error?.message)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Errore durante la pubblicazione del thread.' })
  }
})