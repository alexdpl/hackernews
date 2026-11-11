// server/api/user/xp/history.get.ts
import { defineEventHandler, getCookie } from 'h3'
import { eq, desc } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { users, xpTransactions } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  try {
    const username = getCookie(event, 'dkp_user') || 'alexdpl'
    const db = getDb()

    const userRecords = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1)
    if (!userRecords.length) {
      return { success: true, data: [] }
    }

    const userId = userRecords[0].id

    const history = await db.select()
      .from(xpTransactions)
      .where(eq(xpTransactions.userId, userId))
      .orderBy(desc(xpTransactions.id))
      .limit(20)

    return {
      success: true,
      data: history || []
    }
  } catch (error: any) {
    console.warn('❌ Errore lettura storico XP, fallback vuoto:', error)
    return { success: false, data: [] }
  }
})