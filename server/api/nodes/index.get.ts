// server/api/nodes/index.get.ts
import { defineEventHandler } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { VaultService } from '~~/server/services/vault.service'

function stripNodePrefix(raw: string): string {
  return String(raw || '').replace(/^(n\/)+/i, '').trim()
}

export default defineEventHandler(async () => {
  try {
    const db = await getDb()
    if (!db) {
      return { success: false, vaultConnected: false, total: 0, data: [], tree: [] }
    }

    const vaultConnected = await VaultService.ensureForumVaultConnection().catch(() => false)

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
      const parentIdRaw = r.parent_id ?? r.parentId ?? null
      const parentId = parentIdRaw !== null && Number(parentIdRaw) > 0 ? Number(parentIdRaw) : null
      const parentRow = parentId ? nodeById.get(parentId) : null

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
        slug: String(r.slug || '').trim(),
        icon: r.icon || '#',
        color: r.color || '#a855f7',
        parentId,
        parent_id: parentId,
        parentName: parentRow ? stripNodePrefix(parentRow.name) : null,
        parentSlug: parentRow ? String(parentRow.slug || '') : null,
        isSubNode: Boolean(parentId || /^n\/n\//i.test(rawName)),
        category: dbCategory,
        subscribersCount: Number(r.subscribers_count ?? r.subscribersCount ?? 0),
        subscribers_count: Number(r.subscribers_count ?? r.subscribersCount ?? 0),
        postsCount: Number(r.posts_count ?? r.postsCount ?? 0),
        posts_count: Number(r.posts_count ?? r.postsCount ?? 0),
        isVaultNode: r.slug === 'blockchain-vault'
      }
    })

    // Costruzione albero gerarchico (Parent -> Children) per Pubblica e Admin
    const childrenMap = new Map<number, any[]>()
    for (const n of normalized) {
      if (n.parentId) {
        if (!childrenMap.has(n.parentId)) childrenMap.set(n.parentId, [])
        childrenMap.get(n.parentId)!.push(n)
      }
    }

    const tree = normalized
      .filter((n: any) => !n.parentId)
      .map((parent: any) => ({
        ...parent,
        children: childrenMap.get(parent.id) || []
      }))

    return {
      success: true,
      vaultConnected,
      vaultNodeSlug: 'blockchain-vault',
      total: normalized.length,
      data: normalized,
      tree
    }
  } catch (err: any) {
    console.error('❌ [NODES GET ERROR]:', err?.message)
    return {
      success: false,
      vaultConnected: false,
      total: 0,
      message: 'Errore durante il recupero dei DKP Nodes.',
      data: [],
      tree: []
    }
  }
})