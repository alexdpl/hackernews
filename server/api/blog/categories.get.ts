// server/api/blog/categories.get.ts
import { defineEventHandler, getQuery, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { blogCategories, blogSubcategories } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { id, type } = query

  try {
    const db = getDb()

    // Se viene fornito un ID specifico (per recuperare una sola categoria o sottocategoria)
    if (id) {
      if (type === 'subcategory') {
        const subcategory = await db.query.blogSubcategories.findFirst({
          where: eq(blogSubcategories.id, Number(id)),
          with: {
            category: true,
          },
        })
        if (!subcategory) {
          throw createError({ statusCode: 404, statusMessage: 'Sottocategoria non trovata.' })
        }
        return { success: true, data: subcategory }
      } else {
        const category = await db.query.blogCategories.findFirst({
          where: eq(blogCategories.id, Number(id)),
          with: {
            subcategories: true,
          },
        })
        if (!category) {
          throw createError({ statusCode: 404, statusMessage: 'Categoria non trovata.' })
        }
        return { success: true, data: category }
      }
    }

    // Se non viene specificato alcun ID, restituisce tutte le categorie con le sottocategorie
    const categories = await db.query.blogCategories.findMany({
      with: {
        subcategories: true,
      },
    })

    return { success: true, data: categories }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || `Errore recupero categorie: ${error.message}`,
    })
  }
})