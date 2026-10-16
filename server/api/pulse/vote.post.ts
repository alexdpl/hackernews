// server/api/pulse/vote.post.ts
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { users, xpTransactions } from '~~/drizzle/schema'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const storyId = parseInt(body.storyId)
    const userId = body.userId || 1 // Fallback utente di default

    if (!storyId || !userId) {
      throw createError({ statusCode: 400, statusMessage: 'Parametri mancanti' })
    }

    // Correzione v2.5-GOLD: getDb() è asincrono
    const db = await getDb()
    if (!db) throw createError({ statusCode: 500, statusMessage: 'Database non disponibile' })

    // 1. Verifichiamo se l'utente ha già votato
    const existingUpvote: any = await db.execute(sql`
      SELECT id FROM pulse_upvotes WHERE story_id = ${storyId} AND user_id = ${userId} LIMIT 1;
    `)

    const hasVoted = (existingUpvote?.rows || existingUpvote || []).length > 0

    if (hasVoted) {
      return { success: false, message: 'Hai già votato questo contenuto!' }
    }

    // 2. Registriamo il voto
    await db.execute(sql`
      INSERT INTO pulse_upvotes (story_id, user_id) VALUES (${storyId}, ${userId});
    `)

    // 3. Incrementiamo i punti del post
    await db.execute(sql`
      UPDATE pulse_stories SET points = points + 1 WHERE id = ${storyId};
    `)

    // 4. GAMIFICATION v2.5-GOLD: Assegniamo +5 XP all'utente e registriamo la transazione
    const rewardXp = 5
    await db.update(users)
      .set({ xp: sql`COALESCE(xp, 0) + ${rewardXp}` })
      .where(sql`id = ${userId}`)

    await db.insert(xpTransactions).values({
      userId: Number(userId),
      action: `Upvote Story ID #${storyId}`,
      points: rewardXp
    })

    return {
      success: true,
      message: 'Voto registrato! +5 XP guadagnati! ⚡',
      xpAwarded: rewardXp
    }
  } catch (err: any) {
    console.error('[PULSE VOTE ERROR]', err)
    return { success: false, message: err?.message || 'Errore durante la registrazione del voto' }
  }
})