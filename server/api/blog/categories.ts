// server/api/blog/categories.ts
import { defineEventHandler, createError } from 'h3'
import { getDb } from '~~/server/utils/db'
import { blogCategories, blogSubcategories } from '~~/drizzle/schema'

export default defineEventHandler(async () => {
  const db = getDb()

  try {
    // 1. Tenta il recupero con Drizzle Relational API se configurato
    if (db.query && db.query.blogCategories) {
      const categories = await db.query.blogCategories.findMany({
        with: {
          subcategories: true
        },
        orderBy: (categories, { asc }) => [asc(categories.name)]
      })
      return { success: true, data: categories }
    }

    // 2. Fallback SQL standard se le relazioni Drizzle non sono attive
    const categories = await db.select().from(blogCategories)
    const subcategories = await db.select().from(blogSubcategories)

    const formattedData = categories.map((cat) => ({
      ...cat,
      subcategories: subcategories.filter((sub) => sub.categoryId === cat.id)
    }))

    return { success: true, data: formattedData }
  } catch (error: any) {
    console.error('Errore durante il recupero pubblico delle categorie:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Errore caricamento categorie: ${error.message}`
    })
  }
})