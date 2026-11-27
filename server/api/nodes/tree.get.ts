// server/api/nodes/tree.get.ts
import { defineEventHandler } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '../../utils/db'
import { cleanNodeName, rebuildSemanticNodesHierarchy } from '../../utils/nodesTreeService'

export default defineEventHandler(async () => {
  const db = await getDb()
  if (!db) {
    return { success: false, total: 0, rootCount: 0, subCount: 0, flat: [], tree: [] }
  }

  const healthCheck: any = await db.execute(sql`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE parent_id IS NULL)::int AS root_cnt
    FROM nodes
  `).catch(() => [])
  const hRow = (Array.isArray(healthCheck) ? healthCheck : (healthCheck?.rows || []))[0] || {}
  if (Number(hRow.total || 0) > 12 && Number(hRow.root_cnt || 0) > 12) {
    await rebuildSemanticNodesHierarchy(db).catch(() => null)
  }

  const res: any = await db.execute(sql`
    SELECT
      n.id,
      n.name,
      n.slug,
      n.description,
      n.icon,
      n.color,
      n.category,
      n.parent_id AS "parentId",
      n.subscribers_count AS "subscribersCount",
      n.is_private AS "isPrivate",
      COUNT(p.id)::int AS "postsCount"
    FROM nodes n
    LEFT JOIN node_posts p ON p.node_id = n.id
    GROUP BY n.id
    ORDER BY n.parent_id NULLS FIRST, n.category ASC, n.name ASC
  `)

  const rows = Array.isArray(res) ? res : (res?.rows || [])
  const byId = new Map<number, any>()

  const normalized = rows.map((r: any) => {
    const parentId = r.parentId !== null && Number(r.parentId) > 0 ? Number(r.parentId) : null
    const item = {
      id: Number(r.id),
      name: cleanNodeName(r.name || r.slug),
      slug: String(r.slug || '').trim(),
      description: String(r.description || ''),
      icon: r.icon || '#',
      color: r.color || '#38bdf8',
      category: String(r.category || '3. Dev, Tech & Architecture').trim(),
      parentId,
      parentName: null as string | null,
      subscribersCount: Number(r.subscribersCount || 0),
      postsCount: Number(r.postsCount || 0),
      isPrivate: Boolean(r.isPrivate),
      children: [] as any[]
    }
    byId.set(item.id, item)
    return item
  })

  const roots: any[] = []
  for (const node of normalized) {
    if (node.parentId && byId.has(node.parentId) && node.parentId !== node.id) {
      const parent = byId.get(node.parentId)
      node.parentName = parent.name
      parent.children.push(node)
    } else {
      node.parentId = null
      roots.push(node)
    }
  }

  roots.sort((a, b) => a.category.localeCompare(b.category, 'it', { numeric: true }))

  return {
    success: true,
    total: normalized.length,
    rootCount: roots.length,
    subCount: normalized.length - roots.length,
    flat: normalized,
    tree: roots
  }
})