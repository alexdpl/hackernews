// server/api/blog/related.get.ts
import { defineEventHandler, getQuery, createError } from 'h3'
import postgres from 'postgres'

let sqlInstance: any = null
function getSqlClient() {
  if (sqlInstance) return sqlInstance
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw createError({ statusCode: 500, statusMessage: 'DATABASE_URL mancante.' })
  sqlInstance = postgres(connectionString, { ssl: 'require', max: 10 })
  return sqlInstance
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentId = query.id ? String(query.id) : null
  const category = query.cat ? String(query.cat) : null
  const tagsRaw = query.tags ? String(query.tags) : ''

  const sql = getSqlClient()

  try {
    const isNumeric = currentId && !isNaN(Number(currentId))

    // Estrazione dei tag puliti
    const tagList = tagsRaw
      ? tagsRaw.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
      : []

    let relatedPosts: any[] = []

    if (category) {
      relatedPosts = await sql`
        SELECT p.id, p.title, p.slug, p.excerpt, p.created_at, p.views, p.likes,
               c.name as category_name
        FROM blog_posts p
        LEFT JOIN blog_categories c ON p.category_id = c.id
        WHERE p.status = 'published'
          ${isNumeric ? sql`AND p.id != ${Number(currentId)}` : currentId ? sql`AND p.slug != ${currentId}` : sql``}
          AND (c.name = ${category} OR c.slug = ${category})
        ORDER BY p.created_at DESC
        LIMIT 3
      `
    }

    // Fallback: se non trova post per categoria, prende gli ultimi pubblicati
    if (!relatedPosts || relatedPosts.length === 0) {
      relatedPosts = await sql`
        SELECT p.id, p.title, p.slug, p.excerpt, p.created_at, p.views, p.likes,
               c.name as category_name
        FROM blog_posts p
        LEFT JOIN blog_categories c ON p.category_id = c.id
        WHERE p.status = 'published'
          ${isNumeric ? sql`AND p.id != ${Number(currentId)}` : currentId ? sql`AND p.slug != ${currentId}` : sql``}
        ORDER BY p.created_at DESC
        LIMIT 3
      `
    }

    return {
      success: true,
      data: relatedPosts.map(row => ({
        id: row.id,
        title: row.title,
        slug: row.slug,
        excerpt: row.excerpt,
        categoryName: row.category_name || 'Generale',
        views: row.views || 0,
        likes: row.likes || 0,
        createdAt: row.created_at
      }))
    }
  } catch (error: any) {
    console.error('[API /blog/related] Errore:', error.message)
    // Ritorna un array vuoto anziché mandare in crash la pagina con errore 500
    return { success: true, data: [] }
  }
})