// server/api/nodes/posts/[id].delete.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
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
      statusMessage: 'Devi effettuare il login per eliminare una discussione.'
    })
  }

  const rawPostId = String(getRouterParam(event, 'id') || '').trim()
  const numericPostId = Number(rawPostId)
  if (!/^\d+$/.test(rawPostId) || !Number.isSafeInteger(numericPostId) || numericPostId <= 0 || numericPostId > 2147483647) {
    throw createError({ statusCode: 400, statusMessage: 'ID thread non valido.' })
  }

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

    // 2. Recupera il thread reale da node_posts
    const postRes = await db.execute(sql`
      SELECT id, author_id AS "authorId", node_id AS "nodeId"
      FROM node_posts
      WHERE id = ${numericPostId}
      LIMIT 1;
    `)
    const targetPost = extractRows(postRes)[0]
    if (!targetPost) {
      throw createError({ statusCode: 404, statusMessage: 'Discussione non trovata.' })
    }

    const isOwner = Number(targetPost.authorId) === currentUserId
    if (!isOwner && !isAdmin) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Non hai i permessi per eliminare questa discussione.'
      })
    }

    // 3. Eliminazione da node_posts (ON DELETE CASCADE rimuove commenti e voti collegati)
    await db.execute(sql`
      DELETE FROM node_posts WHERE id = ${numericPostId};
    `)

    // 4. Decremento best-effort contatore post del nodo
    if (targetPost.nodeId) {
      await db.execute(sql`
        UPDATE nodes
        SET posts_count = GREATEST(COALESCE(posts_count, 0) - 1, 0)
        WHERE id = ${Number(targetPost.nodeId)};
      `).catch(() => {})
    }

    return {
      success: true,
      message: 'Discussione eliminata correttamente.'
    }
  } catch (err: any) {
    if (err?.statusCode) throw err
    console.error('❌ [DELETE NODE POST ERROR]:', err)
    throw createError({
      statusCode: 500,
      statusMessage: err?.message || 'Errore durante la cancellazione del thread.'
    })
  }
})