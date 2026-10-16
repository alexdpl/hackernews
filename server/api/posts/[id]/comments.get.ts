// server/api/posts/[id]/comments.get.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { eq, desc } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { comments } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  try {
    const rawId = getRouterParam(event, 'id') || event.context.params?.id
    const postId = Number(rawId)

    if (!rawId || isNaN(postId) || postId <= 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID post non valido o mancante.'
      })
    }

    // Correzione v2.5-GOLD: getDb() è asincrono
    const db = await getDb()
    if (!db) {
      throw createError({ statusCode: 500, statusMessage: 'Database Neon non disponibile.' })
    }

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
    if (error.statusCode === 400 || error.statusCode === 500) {
      throw error
    }

    console.error('=== [COMMENTS GET API ERROR] ===', error)

    throw createError({
      statusCode: 500,
      statusMessage: `Errore DB Neon: impossibile recuperare i commenti (${error.message || 'Errore interno'})`
    })
  }
})