// server/api/blog/index.get.ts
import { defineEventHandler, getQuery } from 'h3'
import { eq, desc } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
// 🔥 FIX: Importiamo blogPosts e users dal tuo schema corretto
import { blogPosts, blogCategories, blogSubcategories, users } from '~~/drizzle/schema' // Assicurati che il path sia corretto (es. ~~/drizzle/schema se usi quella cartella)

function getSafeQuery(event: any): Record<string, any> {
  try {
    return getQuery(event) || {}
  } catch {
    const rawUrl = event.node?.req?.url || event.path || ''
    const search = rawUrl.includes('?') ? rawUrl.split('?')[1] : ''
    const params = new URLSearchParams(search)
    const result: Record<string, any> = {}
    for (const [key, value] of params.entries()) {
      result[key] = value
    }
    return result
  }
}

export default defineEventHandler(async (event) => {
  const query = getSafeQuery(event)
  const categorySlug = query.category ? String(query.category) : null
  const subcategorySlug = query.subcategory || query.subCategory ? String(query.subcategory || query.subCategory) : null

  try {
    const db = getDb()
    let postsList: any[] = []

    // 🔥 FIX: Approccio Drizzle Relational Queries (se supportato)
    if (db.query && db.query.blogPosts) {
      postsList = await db.query.blogPosts.findMany({
        where: query.public === 'true' ? eq(blogPosts.status, 'published') : undefined,
        orderBy: [desc(blogPosts.createdAt)],
        with: {
          category: true,
          subcategory: true,
          author: {
            columns: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
      })
    } else {
      // 🔥 FIX: Fallback manuale robusto se db.query non è impostato nel client DB
      // Eseguiamo una query leftJoin per recuperare manualmente i dati relazionali
      const rawPosts = await db
        .select({
          post: blogPosts,
          category: blogCategories,
          subcategory: blogSubcategories,
          author: users,
        })
        .from(blogPosts)
        .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
        .leftJoin(blogSubcategories, eq(blogPosts.subcategoryId, blogSubcategories.id))
        .leftJoin(users, eq(blogPosts.authorId, users.id))
        .orderBy(desc(blogPosts.createdAt))

      // Rimodelliamo i dati per mimare l'output di db.query.findMany()
      postsList = rawPosts.map(row => ({
        ...row.post,
        category: row.category,
        subcategory: row.subcategory,
        author: row.author ? { id: row.author.id, username: row.author.username, avatarUrl: row.author.avatarUrl } : null
      }))
      
      // Filtro status per il fallback
      if (query.public === 'true') {
        postsList = postsList.filter(p => p.status === 'published')
      }
    }

    let filteredPosts = [...postsList]

    // Filtro Categoria
    if (categorySlug) {
      filteredPosts = filteredPosts.filter(
        (p) => p.category?.slug === categorySlug || String(p.categoryId) === categorySlug || p.category?.name?.toLowerCase() === categorySlug.toLowerCase()
      )
    }

    // Filtro Sottocategoria
    if (subcategorySlug) {
      filteredPosts = filteredPosts.filter(
        (p) => p.subcategory?.slug === subcategorySlug || String(p.subcategoryId) === subcategorySlug || p.subcategory?.name?.toLowerCase() === subcategorySlug.toLowerCase()
      )
    }

    // NORMALIZZAZIONE DATI PER IL FRONTEND
    const normalizedPosts = filteredPosts.map((p) => {
      const catName = p.category?.name || 'Generale'
      const subName = p.subcategory?.name || ''
      const authorName = p.author?.username || 'Alessandro De Paola'

      // Tag sempre garantiti come Array di stringhe
      let tagsArray: string[] = []
      if (Array.isArray(p.tags)) {
        tagsArray = p.tags
      } else if (typeof p.tags === 'string') {
        try { tagsArray = JSON.parse(p.tags) } catch { tagsArray = [] }
      }

      return {
        ...p,
        category: catName,              // Evita il JSON grezzo nel badge <span class="cat-badge">
        categoryName: catName,          // Per retrocompatibilità
        categoryObject: p.category,    // Mantiene l'oggetto se servono icona o colore
        subCategory: subName,          // Stringa pulita per la sottocategoria
        subcategoryName: subName,
        subcategoryObject: p.subcategory,
        authorName: authorName,
        tags: tagsArray
      }
    })

    return {
      success: true,
      data: normalizedPosts,
      total: normalizedPosts.length,
    }
  } catch (error: any) {
    console.error('Errore durante il recupero dei post dal DB Neon:', error)
    return {
      success: false,
      data: [],
      total: 0,
      error: error.message,
    }
  }
})