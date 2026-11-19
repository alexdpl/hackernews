import { defineEventHandler, getQuery, setResponseHeader } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store, no-cache, must-revalidate')
  const query = getQuery(event)
  const nodeSlug = String(query.nodeSlug || query.node || '').trim().toLowerCase()
  const limit = Math.min(100, Math.max(1, Number(query.limit || 30)))

  const db = await getDb()
  if (!db) return { success: true, data: [] }

  await db.execute(sql`ALTER TABLE node_posts ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;`).catch(() => null)
  await db.execute(sql`ALTER TABLE node_posts ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;`).catch(() => null)
  await db.execute(sql`ALTER TABLE node_posts ADD COLUMN IF NOT EXISTS vault_hash VARCHAR(128);`).catch(() => null)

  // CASO SPECIALE: n/blockchain-vault -> Unisce Thread Notarizzati + Blog Post Notarizzati
  if (nodeSlug === 'blockchain-vault') {
    const vaultRes = await db.execute(sql`
      (
        SELECT
          np.id::text AS id,
          'thread' AS "sourceType",
          np.title,
          np.content,
          COALESCE(np.tags, '[]'::jsonb) AS tags,
          np.vault_hash AS "vaultHash",
          COALESCE(np.is_locked, false) AS "isLocked",
          COALESCE(np.karma_score, 0)::int AS "karmaScore",
          np.created_at AS "createdAt",
          COALESCE(u.username, 'sentinel_ai') AS "authorName",
          COALESCE(u.role, 'USER') AS "authorRole",
          'blockchain-vault' AS "nodeSlug"
        FROM node_posts np
        LEFT JOIN users u ON u.id = np.author_id
        WHERE np.vault_hash IS NOT NULL OR LOWER(COALESCE(np.node_slug, '')) = 'blockchain-vault'
      )
      UNION ALL
      (
        SELECT
          ('blog-' || bp.id::text) AS id,
          'blog' AS "sourceType",
          bp.title,
          COALESCE(bp.excerpt, bp.content, '') AS content,
          COALESCE(bp.tags, '["vault","sha-256"]'::jsonb) AS tags,
          COALESCE(vc.hash, encode(sha256(bp.title::bytea), 'hex')) AS "vaultHash",
          false AS "isLocked",
          10 AS "karmaScore",
          bp.created_at AS "createdAt",
          COALESCE(u.username, 'alexdpl') AS "authorName",
          COALESCE(u.role, 'ADMIN') AS "authorRole",
          'blockchain-vault' AS "nodeSlug"
        FROM blog_posts bp
        LEFT JOIN users u ON u.id = bp.author_id
        LEFT JOIN vault_certs vc ON vc.title = bp.title
        WHERE bp.status = 'published'
      )
      ORDER BY "createdAt" DESC
      LIMIT ${limit};
    `).catch(() => [])

    const items = extractRows(vaultRes).map((r: any) => ({
      ...r,
      tags: Array.isArray(r.tags) ? r.tags : ['vault', 'sha-256'],
      authorBadges: String(r.authorRole).toUpperCase() === 'ADMIN'
        ? ['Kernel Admin', 'Vault Master']
        : ['Verified Builder']
    }))

    return { success: true, data: items }
  }

  // QUERY STANDARD NODI
  const res = nodeSlug
    ? await db.execute(sql`
        SELECT
          np.id, np.title, np.content,
          COALESCE(np.tags, '[]'::jsonb) AS tags,
          np.vault_hash AS "vaultHash",
          COALESCE(np.is_locked, false) AS "isLocked",
          COALESCE(np.karma_score, 0)::int AS "karmaScore",
          np.created_at AS "createdAt",
          COALESCE(np.node_slug, 'general') AS "nodeSlug",
          COALESCE(u.username, 'dkp_dev') AS "authorName",
          COALESCE(u.role, 'USER') AS "authorRole"
        FROM node_posts np
        LEFT JOIN users u ON u.id = np.author_id
        WHERE LOWER(COALESCE(np.node_slug, '')) = ${nodeSlug}
        ORDER BY np.created_at DESC
        LIMIT ${limit};
      `)
    : await db.execute(sql`
        SELECT
          np.id, np.title, np.content,
          COALESCE(np.tags, '[]'::jsonb) AS tags,
          np.vault_hash AS "vaultHash",
          COALESCE(np.is_locked, false) AS "isLocked",
          COALESCE(np.karma_score, 0)::int AS "karmaScore",
          np.created_at AS "createdAt",
          COALESCE(np.node_slug, 'general') AS "nodeSlug",
          COALESCE(u.username, 'dkp_dev') AS "authorName",
          COALESCE(u.role, 'USER') AS "authorRole"
        FROM node_posts np
        LEFT JOIN users u ON u.id = np.author_id
        ORDER BY np.created_at DESC
        LIMIT ${limit};
      `)

  const items = extractRows(res).map((r: any) => ({
    ...r,
    sourceType: 'thread',
    tags: Array.isArray(r.tags) ? r.tags : [],
    authorBadges: String(r.authorRole).toUpperCase() === 'ADMIN'
      ? ['Kernel Admin', 'Top Debater']
      : ['Verified Builder']
  }))

  return { success: true, data: items }
})