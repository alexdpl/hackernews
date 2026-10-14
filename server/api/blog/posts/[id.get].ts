// server/api/blog/posts/[id].get.ts
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
  // 🟢 IL SEGRETO È QUI: Estraiamo 'id', ma conterrà lo slug testuale inviato dal frontend!
  const param = getRouterParam(event, 'id')

  if (!param) {
    throw createError({ statusCode: 400, statusMessage: 'Parametro mancante.' })
  }

  const sql = getSqlClient()

  try {
    const isNumeric = !isNaN(Number(param))
    let posts = []

    if (isNumeric) {
      posts = await sql`
        SELECT p.*, c.name as category_name, u.username as author_name, u.xp as author_xp
        FROM blog_posts p
        LEFT JOIN blog_categories c ON p.category_id = c.id
        LEFT JOIN users u ON p.author_id = u.id
        WHERE p.id = ${Number(param)}
        LIMIT 1;
      `
    } else {
      posts = await sql`
        SELECT p.*, c.name as category_name, u.username as author_name, u.xp as author_xp
        FROM blog_posts p
        LEFT JOIN blog_categories c ON p.category_id = c.id
        LEFT JOIN users u ON p.author_id = u.id
        WHERE p.slug = ${param}
        LIMIT 1;
      `
    }

    if (posts.length === 0) throw createError({ statusCode: 404, statusMessage: 'Articolo non trovato' })

    const row = posts[0]
    
    return {
      success: true,
      data: {
        id: row.id,
        title: row.title,
        slug: row.slug,
        content: row.content,
        excerpt: row.excerpt,
        categoryId: row.category_id,
        categoryName: row.category_name || 'Generale',
        subcategoryId: row.subcategory_id,
        authorId: row.author_id,
        authorName: row.author_name || 'alexdpl',
        authorXp: row.author_xp || 500,
        tags: row.tags || [],
        status: row.status,
        isVerified: row.is_verified,
        vaultCertificateId: row.vault_certificate_id,
        vaultHash: row.vault_hash,
        views: row.views || 0,
        likes: row.likes || 0,
        createdAt: row.created_at,
      }
    }
  } catch (error: any) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})