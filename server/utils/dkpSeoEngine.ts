// server/utils/dkpSeoEngine.ts
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export const DKP_CANONICAL_ORIGIN = 'https://devkernelpulse.org'

export interface DkpStaticRouteEntry {
  path: string
  changefreq: 'daily' | 'weekly' | 'monthly'
  priority: string
  title: string
  category: 'core' | 'docs' | 'tools' | 'community' | 'legal'
}

export const DKP_STATIC_ROUTES: DkpStaticRouteEntry[] = [
  { path: '', changefreq: 'daily', priority: '1.0', title: 'DevKernelPulse Home', category: 'core' },
  { path: '/blog', changefreq: 'daily', priority: '0.9', title: 'DKP Engineering Blog', category: 'core' },
  { path: '/nodes', changefreq: 'daily', priority: '0.9', title: 'DKP Community Nodes & Forum', category: 'community' },
  { path: '/news', changefreq: 'daily', priority: '0.9', title: 'Tech News & Discussions', category: 'community' },
  { path: '/newest', changefreq: 'daily', priority: '0.8', title: 'Latest Submissions', category: 'community' },
  { path: '/ask', changefreq: 'daily', priority: '0.8', title: 'Ask DKP Developers', category: 'community' },
  { path: '/show', changefreq: 'daily', priority: '0.8', title: 'Show DKP Projects', category: 'community' },
  { path: '/jobs', changefreq: 'daily', priority: '0.8', title: 'Tech & AI Jobs', category: 'community' },
  { path: '/bounties', changefreq: 'daily', priority: '0.8', title: 'DKP Bounties & $PULSE', category: 'community' },
  { path: '/shop', changefreq: 'weekly', priority: '0.8', title: 'DKP Shop & API Pass', category: 'core' },
  { path: '/roadmap', changefreq: 'weekly', priority: '0.8', title: 'DKP Roadmap v2.6', category: 'core' },
  { path: '/features', changefreq: 'weekly', priority: '0.8', title: 'Platform Features', category: 'core' },
  { path: '/about', changefreq: 'monthly', priority: '0.7', title: 'About DevKernelPulse', category: 'core' },
  { path: '/guidelines', changefreq: 'monthly', priority: '0.6', title: 'Community Guidelines', category: 'community' },
  { path: '/status', changefreq: 'daily', priority: '0.6', title: 'System Status & Telemetry', category: 'core' },
  { path: '/contact', changefreq: 'monthly', priority: '0.6', title: 'Contact', category: 'core' },
  { path: '/docs', changefreq: 'weekly', priority: '0.9', title: 'Documentation Hub', category: 'docs' },
  { path: '/docs/api', changefreq: 'weekly', priority: '0.9', title: 'DKP API Reference', category: 'docs' },
  { path: '/docs/ecosystem', changefreq: 'weekly', priority: '0.9', title: 'DKP Ecosystem Architecture', category: 'docs' },
  { path: '/docs/sdk', changefreq: 'weekly', priority: '0.9', title: '@devkernelpulse/sdk Docs', category: 'docs' },
  { path: '/tools', changefreq: 'weekly', priority: '0.8', title: 'DKP Developer Tools Suite', category: 'tools' },
  { path: '/tools/terminal', changefreq: 'weekly', priority: '0.7', title: 'DKP Web Terminal', category: 'tools' },
  { path: '/tools/openui-studio', changefreq: 'weekly', priority: '0.8', title: 'OpenUI Studio AI', category: 'tools' },
  { path: '/tools/cli-toolkit', changefreq: 'weekly', priority: '0.7', title: 'DKP CLI Toolkit', category: 'tools' },
  { path: '/tools/proof-of-code', changefreq: 'weekly', priority: '0.8', title: 'Proof of Code Vault Verifier', category: 'tools' },
  { path: '/tools/ai-scanner', changefreq: 'weekly', priority: '0.7', title: 'AI Security Scanner', category: 'tools' },
  { path: '/tools/ai-repo-scanner', changefreq: 'weekly', priority: '0.7', title: 'AI Repo Scanner', category: 'tools' },
  { path: '/playground', changefreq: 'weekly', priority: '0.7', title: 'AI & OpenUI Playground', category: 'tools' },
  { path: '/legal/privacy', changefreq: 'monthly', priority: '0.4', title: 'Privacy Policy', category: 'legal' },
  { path: '/legal/terms', changefreq: 'monthly', priority: '0.4', title: 'Terms of Service', category: 'legal' },
  { path: '/legal/cookies', changefreq: 'monthly', priority: '0.4', title: 'Cookie Policy', category: 'legal' }
]

export interface DkpIndexableItem {
  kind: 'blog' | 'node' | 'thread'
  url: string
  title: string
  description: string
  author: string
  category: string
  notarizationHash?: string
  updatedAt: string
}

export function escapeXml(unsafe: unknown): string {
  return String(unsafe ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

async function getTableColumns(db: any, tableName: string): Promise<Set<string>> {
  try {
    const res = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ${tableName};
    `)
    return new Set(extractRows(res).map((r: any) => String(r.column_name)))
  } catch {
    return new Set()
  }
}

export async function fetchIndexableDkpContent(): Promise<{
  posts: DkpIndexableItem[]
  nodes: DkpIndexableItem[]
  threads: DkpIndexableItem[]
}> {
  const result = {
    posts: [] as DkpIndexableItem[],
    nodes: [] as DkpIndexableItem[],
    threads: [] as DkpIndexableItem[]
  }

  const db = await getDb().catch(() => null)
  if (!db) return result

  // 1. BLOG POSTS (blog_posts)
  try {
    const cols = await getTableColumns(db, 'blog_posts')
    if (cols.size > 0 && cols.has('slug')) {
      const titleExpr = cols.has('title') ? 'title' : `'Articolo DevKernelPulse'`
      const descCol = cols.has('excerpt') ? 'excerpt' : cols.has('description') ? 'description' : cols.has('summary') ? 'summary' : null
      const descExpr = descCol ? `COALESCE(NULLIF(${descCol}, ''), '')` : `''`
      const authorCol = cols.has('author_name') ? 'author_name' : cols.has('author') ? 'author' : cols.has('username') ? 'username' : null
      const authorExpr = authorCol ? `COALESCE(NULLIF(${authorCol}, ''), 'Alessandro De Paola')` : `'Alessandro De Paola'`
      const catCol = cols.has('category') ? 'category' : cols.has('tag') ? 'tag' : null
      const catExpr = catCol ? `COALESCE(NULLIF(${catCol}, ''), 'Engineering')` : `'Engineering'`
      const hashCol = cols.has('notarization_hash') ? 'notarization_hash' : cols.has('sha256_hash') ? 'sha256_hash' : cols.has('tx_hash') ? 'tx_hash' : null
      const hashExpr = hashCol ? `${hashCol}` : `NULL`
      const dateExpr = cols.has('updated_at') && cols.has('created_at')
        ? 'COALESCE(updated_at, created_at, NOW())'
        : cols.has('created_at')
          ? 'COALESCE(created_at, NOW())'
          : 'NOW()'
      const statusWhere = cols.has('status') ? `WHERE LOWER(COALESCE(status, 'published')) = 'published'` : ''

      const rows = extractRows(
        await db.execute(
          sql.raw(`
            SELECT
              slug,
              ${titleExpr} AS title,
              ${descExpr} AS description,
              ${authorExpr} AS author,
              ${catExpr} AS category,
              ${hashExpr} AS notarization_hash,
              ${dateExpr} AS updated_at
            FROM blog_posts
            ${statusWhere}
            ORDER BY ${dateExpr} DESC
            LIMIT 1000;
          `)
        )
      )

      result.posts = rows
        .filter((r: any) => r.slug)
        .map((r: any) => ({
          kind: 'blog' as const,
          url: `${DKP_CANONICAL_ORIGIN}/blog/${encodeURIComponent(String(r.slug).trim())}`,
          title: String(r.title || r.slug),
          description: String(r.description || `Approfondimento tecnico su ${r.title || r.slug} — DevKernelPulse`).slice(0, 260),
          author: String(r.author || 'Alessandro De Paola'),
          category: String(r.category || 'Engineering'),
          notarizationHash: r.notarization_hash ? String(r.notarization_hash) : undefined,
          updatedAt: new Date(r.updated_at || Date.now()).toISOString()
        }))
    }
  } catch (err) {
    console.warn('[dkpSeoEngine] Errore lettura blog_posts:', err)
  }

  // 2. NODI DEL FORUM (nodes / dkp_nodes)
  for (const nodeTable of ['nodes', 'dkp_nodes', 'community_nodes']) {
    try {
      const cols = await getTableColumns(db, nodeTable)
      if (cols.size === 0 || !cols.has('slug')) continue

      const nameCol = cols.has('name') ? 'name' : cols.has('title') ? 'title' : 'slug'
      const descCol = cols.has('description') ? 'description' : cols.has('tagline') ? 'tagline' : null
      const descExpr = descCol ? `COALESCE(NULLIF(${descCol}, ''), '')` : `''`
      const dateExpr = cols.has('updated_at') && cols.has('created_at')
        ? 'COALESCE(updated_at, created_at, NOW())'
        : cols.has('created_at')
          ? 'COALESCE(created_at, NOW())'
          : 'NOW()'

      const rows = extractRows(
        await db.execute(
          sql.raw(`
            SELECT
              slug,
              ${nameCol} AS name,
              ${descExpr} AS description,
              ${dateExpr} AS updated_at
            FROM ${nodeTable}
            WHERE slug IS NOT NULL AND slug <> ''
            ORDER BY ${dateExpr} DESC
            LIMIT 500;
          `)
        )
      )

      result.nodes = rows.map((r: any) => ({
        kind: 'node' as const,
        url: `${DKP_CANONICAL_ORIGIN}/nodes/n/${encodeURIComponent(String(r.slug).trim())}`,
        title: String(r.name || r.slug),
        description: String(r.description || `Nodo tematico ${r.name || r.slug} nella community DevKernelPulse.`).slice(0, 240),
        author: 'DevKernelPulse Community',
        category: String(r.name || 'Nodes'),
        updatedAt: new Date(r.updated_at || Date.now()).toISOString()
      }))
      break
    } catch {
      // Prova tabella candidata successiva
    }
  }

  // 3. THREAD DEL FORUM & DISCUSSIONI (threads / forum_threads / dkp_threads / items)
  for (const threadTable of ['threads', 'forum_threads', 'dkp_threads', 'node_threads', 'items']) {
    try {
      const cols = await getTableColumns(db, threadTable)
      if (cols.size === 0) continue

      const hasSlug = cols.has('slug')
      const hasId = cols.has('id')
      if (!hasSlug && !hasId) continue

      const idSelect = hasSlug ? `COALESCE(NULLIF(slug, ''), id::text)` : `id::text`
      const titleCol = cols.has('title') ? 'title' : cols.has('subject') ? 'subject' : null
      if (!titleCol) continue

      const bodyCol = cols.has('excerpt') ? 'excerpt' : cols.has('content') ? 'content' : cols.has('body') ? 'body' : null
      const descExpr = bodyCol ? `LEFT(COALESCE(NULLIF(${bodyCol}, ''), ''), 240)` : `''`
      const authorCol = cols.has('author_name') ? 'author_name' : cols.has('username') ? 'username' : cols.has('author') ? 'author' : null
      const authorExpr = authorCol ? `COALESCE(NULLIF(${authorCol}, ''), 'DKP Member')` : `'DKP Member'`
      const nodeSlugCol = cols.has('node_slug') ? 'node_slug' : cols.has('category') ? 'category' : null
      const nodeExpr = nodeSlugCol ? `COALESCE(NULLIF(${nodeSlugCol}, ''), 'general')` : `'general'`
      const hashCol = cols.has('notarization_hash') ? 'notarization_hash' : cols.has('sha256_hash') ? 'sha256_hash' : null
      const hashExpr = hashCol ? `${hashCol}` : `NULL`
      const dateExpr = cols.has('updated_at') && cols.has('created_at')
        ? 'COALESCE(updated_at, created_at, NOW())'
        : cols.has('created_at')
          ? 'COALESCE(created_at, NOW())'
          : 'NOW()'

      const rows = extractRows(
        await db.execute(
          sql.raw(`
            SELECT
              ${idSelect} AS identifier,
              ${hasSlug ? 'TRUE' : 'FALSE'} AS is_slug,
              ${titleCol} AS title,
              ${descExpr} AS description,
              ${authorExpr} AS author,
              ${nodeExpr} AS node_slug,
              ${hashExpr} AS notarization_hash,
              ${dateExpr} AS updated_at
            FROM ${threadTable}
            WHERE ${titleCol} IS NOT NULL AND ${titleCol} <> ''
            ORDER BY ${dateExpr} DESC
            LIMIT 2000;
          `)
        )
      )

      result.threads = rows.map((r: any) => {
        const ident = encodeURIComponent(String(r.identifier).trim())
        const url =
          threadTable === 'items'
            ? `${DKP_CANONICAL_ORIGIN}/item/${ident}`
            : r.is_slug && r.node_slug && r.node_slug !== 'general'
              ? `${DKP_CANONICAL_ORIGIN}/nodes/n/${encodeURIComponent(String(r.node_slug).trim())}/${ident}`
              : `${DKP_CANONICAL_ORIGIN}/item/${ident}`

        return {
          kind: 'thread' as const,
          url,
          title: String(r.title),
          description: String(r.description || `Discussione tecnica su ${r.title}`).replace(/\s+/g, ' ').trim(),
          author: String(r.author || 'DKP Member'),
          category: String(r.node_slug || 'Forum'),
          notarizationHash: r.notarization_hash ? String(r.notarization_hash) : undefined,
          updatedAt: new Date(r.updated_at || Date.now()).toISOString()
        }
      })
      break
    } catch {
      // Prova tabella candidata successiva
    }
  }

  return result
}