// server/api/user/xp-stats.get.ts
import { defineEventHandler, createError, getCookie } from 'h3'
import { eq, desc } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { xpTransactions, users } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const sessionUserCookie = getCookie(event, 'dkp_user_id') || getCookie(event, 'user_id')
  const userId = sessionUserCookie ? parseInt(sessionUserCookie, 10) : null

  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Non autorizzato. Effettua il login.' })
  }

  const db = getDb()

  try {
    // Recupera i dati XP direttamente dal profilo utente nella tabella users
    const [userRecord] = await db
      .select({ xp: users.xp, level: users.level })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    const totalXp = userRecord?.xp || 0

    // Logica dinamica di livello basata sugli XP
    let levelName = 'Developer Novice'
    let nextLevelXp = 100
    if (totalXp >= 100) { levelName = 'Developer Pro'; nextLevelXp = 500 }
    if (totalXp >= 500) { levelName = 'Developer VIP Member'; nextLevelXp = 1000 }

    // Recupera la cronologia dei movimenti XP
    const history = await db
      .select({
        id: xpTransactions.id,
        action: xpTransactions.action,
        points: xpTransactions.points,
        createdAt: xpTransactions.createdAt,
      })
      .from(xpTransactions)
      .where(eq(xpTransactions.userId, userId))
      .orderBy(desc(xpTransactions.createdAt))
      .limit(10)

    return {
      success: true,
      stats: {
        xp: totalXp,
        level: levelName,
        nextLevelXp,
        progress: Math.min(100, (totalXp / nextLevelXp) * 100)
      },
      history: history.map(log => ({
        id: log.id,
        action: log.action,
        points: log.points > 0 ? `+${log.points} XP` : `${log.points} XP`,
        date: new Date(log.createdAt).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
      }))
    }
  } catch (error) {
    throw createError({ statusCode: 500, statusMessage: 'Errore durante il recupero statistiche XP' })
  }
})