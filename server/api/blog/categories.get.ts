// server/api/blog/categories.get.ts
import { defineEventHandler } from 'h3'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async () => {
  try {
    const db = getDb()
    const categories = await db.query.blogCategories.findMany({
      with: {
        subcategories: true // 👈 Garanzia di ritorno sottocategorie da Neon DB
      }
    })

    return {
      success: true,
      data: categories || []
    }
  } catch (error: any) {
    console.error('Errore categorie:', error)
    return {
      success: false,
      data: [],
      error: error.message
    }
  }
})