// server/api/admin/blog/categories.delete.ts
import { defineEventHandler, createError, getQuery } from 'h3'
import { eq } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { blogCategories, blogSubcategories } from '~~/drizzle/schema'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const id = query.id ? Number(query.id) : NaN
  const type = ((query.type || query.target) as string)?.trim()

  if (!id || isNaN(id) || (type !== 'category' && type !== 'subcategory')) {
    throw createError({ 
      statusCode: 400, 
      statusMessage: 'Parametri ID (numerico) e Type ("category" | "subcategory") sono obbligatori.' 
    })
  }

  try {
    const db = getDb()

    if (type === 'category') {
      // 1. Elimina le sottocategorie collegate per sicurezza
      await db.delete(blogSubcategories).where(eq(blogSubcategories.categoryId, id))
      
      // 2. Elimina la categoria principale
      await db.delete(blogCategories).where(eq(blogCategories.id, id))
    } else if (type === 'subcategory') {
      // Elimina la singola sottocategoria
      await db.delete(blogSubcategories).where(eq(blogSubcategories.id, id))
    }

    return { success: true, message: 'Elemento eliminato con successo.' }
  } catch (error: any) {
    console.error('Errore durante l\'eliminazione:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || `Errore durante l'eliminazione: ${error.message}`,
    })
  }
})