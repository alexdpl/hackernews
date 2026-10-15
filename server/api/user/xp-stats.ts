// server/api/user/xp-stats.ts
import { defineEventHandler, getQuery } from 'h3'
import { eq, desc } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { xpTransactions } from '~~/drizzle/schema'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const userId = query.userId ? Number(query.userId) : 1
    const db = await getDb()

    // Recupera le ultime 10 attività dell'utente
    const history = await db.select()
      .from(xpTransactions)
      .where(eq(xpTransactions.userId, userId))
      .orderBy(desc(xpTransactions.createdAt))
      .limit(10)

    // Formatta i dati per la tabella della dashboard
    const formattedHistory = history.map(tx => ({
      id: tx.id,
      action: tx.action,
      points: tx.points > 0 ? `+${tx.points}` : `${tx.points}`,
      date: tx.createdAt ? tx.createdAt.toISOString().split('T')[0] : 'Oggi'
    }))

    return { success: true, history: formattedHistory }
  } catch (err: any) {
    console.warn('[XP-STATS ERROR]', err)
    // Ritorna array vuoto in caso di errore per evitare crash del frontend
    return { success: true, history: [] } 
  }
})