// server/api/admin/nodes/posts/[id].ts
import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { BlockchainService } from '~~/server/utils/blockchainService'

export default defineEventHandler(async (event) => {
  const method = event.node.req.method
  const db = await getDb()
  if (!db) throw createError({ statusCode: 500, statusMessage: 'Database offline' })

  const postId = Number(getRouterParam(event, 'id'))
  if (!postId || isNaN(postId)) {
    throw createError({ statusCode: 400, statusMessage: 'ID Thread non valido.' })
  }

  // PATCH / PUT: Azioni rapide (pin, lock, notarize) + Modifica completa (title, content, nodeId)
  if (method === 'PATCH' || method === 'PUT') {
    const body = await readBody(event)
    const { action, title, content, nodeId, node_id, isPinned, is_pinned, isLocked, is_locked } = body

    try {
      if (action === 'toggle_pin') {
        await db.execute(sql`UPDATE node_posts SET is_pinned = NOT is_pinned WHERE id = ${postId}`)
        return { success: true, message: 'Stato pin thread aggiornato.' }
      }

      if (action === 'toggle_lock') {
        await db.execute(sql`UPDATE node_posts SET is_locked = NOT is_locked WHERE id = ${postId}`)
        return { success: true, message: 'Stato lock thread aggiornato.' }
      }

      if (action === 'notarize') {
        const res: any = await db.execute(sql`SELECT id, title, content FROM node_posts WHERE id = ${postId} LIMIT 1`)
        const row = (Array.isArray(res) ? res : (res?.rows || []))[0]
        if (!row) throw createError({ statusCode: 404, statusMessage: 'Thread non trovato.' })

        const proof = await BlockchainService.notarizeEntity(db, {
          entityType: 'forum',
          entityId: postId,
          title: row.title,
          content: row.content
        })
        return { success: true, message: 'Thread notarizzato on-chain!', proof, vaultHash: proof.vaultHash }
      }

      // Modifica completa dei campi del thread (incluso spostamento nodo)
      const targetNodeId = nodeId !== undefined ? Number(nodeId) : (node_id !== undefined ? Number(node_id) : null)
      const targetPinned = isPinned !== undefined ? Boolean(isPinned) : (is_pinned !== undefined ? Boolean(is_pinned) : null)
      const targetLocked = isLocked !== undefined ? Boolean(isLocked) : (is_locked !== undefined ? Boolean(is_locked) : null)

      const updated: any = await db.execute(sql`
        UPDATE node_posts
        SET
          title = COALESCE(NULLIF(${String(title || '').trim()}, ''), title),
          content = COALESCE(NULLIF(${String(content || '').trim()}, ''), content),
          node_id = COALESCE(${targetNodeId && targetNodeId > 0 ? targetNodeId : null}, node_id),
          is_pinned = COALESCE(${targetPinned}, is_pinned),
          is_locked = COALESCE(${targetLocked}, is_locked),
          updated_at = NOW()
        WHERE id = ${postId}
        RETURNING id, title, content, node_id AS "nodeId", is_pinned AS "isPinned", is_locked AS "isLocked"
      `)

      const row = updated?.rows?.[0] || updated?.[0]
      if (!row) {
        throw createError({ statusCode: 404, statusMessage: 'Thread non trovato.' })
      }

      // Ri-notarizza automaticamente l'hash SHA-256 sul DKP Vault dopo la modifica
      const proof = await BlockchainService.notarizeEntity(db, {
        entityType: 'forum',
        entityId: postId,
        title: row.title,
        content: row.content
      })

      return {
        success: true,
        message: 'Thread aggiornato e ri-notarizzato SHA-256.',
        data: { ...row, vaultHash: proof.vaultHash, vaultBlockNumber: proof.blockNumber },
        proof
      }
    } catch (err: any) {
      throw createError({ statusCode: 500, statusMessage: err.message })
    }
  }

  // DELETE: Eliminazione definitiva Thread + pulizia ledger Vault
  if (method === 'DELETE') {
    try {
      await db.execute(sql`DELETE FROM dkp_vault_ledger WHERE entity_type = 'forum' AND entity_id = ${postId}`).catch(() => null)
      await db.execute(sql`DELETE FROM node_posts WHERE id = ${postId}`)
      return { success: true, message: 'Thread eliminato dal forum.' }
    } catch (err: any) {
      throw createError({ statusCode: 500, statusMessage: err.message })
    }
  }
})