// server/api/admin/blog/categories.ts
import { defineEventHandler, getMethod, readBody, getQuery, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { blogCategories, blogSubcategories } from '~~/drizzle/schema'

export default defineEventHandler(async (event) => {
  const db = getDb()
  const method = getMethod(event)

  // 📥 GET: Recupera tutte le categorie con le relative sottocategorie
  if (method === 'GET') {
    try {
      if (db.query && db.query.blogCategories) {
        const categories = await db.query.blogCategories.findMany({
          with: { subcategories: true },
          orderBy: (categories, { desc }) => [desc(categories.createdAt)]
        })
        return { success: true, data: categories }
      }

      const categories = await db.select().from(blogCategories)
      const subcategories = await db.select().from(blogSubcategories)

      const categoriesWithSubs = categories.map((cat) => ({
        ...cat,
        subcategories: subcategories.filter((sub) => sub.categoryId === cat.id)
      }))

      return { success: true, data: categoriesWithSubs }
    } catch (error: any) {
      console.error('Errore durante il recupero delle categorie:', error)
      throw createError({
        statusCode: 500,
        statusMessage: `Errore recupero categorie: ${error.message}`
      })
    }
  }

  // 📤 POST: Aggiunge o Aggiorna Categoria / Sottocategoria
  if (method === 'POST') {
    const body = (await readBody(event)) || {}
    const { id, type, name, slug, description, icon, color, categoryId } = body

    const cleanName = name?.trim()
    const cleanSlug = slug?.trim()

    if (!cleanName || !cleanSlug) {
      throw createError({ statusCode: 400, statusMessage: 'Nome e Slug sono obbligatori.' })
    }

    try {
      if (type === 'subcategory') {
        if (!categoryId) {
          throw createError({ statusCode: 400, statusMessage: 'categoryId è obbligatorio per le sottocategorie.' })
        }

        if (id) {
          const [updatedSub] = await db
            .update(blogSubcategories)
            .set({ categoryId: Number(categoryId), name: cleanName, slug: cleanSlug })
            .where(eq(blogSubcategories.id, Number(id)))
            .returning()

          return { success: true, message: 'Sottocategoria aggiornata!', action: 'updated', data: updatedSub }
        } else {
          const [newSub] = await db
            .insert(blogSubcategories)
            .values({ categoryId: Number(categoryId), name: cleanName, slug: cleanSlug })
            .returning()

          return { success: true, message: 'Sottocategoria creata!', action: 'created', data: newSub }
        }
      }

      const categoryPayload = {
        name: cleanName,
        slug: cleanSlug,
        description: description ? description.trim() : null,
        icon: icon || '🔒',
        color: color || '#00dc82'
      }

      if (id) {
        const [updatedCat] = await db
          .update(blogCategories)
          .set(categoryPayload)
          .where(eq(blogCategories.id, Number(id)))
          .returning()

        return { success: true, message: 'Categoria aggiornata con successo!', action: 'updated', data: updatedCat }
      } else {
        const [newCat] = await db
          .insert(blogCategories)
          .values(categoryPayload)
          .returning()

        return { success: true, message: 'Categoria creata con successo!', action: 'created', data: newCat }
      }

    } catch (error: any) {
      console.error('Errore durante il salvataggio:', error)

      if (error.code === '23505' || error.message?.includes('unique constraint')) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Lo slug specificato è già presente nel database. Scegli uno slug univoco.',
        })
      }

      throw createError({
        statusCode: error.statusCode || 500,
        statusMessage: error.statusMessage || `Errore salvataggio: ${error.message}`
      })
    }
  }

  // 🗑️ DELETE: Elimina una Categoria o Sottocategoria
  if (method === 'DELETE') {
    const query = getQuery(event)
    const id = query.id ? Number(query.id) : NaN
    const itemType = ((query.type || query.target) as string)?.trim()

    if (!id || isNaN(id)) {
      throw createError({ statusCode: 400, statusMessage: 'ID valido mancante.' })
    }

    try {
      if (itemType === 'subcategory') {
        await db.delete(blogSubcategories).where(eq(blogSubcategories.id, id))
        return { success: true, message: 'Sottocategoria eliminata con successo.' }
      } else {
        // Elimina sottocategorie collegate e poi la categoria padre
        await db.delete(blogSubcategories).where(eq(blogSubcategories.categoryId, id))
        await db.delete(blogCategories).where(eq(blogCategories.id, id))
        return { success: true, message: 'Categoria eliminata con successo.' }
      }
    } catch (error: any) {
      console.error('Errore durante l\'eliminazione:', error)
      throw createError({
        statusCode: error.statusCode || 500,
        statusMessage: error.statusMessage || `Errore eliminazione: ${error.message}`
      })
    }
  }
})