// server/api/blog/posts/[id].delete.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
// 🔥 FIX: Import corretto dallo schema
import { blogPosts } from '~~/drizzle/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID articolo mancante' })
  }

  try {
    const db = getDb()
    await db.delete(blogPosts).where(eq(blogPosts.id, Number(id)))

    return {
      success: true,
      message: `Articolo #${id} eliminato con successo da Neon DB`
    }
  } catch (error: any) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})