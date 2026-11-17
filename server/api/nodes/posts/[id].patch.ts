// server/api/nodes/posts/[id].patch.ts
import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { extractDkpUserFromEvent } from '~~/server/utils/session'

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

export default defineEventHandler(async (event) => {
  const sessionUser = extractDkpUserFromEvent(event)
  if (!sessionUser?.id || Number(sessionUser.id) <= 0) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Devi effettuare il login per modificare una discussione.'
    })
  }

  const rawPostId = String(getRouterParam(event, 'id') || '').trim()
  const numericPostId = Number(rawPostId)
  if (!/^\d+$/.test(rawPostId) || !Number.isSafeInteger(numericPostId) || numericPostId <= 0 || numericPostId > 2147483647) {
    throw createError({ statusCode: 400, statusMessage: 'ID thread non valido.' })
  }

  const body = (await readBody(event).catch(() => ({}))) || {}
  const { title, content, nodeId, node_id, vaultHash, vault_hash, isPinned, is_pinned } = body

  const db = await getDb()
  if (!db) {
    throw createError({ statusCode: 500, statusMessage: 'Database Neon non disponibile.' })
  }

  try {
    // 1. Verifica utente autenticato e ruolo sul DB
    const userRes = await db.execute(sql`
      SELECT id, role FROM users WHERE id = ${Number(sessionUser.id)} LIMIT 1;
    `)
    const dbUser = extractRows(userRes)[0]
    if (!dbUser?.id) {
      throw createError({ statusCode: 401, statusMessage: 'Sessione non valida o utente inesistente.' })
    }

    const currentUserId = Number(dbUser.id)
    const isAdmin = String(dbUser.role || '').toUpperCase() === 'ADMIN'

    // 2. Recupera thread esistente per verifica proprietà
    const existingRes = await db.execute(sql`
      SELECT id, author_id AS "authorId", node_id AS "nodeId", is_locked AS "isLocked"
      FROM node_posts
      WHERE id = ${numericPostId}
      LIMIT 1;
    `)
    const existingPost = extractRows(existingRes)[0]
    if (!existingPost) {
      throw createError({ statusCode: 404, statusMessage: 'Thread non trovato.' })
    }

    const isOwner = Number(existingPost.authorId) === currentUserId
    if (!isOwner && !isAdmin) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Non hai i permessi per modificare questa discussione.'
      })
    }

    if (existingPost.isLocked && !isAdmin) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Questo thread è bloccato e può essere modificato solo da un amministratore.'
      })
    }

    // 3. Validazione campi modificabili
    let nextTitle: string | null = null
    if (title !== undefined) {
      const cleaned = String(title).trim()
      if (cleaned.length < 3 || cleaned.length > 255) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Il titolo deve essere compreso tra 3 e 255 caratteri.'
        })
      }
      nextTitle = cleaned
    }

    let nextContent: string | null = null
    if (content !== undefined) {
      const cleaned = String(content).trim()
      if (cleaned.length < 5 || cleaned.length > 50000) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Il contenuto deve essere compreso tra 5 e 50.000 caratteri.'
        })
      }
      nextContent = cleaned
    }

    let nextNodeId: number | null = null
    const rawNodeId = nodeId !== undefined ? nodeId : node_id
    if (rawNodeId !== undefined && rawNodeId !== null) {
      const parsedNodeId = Number(rawNodeId)
      if (!Number.isSafeInteger(parsedNodeId) || parsedNodeId <= 0) {
        throw createError({ statusCode: 400, statusMessage: 'nodeId non valido.' })
      }
      const nodeCheck = await db.execute(sql`
        SELECT id FROM nodes WHERE id = ${parsedNodeId} LIMIT 1;
      `)
      if (!extractRows(nodeCheck)[0]) {
        throw createError({ statusCode: 404, statusMessage: 'Nodo di destinazione non trovato.' })
      }
      nextNodeId = parsedNodeId
    }

    // Solo ADMIN può pinnare/spinnare o sovrascrivere direttamente vault_hash
    const rawIsPinned = isPinned !== undefined ? isPinned : is_pinned
    if (rawIsPinned !== undefined && !isAdmin) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Solo gli amministratori possono fissare (pin) un thread.'
      })
    }
    const nextIsPinned: boolean | null = isAdmin && rawIsPinned !== undefined ? Boolean(rawIsPinned) : null

    const rawVaultHash = vaultHash !== undefined ? vaultHash : vault_hash
    let nextVaultHash: string | null = null
    if (isAdmin && typeof rawVaultHash === 'string' && /^[a-f0-9]{64}$/i.test(rawVaultHash.trim())) {
      nextVaultHash = rawVaultHash.trim().toLowerCase()
    }

    const updated: any = await db.execute(sql`
      UPDATE node_posts
      SET
        title = COALESCE(${nextTitle}, title),
        content = COALESCE(${nextContent}, content),
        node_id = COALESCE(${nextNodeId}, node_id),
        vault_hash = COALESCE(${nextVaultHash}, vault_hash),
        is_pinned = COALESCE(${nextIsPinned}, is_pinned),
        updated_at = NOW()
      WHERE id = ${numericPostId}
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
        is_locked AS "isLocked",
        created_at AS "createdAt",
        updated_at AS "updatedAt";
    `)

    const row = extractRows(updated)[0]
    if (!row) {
      throw createError({ statusCode: 404, statusMessage: 'Thread non trovato o non modificabile.' })
    }

    return {
      success: true,
      message: 'Thread aggiornato con successo!',
      post: row,
      data: row
    }
  } catch (err: any) {
    if (err?.statusCode) throw err
    console.error('❌ [PATCH NODE POST ERROR]:', err)
    throw createError({
      statusCode: 500,
      statusMessage: err?.message || 'Errore durante l\'aggiornamento del thread.'
    })
  }
})