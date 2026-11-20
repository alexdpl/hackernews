import { defineEventHandler, setResponseHeader } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

function normalizeTags(raw: any): string[] {
  if (Array.isArray(raw)) return raw.map(t => String(t).trim()).filter(Boolean)
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.map(t => String(t).trim()).filter(Boolean)
    } catch {}
    return raw.split(',').map(t => t.trim()).filter(Boolean)
  }
  return []
}

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store, no-cache, must-revalidate')
  const db = await Promise.resolve(getDb())
  if (!db) return { success: true, posts: [], sourceTable: 'none' }

  const tablesRes = await db.execute(sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('blog_posts', 'blog_categories', 'dkp_blog_posts', 'dkp_blog_categories');
  `)
  const existingTables = new Set(extractRows(tablesRes).map((r: any) => String(r.table_name)))

  // Mappa ID -> Nome Categoria se blog_categories esiste
  const catIdMap = new Map<number, string>()
  if (existingTables.has('blog_categories')) {
    const bcRes = await db.execute(sql`SELECT * FROM blog_categories;`).catch(() => null)
    extractRows(bcRes).forEach((c: any) => {
      if (c.id) catIdMap.set(Number(c.id), String(c.name || c.title || 'Architecture'))
    })
  }
  if (existingTables.has('dkp_blog_categories')) {
    const dbcRes = await db.execute(sql`SELECT id, name FROM dkp_blog_categories;`).catch(() => null)
    extractRows(dbcRes).forEach((c: any) => {
      if (c.id && !catIdMap.has(Number(c.id))) catIdMap.set(Number(c.id), String(c.name))
    })
  }

  if (existingTables.has('blog_posts')) {
    const rawRes = await db.execute(sql`SELECT * FROM blog_posts ORDER BY id DESC LIMIT 500;`)
    const rawRows = extractRows(rawRes)

    const mapped = rawRows.map((r: any) => {
      const rawStatus = String(r.status || (r.is_published === false || r.published === false ? 'DRAFT' : 'PUBLISHED')).toUpperCase()
      const resolvedCategory =
        r.category ||
        r.category_name ||
        (r.category_id ? catIdMap.get(Number(r.category_id)) : null) ||
        'Architecture'

      return {
        id: Number(r.id),
        title: String(r.title || 'Senza Titolo'),
        slug: String(r.slug || `post-${r.id}`),
        category: String(resolvedCategory),
        subCategory: String(r.sub_category || r.subCategory || r.subcategory || ''),
        excerpt: String(r.excerpt || r.summary || r.description || ''),
        content: String(r.content || r.body || ''),
        coverImage: String(r.cover_image || r.coverImage || r.image_url || r.image || ''),
        author: String(r.author || r.author_name || 'DKP Editorial'),
        tags: normalizeTags(r.tags),
        status: rawStatus === 'DRAFT' ? 'DRAFT' : 'PUBLISHED',
        isFeatured: Boolean(r.is_featured ?? r.isFeatured ?? r.featured ?? false),
        viewsCount: Number(r.views_count ?? r.views ?? 0),
        createdAt: r.created_at || r.createdAt || r.published_at || new Date().toISOString()
      }
    })

    return {
      success: true,
      sourceTable: 'blog_posts',
      posts: mapped
    }
  }

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS dkp_blog_posts (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      category VARCHAR(80) DEFAULT 'Architecture',
      sub_category VARCHAR(80) DEFAULT '',
      excerpt TEXT DEFAULT '',
      content TEXT DEFAULT '',
      cover_image TEXT DEFAULT '',
      author VARCHAR(120) DEFAULT 'DKP Editorial',
      tags TEXT DEFAULT '',
      status VARCHAR(32) DEFAULT 'PUBLISHED',
      is_featured BOOLEAN DEFAULT FALSE,
      views_count INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)

  const rows = await db.execute(sql`SELECT * FROM dkp_blog_posts ORDER BY id DESC;`)
  const mapped = extractRows(rows).map((r: any) => ({
    id: Number(r.id),
    title: String(r.title),
    slug: String(r.slug),
    category: String(r.category || 'Architecture'),
    subCategory: String(r.sub_category || ''),
    excerpt: String(r.excerpt || ''),
    content: String(r.content || ''),
    coverImage: String(r.cover_image || ''),
    author: String(r.author || 'DKP Editorial'),
    tags: normalizeTags(r.tags),
    status: String(r.status || 'PUBLISHED') === 'DRAFT' ? 'DRAFT' : 'PUBLISHED',
    isFeatured: Boolean(r.is_featured),
    viewsCount: Number(r.views_count || 0),
    createdAt: r.created_at || new Date().toISOString()
  }))

  return { success: true, sourceTable: 'dkp_blog_posts', posts: mapped }
})