import { defineEventHandler, getCookie } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  // 1. Recupero Utente (Fallback a 1 per test admin se non loggato)
  const sessionUserCookie = getCookie(event, 'dkp_user_id') || getCookie(event, 'user_id')
  const userId = sessionUserCookie ? parseInt(sessionUserCookie, 10) : 1

  const db = getDb()

  try {
    // 2. Somma totale degli XP per l'utente dalla tabella transazioni
    const result = await db.execute(sql`
      SELECT COALESCE(SUM(amount), 0) as total_xp
      FROM user_xp_transactions
      WHERE user_id = ${userId}
    `)

    const totalXp = Number(result.rows[0].total_xp)

    // 3. Calcolo del Livello e Titolo basato sugli XP
    let level = 1
    let title = 'Newbie Developer'

    if (totalXp >= 500 && totalXp < 2000) {
      level = 2
      title = 'DKP Developer'
    } else if (totalXp >= 2000 && totalXp < 5000) {
      level = 3
      title = 'Core Pioneer'
    } else if (totalXp >= 5000 && totalXp < 15000) {
      level = 4
      title = 'Pulse Architect'
    } else if (totalXp >= 15000) {
      level = 5
      title = 'Kernel Master (S-Tier)'
    }

    return {
      success: true,
      data: {
        userId,
        totalXp,
        level,
        title
      }
    }
  } catch (error: any) {
    console.error('❌ Errore sync XP:', error)
    return {
      success: false,
      message: 'Impossibile sincronizzare XP dal database',
      error: error.message
    }
  }
})