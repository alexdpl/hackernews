// server/api/admin/blog/moderate.post.ts
import { defineEventHandler, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { blogPosts } from '~~/server/db/schema'
import crypto from 'node:crypto'

// Parser nativo del body a prova di mismatch H3
async function getRequestBody(event: any): Promise<any> {
  const req = event.node?.req || event.req
  if (req?.body && typeof req.body === 'object') return req.body

  return new Promise((resolve) => {
    if (!req) return resolve({})
    let rawData = ''
    req.on('data', (chunk: any) => { rawData += chunk })
    req.on('end', () => {
      try { resolve(rawData ? JSON.parse(rawData) : {}) } 
      catch { resolve({}) }
    })
    req.on('error', () => resolve({}))
  })
}

export default defineEventHandler(async (event) => {
  const body = (await getRequestBody(event)) || {}
  const { postId, action, rejectReason } = body

  if (!postId || !action) {
    throw createError({ statusCode: 400, statusMessage: 'postId e action (approve | reject) sono obbligatori.' })
  }

  const numericPostId = Number(postId)
  if (isNaN(numericPostId)) {
    throw createError({ statusCode: 400, statusMessage: 'ID Articolo non valido.' })
  }

  try {
    const db = getDb()

    if (action === 'approve') {
      // Generazione Certificato di Verifica DKP Vault
      const vaultHash = crypto.createHash('sha256').update(`dkp-vault-${numericPostId}-${Date.now()}`).digest('hex')
      const vaultCertificateId = `DKP-VAULT-CERT-${Math.random().toString(36).substring(2, 8).toUpperCase()}-2026`

      const [updatedPost] = await db
        .update(blogPosts)
        .set({
          status: 'published',
          isVerified: true,
          vaultCertificateId,
          vaultHash,
          updatedAt: new Date()
        })
        .where(eq(blogPosts.id, numericPostId))
        .returning()

      return {
        success: true,
        message: 'Articolo approvato, verificato con DKP Vault Certificate e pubblicato online!',
        action: 'approved',
        data: updatedPost
      }
    } else if (action === 'reject') {
      const [updatedPost] = await db
        .update(blogPosts)
        .set({
          status: 'draft',
          isVerified: false,
          updatedAt: new Date()
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