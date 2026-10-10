// server/api/blog/categories/index.get.ts
import { defineEventHandler } from 'h3'
import { getDb } from '~~/server/utils/db'
// 🔥 FIX: Importiamo gli schemi corretti (anche se qui non li usiamo direttamente per query.findMany, è buona prassi averli se servono fallback)
import { blogCategories, blogSubcategories } from '~~/drizzle/schema'

export default defineEventHandler(async () => {
  try {
    const db = getDb()
    
    // Tentativo primario: Drizzle Relational Queries
    if (db.query && db.query.blogCategories) {
      const categories = await db.query.blogCategories.findMany({
        with: {
          subcategories: true // Recupera le sottocategorie annidate
        }
      })
      return {
        success: true,
        data: categories || []
      }
    }

    // 🔥 FIX: Fallback sicuro in caso db.query non sia inizializzato con lo schema
    // Fallback: Recupera le categorie e sottocategorie con query tradizionali e le unisce
    const rawCategories = await db.select().from(blogCategories)
    const rawSubcategories = await db.select().from(blogSubcategories)

    // Costruiamo l'albero manualmente
    const structuredCategories = rawCategories.map(cat => {
      return {
        ...cat,
        subcategories: rawSubcategories.filter(sub => sub.categoryId === cat.id)
      }
    })

    return {
      success: true,
      data: structuredCategories
    }

  } catch (error: any) {
    console.error('Errore durante il recupero delle categorie:', error)
    return {
      success: false,
      data: [],
      error: error.message
    }
  }
})

