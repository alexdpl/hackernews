// server/api/pulse/vote.post.ts
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const storyId = parseInt(body.storyId)
    const userId = body.userId || 1 // Sostituire con l'ID dell'utente autenticato

    if (!storyId || !userId) {
      throw createError({ statusCode: 400, statusMessage: 'Parametri mancanti' })
    }

    const db = getDb()
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

    // 4. GAMIFICATION: Assegniamo +5 XP all'utente che ha effettuato l'upvote
    await db.execute(sql`
      UPDATE users SET xp = COALESCE(xp, 0) + 5 WHERE id = ${userId};
    `)

    return {
      success: true,
      message: 'Voto registrato! +5 XP guadagnati! ⚡',
      xpAwarded: 5
    }
  } catch (err: any) {
    return { success: false, message: err?.message || 'Errore durante la registrazione del voto' }
  }
})