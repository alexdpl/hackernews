// server/api/nodes.get.ts
import { defineEventHandler } from 'h3'

function stripNodePrefix(raw: string): string {
  return String(raw || '').replace(/^(n\/)+/i, '').trim()
}

export default defineEventHandler(async () => {
  const sql = usePureSql()

  try {
    const rows: any[] = await sql`
      SELECT *
      FROM dkp_nodes
      ORDER BY id ASC
    `

    const nodeById = new Map<number, any>()
    for (const r of rows) {
      nodeById.set(Number(r.id), r)
    }

    const normalized = rows.map((r) => {
      const rawName = String(r.name || r.slug || '')
      const isSubByPrefix = /^n\/n\//i.test(rawName)
      const parentId = r.parent_id ?? r.parentId ?? null
      const parentRow = parentId ? nodeById.get(Number(parentId)) : null

      const dbCategory = String(
        r.category ||
        r.group_name ||
        r.groupName ||
        (parentRow ? stripNodePrefix(parentRow.name) : '')
      ).trim()

      return {
        ...r,
        id: Number(r.id),
        name: stripNodePrefix(rawName),
        rawName,
        slug: String(r.slug || ''),
        icon: r.icon || '#',
        parentId: parentId ? Number(parentId) : null,
        isSubNode: Boolean(parentId || isSubByPrefix),
        category: dbCategory,
        subscribersCount: Number(r.subscribers_count ?? r.subscribersCount ?? 0),
        postsCount: Number(r.posts_count ?? r.postsCount ?? 0)
      }
    })

    return {
      success: true,
      total: normalized.length,
      data: normalized
    }
  } catch (err: any) {
    console.error('[GET /api/nodes ERROR]:', err)
    return {
      success: false,
      total: 0,
      data: [],
      error: err?.message || 'Errore recupero nodi'
    }
  }
})