// server/api/user/xp/award.ts
import { defineEventHandler, readBody, getCookie } from 'h3'
import { getDb } from '~~/server/utils/db'
import { sql } from 'drizzle-orm'
import { users } from '~~/server/db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const username = getCookie(event, 'dkp_user') || 'alexdpl'
  const db = getDb()

  const body = await readBody(event)
  const { amount, actionType, description } = body

  if (!amount || !actionType) {
    return { success: false, message: 'Dati mancanti per assegnare XP' }
  }

  try {
    // Troviamo l'ID corretto dal database usando lo username
    const userRecords = await db.select().from(users).where(eq(users.username, username)).limit(1)
    const userId = userRecords.length > 0 ? userRecords[0].id : 1

    await db.execute(sql`
      INSERT INTO user_xp_transactions (user_id, amount, action_type, description)
      VALUES (${userId}, ${amount}, ${actionType}, ${description})
    `)

    return { success: true, message: 'XP Assegnati con successo' }
  } catch (error: any) {
    console.error('❌ Errore scrittura XP:', error)
    return { success: false, error: error.message }
  }
})