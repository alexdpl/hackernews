// server/api/nodes.get.ts
import { defineEventHandler } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

function stripNodePrefix(raw: string): string {
  return String(raw || '').replace(/^(n\/)+/i, '').trim()
}

export default defineEventHandler(async () => {
  try {
    const db = await getDb()
    if (!db) {
      return { success: false, total: 0, data: [], error: 'Database offline' }
    }

    const result: any = await db.execute(sql`
      SELECT *
      FROM nodes
      ORDER BY id ASC;
    `)

    const rows = Array.isArray(result) ? result : (result?.rows || [])

    const nodeById = new Map<number, any>()
    for (const r of rows) {
      nodeById.set(Number(r.id), r)
    }

    const normalized = rows.map((r: any) => {
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
        color: r.color || '#a855f7',
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