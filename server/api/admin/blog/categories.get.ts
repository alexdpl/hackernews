import { defineEventHandler, createError, getQuery } from 'h3'
import { eq } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
// Nota: adatta il percorso dell'import se il tuo schema è in '~~/drizzle/schema' o '~~/server/db/schema'
import { blogCategories, blogSubcategories } from '~~/drizzle/schema'

export default defineEventHandler(async (event) => {
  // Parsing sicuro dei parametri di query usando la funzione nativa getQuery di h3
  const query = getQuery(event)
  const id = query.id ? Number(query.id) : null
  const type = query.type as string | undefined

  try {
    const db = getDb()

    // 1. Se viene richiesto un ID specifico (singola categoria o sottocategoria)
    if (id) {
      if (type === 'subcategory') {
        const [sub] = await db
          .select()
          .from(blogSubcategories)
          .where(eq(blogSubcategories.id, id))

        if (!sub) {
          throw createError({ statusCode: 404, statusMessage: 'Sottocategoria non trovata.' })
        }

        let category = null
        if (sub.categoryId) {
          const [cat] = await db
            .select()
            .from(blogCategories)
            .where(eq(blogCategories.id, sub.categoryId))
          category = cat || null
        }

        return { success: true, data: { ...sub, category } }
      } else {
        const [cat] = await db
          .select()
          .from(blogCategories)
          .where(eq(blogCategories.id, id))

        if (!cat) {
          throw createError({ statusCode: 404, statusMessage: 'Categoria non trovata.' })
        }

        const subs = await db
          .select()
          .from(blogSubcategories)
          .where(eq(blogSubcategories.categoryId, id))

        return { success: true, data: { ...cat, subcategories: subs } }
      }
    }

    // 2. Recupero di TUTTE le categorie e sottocategorie
    const categories = await db.select().from(blogCategories)
    const subcategories = await db.select().from(blogSubcategories)

    // Unione delle sottocategorie alle rispettive categorie padre
    const categoriesWithSubs = categories.map((cat) => ({
      ...cat,
      subcategories: subcategories.filter((sub) => sub.categoryId === cat.id)
    }))

    return { success: true, data: categoriesWithSubs }
  } catch (error: any) {
    console.error('Errore durante il recupero delle categorie:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || `Errore recupero categorie: ${error.message}`
    })
  }
})