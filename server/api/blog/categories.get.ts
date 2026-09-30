// server/api/blog/categories.get.ts
import { defineEventHandler, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { blogCategories, blogSubcategories } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  // Parsing sicuro dell'URL relativo per evitare ERR_INVALID_URL
  const rawUrl = event.node?.req?.url || event.path || ''
  const urlObj = new URL(rawUrl, 'http://localhost')
  const id = urlObj.searchParams.get('id')
  const type = urlObj.searchParams.get('type')

  try {
    const db = getDb()

    // 1. Se viene richiesto un ID specifico (singola categoria o sottocategoria)
    if (id) {
      const numId = Number(id)

      if (type === 'subcategory') {
        const [sub] = await db.select().from(blogSubcategories).where(eq(blogSubcategories.id, numId))
        if (!sub) {
          throw createError({ statusCode: 404, statusMessage: 'Sottocategoria non trovata.' })
        }
        
        let category = null
        if (sub.categoryId) {
          const [cat] = await db.select().from(blogCategories).where(eq(blogCategories.id, sub.categoryId))
          category = cat || null
        }

        return { success: true, data: { ...sub, category } }
      } else {
        const [cat] = await db.select().from(blogCategories).where(eq(blogCategories.id, numId))
        if (!cat) {
          throw createError({ statusCode: 404, statusMessage: 'Categoria non trovata.' })
        }

        const subs = await db.select().from(blogSubcategories).where(eq(blogSubcategories.categoryId, numId))

        return { success: true, data: { ...cat, subcategories: subs } }
      }
    }

    // 2. Recupero di TUTTE le categorie e sottocategorie con SELECT standard (senza JOIN LATERAL)
    const categories = await db.select().from(blogCategories)
    const subcategories = await db.select().from(blogSubcategories)

    // Unione delle sottocategorie alle rispettive categorie padre
    const categoriesWithSubs = categories.map((cat: any) => ({
      ...cat,
      subcategories: subcategories.filter((sub: any) => sub.categoryId === cat.id)
    }))

    return { success: true, data: categoriesWithSubs }
  } catch (error: any) {
    console.error('Errore durante il recupero delle categorie:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || `Errore recupero categorie: ${error.message}`,
    })
  }
})