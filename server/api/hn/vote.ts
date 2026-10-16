// server/api/hn/vote.post.ts
import { and, eq, sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { votes, users, xpTransactions } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)

  if (method === 'POST') {
    const body = await readBody(event)
    const { postId, userId, username } = body
    
    const currentUsername = username || 'utente_neon'
    const targetUserId = userId ? Number(userId) : 1

    if (!postId) {
      throw createError({ statusCode: 400, statusMessage: 'postId obbligatorio.' })
    }

    try {
      // Correzione v2.5-GOLD: getDb() è asincrono
      const db = await getDb()
      if (!db) {
        throw createError({ statusCode: 500, statusMessage: 'Database Neon non disponibile.' })
      }

      // Controlla se il voto esiste già
      const existingVote = await db
        .select()
        .from(votes)
        .where(
          and(
            eq(votes.postId, parseInt(postId, 10)),
            eq(votes.username, currentUsername)
          )
        )
        .limit(1)

      if (existingVote.length > 0) {
        throw createError({ statusCode: 400, statusMessage: 'Hai già votato questo post.' })
      }

      // Inserisce il voto
      await db.insert(votes).values({
        postId: parseInt(postId, 10),
        username: currentUsername,
      })

      // GAMIFICATION v2.5-GOLD: +5 XP per l'upvote
      const rewardXp = 5
      await db.update(users)
        .set({ xp: sql`COALESCE(xp, 0) + ${rewardXp}` })
        .where(eq(users.id, targetUserId))

      await db.insert(xpTransactions).values({
        userId: targetUserId,
        action: `Vote HN Post #${postId}`,
        points: rewardXp
      }).catch(() => {})

      return { success: true, message: 'Upvote registrato con successo! +5 XP ⚡' }
    } catch (error: any) {
      if (error.statusCode) throw error
      throw createError({
        statusCode: 500,
        statusMessage: error.message || 'Errore durante la registrazione del voto.',
      })
    }
  }

  throw createError({ statusCode: 405, statusMessage: 'Metodo non supportato.' })
})