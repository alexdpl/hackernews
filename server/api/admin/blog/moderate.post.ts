// server/api/admin/blog/moderate.post.ts
import { defineEventHandler, createError, readBody } from 'h3'
import { eq } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { blogPosts, users } from '~~/drizzle/schema' 
import crypto from 'node:crypto'

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) || {}
  const { postId, action, rejectReason } = body

  if (!postId || !action) {
    throw createError({ statusCode: 400, statusMessage: 'postId e action (approve | reject) sono obbligatori.' })
  }

  const numericPostId = Number(postId)
  if (isNaN(numericPostId)) {
    throw createError({ statusCode: 400, statusMessage: 'ID Articolo non valido.' })
  }

  try {
    const db = await getDb()

    if (action === 'approve') {
      // 1. Generazione Certificato di Verifica DKP Vault
      const vaultHash = crypto.createHash('sha256').update(`dkp-vault-${numericPostId}-${Date.now()}`).digest('hex')
      const vaultCertificateId = `DKP-VAULT-CERT-${Math.random().toString(36).substring(2, 8).toUpperCase()}-2026`

      const nowIso = new Date().toISOString()

      const [updatedPost] = await db
        .update(blogPosts)
        .set({
          status: 'published',
          isVerified: true,
          vaultCertificateId,
          vaultHash,
          updatedAt: nowIso
        })
        .where(eq(blogPosts.id, numericPostId))
        .returning()

      // 🏆 2. GAMIFICATION SYSTEM: Assegnazione XP, Reputazione e badge "Gold Author"
      if (updatedPost && updatedPost.authorId) {
        const [author] = await db.select().from(users).where(eq(users.id, updatedPost.authorId)).limit(1)

        if (author) {
          const newReputation = (author.reputation || 100) + 150
          const newXp = (author.xp || 0) + 150
          
          let currentBadges: string[] = []
          if (Array.isArray(author.badges)) {
            currentBadges = author.badges
          } else if (typeof author.badges === 'string') {
            try { currentBadges = JSON.parse(author.badges) } catch { currentBadges = [] }
          }

          if (!currentBadges.includes('Gold Author')) {
            currentBadges.push('Gold Author')
          }

          // Aggiornamento allineato allo schema utenti (reputation, xp, badges)
          await db.update(users)
            .set({
              reputation: newReputation,
              xp: newXp,
              badges: currentBadges
            })
            .where(eq(users.id, author.id))
        }
      }

      return {
        success: true,
        message: 'Articolo approvato, verificato con DKP Vault, reputazione (+150) e badge Gold Author assegnati!',
        action: 'approved',
        data: updatedPost
      }
    } else if (action === 'reject') {
      const nowIso = new Date().toISOString()
      
      const [updatedPost] = await db
        .update(blogPosts)
        .set({
          status: 'draft',
          isVerified: false,
          updatedAt: nowIso
        })
        .where(eq(blogPosts.id, numericPostId))
        .returning()

      return {
        success: true,
        message: `Articolo rifiutato e riposizionato in bozza.${rejectReason ? ' Note: ' + rejectReason : ''}`,
        action: 'rejected',
        data: updatedPost
      }
    } else {
      throw createError({ statusCode: 400, statusMessage: 'Azione non riconosciuta (usa approve o reject).' })
    }
  } catch (error: any) {
    console.error('Errore nella moderazione articolo:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || `Errore moderazione: ${error.message}`
    })
  }
})