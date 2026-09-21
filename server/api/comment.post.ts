// server/api/commet.posts.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { getDb } from '../utils/db'
import { comments } from '../db/schema'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { postId, text, author } = body

    if (!postId || !text || text.trim().length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID Post e testo del commento sono obbligatori'
      })
    }

    const db = getDb()

    // Inserisce il commento nel DB
    const [newComment] = await db
      .insert(comments)
      .values({
        postId: Number(postId),
        text: text.trim(),
        createdAt: new Date()
      })
      .returning()

    return {
      success: true,
      data: newComment
    }
  } catch (error: any) {
    throw createError({ statusCode: 500, statusMessage: error.message || 'Errore salvataggio commento' })
  }
})