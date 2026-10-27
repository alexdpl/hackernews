// server/api/pulse/stories/[id].delete.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { posts, comments } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const idParam = getRouterParam(event, 'id')
  const postId = Number(idParam)

  if (!postId || isNaN(postId)) {
    throw createError({ statusCode: 400, statusMessage: 'ID post non valido' })
  }

  const db = getDb()

  try {
    // 1. Prima eliminiamo i commenti associati per rispettare i vincoli di chiave esterna
    await db.delete(comments).where(eq(comments.postId, postId))

    // 2. Quindi eliminiamo il post dalla tabella posts
    await db.delete(posts).where(eq(posts.id, postId))

    return {
      success: true,
      message: 'Post e relativi commenti eliminati con successo.'
    }
  } catch (err: any) {
    console.error('❌ Errore cancellazione post:', err)
    throw createError({ statusCode: 500, statusMessage: err.message || 'Errore durante la cancellazione' })
  }
})