// server/api/posts/[id]/vote.post.ts
import { defineEventHandler, getRouterParam, getHeader, createError } from 'h3'
import { eq, sql } from 'drizzle-orm'

// Relative imports per struttura Nuxt 4 (root /server/)
import { getDb } from '~~/server/utils/db'
import { posts, votes } from '~~/server/db/schema'

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

    // 2. Identificazione client (IP) per prevenzione voti doppi
    const forwardedFor = getHeader(event, 'x-forwarded-for')
    const realIp = getHeader(event, 'x-real-ip')
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : (realIp || '127.0.0.1')

    const db = getDb()

    // 3. Verifica esistenza del post
    const targetPost = await db
      .select({ id: posts.id, points: posts.points })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1)

    if (!targetPost || targetPost.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Post non trovato.'
      })
    }

    // 4. Inserimento voto con blocco duplicati (PG Unique Constraint: 23505)
    try {
      await db.insert(votes).values({
        postId,
        username: clientIp
      })
    } catch (dbErr: any) {
      // 23505 = Codice errore PostgreSQL per violazione di vincolo UNIQUE
      if (dbErr.code === '23505' || dbErr.message?.includes('unique_user_post_vote')) {
        throw createError({
          statusCode: 409, // Conflict
          statusMessage: 'Hai già votato questo post.'
        })
      }
      throw dbErr
    }

    // 5. Incremento atomico dei punti (evita race conditions)
    const updatedPost = await db
      .update(posts)
      .set({
        points: sql`${posts.points} + 1`
      })
      .where(eq(posts.id, postId))
      .returning({ points: posts.points })

    const newPoints = updatedPost?.[0]?.points ?? (targetPost[0].points + 1)

    return {
      success: true,
      points: newPoints,
      message: 'Voto registrato con successo.'
    }

  } catch (error: any) {
    console.error('=== [VOTE POST API ERROR] ===', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: `Errore DB Neon: operazione di voto fallita (${error.message || 'Errore interno'})`
    })
  }
})