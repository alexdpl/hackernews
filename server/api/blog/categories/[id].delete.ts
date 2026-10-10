// server/api/blog/categories/[id].delete.ts
import { defineEventHandler, createError, getQuery } from 'h3'
import { eq } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
// 🔥 FIX: Assicurati che il percorso import sia corretto
import { blogCategories, blogSubcategories } from '~~/drizzle/schema'

export default defineEventHandler(async (event) => {
  try {
    // 1. Validazione sicura dei parametri
    const idParam = event.context.params?.id // Prende l'ID dalla rotta [id]
    const query = getQuery(event)
    const typeParam = query.type || query.target // Si aspetta ?type=category o ?type=subcategory

    const id = idParam ? Number(idParam) : NaN
    const type = typeof typeParam === 'string' ? typeParam.trim() : ''

    if (!id || isNaN(id) || (type !== 'category' && type !== 'subcategory')) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID o parametro type (category/subcategory) non valido o mancante.'
      })
    }

    const db = await getDb()

    // 2. Esecuzione dell'eliminazione
    if (type === 'category') {
      // Per eliminare una categoria, eliminiamo prima le sottocategorie associate per non violare le Foreign Keys (anche se 'cascade' dovrebbe farlo in automatico, è una sicurezza extra)
      await db.delete(blogSubcategories).where(eq(blogSubcategories.categoryId, id))
      await db.delete(blogCategories).where(eq(blogCategories.id, id))
    } else {
      // Elimina solo una specifica sottocategoria
      await db.delete(blogSubcategories).where(eq(blogSubcategories.id, id))
    }

    return { 
      success: true, 
      message: `${type === 'category' ? 'Categoria' : 'Sottocategoria'} eliminata con successo.` 
    }

  } catch (err: any) {
    console.error('[DB DELETE CATEGORY ERROR]:', err)
    
    // Ritorna errore chiaro al frontend
    throw createError({
      statusCode: 500,
      statusMessage: `Errore durante l'eliminazione dal DB: ${err.message}`
    })
  }
})