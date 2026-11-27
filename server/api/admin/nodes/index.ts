// server/api/admin/nodes/index.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { cleanNodeName, cleanNodeSlug, rebuildSemanticNodesHierarchy } from '~~/server/utils/nodesTreeService'

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

  await db.execute(sql`ALTER TABLE nodes ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES nodes(id) ON DELETE SET NULL;`).catch(() => null)
  await db.execute(sql`ALTER TABLE nodes ADD COLUMN IF NOT EXISTS category VARCHAR(120);`).catch(() => null)

  if (method === 'GET') {
    try {
      const orphanCheck: any = await db.execute(sql`
        SELECT COUNT(*)::int AS cnt FROM nodes WHERE name ILIKE 'n/n/%'
      `).catch(() => [])
      const orphanCount = Number((Array.isArray(orphanCheck) ? orphanCheck : (orphanCheck?.rows || []))[0]?.cnt || 0)
      if (orphanCount > 0) {
        await rebuildSemanticNodesHierarchy(db).catch(() => null)
      }

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
        ORDER BY n.parent_id NULLS FIRST, n.category ASC, n.name ASC;
      `)
      const rows = (Array.isArray(result) ? result : (result?.rows || [])).map((r: any) => ({
        ...r,
        id: Number(r.id),
        name: cleanNodeName(r.name),
        parentId: r.parentId ? Number(r.parentId) : null,
        parentName: r.parentName ? cleanNodeName(r.parentName) : null,
        postsCount: Number(r.postsCount || 0),
        subscribersCount: Number(r.subscribersCount || 0)
      }))
      return { success: true, data: rows }
    } catch (err: any) {
      throw createError({ statusCode: 500, statusMessage: err.message })
    }
  }

  if (method === 'POST') {
    const body = await readBody(event)
    const creatorId = event.context.user?.id || 1
    const { name, slug, description, icon, color, isPrivate, category } = body
    const parentId = normalizeParentId(body.parentId !== undefined ? body.parentId : body.parent_id)

    const cleanName = cleanNodeName(name)
    const cleanSlug = cleanNodeSlug(slug || cleanName)

    if (!cleanName || !cleanSlug) {
      throw createError({ statusCode: 400, statusMessage: 'Nome e slug sono obbligatori.' })
    }

    try {
      let inheritedCategory = category ? String(category).trim() : null
      if (parentId !== null) {
        const check: any = await db.execute(sql`SELECT id, category FROM nodes WHERE id = ${parentId} LIMIT 1`)
        const found = Array.isArray(check) ? check : (check?.rows || [])
        if (!found.length) {
          throw createError({ statusCode: 400, statusMessage: `Nodo padre #${parentId} non trovato.` })
        }
        if (!inheritedCategory && found[0].category) {
          inheritedCategory = String(found[0].category).trim()
        }
      }

      const result: any = await db.execute(sql`
        INSERT INTO nodes (
          name, slug, description, icon, color, category, parent_id, creator_id, is_private, subscribers_count
        )
        VALUES (
          ${cleanName},
          ${cleanSlug},
          ${String(description || '').trim()},
          ${icon || '#'},
          ${color || '#38bdf8'},
          ${inheritedCategory || '3. Dev, Tech & Architecture'},
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