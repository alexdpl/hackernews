// server/api/admin/blog/categories.ts
import { defineEventHandler, getMethod, readBody, createError, getQuery } from 'h3'
import { eq } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { blogCategories, blogSubcategories } from '~~/drizzle/schema'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  try {
    const db = await getDb()

    // 🟩 GET: SQL puro, nessuna relazione Drizzle, zero rischi di crash
    if (method === 'GET') {
      const rawCats = await db.select().from(blogCategories)
      const rawSubs = await db.select().from(blogSubcategories)
      
      const cats = rawCats.map(c => ({
        ...c,
        subcategories: rawSubs.filter(s => s.categoryId === c.id)
      }))

      return { success: true, data: cats }
    }

    // 🟦 POST: Inserimento / Aggiornamento
    if (method === 'POST') {
      const body = await readBody(event) || {}
      if (body.type === 'category' || !body.categoryId) {
        const payload = {
          name: body.name,
          slug: body.slug,
          description: body.description || null,
          icon: body.icon || '🏷️',
          color: body.color || '#00dc82',
          tags: body.tags || []
        }
        if (body.id) {
          await db.update(blogCategories).set(payload).where(eq(blogCategories.id, body.id))
          return { success: true, message: 'Aggiornata!' }
        } else {
          const [newCat] = await db.insert(blogCategories).values(payload).returning()
          return { success: true, data: newCat }
        }
      } else {
        const payload = {
          categoryId: Number(body.categoryId),
          name: body.name,
          slug: body.slug,
          description: body.description || null
        }
        if (body.id) {
          await db.update(blogSubcategories).set(payload).where(eq(blogSubcategories.id, body.id))
          return { success: true, message: 'Sottocategoria aggiornata!' }
        } else {
          const [newSub] = await db.insert(blogSubcategories).values(payload).returning()
          return { success: true, data: newSub }
        }
      }
    }

    // 🟥 DELETE
    if (method === 'DELETE') {
      const query = getQuery(event)
      const id = Number(query.id)
      const type = String(query.type || 'category')
      if (!id) throw createError({ statusCode: 400, message: 'ID mancante' })

      if (type === 'category') {
        await db.delete(blogSubcategories).where(eq(blogSubcategories.categoryId, id))
        await db.delete(blogCategories).where(eq(blogCategories.id, id))
      } else {
        await db.delete(blogSubcategories).where(eq(blogSubcategories.id, id))
      }
      return { success: true, message: 'Eliminato con successo!' }
    }

    throw createError({ statusCode: 405, message: 'Method Not Allowed' })
  } catch (err: any) {
    console.error('[API ADMIN CATEGORIES ERROR]:', err)
    return { success: false, message: err.message || 'Errore Server' }
  }
})