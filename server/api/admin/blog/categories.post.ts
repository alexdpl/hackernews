// server/api/admin/blog/categories.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { blogCategories, blogSubcategories } from '~~/drizzle/schema'

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) || {}
  const { id, type, name, slug, description, icon, color, categoryId } = body

  const cleanName = name?.trim()
  const cleanSlug = slug?.trim()

  if (!cleanName || !cleanSlug) {
    throw createError({ statusCode: 400, statusMessage: 'Nome e slug sono campi obbligatori.' })
  }

  try {
    const db = getDb()

    // 1. GESTIONE SOTTOCATEGORIA
    if (type === 'subcategory') {
      if (!categoryId) {
        throw createError({ statusCode: 400, statusMessage: 'categoryId è obbligatorio per le sottocategorie.' })
      }

      if (id) {
        // MODIFICA SOTTOCATEGORIA
        const [updatedSub] = await db
          .update(blogSubcategories)
          .set({ 
            categoryId: Number(categoryId), 
            name: cleanName, 
            slug: cleanSlug 
          })
          .where(eq(blogSubcategories.id, Number(id)))
          .returning()

        return { success: true, action: 'updated', data: updatedSub }
      } else {
        // CREAZIONE SOTTOCATEGORIA
        const [newSub] = await db
          .insert(blogSubcategories)
          .values({ 
            categoryId: Number(categoryId), 
            name: cleanName, 
            slug: cleanSlug 
          })
          .returning()

        return { success: true, action: 'created', data: newSub }
      }
    } 
    // 2. GESTIONE CATEGORIA PRINCIPALE
    else {
      const categoryPayload = {
        name: cleanName,
        slug: cleanSlug,
        description: description ? description.trim() : null,
        icon: icon || '🔒',
        color: color || '#00dc82',
      }

      if (id) {
        // MODIFICA CATEGORIA
        const [updatedCat] = await db
          .update(blogCategories)
          .set(categoryPayload)
          .where(eq(blogCategories.id, Number(id)))
          .returning()

        return { success: true, action: 'updated', data: updatedCat }
      } else {
        // CREAZIONE CATEGORIA
        const [newCat] = await db
          .insert(blogCategories)
          .values(categoryPayload)
          .returning()

        return { success: true, action: 'created', data: newCat }
      }
    }
  } catch (error: any) {
    console.error('Errore durante il salvataggio della categoria:', error)

    // Gestione specifica dell'errore Postgres per slug duplicato (Unique Violation)
    if (error.code === '23505' || error.message?.includes('unique constraint')) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Lo slug specificato è già presente nel database. Scegli uno slug univoco.',
      })
    }

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || `Errore durante il salvataggio: ${error.message}`,
    })
  }
})