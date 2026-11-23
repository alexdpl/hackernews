// server/api/admin/nodes/merge.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const mode = String(body?.mode || 'merge').trim() // 'merge' | 'move'
  const sourceNodeId = Number(body?.sourceNodeId)
  const targetParentIdRaw = body?.targetNodeId ?? body?.targetParentId ?? null
  const targetNodeId = targetParentIdRaw === null || targetParentIdRaw === '' || targetParentIdRaw === 'root'
    ? null
    : Number(targetParentIdRaw)

  if (!sourceNodeId || Number.isNaN(sourceNodeId)) {
    throw createError({ statusCode: 400, statusMessage: 'Nodo sorgente non valido.' })
  }

  const db = await getDb()
  if (!db) throw createError({ statusCode: 500, statusMessage: 'Database offline' })

  const srcRes: any = await db.execute(sql`SELECT id, name, slug, parent_id FROM nodes WHERE id = ${sourceNodeId} LIMIT 1`)
  const srcNode = (Array.isArray(srcRes) ? srcRes : (srcRes?.rows || []))[0]
  if (!srcNode) {
    throw createError({ statusCode: 404, statusMessage: 'Nodo sorgente non trovato.' })
  }

  if (mode === 'move') {
    if (targetNodeId === sourceNodeId) {
      throw createError({ statusCode: 400, statusMessage: 'Un nodo non può essere spostato dentro se stesso.' })
    }
    if (targetNodeId !== null) {
      const dstRes: any = await db.execute(sql`SELECT id, name, parent_id FROM nodes WHERE id = ${targetNodeId} LIMIT 1`)
      const dstNode = (Array.isArray(dstRes) ? dstRes : (dstRes?.rows || []))[0]
      if (!dstNode) {
        throw createError({ statusCode: 404, statusMessage: 'Nodo padre destinazione non trovato.' })
      }
      if (Number(dstNode.parent_id) === sourceNodeId) {
        throw createError({ statusCode: 400, statusMessage: 'Impossibile creare un ciclo padre-figlio.' })
      }
    }

    await db.execute(sql`
      UPDATE nodes
      SET parent_id = ${targetNodeId}
      WHERE id = ${sourceNodeId}
    `)

    return {
      success: true,
      message: targetNodeId === null
        ? `Nodo n/${srcNode.slug} promosso a livello Root.`
        : `Nodo n/${srcNode.slug} spostato sotto il nuovo genitore #${targetNodeId}.`
    }
  }

  // mode === 'merge': consolida thread e sottonodi su targetNodeId ed elimina il nodo ridondante
  if (!targetNodeId || Number.isNaN(targetNodeId) || targetNodeId === sourceNodeId) {
    throw createError({ statusCode: 400, statusMessage: 'Seleziona un nodo destinazione valido diverso dal nodo sorgente.' })
  }

  const dstRes: any = await db.execute(sql`SELECT id, name, slug FROM nodes WHERE id = ${targetNodeId} LIMIT 1`)
  const dstNode = (Array.isArray(dstRes) ? dstRes : (dstRes?.rows || []))[0]
  if (!dstNode) {
    throw createError({ statusCode: 404, statusMessage: 'Nodo destinazione non trovato.' })
  }

  const movedPosts: any = await db.execute(sql`
    UPDATE node_posts
    SET node_id = ${targetNodeId}
    WHERE node_id = ${sourceNodeId}
    RETURNING id
  `)
  const movedCount = (Array.isArray(movedPosts) ? movedPosts : (movedPosts?.rows || [])).length

  // Sposta eventuali sub-nodi figli sotto il nodo destinazione (evitando auto-referenze)
  await db.execute(sql`
    UPDATE nodes
    SET parent_id = ${targetNodeId}
    WHERE parent_id = ${sourceNodeId} AND id <> ${targetNodeId}
  `)

  await db.execute(sql`DELETE FROM nodes WHERE id = ${sourceNodeId}`)

  return {
    success: true,
    movedThreads: movedCount,
    message: `Consolidato n/${srcNode.slug} in n/${dstNode.slug} (${movedCount} thread trasferiti).`
  }
})