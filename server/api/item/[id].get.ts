// server/api/item/[id].get.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { getDb } from '../../utils/db'
import { posts, comments } from '../../db/schema'
import { eq, desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const idParam = getRouterParam(event, 'id')
  if (!idParam) throw createError({ statusCode: 400, statusMessage: 'ID post mancante' })

  const postId = parseInt(idParam, 10)
  if (isNaN(postId)) throw createError({ statusCode: 400, statusMessage: 'ID post non valido' })

  try {
    const db = getDb()

    // 1. Recupera i dettagli del post
    const [post] = await db.select().from(posts).where(eq(posts.id, postId))
    if (!post) throw createError({ statusCode: 404, statusMessage: 'Post non trovato' })

    // 2. Recupera tutti i commenti associati al post
    const postComments = await db
      .select()
      .from(comments)
      .where(eq(comments.postId, postId))
      .orderBy(desc(comments.createdAt))

    return {
      success: true,
      data: {
        ...post,
        comments: postComments
      }
    }
  } catch (error: any) {
    throw createError({ statusCode: 500, statusMessage: error.message || 'Errore lettura post' })
  }
})