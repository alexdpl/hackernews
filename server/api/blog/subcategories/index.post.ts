// server/api/blog/subcategories/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { getDb } from '~~/server/utils/db'
import { blogSubcategories } from '~~/drizzle/schema'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { categoryId, name, slug, description } = body

    if (!categoryId || !name || !slug) {
      throw createError({ statusCode: 400, statusMessage: 'Categoria padre, Nome e Slug sono obbligatori.' })
    }

    const db = await getDb()

    const [newSubcategory] = await db.insert(blogSubcategories).values({
      categoryId: Number(categoryId),
      name,
      slug,
      description: description || null
    }).returning()

    return {
      success: true,
      data: newSubcategory,
      message: 'Sottocategoria creata con successo.'
    }
  } catch (err: any) {
    console.error('[SUBCATEGORY POST ERROR]:', err)
    throw createError({ statusCode: 500, statusMessage: `Errore creazione sottocategoria: ${err.message}` })
  }
})