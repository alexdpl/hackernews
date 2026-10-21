import { defineEventHandler, readBody, getCookie } from 'h3'
import { getDb } from '~~/server/utils/db'
import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const sessionUserCookie = getCookie(event, 'dkp_user_id') || getCookie(event, 'user_id')
  const userId = sessionUserCookie ? parseInt(sessionUserCookie, 10) : 1

  const body = await readBody(event)
  const { amount, actionType, description } = body

  if (!amount || !actionType) {
    return { success: false, message: 'Dati mancanti per assegnare XP' }
  }

  const db = getDb()

  try {
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