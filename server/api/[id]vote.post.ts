// server/api/posts/[id]/vote.post.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { eq, sql } from 'drizzle-orm'

// Relative imports per struttura Nuxt 4
import { getDb } from '~~/server/utils/db'
import { posts } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  try {
    // 1. Estrazione e validazione ID post
    const rawId = getRouterParam(event, 'id')
    const postId = Number(rawId)

    if (!rawId || isNaN(postId) || postId <= 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID post non valido o mancante.'
      })
    }

    const db = getDb()

    // 2. Incremento atomico dei punti (+1) con clausola returning
    const updatedPost = await db
      .update(posts)
      .set({
        points: sql`${posts.points} + 1`
      })
      .where(eq(posts.id, postId))
      .returning({ points: posts.points })

    if (!updatedPost || updatedPost.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Post non trovato.'
      })
    }

    return {
      success: true,
      points: updatedPost[0].points,
      message: 'Voto registrato con successo.'
    }

  } catch (error: any) {
    console.error('=== [VOTE POST API ERROR] ===', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: `Errore durante il voto: ${error.message || 'Errore interno'}`
    })
  }
})