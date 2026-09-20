// server/api/posts/[id]/comments.post.ts
import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'

// Relative imports per struttura Nuxt 4 (root /server/)
import { getDb } from '~~/server/utils/db'
import { comments } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  try {
    // 1. Validazione ID Post
    const rawId = getRouterParam(event, 'id')
    const postId = Number(rawId)

    if (!rawId || isNaN(postId) || postId <= 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID post non valido o mancante.'
      })
    }

    // 2. Lettura e validazione Body
    const body = await readBody(event)

    if (!body?.content || typeof body.content !== 'string' || !body.content.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Il testo del commento non può essere vuoto.'
      })
    }

    const author = body.author && typeof body.author === 'string' && body.author.trim()
      ? body.author.trim()
      : 'utente_anonimo'

    const parentId = body.parentId && !isNaN(Number(body.parentId))
      ? Number(body.parentId)
      : null

    const db = getDb()

    // 3. Inserimento commento nel database Neon
    const inserted = await db
      .insert(comments)
      .values({
        postId,
        parentId,
        author,
        content: body.content.trim()
      })
      .returning()

    if (!inserted || inserted.length === 0) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Impossibile creare il commento.'
      })
    }

    // 4. Risposta di successo
    return {
      success: true,
      data: inserted[0]
    }

  } catch (error: any) {
    console.error('=== [COMMENTS POST API ERROR] ===', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: `Errore DB Neon: salvataggio commento fallito (${error.message || 'Errore interno'})`
    })
  }
})