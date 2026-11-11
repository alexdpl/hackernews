// server/api/user/xp/award.post.ts
import { defineEventHandler, readBody, getCookie, createError } from 'h3'
import { eq, sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { users, xpTransactions } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const username = getCookie(event, 'dkp_user') || 'alexdpl'
  const db = getDb()

  const body = await readBody(event)
  const { amount, actionType, description } = body || {}

  if (!amount || !actionType) {
    throw createError({ statusCode: 400, statusMessage: 'Parametri amount ed actionType obbligatori' })
  }

  try {
    // 1. Trova l'utente per username
    const userRecords = await db.select().from(users).where(eq(users.username, username)).limit(1)
    const userId = userRecords.length > 0 ? userRecords[0].id : 1

    const numAmount = Number(amount)

    // 2. Inserisci la transazione nello storico XP
    await db.insert(xpTransactions).values({
      userId,
      amount: numAmount,
      actionType,
      description: description || 'Assegnazione XP System'
    })

    // 3. AGGIORNAMENTO FONDAMENTALE: Incrementa il punteggio XP totale nella tabella utenti
    await db.update(users)
      .set({ xp: sql`${users.xp} + ${numAmount}` })
      .where(eq(users.id, userId))

    return {
      success: true,
      message: `Assegnati +${numAmount} XP con successo`,
      data: { userId, amount: numAmount, actionType }
    }
  } catch (error: any) {
    console.error('❌ Errore scrittura XP:', error)
    return { success: false, error: error.message || 'Errore durante l\'assegnazione degli XP' }
  }
})