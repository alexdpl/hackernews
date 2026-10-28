// server/api/blog/posts/[slug].ts
import postgres from 'postgres'

export default defineEventHandler(async (event) => {
  // H3 Headers polyfill
  if (event.node?.req?.headers && typeof (event.node.req.headers as any).get !== 'function') {
    (event.node.req.headers as any).get = (key: string) => (event.node.req.headers as any)[key.toLowerCase()]
  }

  // Cattura lo slug dall'URL
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Slug mancante.' })
  }

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw createError({ statusCode: 500, statusMessage: 'Errore DB URL' })
  }

  const isProd = process.env.NODE_ENV === 'production'
  const sql = postgres(connectionString, { 
    ssl: isProd ? { rejectUnauthorized: false } : 'prefer' 
  })

  try {
    // 1. Lettura dal DB unendo post, utente e categoria
    const result = await sql`
      SELECT 
        p.id, p.title, p.slug, p.content, p.excerpt, p.tags, p.status, 
        p.is_verified, p.vault_certificate_id, p.vault_hash, 
        p.views, p.likes, p.created_at, p.updated_at,
        c.name AS category_name, c.slug AS category_slug,
        u.username AS author_name, u.xp AS author_xp
      FROM blog_posts p
      LEFT JOIN blog_categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.author_id = u.id
      WHERE LOWER(p.slug) = LOWER(${slug})
      LIMIT 1
    `

    if (result.length === 0) {
      await sql.end()
      throw createError({ statusCode: 404, statusMessage: 'Articolo non trovato.' })
    }

    const row = result[0]

    // 2. Parse array/json tags nativo
    let parsedTags: string[] = []
    if (Array.isArray(row.tags)) {
      parsedTags = row.tags
    } else if (typeof row.tags === 'string') {
      try { parsedTags = JSON.parse(row.tags) } catch { parsedTags = [] }
    }

    // 3. Incremento View counter in background
    sql`UPDATE blog_posts SET views = views + 1 WHERE id = ${row.id}`.execute().catch(() => {})

    await sql.end()

    // 4. Mappatura rigorosa con i nomi campi attesi dal componente [slug].vue
    return {
      success: true,
      data: {
        id: row.id,
        title: row.title,
        slug: row.slug,
        content: row.content,
        excerpt: row.excerpt,
        summary: row.excerpt,
        category: row.category_name || 'Generale',
        categoryName: row.category_name || 'Generale',
        authorName: row.author_name || 'DevKernelPulse Team',
        authorXp: row.author_xp || 0,
        tags: parsedTags,
        status: row.status,
        isVerified: row.is_verified,
        vaultCertificateId: row.vault_certificate_id,
        vaultHash: row.vault_hash,
        views: (row.views || 0) + 1,
        likes: row.likes || 0,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }
    }
  } catch (error: any) {
    await sql.end()
    if (error.statusCode === 404) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})