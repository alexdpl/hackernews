// server/api/nodes/posts.get.ts
import { defineEventHandler, getQuery } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '../../utils/db'
import { VaultService } from '../../services/vault.service'

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

function slugifyTitle(raw: string): string {
  return String(raw || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96)
}

function parseTags(raw: any): string[] {
  if (Array.isArray(raw)) return raw.map((t) => String(t).trim()).filter(Boolean)
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.map((t) => String(t).trim()).filter(Boolean)
    } catch {
      return raw.split(/[,;]+/).map((t) => t.trim().replace(/^#/, '')).filter(Boolean)
    }
  }
  return []
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const nodeSlug = query.nodeSlug
    ? String(query.nodeSlug).trim().toLowerCase().replace(/^(n\/)+/i, '')
    : null
  const sort = query.sort ? String(query.sort).toLowerCase() : 'hot'
  const search = query.search || query.q ? String(query.search || query.q).trim() : ''
  const authorId = query.authorId || query.userId ? Number(query.authorId || query.userId) : null

  const page = Math.max(1, Number(query.page || 1))
  const limit = Math.min(100, Math.max(1, Number(query.limit || 20)))
  const offset = (page - 1) * limit

  try {
    const db = await getDb()
    if (!db) {
      return {
        success: true,
        data: [],
        posts: [],
        pagination: { page, limit, total: 0, totalPages: 1, hasMore: false }
      }
    }

    await db.execute(sql`
      ALTER TABLE node_posts ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
    `).catch(() => {})

    await VaultService.syncUnnotarizedPosts(25).catch(() => {})

    let orderByClause = sql`p.is_pinned DESC, p.created_at DESC`
    if (sort === 'top') {
      orderByClause = sql`p.is_pinned DESC, p.karma_score DESC, p.created_at DESC`
    } else if (sort === 'hot') {
      orderByClause = sql`p.is_pinned DESC, (p.karma_score + 1) / POWER(EXTRACT(EPOCH FROM (NOW() - p.created_at))/3600 + 2, 1.5) DESC`
    }

    const conditions: any[] = [sql`1 = 1`]

    if (nodeSlug === 'blockchain-vault') {
      conditions.push(sql`(p.vault_hash IS NOT NULL OR LOWER(REGEXP_REPLACE(n.slug, '^(n/)+', '', 'i')) = 'blockchain-vault')`)
    } else if (nodeSlug) {
      conditions.push(sql`(
        LOWER(REGEXP_REPLACE(n.slug, '^(n/)+', '', 'i')) = ${nodeSlug}
        OR n.parent_id IN (
          SELECT id FROM nodes WHERE LOWER(REGEXP_REPLACE(slug, '^(n/)+', '', 'i')) = ${nodeSlug}
        )
      )`)
    }

    if (authorId && !Number.isNaN(authorId)) {
      conditions.push(sql`p.author_id = ${authorId}`)
    }

    if (search) {
      const pattern = `%${search}%`
      conditions.push(
        sql`(p.title ILIKE ${pattern} OR COALESCE(p.content, '') ILIKE ${pattern} OR COALESCE(n.name, '') ILIKE ${pattern} OR COALESCE(p.tags::text, '') ILIKE ${pattern})`
      )
    }

    const whereClause = sql.join(conditions, sql` AND `)

    const countRes = await db.execute(sql`
      SELECT COUNT(*)::int AS total
      FROM node_posts p
      LEFT JOIN nodes n ON p.node_id = n.id
      WHERE ${whereClause};
    `)
    const total = Number(extractRows(countRes)[0]?.total ?? 0)
    const totalPages = Math.max(1, Math.ceil(total / limit))

    const result = await db.execute(sql`
      SELECT
        p.id,
        p.title,
        COALESCE(p.content, '') AS content,
        LEFT(COALESCE(p.content, ''), 360) AS excerpt,
        COALESCE(p.tags, '[]'::jsonb) AS tags,
        p.karma_score AS "karmaScore",
        p.comments_count AS "commentsCount",
        p.vault_hash AS "vaultHash",
        p.vault_block_number AS "vaultBlockNumber",
        p.is_pinned AS "isPinned",
        p.is_locked AS "isLocked",
        p.created_at AS "createdAt",
        n.id AS "nodeId",
        n.name AS "nodeName",
        REGEXP_REPLACE(COALESCE(n.slug, 'general'), '^(n/)+', '', 'i') AS "nodeSlug",
        n.icon AS "nodeIcon",
        n.color AS "nodeColor",
        u.id AS "authorId",
        COALESCE(u.username, 'alexdpl') AS "authorUsername",
        COALESCE(u.username, 'alexdpl') AS "authorName",
        'DKP-VAULT-MAINNET-v2.6' AS "vaultNetwork"
      FROM node_posts p
      LEFT JOIN nodes n ON p.node_id = n.id
      LEFT JOIN users u ON p.author_id = u.id
      WHERE ${whereClause}
      ORDER BY ${orderByClause}
      LIMIT ${limit} OFFSET ${offset};
    `)

    const rows = extractRows(result).map((r: any) => {
      const tSlug = slugifyTitle(r.title)
      return {
        ...r,
        slug: tSlug ? `${r.id}-${tSlug}` : String(r.id),
        tags: parseTags(r.tags),
        nodeSlug: String(r.nodeSlug || 'general').replace(/^(n\/)+/i, '').toLowerCase()
      }
    })

    return {
      success: true,
      vaultConnected: true,
      count: rows.length,
      total,
      data: rows,
      posts: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages
      }
    }
  } catch (err: any) {
    console.error('[NODE POSTS GET ERROR]:', err?.message)
    return {
      success: false,
      message: 'Errore nel recupero dei thread.',
      data: [],
      posts: [],
      pagination: { page, limit, total: 0, totalPages: 1, hasMore: false }
    }
  }
})