// server/api/user/xp/history.get.ts
import { defineEventHandler, getCookie, parseCookies } from 'h3'
import { eq, desc } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { xpTransactions, users } from '~~/drizzle/schema'

export default defineEventHandler(async (event) => {
  try {
    // Recupera l'utente dalla sessione (adatta alla tua logica)
    const cookies = parseCookies(event)
    let username = 'Socio' // Fallback
    
    if (cookies.dkp_session) {
      try {
        const parsed = JSON.parse(decodeURIComponent(cookies.dkp_session))
        if (parsed.username) username = parsed.username
      } catch (_) {}
    }

    const db = await getDb()
    
    // Troviamo l'ID dell'utente partendo dall'username
    const userRecords = await db.select().from(users).where(eq(users.username, username)).limit(1)
    if (!userRecords.length) return { success: false, data: [] }

    const userId = userRecords[0].id

    // Peschiamo le ultime 20 transazioni
    const history = await db.select()
      .from(xpTransactions)
      .where(eq(xpTransactions.userId, userId))
      .orderBy(desc(xpTransactions.id)) // Oppure createdAt se lo hai nello schema
      .limit(20)

    return {
      success: true,
      data: history
    }
  } catch (error) {
    return { success: false, data: [] }
  }
})