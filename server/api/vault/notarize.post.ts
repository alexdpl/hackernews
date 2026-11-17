// server/api/vault/notarize.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { extractDkpUserFromEvent } from '~~/server/utils/session'
import { VaultService } from '~~/server/services/vault.service'
import type { VaultEntityType } from '~~/server/utils/blockchainService'

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

export default defineEventHandler(async (event) => {
  const sessionUser = extractDkpUserFromEvent(event)
  if (!sessionUser?.id || Number(sessionUser.id) <= 0) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Devi effettuare il login per notarizzare un contenuto nel DKP Vault.'
    })
  }

  const body = (await readBody(event).catch(() => ({}))) || {}
  const rawId = body.entityId ?? body.postId
  const targetId = Number(rawId)

  if (
    rawId === undefined ||
    rawId === null ||
    !/^\d+$/.test(String(rawId).trim()) ||
    !Number.isSafeInteger(targetId) ||
    targetId <= 0 ||
    targetId > 2147483647
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'postId o entityId intero positivo obbligatorio per la notarizzazione SHA-256.'
    })
  }

  if (body.entityType !== undefined && body.entityType !== 'blog' && body.entityType !== 'forum') {
    throw createError({
      statusCode: 400,
      statusMessage: 'entityType non valido (valori consentiti: "forum" o "blog").'
    })
  }

  const entityType = (body.entityType === 'blog' ? 'blog' : 'forum') as VaultEntityType

  const db = await getDb()
  if (!db) {
    throw createError({ statusCode: 500, statusMessage: 'Database Neon non disponibile.' })
  }

  try {
    // 1. Verifica utente autenticato su DB
    const userRes = await db.execute(sql`
      SELECT id, role FROM users WHERE id = ${Number(sessionUser.id)} LIMIT 1;
    `)
    const dbUser = extractRows(userRes)[0]
    if (!dbUser?.id) {
      throw createError({ statusCode: 401, statusMessage: 'Sessione non valida o utente inesistente.' })
    }

    const currentUserId = Number(dbUser.id)
    const isAdmin = String(dbUser.role || '').toUpperCase() === 'ADMIN'

    // 2. Verifica esistenza e permessi sull'entità target
    if (entityType === 'blog') {
      const blogRes = await db.execute(sql`
        SELECT id, author_id AS "authorId", status, vault_hash AS "vaultHash"
        FROM blog_posts
        WHERE id = ${targetId}
        LIMIT 1;
      `)
      const blogPost = extractRows(blogRes)[0]
      if (!blogPost) {
        throw createError({ statusCode: 404, statusMessage: 'Articolo non trovato.' })
      }

      const isOwner = Number(blogPost.authorId) === currentUserId
      if (blogPost.status !== 'published' && !isOwner && !isAdmin) {
        throw createError({ statusCode: 404, statusMessage: 'Articolo non trovato.' })
      }

      // Se già notarizzato, solo autore o ADMIN possono ri-notarizzare; altrimenti restituisce la prova esistente
      if (blogPost.vaultHash && !isOwner && !isAdmin) {
        const existing = await VaultService.verifyProof({ entityId: targetId, entityType: 'blog' })
        if (existing?.proof) {
          return { success: true, proof: existing.proof }
        }
      }
    } else {
      const nodePostRes = await db.execute(sql`
        SELECT id, author_id AS "authorId", vault_hash AS "vaultHash"
        FROM node_posts
        WHERE id = ${targetId}
        LIMIT 1;
      `)
      const nodePost = extractRows(nodePostRes)[0]
      if (!nodePost) {
        throw createError({ statusCode: 404, statusMessage: 'Discussione non trovata.' })
      }

      const isOwner = Number(nodePost.authorId) === currentUserId
      if (nodePost.vaultHash && !isOwner && !isAdmin) {
        const existing = await VaultService.verifyProof({ entityId: targetId, entityType: 'forum' })
        if (existing?.proof) {
          return { success: true, proof: existing.proof }
        }
      }
    }

    const proof = await VaultService.notarizePost(targetId, entityType)
    if (!proof) {
      throw createError({ statusCode: 404, statusMessage: 'Contenuto non trovato.' })
    }

    return {
      success: true,
      proof
    }
  } catch (err: any) {
    if (err?.statusCode) throw err
    console.error('❌ [VAULT NOTARIZE ERROR]:', err?.message)
    throw createError({
      statusCode: 500,
      statusMessage: err?.message || 'Errore durante la notarizzazione SHA-256.'
    })
  }
})