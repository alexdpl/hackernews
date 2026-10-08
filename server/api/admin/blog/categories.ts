// server/api/admin/blog/categories.ts
import { defineEventHandler, getMethod, readBody, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { blogCategories, blogSubcategories } from '~~/drizzle/schema'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const db = await getDb()

  try {
    // 🟩 METODO GET (Recupero Categorie)
    if (method === 'GET') {
      const cats = await db.query.blogCategories.findMany({
        with: { subcategories: true }
      })
      return { success: true, data: cats }
    }

    // 🟦 METODO POST (Crea o Aggiorna Categoria/Sottocategoria)
    if (method === 'POST') {
      const body = await readBody(event)
      if (!body) throw createError({ statusCode: 400, message: 'Body mancante' })

      if (body.type === 'category') {
        const payload = {
          name: body.name,
          slug: body.slug,
          description: body.description || null,
          icon: body.icon || '🏷️',
          color: body.color || '#00dc82',
          tags: body.tags || []
        }
        
        if (body.id) {
          // Update
          await db.update(blogCategories).set(payload).where(eq(blogCategories.id, body.id))
          return { success: true, message: 'Aggiornata!' }
        } else {
          // Create
          const [newCat] = await db.insert(blogCategories).values(payload).returning()
          return { success: true, data: newCat }
        }
      } 
      
      if (body.type === 'subcategory') {
        const payload = {
          categoryId: body.categoryId,
          name: body.name,
          slug: body.slug,
          description: body.description || null
        }
        
        if (body.id) {
          await db.update(blogSubcategories).set(payload).where(eq(blogSubcategories.id, body.id))
          return { success: true, message: 'Sottocategoria Aggiornata!' }
        } else {
          const [newSub] = await db.insert(blogSubcategories).values(payload).returning()
          return { success: true, data: newSub }
        }
      }
    }

    // 🟥 METODO DELETE (BLINDATO CONTRO LA CANCELLAZIONE TOTALE)
    if (method === 'DELETE') {
      const queryString = event.path.split('?')[1] || ''
      const searchParams = new URLSearchParams(queryString)

      const idParam = searchParams.get('id')
      const type = searchParams.get('type')

      // Mettiamo un parseInt esplicito
      const id = parseInt(idParam || '', 10)

      // GUARDIA DI FERRO: Se l'ID non è un numero valido o è 0, o il tipo non è corretto, BLOCCARE TUTTO.
      if (!id || isNaN(id) || id <= 0 || !['category', 'subcategory'].includes(type || '')) {
        throw createError({ statusCode: 400, message: 'CRITICO: Parametri DELETE non validi o ID mancante. Operazione annullata per sicurezza.' })
      }

      if (type === 'category') {
        // La where con eq(..., id) ora è sicura al 100% perché id è un intero verificato
        await db.delete(blogSubcategories).where(eq(blogSubcategories.categoryId, id))
        await db.delete(blogCategories).where(eq(blogCategories.id, id))
      } else {
        await db.delete(blogSubcategories).where(eq(blogSubcategories.id, id))
      }

      return { success: true, message: `Elemento ${id} eliminato in sicurezza!` }
    }

    // Se il metodo non è gestito (es. PUT, PATCH)
    throw createError({ statusCode: 405, message: 'Method Not Allowed' })
    
  } catch (err: any) {
    console.error('[API CATEGORIES ERROR]:', err)
    
    // Per il tuo sistema ibrido, restituiamo 200 con {success:false} per far continuare il Vue
    return { success: false, message: err.message || 'Errore Server' }
  }
})