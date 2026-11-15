// server/api/admin/nodes/[id].ts
import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

function normalizeParentId(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '' || raw === 'null' || raw === 'root') {
    return null
  }
  const num = Number(raw)
  return Number.isInteger(num) && num > 0 ? num : null
}

export default defineEventHandler(async (event) => {
  const method = event.node.req.method
  const db = await getDb()
  if (!db) throw createError({ statusCode: 500, statusMessage: 'Database offline' })

  const nodeId = Number(getRouterParam(event, 'id'))
  if (!nodeId || isNaN(nodeId)) {
    throw createError({ statusCode: 400, statusMessage: 'ID Nodo non valido.' })
  }

  // PUT / PATCH: Aggiornamento Nodo e Gerarchia Padre/Figlio
  if (method === 'PUT' || method === 'PATCH') {
    const body = await readBody(event)
    const { name, slug, description, icon, color, isPrivate, category } = body

    const hasExplicitParent = body.parentId !== undefined || body.parent_id !== undefined
    const parentId = hasExplicitParent
      ? normalizeParentId(body.parentId !== undefined ? body.parentId : body.parent_id)
      : null

    if (parentId === nodeId) {
      throw createError({ statusCode: 400, statusMessage: 'Un nodo non può essere padre di se stesso.' })
    }

    const cleanSlug = slug
      ? String(slug).trim().toLowerCase().replace(/^(n\/)+/i, '').replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '')
      : null

    try {
      const result: any = await db.execute(sql`
        UPDATE nodes
        SET 
          name = COALESCE(NULLIF(${String(name || '').trim()}, ''), name),
          slug = COALESCE(NULLIF(${cleanSlug || ''}, ''), slug),
          description = COALESCE(${description ?? null}, description),
          icon = COALESCE(NULLIF(${String(icon || '').trim()}, ''), icon),
          color = COALESCE(NULLIF(${String(color || '').trim()}, ''), color),
          category = ${category !== undefined ? (String(category).trim() || null) : sql`category`},
          parent_id = ${hasExplicitParent ? parentId : sql`parent_id`},
          is_private = COALESCE(${isPrivate !== undefined ? Boolean(isPrivate) : null}, is_private)
        WHERE id = ${nodeId}
        RETURNING id, name, slug, category, parent_id AS "parentId"
      `)
      const updated = result?.rows?.[0] || result?.[0]
      if (!updated) {
        throw createError({ statusCode: 404, statusMessage: 'Nodo non trovato.' })
      }
      return { success: true, message: 'Nodo aggiornato con successo.', data: updated }
    } catch (err: any) {
      throw createError({ statusCode: 500, statusMessage: err.message })
    }
  }

  // DELETE: Eliminazione Nodo (promuove eventuali sottonodi a Root prima di eliminare)
  if (method === 'DELETE') {
    try {
      await db.execute(sql`UPDATE nodes SET parent_id = NULL WHERE parent_id = ${nodeId}`)
      await db.execute(sql`DELETE FROM nodes WHERE id = ${nodeId}`)
      return { success: true, message: 'Nodo eliminato con successo.' }
    } catch (err: any) {
      throw createError({ statusCode: 500, statusMessage: err.message })
    }
  }
})