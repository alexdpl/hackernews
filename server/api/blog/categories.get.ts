import { defineEventHandler } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

export default defineEventHandler(async () => {
  const db = await Promise.resolve(getDb())
  if (!db) return { success: true, data: [] }

  try {
    const catRes = await db.execute(sql`
      SELECT id, name, slug, COALESCE(description, '') AS description
      FROM blog_categories
      ORDER BY id ASC;
    `)
    const subRes = await db.execute(sql`
      SELECT id, category_id, name, slug
      FROM blog_subcategories
      ORDER BY id ASC;
    `)

    const cats = extractRows(catRes)
    const subs = extractRows(subRes)

    if (cats.length > 0) {
      const data = cats.map((c: any) => {
        const cid = Number(c.id)
        const catSubs = subs
          .filter((s: any) => Number(s.category_id) === cid)
          .map((s: any) => ({
            id: Number(s.id),
            name: String(s.name),
            slug: String(s.slug)
          }))
        return {
          id: cid,
          name: String(c.name),
          slug: String(c.slug),
          description: String(c.description || ''),
          subcategories: catSubs
        }
      })
      return { success: true, data }
    }
  } catch {
    // Fallback su dkp_blog_categories se blog_categories non esiste
  }

  const fallbackRes = await db.execute(sql`SELECT * FROM dkp_blog_categories ORDER BY sort_order ASC, id ASC;`).catch(() => [])
  const rows = extractRows(fallbackRes).map((r: any) => ({
    id: Number(r.id),
    name: String(r.name),
    slug: String(r.slug),
    description: String(r.description || ''),
    subcategories: Array.isArray(r.subcategories) ? r.subcategories : []
  }))

  return { success: true, data: rows }
})