// server/api/admin/blog/categories.post.ts
import { defineEventHandler, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { blogCategories, blogSubcategories } from '~~/server/db/schema'

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W_]+-/g, '-')
    .replace(/[^a-z0-9-]+/g, '')
    .replace(/^-+|-+$/g, '')
}

// Helper per il parsing del body a prova di incompatibilità tra versioni di H3
async function getRequestBody(event: any): Promise<any> {
  const req = event.node?.req || event.req
  if (req?.body && typeof req.body === 'object') {
    return req.body
  }

  return new Promise((resolve) => {
    if (!req) return resolve({})
    let rawData = ''
    req.on('data', (chunk: any) => {
      rawData += chunk
    })
    req.on('end', () => {
      try {
        resolve(rawData ? JSON.parse(rawData) : {})
      } catch {
        resolve({})
      }
    })
    req.on('error', () => resolve({}))
  })
}

export default defineEventHandler(async (event) => {
  // Usiamo il parser nativo senza chiamare readBody di H3 v2
  const body = (await getRequestBody(event)) || {}
  const { id, type, name, slug, description, icon, color, categoryId } = body

  const cleanName = name?.trim()
  if (!cleanName) {
    throw createError({ statusCode: 400, statusMessage: 'Il nome è un campo obbligatorio.' })
  }

  const cleanSlug = slug?.trim() ? slugify(slug) : slugify(cleanName)
  const numericId = id && !isNaN(Number(id)) ? Number(id) : null
  const numericCategoryId = categoryId && !isNaN(Number(categoryId)) ? Number(categoryId) : null

  try {
    const db = getDb()

    // 1. GESTIONE SOTTOCATEGORIA
    if (type === 'subcategory') {
      if (!numericCategoryId) {
        throw createError({ 
          statusCode: 400, 
          statusMessage: 'categoryId non valido. Se la categoria principale non è presente sul DB, salvala prima.' 
        })
      }

      const subPayload = {
        categoryId: numericCategoryId,
        name: cleanName,
        slug: cleanSlug,
        description: description ? description.trim() : null
      }

      if (numericId) {
        // MODIFICA SOTTOCATEGORIA
        const [updatedSub] = await db
          .update(blogSubcategories)
          .set(subPayload)
          .where(eq(blogSubcategories.id, numericId))
          .returning()

        return { success: true, action: 'updated', data: updatedSub }
      } else {
        // CREAZIONE SOTTOCATEGORIA
        const [newSub] = await db
          .insert(blogSubcategories)
          .values(subPayload)
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

      if (numericId) {
        const [updatedCat] = await db
          .update(blogCategories)
          .set(categoryPayload)
          .where(eq(blogCategories.id, numericId))
          .returning()

        if (!updatedCat) {
          const [insertedCat] = await db
            .insert(blogCategories)
            .values(categoryPayload)
            .returning()
          return { success: true, action: 'created', data: insertedCat }
        }

        return { success: true, action: 'updated', data: updatedCat }
      } else {
        const [newCat] = await db
          .insert(blogCategories)
          .values(categoryPayload)
          .returning()

        return { success: true, action: 'created', data: newCat }
      }
    }
  } catch (error: any) {
    console.error('Errore durante il salvataggio su DB:', error)

    if (error.code === '23503') {
      throw createError({
        statusCode: 400,
        statusMessage: 'La categoria principale non esiste ancora nel Database Neon. Salvala o ricreala prima di aggiungere sottocategorie.',
      })
    }

    if (error.code === '23505' || error.message?.includes('unique constraint')) {
      throw createError({
        statusCode: 409,
        statusMessage: `Lo slug "${cleanSlug}" esiste già nel DB. Scegli un nome o uno slug differente.`,
      })
    }

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || `Errore DB: ${error.message}`,
    })
  }
})