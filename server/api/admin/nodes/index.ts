// server/api/admin/nodes/index.ts
import { defineEventHandler, readBody, createError } from 'h3'
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

  // Assicura che le colonne gerarchiche esistano senza errori
  await db.execute(sql`ALTER TABLE nodes ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES nodes(id) ON DELETE SET NULL;`).catch(() => null)
  await db.execute(sql`ALTER TABLE nodes ADD COLUMN IF NOT EXISTS category VARCHAR(120);`).catch(() => null)

  // 1. GET: Elenco completo dei Nodi con parentId, category e conteggio thread
  if (method === 'GET') {
    try {
      const result: any = await db.execute(sql`
        SELECT 
          n.id,
          n.name,
          n.slug,
          n.description,
          n.icon,
          n.color,
          n.category,
          n.parent_id AS "parentId",
          p_parent.name AS "parentName",
          n.subscribers_count AS "subscribersCount",
          n.is_private AS "isPrivate",
          n.created_at AS "createdAt",
          COUNT(p.id)::int AS "postsCount"
        FROM nodes n
        LEFT JOIN nodes p_parent ON n.parent_id = p_parent.id
        LEFT JOIN node_posts p ON n.id = p.node_id
        GROUP BY n.id, p_parent.name
        ORDER BY n.parent_id NULLS FIRST, n.subscribers_count DESC, n.id ASC;
      `)
      const rows = Array.isArray(result) ? result : (result?.rows || [])
      return { success: true, data: rows }
    } catch (err: any) {
      throw createError({ statusCode: 500, statusMessage: err.message })
    }
  }

  // 2. POST: Creazione nuovo Nodo Principale (parent_id = NULL) o Sottonodo esplicito
  if (method === 'POST') {
    const body = await readBody(event)
    const creatorId = event.context.user?.id || 1
    const { name, slug, description, icon, color, isPrivate, category } = body
    const parentId = normalizeParentId(body.parentId !== undefined ? body.parentId : body.parent_id)

    if (!name || !slug) {
      throw createError({ statusCode: 400, statusMessage: 'Nome e slug sono obbligatori.' })
    }

    const cleanSlug = String(slug)
      .trim()
      .toLowerCase()
      .replace(/^(n\/)+/i, '')
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '')

    try {
      if (parentId !== null) {
        const check: any = await db.execute(sql`SELECT id FROM nodes WHERE id = ${parentId} LIMIT 1`)
        const found = Array.isArray(check) ? check : (check?.rows || [])
        if (!found.length) {
          throw createError({ statusCode: 400, statusMessage: `Nodo padre #${parentId} non trovato.` })
        }
      }

      const result: any = await db.execute(sql`
        INSERT INTO nodes (
          name, slug, description, icon, color, category, parent_id, creator_id, is_private, subscribers_count
        )
        VALUES (
          ${String(name).trim()},
          ${cleanSlug},
          ${String(description || '').trim()},
          ${icon || '#'},
          ${color || '#38bdf8'},
          ${category ? String(category).trim() : null},
          ${parentId},
          ${creatorId},
          ${Boolean(isPrivate)},
          1
        )
        RETURNING id, name, slug, category, parent_id AS "parentId"
      `)
      const newNode = result?.rows?.[0] || result?.[0]
      return { success: true, message: 'Nodo creato con successo', data: newNode }
    } catch (err: any) {
      throw createError({ statusCode: 500, statusMessage: err.message })
    }
  }
})