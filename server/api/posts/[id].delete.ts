// server/api/posts/[id].delete.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db' // 👈 'getDb' con la 'B' maiuscola
import { blogPosts } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const idParam = getRouterParam(event, 'id')

  if (!idParam) {
    throw createError({ statusCode: 400, statusMessage: 'ID articolo mancante' })
  }

  const id = parseInt(idParam, 10)
  if (isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'ID non valido' })
  }

  try {
    const db = getDb() // 👈 Mancava l'inizializzazione dell'istanza DB!
    
    const deleted = await db.delete(blogPosts).where(eq(blogPosts.id, id)).returning()

    if (deleted.length === 0) {
      throw createError({ statusCode: 404, statusMessage: `Articolo ID ${id} non presente nel Database.` })
    }

    return {
      success: true,
      message: `Articolo ID ${id} eliminato con successo.`
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || `Errore cancellazione DB: ${error.message}`
    })
  }
})