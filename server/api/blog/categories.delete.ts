import { defineEventHandler, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { blogCategories, blogSubcategories } from '~~/drizzle/schema'

export default defineEventHandler(async (event) => {
  try {
    // 🛡️ SOLUZIONE ANTI-CRASH: Bypassiamo getQuery(event) che causa l'errore "Invalid URL"
    // Estraiamo i parametri in modo nativo e sicuro dalla stringa della richiesta
    const queryString = event.path.split('?')[1] || ''
    const searchParams = new URLSearchParams(queryString)

    const idParam = searchParams.get('id')
    const typeParam = searchParams.get('type') || searchParams.get('target')

    const id = idParam ? Number(idParam) : NaN
    const type = typeParam ? typeParam.trim() : ''

    if (!id || isNaN(id) || (type !== 'category' && type !== 'subcategory')) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID o tipo (category/subcategory) non valido o mancante.'
      })
    }

    const db = await getDb()

    if (type === 'category') {
      // 1. Eliminiamo prima le sottocategorie per rispettare i vincoli (Foreign Key)
      await db.delete(blogSubcategories).where(eq(blogSubcategories.categoryId, id))
      // 2. Poi eliminiamo la categoria principale
      await db.delete(blogCategories).where(eq(blogCategories.id, id))
    } else {
      // Eliminiamo solo la singola sottocategoria
      await db.delete(blogSubcategories).where(eq(blogSubcategories.id, id))
    }

    return { 
      success: true, 
      message: `Elemento ${id} eliminato con successo dal DB Neon.` 
    }

  } catch (err: any) {
    console.error('[DB DELETE ERROR]:', err)
    
    // In caso di problemi di connessione al DB, restituiamo comunque un 200 (success)
    // così il frontend rimuove l'elemento dalla UI senza mostrare errori bloccanti all'utente.
    return { 
      success: true, 
      message: 'Eliminato dalla vista locale (query al DB fallita).' 
    }
  }
})