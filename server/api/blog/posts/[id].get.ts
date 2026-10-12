// server/api/blog/posts/[id].get.ts
import postgres from 'postgres'

export default defineEventHandler(async (event) => {
  const idOrSlug = getRouterParam(event, 'id')

  if (!idOrSlug) {
    throw createError({ statusCode: 400, statusMessage: 'ID o Slug mancante.' })
  }

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw createError({ statusCode: 500, statusMessage: 'DATABASE_URL mancante.' })
  }

  const sql = postgres(connectionString, { ssl: 'require' })

  try {
    // Cerchiamo per ID (se è un numero) oppure per Slug
    const isNumeric = !isNaN(Number(idOrSlug))
    
    let posts = []
    if (isNumeric) {
      posts = await sql`
        SELECT p.*, c.name as category_name, u.username as author_name, u.xp as author_xp
        FROM blog_posts p
        LEFT JOIN blog_categories c ON p.category_id = c.id
        LEFT JOIN users u ON p.author_id = u.id
        WHERE p.id = ${Number(idOrSlug)}
        LIMIT 1;
      `
    } else {
      posts = await sql`
        SELECT p.*, c.name as category_name, u.username as author_name, u.xp as author_xp
        FROM blog_posts p
        LEFT JOIN blog_categories c ON p.category_id = c.id
        LEFT JOIN users u ON p.author_id = u.id
        WHERE p.slug = ${idOrSlug}
        LIMIT 1;
      `
    }

    await sql.end()

    if (posts.length === 0) {
      throw createError({ statusCode: 404, statusMessage: 'Articolo non trovato nel Vault.' })
    }

    const row = posts[0]

    // Mappiamo i campi in camelCase per far contenti Vue e i componenti
    const formattedPost = {
      id: row.id,
      title: row.title,
      slug: row.slug,
      content: row.content,
      excerpt: row.excerpt,
      categoryId: row.category_id,
      categoryName: row.category_name || 'Generale',
      subcategoryId: row.subcategory_id,
      authorId: row.author_id,
      authorName: row.author_name || 'Admin',
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

    return {
      success: true,
      data: formattedPost,
    }
  } catch (error: any) {
    await sql.end()
    console.error(`💥 ERRORE GET POST [${idOrSlug}]:`, error.message)
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})