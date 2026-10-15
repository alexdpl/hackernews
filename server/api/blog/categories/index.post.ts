// server/api/blog/categories/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { getDb } from '~~/server/utils/db'
import { blogCategories } from '~~/drizzle/schema'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { name, slug, description, icon, color, tags } = body

    if (!name || !slug) {
      throw createError({ statusCode: 400, statusMessage: 'Nome e Slug sono obbligatori.' })
    }

    const db = await getDb()

    const [newCategory] = await db.insert(blogCategories).values({
      name,
      slug,
      description: description || null,
      icon: icon || '🏷️',
      color: color || '#00dc82',
      tags: tags || []
    }).returning()

    return {
      success: true,
      data: newCategory,
      message: 'Categoria creata con successo.'
    }
  } catch (err: any) {
    console.error('[CATEGORY POST ERROR]:', err)
    throw createError({ statusCode: 500, statusMessage: `Errore creazione categoria: ${err.message}` })
  }
})