import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export interface ColumnInfo {
  name: string
  isNullable: boolean
  dataType: string
  hasDefault: boolean
}

export interface ResolvedNewsTable {
  tableName: string
  columns: Set<string>
  columnMeta: Map<string, ColumnInfo>
}

let cachedMeta: ResolvedNewsTable | null = null

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

export async function resolveNewsTable(forceRefresh = false): Promise<ResolvedNewsTable | null> {
  if (cachedMeta && !forceRefresh) return cachedMeta

  const db = await getDb()
  if (!db) return null

  try {
    const tablesRes = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE';
    `)
    const tableNames = extractRows(tablesRes).map((r: any) => String(r.table_name))

    const candidates = ['stories', 'hn_stories', 'news', 'feed_items', 'articles']
    let chosen = candidates.find((c) => tableNames.includes(c))

    if (!chosen) {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS news (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          url TEXT,
          domain TEXT,
          author VARCHAR(120) DEFAULT 'sentinel_ai',
          points INTEGER DEFAULT 1,
          comments_count INTEGER DEFAULT 0,
          type VARCHAR(40) DEFAULT 'feed',
          feed_channel VARCHAR(40) DEFAULT 'feed',
          source_provider VARCHAR(40) DEFAULT 'HN',
          sentinel_verified BOOLEAN DEFAULT TRUE,
          sentinel_hash VARCHAR(128),
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `)
      chosen = 'news'
    }

    await db.execute(
      sql.raw(`
        ALTER TABLE "${chosen}"
          ADD COLUMN IF NOT EXISTS feed_channel VARCHAR(40),
          ADD COLUMN IF NOT EXISTS source_provider VARCHAR(40) DEFAULT 'HN',
          ADD COLUMN IF NOT EXISTS sentinel_verified BOOLEAN DEFAULT TRUE,
          ADD COLUMN IF NOT EXISTS sentinel_hash VARCHAR(128);
      `)
    ).catch(() => null)

    const colsRes = await db.execute(sql`
      SELECT column_name, is_nullable, data_type, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ${chosen};
    `)

    const columns = new Set<string>()
    const columnMeta = new Map<string, ColumnInfo>()

    for (const r of extractRows(colsRes)) {
      const name = String(r.column_name)
      columns.add(name)
      columnMeta.set(name, {
        name,
        isNullable: String(r.is_nullable).toUpperCase() === 'YES',
        dataType: String(r.data_type || '').toLowerCase(),
        hasDefault: r.column_default !== null && r.column_default !== undefined
      })
    }

    cachedMeta = { tableName: chosen, columns, columnMeta }
    return cachedMeta
  } catch (err) {
    console.error('[dkpNewsRepo] Errore risoluzione tabella:', err)
    return null
  }
}

export function normalizeNewsRow(r: any, fallbackType = 'feed') {
  let domain = r.domain || ''
  if (!domain && r.url) {
    try {
      domain = new URL(String(r.url)).hostname.replace(/^www\./, '')
    } catch {
      domain = 'devkernelpulse.org'
    }
  }

  let createdAt = r.created_at || r.createdAt || r.published_at || null
  if (!createdAt && typeof r.time === 'number') {
    createdAt = new Date(r.time * 1000).toISOString()
  }

  const pts = Number(r.points ?? r.score ?? r.karma ?? 1)
  const author = r.author || r.by || r.username || 'sentinel_ai'
  const comments = Number(r.comments_count ?? r.commentsCount ?? r.descendants ?? 0)

  return {
    id: r.id,
    title: r.title || '(Senza titolo)',
    url: r.url || null,
    text: r.text || r.content || r.summary || '',
    domain: domain || 'devkernelpulse.org',
    points: pts,
    score: pts,
    author,
    by: author,
    type: r.feed_channel || r.type || fallbackType,
    sourceProvider: r.source_provider || r.sourceProvider || 'HN',
    sentinelVerified: r.sentinel_verified !== false,
    commentsCount: comments,
    createdAt: createdAt || new Date().toISOString()
  }
}