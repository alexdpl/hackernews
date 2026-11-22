// server/api/vault/ledger.ts
import { defineEventHandler, getQuery, setResponseHeaders } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { BlockchainService } from '~~/server/utils/blockchainService'

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

let indexesEnsured = false

async function ensureVaultLedgerIndexes(db: any) {
  if (indexesEnsured) return
  await BlockchainService.ensureSchema(db).catch(() => null)

  const indexStatements = [
    sql`CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON blog_posts (created_at DESC);`,
    sql`CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles (created_at DESC);`,
    sql`CREATE INDEX IF NOT EXISTS idx_node_posts_created_at ON node_posts (created_at DESC);`,
    sql`CREATE INDEX IF NOT EXISTS idx_vault_certs_created_at ON vault_certs (created_at DESC);`,
    sql`CREATE INDEX IF NOT EXISTS idx_dkp_vault_ledger_notarized_at ON dkp_vault_ledger (notarized_at DESC);`
  ]

  for (const stmt of indexStatements) {
    await db.execute(stmt).catch(() => null)
  }
  indexesEnsured = true
}

async function resolveExistingBlogTables(db: any): Promise<string[]> {
  const res = await db.execute(sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('blog_posts', 'articles', 'posts')
    ORDER BY CASE table_name
      WHEN 'blog_posts' THEN 1
      WHEN 'articles' THEN 2
      ELSE 3
    END;
  `).catch(() => null)
  return extractRows(res).map((r: any) => String(r.table_name))
}

async function getTableColumns(db: any, tableName: string): Promise<Set<string>> {
  const res = await db.execute(sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = ${tableName};
  `).catch(() => null)
  return new Set(extractRows(res).map((r: any) => String(r.column_name)))
}

export default defineEventHandler(async (event) => {
  setResponseHeaders(event, {
    'X-Cloud-Region': 'europe-west4',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  })

  const startedAt = Date.now()
  const query = getQuery(event)
  const rawCategory = String(query.category || query.section || 'all').trim().toLowerCase()
  const category: 'all' | 'blog' | 'forum' | 'tool' =
    rawCategory === 'blog'
      ? 'blog'
      : rawCategory === 'forum' || rawCategory === 'thread' || rawCategory === 'nodes'
        ? 'forum'
        : rawCategory === 'tool' || rawCategory === 'tools'
          ? 'tool'
          : 'all'

  const searchQ = String(query.q || '').trim().toLowerCase()
  const page = Math.max(1, parseInt(String(query.page || '1'), 10) || 1)
  const limit = Math.min(100, Math.max(5, parseInt(String(query.limit || '30'), 10) || 30))

  const db = await getDb()
  if (!db) {
    return {
      success: false,
      message: 'Database Neon non disponibile.',
      items: [],
      counts: { all: 0, blog: 0, forum: 0, tool: 0 },
      pagination: { page: 1, limit, totalItems: 0, totalPages: 1 },
      telemetry: { dbLatencyMs: 0, latestBlock: 0, network: 'DKP-Mainnet-SHA256' }
    }
  }

  await ensureVaultLedgerIndexes(db)

  interface UnifiedVaultEntry {
    uid: string
    category: 'blog' | 'forum' | 'tool'
    badgeLabel: string
    subType: string
    entityId: number
    title: string
    author: string
    hash: string
    blockNumber: number | null
    merkleRoot: string | null
    nodeSlug: string | null
    routeUrl: string
    status: string
    createdAt: string
  }

  const unified: UnifiedVaultEntry[] = []
  const seenKeys = new Set<string>()
  const seenBlogIds = new Set<number>()

  // -----------------------------------------------------------------------
  // 1. EDITORIAL BLOG (rilevamento dinamico blog_posts / articles / posts + ledger)
  // -----------------------------------------------------------------------
  const blogTables = await resolveExistingBlogTables(db)
  for (const tbl of blogTables) {
    try {
      const cols = await getTableColumns(db, tbl)
      if (!cols.has('id') || !cols.has('title')) continue

      const hasSlug = cols.has('slug')
      const hasCategory = cols.has('category')
      const hasVaultHash = cols.has('vault_hash')
      const hasVaultBlock = cols.has('vault_block_number')
      const hasAuthorId = cols.has('author_id')
      const hasAuthorCol = cols.has('author')
      const hasCreatedAt = cols.has('created_at')

      const slugExpr = hasSlug ? `b.slug` : `CAST(b.id AS TEXT)`
      const catExpr = hasCategory ? `COALESCE(b.category, 'Editorial')` : `'Editorial'`
      const hashExpr = hasVaultHash ? `COALESCE(b.vault_hash, vl.vault_hash)` : `vl.vault_hash`
      const blockExpr = hasVaultBlock ? `COALESCE(b.vault_block_number, vl.block_number)` : `vl.block_number`
      const authorJoin = hasAuthorId ? `LEFT JOIN users u ON u.id = b.author_id` : ``
      const authorExpr = hasAuthorId
        ? `COALESCE(u.username, ${hasAuthorCol ? 'b.author,' : ''} 'alexdpl')`
        : hasAuthorCol
          ? `COALESCE(b.author, 'alexdpl')`
          : `'alexdpl'`
      const dateExpr = hasCreatedAt ? `COALESCE(vl.notarized_at, b.created_at, NOW())` : `COALESCE(vl.notarized_at, NOW())`
      const whereExpr = hasVaultHash
        ? `(b.vault_hash IS NOT NULL AND b.vault_hash <> '') OR vl.vault_hash IS NOT NULL`
        : `vl.vault_hash IS NOT NULL`

      const querySql = `
        SELECT
          b.id,
          b.title,
          ${slugExpr} AS slug,
          ${catExpr} AS category,
          ${hashExpr} AS "vaultHash",
          ${blockExpr} AS "blockNumber",
          vl.merkle_root AS "merkleRoot",
          ${authorExpr} AS author,
          ${dateExpr} AS "createdAt"
        FROM ${tbl} b
        ${authorJoin}
        LEFT JOIN LATERAL (
          SELECT block_number, vault_hash, merkle_root, notarized_at
          FROM dkp_vault_ledger
          WHERE entity_type = 'blog' AND entity_id = b.id
          ORDER BY id DESC
          LIMIT 1
        ) vl ON TRUE
        WHERE ${whereExpr}
        ORDER BY ${dateExpr} DESC
        LIMIT 150;
      `

      const blogRes = await db.execute(sql.raw(querySql))
      for (const row of extractRows(blogRes)) {
        const hash = String(row.vaultHash || '').trim()
        const entityId = Number(row.id)
        if (!hash || seenBlogIds.has(entityId)) continue
        seenBlogIds.add(entityId)
        seenKeys.add(`blog:${entityId}:${hash}`)

        unified.push({
          uid: `BLOG-${entityId}`,
          category: 'blog',
          badgeLabel: 'EDITORIAL BLOG',
          subType: String(row.category || 'Editorial'),
          entityId,
          title: String(row.title || 'Articolo Editorial Hub'),
          author: String(row.author || 'alexdpl'),
          hash,
          blockNumber: row.blockNumber ? Number(row.blockNumber) : null,
          merkleRoot: row.merkleRoot ? String(row.merkleRoot) : null,
          nodeSlug: null,
          routeUrl: row.slug ? `/blog/${row.slug}` : '/blog',
          status: 'VERIFIED',
          createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString()
        })
      }
    } catch {}
  }

  // Fallback diretto da dkp_vault_ledger per eventuali record entity_type = 'blog' residui
  try {
    const ledgerBlogRes = await db.execute(sql`
      SELECT
        entity_id AS "entityId",
        block_number AS "blockNumber",
        vault_hash AS "vaultHash",
        merkle_root AS "merkleRoot",
        notarized_at AS "createdAt"
      FROM dkp_vault_ledger
      WHERE entity_type = 'blog'
      ORDER BY notarized_at DESC
      LIMIT 150;
    `)
    for (const row of extractRows(ledgerBlogRes)) {
      const entityId = Number(row.entityId)
      const hash = String(row.vaultHash || '').trim()
      if (!hash || seenBlogIds.has(entityId)) continue
      seenBlogIds.add(entityId)

      unified.push({
        uid: `BLOG-${entityId}`,
        category: 'blog',
        badgeLabel: 'EDITORIAL BLOG',
        subType: 'Editorial Hub',
        entityId,
        title: `Articolo Editorial Hub #${entityId}`,
        author: 'alexdpl',
        hash,
        blockNumber: row.blockNumber ? Number(row.blockNumber) : null,
        merkleRoot: row.merkleRoot ? String(row.merkleRoot) : null,
        nodeSlug: null,
        routeUrl: '/blog',
        status: 'VERIFIED',
        createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString()
      })
    }
  } catch {}

  // -----------------------------------------------------------------------
  // 2. FORUM / THREAD (node_posts con vault_hash o presenti su dkp_vault_ledger)
  // -----------------------------------------------------------------------
  try {
    const forumRes = await db.execute(sql`
      SELECT
        np.id,
        np.title,
        COALESCE(np.vault_hash, vl.vault_hash) AS "vaultHash",
        COALESCE(np.vault_block_number, vl.block_number) AS "blockNumber",
        vl.merkle_root AS "merkleRoot",
        n.slug AS "nodeSlug",
        n.name AS "nodeName",
        COALESCE(u.username, 'alexdpl') AS author,
        COALESCE(vl.notarized_at, np.created_at) AS "createdAt"
      FROM node_posts np
      LEFT JOIN nodes n ON n.id = np.node_id
      LEFT JOIN users u ON u.id = np.author_id
      LEFT JOIN LATERAL (
        SELECT block_number, vault_hash, merkle_root, notarized_at
        FROM dkp_vault_ledger
        WHERE entity_type = 'forum' AND entity_id = np.id
        ORDER BY id DESC
        LIMIT 1
      ) vl ON TRUE
      WHERE (np.vault_hash IS NOT NULL AND np.vault_hash <> '') OR vl.vault_hash IS NOT NULL
      ORDER BY COALESCE(vl.notarized_at, np.created_at) DESC
      LIMIT 150;
    `)

    for (const row of extractRows(forumRes)) {
      const hash = String(row.vaultHash || '').trim()
      if (!hash) continue
      const dedupKey = `forum:${row.id}:${hash}`
      if (seenKeys.has(dedupKey)) continue
      seenKeys.add(dedupKey)

      unified.push({
        uid: `THREAD-${row.id}`,
        category: 'forum',
        badgeLabel: 'FORUM / THREAD',
        subType: row.nodeSlug ? `n/${row.nodeSlug}` : 'DKP Talks',
        entityId: Number(row.id),
        title: String(row.title || 'Discussione Notarizzata'),
        author: String(row.author || 'alexdpl'),
        hash,
        blockNumber: row.blockNumber ? Number(row.blockNumber) : null,
        merkleRoot: row.merkleRoot ? String(row.merkleRoot) : null,
        nodeSlug: row.nodeSlug ? String(row.nodeSlug) : null,
        routeUrl: `/nodes/thread/${row.id}`,
        status: 'VERIFIED',
        createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString()
      })
    }
  } catch {}

  // -----------------------------------------------------------------------
  // 3. TOOL ECOSYSTEM (vault_certs: Proof-of-Code, AI Scanner, CLI, Pulse)
  // -----------------------------------------------------------------------
  try {
    const toolsRes = await db.execute(sql`
      SELECT
        vc.id,
        vc.tool_type AS "toolType",
        vc.title,
        vc.hash,
        COALESCE(u.username, 'alexdpl') AS author,
        vc.created_at AS "createdAt"
      FROM vault_certs vc
      LEFT JOIN users u ON u.id = vc.user_id
      WHERE vc.hash IS NOT NULL AND vc.hash <> ''
      ORDER BY vc.created_at DESC
      LIMIT 150;
    `)

    for (const row of extractRows(toolsRes)) {
      const hash = String(row.hash || '').trim()
      if (!hash) continue
      const dedupKey = `tool:${row.id}:${hash}`
      if (seenKeys.has(dedupKey)) continue
      seenKeys.add(dedupKey)

      const rawTool = String(row.toolType || 'PROOF_OF_CODE').toUpperCase()
      const routeUrl = rawTool.includes('SCAN')
        ? '/tools/ai-scanner'
        : rawTool.includes('CLI')
          ? '/tools/cli-toolkit'
          : rawTool.includes('PULSE')
            ? '/feed'
            : '/tools/proof-of-code'

      unified.push({
        uid: `TOOL-${row.id}`,
        category: 'tool',
        badgeLabel: 'TOOL ECOSYSTEM',
        subType: rawTool.replace(/_/g, ' '),
        entityId: Number(row.id),
        title: String(row.title || 'Certificato Crittografico Tool'),
        author: String(row.author || 'alexdpl'),
        hash,
        blockNumber: null,
        merkleRoot: null,
        nodeSlug: null,
        routeUrl,
        status: 'VERIFIED',
        createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString()
      })
    }
  } catch {}

  // Ordinamento cronologico globale decrescente (created_at DESC)
  unified.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const counts = {
    all: unified.length,
    blog: unified.filter((i) => i.category === 'blog').length,
    forum: unified.filter((i) => i.category === 'forum').length,
    tool: unified.filter((i) => i.category === 'tool').length
  }

  const filtered = unified.filter((item) => {
    const matchCategory = category === 'all' || item.category === category
    const matchSearch =
      !searchQ ||
      item.title.toLowerCase().includes(searchQ) ||
      item.author.toLowerCase().includes(searchQ) ||
      item.hash.toLowerCase().includes(searchQ) ||
      item.subType.toLowerCase().includes(searchQ)
    return matchCategory && matchSearch
  })

  const totalItems = filtered.length
  const totalPages = Math.max(1, Math.ceil(totalItems / limit))
  const safePage = Math.min(page, totalPages)
  const startIdx = (safePage - 1) * limit
  const paginatedItems = filtered.slice(startIdx, startIdx + limit)

  const latestBlock = unified.reduce((max, item) => {
    const b = Number(item.blockNumber || 0)
    return b > max ? b : max
  }, 0)

  return {
    success: true,
    items: paginatedItems,
    counts,
    pagination: {
      page: safePage,
      limit,
      totalItems,
      totalPages
    },
    telemetry: {
      dbLatencyMs: Math.max(1, Date.now() - startedAt),
      latestBlock,
      network: 'DKP-Mainnet-SHA256'
    }
  }
})