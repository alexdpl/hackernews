import { defineEventHandler, getQuery, setResponseHeader } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

function normalizeTags(raw: any): string[] {
  if (Array.isArray(raw)) return raw.map((t) => String(t).trim()).filter(Boolean)
  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (!trimmed) return []
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) return parsed.map((t) => String(t).trim()).filter(Boolean)
    } catch {
      return trimmed
        .replace(/^\{|\}$/g, '')
        .split(',')
        .map((t) => t.replace(/^"|"$/g, '').trim())
        .filter(Boolean)
    }
  }
  return []
}

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store, no-cache, must-revalidate')
  const query = getQuery(event)
  const limit = Math.min(100, Math.max(1, Number(query.limit || 100)))

  const db = await getDb()
  if (!db) return { success: true, data: [] }

  try {
    const res = await db.execute(sql`
      SELECT
        bp.id,
        bp.title,
        bp.slug,
        COALESCE(bp.excerpt, LEFT(COALESCE(bp.content, ''), 200)) AS excerpt,
        bp.content,
        bp.category_id AS "categoryId",
        bp.subcategory_id AS "subcategoryId",
        COALESCE(bc.name, 'DKP Ecosystem & Releases') AS category,
        COALESCE(bc.slug, 'dkp-ecosystem-releases') AS "categorySlug",
        COALESCE(bs.name, '') AS subcategory,
        COALESCE(bs.slug, '') AS "subcategorySlug",
        bp.tags,
        COALESCE(bp.status, 'published') AS status,
        COALESCE(bp.views, 0) AS views,
        COALESCE(bp.likes, 0) AS likes,
        bp.vault_hash AS "vaultHash",
        bp.created_at AS "createdAt",
        COALESCE(u.username, 'alexdpl') AS "authorName"
      FROM blog_posts bp
      LEFT JOIN blog_categories bc ON bc.id = bp.category_id
      LEFT JOIN blog_subcategories bs ON bs.id = bp.subcategory_id
      LEFT JOIN users u ON u.id = bp.author_id
      WHERE COALESCE(bp.status, 'published') = 'published'
      ORDER BY bp.created_at DESC
      LIMIT ${limit};
    `)
    const rows = extractRows(res).map((r: any) => ({
      ...r,
      tags: normalizeTags(r.tags)
    }))
    return { success: true, data: rows }
  } catch {
    try {
      const fallbackRes = await db.execute(sql`
        SELECT * FROM blog_posts
        ORDER BY created_at DESC
        LIMIT ${limit};
      `)
      const rows = extractRows(fallbackRes).map((r: any) => ({
        ...r,
        category: r.category || 'DKP Ecosystem & Releases',
        authorName: r.authorName || r.author_name || 'alexdpl',
        createdAt: r.createdAt || r.created_at,
        tags: normalizeTags(r.tags)
      }))
      return { success: true, data: rows }
    } catch {
      return { success: true, data: [] }
    }
  }
})