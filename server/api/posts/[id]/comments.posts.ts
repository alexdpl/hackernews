// server/api/posts/[id]/comments.post.ts
import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { comments, users, xpTransactions } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  try {
    const rawId = getRouterParam(event, 'id')
    const postId = Number(rawId)

    if (!rawId || isNaN(postId) || postId <= 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID post non valido o mancante.'
      })
    }

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

    const userId = body.userId ? Number(body.userId) : null
    const parentId = body.parentId && !isNaN(Number(body.parentId))
      ? Number(body.parentId)
      : null

    // Correzione v2.5-GOLD: getDb() è asincrono
    const db = await getDb()
    if (!db) {
      throw createError({ statusCode: 500, statusMessage: 'Database Neon non disponibile.' })
    }

    // 1. Inserimento commento
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

    // 2. GAMIFICATION v2.5-GOLD: Se l'utente è loggato, diamo +10 XP per la partecipazione attiva
    if (userId) {
      const rewardXp = 10
      await db.update(users)
        .set({ xp: sql`COALESCE(xp, 0) + ${rewardXp}` })
        .where(sql`id = ${userId}`)

      await db.insert(xpTransactions).values({
        userId: userId,
        action: `Comment on Post ID #${postId}`,
        points: rewardXp
      })
    }

    return {
      success: true,
      data: inserted[0],
      message: 'Commento pubblicato! +10 XP guadagnati ✨'
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