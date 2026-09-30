import { defineEventHandler, getQuery, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { blogCategories, blogSubcategories } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { id, type } = query

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Parametro ID mancante.' })
  }

  try {
    const db = getDb()

    if (type === 'subcategory') {
      await db.delete(blogSubcategories).where(eq(blogSubcategories.id, Number(id)))
    } else {
      await db.delete(blogCategories).where(eq(blogCategories.id, Number(id)))
    }
    return { success: true, message: 'Elemento eliminato con successo.' }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || `Errore eliminazione: ${error.message}`,
    })
  }
})