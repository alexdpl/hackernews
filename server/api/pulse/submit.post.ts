// server/api/pulse/submit.post.ts
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { users, xpTransactions } from '~~/drizzle/schema'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { title, url, type, username, userId } = body

    if (!title || !type) {
      throw createError({ statusCode: 400, statusMessage: 'Titolo e Sezione sono obbligatori' })
    }

    // Correzione v2.5-GOLD: getDb() è asincrono
    const db = await getDb()
    if (!db) throw createError({ statusCode: 500, statusMessage: 'Database non disponibile' })

    // Calcolo bonus XP in base alla tipologia di contenuto
    let xpBonus = 15 // Default per News
    if (type === 'ask') xpBonus = 20
    else if (type === 'show') xpBonus = 30
    else if (type === 'jobs') xpBonus = 25

    const safeUrl = url || `https://devkernelpulse.org/item?title=${encodeURIComponent(title)}`

    // 1. Inserimento del contenuto nella tabella pulse_stories
    await db.execute(sql`
      INSERT INTO pulse_stories (title, url, domain, type, author, author_id, points, xp_awarded)
      VALUES (${title}, ${safeUrl}, 'devkernelpulse.org', ${type}, ${username || 'community_user'}, ${userId || null}, 1, ${xpBonus});
    `)

    // 2. Assegnazione automatica del Bonus XP all'utente e registrazione transazione
    const targetUserId = userId ? Number(userId) : null
    if (targetUserId) {
      await db.update(users)
        .set({ xp: sql`COALESCE(xp, 0) + ${xpBonus}` })
        .where(sql`id = ${targetUserId}`)

      // Registrazione nello storico della Dashboard (Gamification Engine)
      await db.insert(xpTransactions).values({
        userId: targetUserId,
        action: `Pulse Submit [${type.toUpperCase()}]: ${title.substring(0, 30)}...`,
        points: xpBonus
      })
    }

    return {
      success: true,
      message: `Contenuto pubblicato con successo su ${type.toUpperCase()}! Hai guadagnato +${xpBonus} XP! 🔥`,
      xpGranted: xpBonus
    }
  } catch (err: any) {
    console.error('[PULSE SUBMIT ERROR]', err)
    return { success: false, message: err?.message || 'Errore durante la pubblicazione' }
  }
})