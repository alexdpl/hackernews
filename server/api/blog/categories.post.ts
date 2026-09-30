// server/api/admin/blog/categories.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { blogCategories, blogSubcategories } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { id, type, name, slug, description, icon, color, categoryId } = body

  if (!name || !slug) {
    throw createError({ statusCode: 400, statusMessage: 'Nome e slug sono campi obbligatori.' })
  }

  try {
    const db = getDb()

    if (type === 'subcategory') {
      if (!categoryId) {
        throw createError({ statusCode: 400, statusMessage: 'categoryId obbligatorio per la sottocategoria.' })
      }

      if (id) {
        // MODIFICA SOTTOCATEGORIA
        const [updatedSub] = await db
          .update(blogSubcategories)
          .set({ categoryId: Number(categoryId), name, slug })
          .where(eq(blogSubcategories.id, Number(id)))
          .returning()

        return { success: true, action: 'updated', data: updatedSub }
      } else {
        // CREAZIONE SOTTOCATEGORIA
        const [newSub] = await db
          .insert(blogSubcategories)
          .values({ categoryId: Number(categoryId), name, slug })
          .returning()

        return { success: true, action: 'created', data: newSub }
      }
    } else {
      // CATEGORIA PRINCIPALE
      if (id) {
        // MODIFICA CATEGORIA
        const [updatedCat] = await db
          .update(blogCategories)
          .set({
            name,
            slug,
            description,
            icon: icon || 'i-heroicons-folder',
            color: color || '#10B981',
          })
          .where(eq(blogCategories.id, Number(id)))
          .returning()

        return { success: true, action: 'updated', data: updatedCat }
      } else {
        // CREAZIONE CATEGORIA
        const [newCat] = await db
          .insert(blogCategories)
          .values({
            name,
            slug,
            description,
            icon: icon || 'i-heroicons-folder',
            color: color || '#10B981',
          })
          .returning()

        return { success: true, action: 'created', data: newCat }
      }
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || `Errore gestione categoria: ${error.message}`,
    })
  }
})