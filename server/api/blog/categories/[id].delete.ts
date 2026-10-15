// server/api/blog/categories/[id].delete.ts
import { defineEventHandler, createError, getQuery } from 'h3'
import { eq } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { blogCategories, blogSubcategories, blogPosts } from '~~/drizzle/schema'

export default defineEventHandler(async (event) => {
  try {
    const idParam = event.context.params?.id
    const query = getQuery(event)
    const typeParam = query.type || 'category'

    const id = idParam ? Number(idParam) : NaN
    const type = typeof typeParam === 'string' ? typeParam.trim().toLowerCase() : 'category'

    if (!id || isNaN(id)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID non valido o mancante.'
      })
    }

    const db = await getDb()

    if (type === 'category') {
      // 1. Sgancia gli articoli dalla categoria madre
      if (blogPosts) {
        await db.update(blogPosts)
          .set({ categoryId: null, subcategoryId: null } as any)
          .where(eq(blogPosts.categoryId, id))
      }
      // 2. Elimina le sottocategorie figlie
      await db.delete(blogSubcategories).where(eq(blogSubcategories.categoryId, id))
      // 3. Elimina la categoria
      await db.delete(blogCategories).where(eq(blogCategories.id, id))
    } else {
      // 1. Sgancia gli articoli dalla sottocategoria
      if (blogPosts) {
        await db.update(blogPosts)
          .set({ subcategoryId: null } as any)
          .where(eq(blogPosts.subcategoryId, id))
      }
      // 2. Elimina la sottocategoria
      await db.delete(blogSubcategories).where(eq(blogSubcategories.id, id))
    }

    return { 
      success: true, 
      message: `${type === 'category' ? 'Categoria' : 'Sottocategoria'} eliminata con successo.` 
    }

  } catch (err: any) {
    console.error('[DB DELETE ERROR]:', err)
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: `Errore durante l'eliminazione dal DB: ${err.message}`
    })
  }
})