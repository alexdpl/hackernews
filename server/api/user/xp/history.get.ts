// server/api/user/xp/history.get.ts
import { defineEventHandler, getCookie } from 'h3'
import { eq, desc } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { xpTransactions, users } from '~~/drizzle/schema' // Oppure ~~/server/db/schema se preferisci

export default defineEventHandler(async (event) => {
  try {
    const username = getCookie(event, 'dkp_user') || 'alexdpl'
    const db = getDb()
    
    const userRecords = await db.select().from(users).where(eq(users.username, username)).limit(1)
    if (!userRecords.length) return { success: false, data: [] }

    const userId = userRecords[0].id

    const history = await db.select()
      .from(xpTransactions)
      .where(eq(xpTransactions.userId, userId))
      .orderBy(desc(xpTransactions.id))
      .limit(20)

    return {
      success: true,
      data: history
    }
  } catch (error) {
    return { success: false, data: [] }
  }
})