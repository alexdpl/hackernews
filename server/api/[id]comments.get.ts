// server/api/posts/[id]/comments.get.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { eq, desc } from 'drizzle-orm'

// Import assoluto root Nuxt 4
import { getDb } from '~~/server/utils/db'
import { comments } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  try {
    // 1. Estrazione flessibile del parametro 'id' (getRouterParam + fallback event.context)
    const rawId = getRouterParam(event, 'id') || event.context.params?.id
    const postId = Number(rawId)

    if (!rawId || isNaN(postId) || postId <= 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID post non valido o mancante.'
      })
    }

    const db = getDb()

    // 2. Query per recuperare i commenti
    const commentsList = await db
      .select()
      .from(comments)
      .where(eq(comments.postId, postId))
      .orderBy(desc(comments.createdAt))

    return {
      success: true,
      data: commentsList
    }

  } catch (error: any) {
    // Se è un errore di validazione 400, rilanciamo pulito senza loggare lo stack-trace
    if (error.statusCode === 400) {
      throw error
    }

    console.error('=== [COMMENTS GET API ERROR] ===', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: `Errore DB Neon: impossibile recuperare i commenti (${error.message || 'Errore interno'})`
    })
  }
})