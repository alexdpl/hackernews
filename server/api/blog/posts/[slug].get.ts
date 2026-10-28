import postgres from 'postgres'

export default defineEventHandler(async (event) => {
  // Fix / Polyfill per gli header H3 su pnpm
  if (event.node?.req?.headers && typeof (event.node.req.headers as any).get !== 'function') {
    (event.node.req.headers as any).get = (key: string) => (event.node.req.headers as any)[key.toLowerCase()]
  }

  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Slug dell\'articolo non specificato.' })
  }

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw createError({ statusCode: 500, statusMessage: 'DATABASE_URL non configurata.' })
  }

  const isProd = process.env.NODE_ENV === 'production'
  const sql = postgres(connectionString, { 
    ssl: isProd ? { rejectUnauthorized: false } : 'prefer' 
  })

  try {
    // Query per recuperare il singolo articolo cercando per slug (case-insensitive)
    const posts = await sql`
      SELECT 
        p.*,
        c.name AS category_name,
        c.slug AS category_slug,
        s.name AS subcategory_name,
        u.username AS author_name,
        u.xp AS author_xp,
        u.avatar_url AS author_avatar
      FROM blog_posts p
      LEFT JOIN blog_categories c ON p.category_id = c.id
      LEFT JOIN blog_subcategories s ON p.subcategory_id = s.id
      LEFT JOIN users u ON p.author_id = u.id
      WHERE LOWER(p.slug) = LOWER(${slug})
      LIMIT 1
    `

    if (posts.length === 0) {
      await sql.end()
      throw createError({ statusCode: 404, statusMessage: 'Articolo non trovato nel Vault.' })
    }

    const row = posts[0]

    // Parse sicuro dei tag
    let tagsArray: string[] = []
    if (Array.isArray(row.tags)) {
      tagsArray = row.tags
    } else if (typeof row.tags === 'string') {
      try { tagsArray = JSON.parse(row.tags) } catch { tagsArray = [] }
    }

    // Mapping normalizzato per adattarsi esattamente alle proprietà attese da [slug].vue
    const normalizedPost = {
      id: row.id,
      title: row.title,
      slug: row.slug,
      content: row.content,
      excerpt: row.excerpt,
      summary: row.excerpt,
      category: row.category_name || 'Generale',
      categoryName: row.category_name || 'Generale',
      categorySlug: row.category_slug,
      subCategory: row.subcategory_name,
      subcategoryName: row.subcategory_name,
      authorName: row.author_name || 'DevKernelPulse Team',
      authorXp: row.author_xp || 0,
      authorAvatar: row.author_avatar,
      tags: tagsArray,
      status: row.status,
      isVerified: row.is_verified ?? true,
      vaultCertificateId: row.vault_certificate_id,
      vaultHash: row.vault_hash,
      views: row.views || 0,
      likes: row.likes || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }

    await sql.end()

    return {
      success: true,
      data: normalizedPost
    }
  } catch (error: any) {
    await sql.end()
    if (error.statusCode === 404) throw error
    console.error('💥 Errore recupero articolo per slug:', error)
    throw createError({ statusCode: 500, statusMessage: `Errore durante il recupero: ${error.message}` })
  }
})