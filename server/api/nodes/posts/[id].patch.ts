// server/api/nodes/posts/[id].patch.ts
import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const postId = getRouterParam(event, 'id')
  const body = await readBody(event)
  
  // Estraiamo tutti i campi modificabili inviati dall'editor avanzato
  const { title, content, nodeId, node_id, vaultHash, vault_hash, isPinned, is_pinned } = body

  if (!postId) {
    throw createError({ statusCode: 400, message: 'ID post mancante' })
  }

  const db = await getDb()
  if (!db) throw createError({ statusCode: 500, message: 'Database offline' })

  // Gestione flessibile dei campi (supporta sia camelCase che snake_case)
  const targetNodeId = nodeId !== undefined ? Number(nodeId) : (node_id !== undefined ? Number(node_id) : null)
  const targetVaultHash = vaultHash !== undefined ? vaultHash : (vault_hash !== undefined ? vault_hash : null)
  const targetIsPinned = isPinned !== undefined ? Boolean(isPinned) : (is_pinned !== undefined ? Boolean(is_pinned) : null)

  try {
    const updated: any = await db.execute(sql`
      UPDATE node_posts 
      SET 
        title = COALESCE(${title || null}, title),
        content = COALESCE(${content || null}, content),
        node_id = COALESCE(${targetNodeId}, node_id),
        vault_hash = COALESCE(${targetVaultHash}, vault_hash),
        is_pinned = COALESCE(${targetIsPinned}, is_pinned),
        updated_at = NOW()
      WHERE id = ${Number(postId)}
      RETURNING *
    `)

    const row = updated?.rows?.[0] || updated?.[0]
    if (!row) {
      throw createError({ statusCode: 404, message: 'Post non trovato o non modificabile' })
    }

    return {
      success: true,
      message: 'Post e nodo aggiornati con successo!',
      post: row
    }
  } catch (err: any) {
    console.error('❌ [PATCH POST ERROR]:', err)
    throw createError({ statusCode: 500, message: err.message || 'Errore durante l\'aggiornamento del post' })
  }
})