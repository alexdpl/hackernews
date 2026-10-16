// server/api/posts/[id]/vote.post.ts
import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { eq, sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { posts, users, xpTransactions } from '~~/server/db/schema'

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

    const body = await readBody(event).catch(() => ({}))
    const userId = body?.userId ? Number(body.userId) : 1 // Fallback utente default

    // Correzione v2.5-GOLD: getDb() è asincrono
    const db = await getDb()
    if (!db) {
      throw createError({ statusCode: 500, statusMessage: 'Database Neon non disponibile.' })
    }

    // 1. Incremento atomico dei punti del post (+1)
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

    // 2. GAMIFICATION v2.5-GOLD: Assegniamo +5 XP per il voto al post
    const rewardXp = 5
    await db.update(users)
      .set({ xp: sql`COALESCE(xp, 0) + ${rewardXp}` })
      .where(sql`id = ${userId}`)

    await db.insert(xpTransactions).values({
      userId: userId,
      action: `Vote Post ID #${postId}`,
      points: rewardXp
    })

    return {
      success: true,
      points: updatedPost[0].points,
      message: 'Voto registrato con successo! +5 XP ⚡'
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