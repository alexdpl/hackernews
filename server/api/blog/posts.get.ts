import { defineEventHandler, getQuery, setResponseHeader } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store, no-cache, must-revalidate')
  const query = getQuery(event)
  const limit = Math.min(50, Math.max(1, Number(query.limit || 20)))

  const db = await getDb()
  if (!db) return { success: true, data: [] }

  const res = await db.execute(sql`
    SELECT
      bp.id, bp.title, bp.slug,
      COALESCE(bp.excerpt, '') AS excerpt,
      bp.content,
      COALESCE(bp.category, 'DKP Ecosystem & Releases') AS category,
      COALESCE(bp.tags, '[]'::jsonb) AS tags,
      COALESCE(bp.status, 'published') AS status,
      bp.created_at AS "createdAt",
      COALESCE(u.username, 'alexdpl') AS "authorName"
    FROM blog_posts bp
    LEFT JOIN users u ON u.id = bp.author_id
    WHERE COALESCE(bp.status, 'published') = 'published'
    ORDER BY bp.created_at DESC
    LIMIT ${limit};
  `).catch(() => [])

  return { success: true, data: extractRows(res) }
})