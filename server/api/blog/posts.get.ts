// server/api/blog/posts.get.ts
import { defineEventHandler, getQuery } from 'h3'
import { eq, desc } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { blogPosts } from '~~/server/db/schema'

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
    } else if (blogPosts) {
      postsList = await db
        .select()
        .from(blogPosts)
        .orderBy(desc(blogPosts.createdAt))
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