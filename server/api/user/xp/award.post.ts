// server/api/user/xp/award.post.ts
import { defineEventHandler, readBody, getCookie, createError } from 'h3'
import { eq, sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { users, xpTransactions } from '~~/drizzle/schema'

export default defineEventHandler(async (event) => {
  const username = getCookie(event, 'dkp_user') || 'alexdpl'
  const db = await getDb()

  const body = await readBody(event)
  const { amount, points, actionType, action, description } = body || {}

  const numAmount = Number(amount ?? points ?? 0)
  const resolvedAction = String(action || actionType || description || '').trim()

  if (!numAmount || !resolvedAction) {
    throw createError({ statusCode: 400, statusMessage: 'Parametri amount/points e action/actionType obbligatori' })
  }

  try {
    const userRecords = await db.select().from(users).where(eq(users.username, username)).limit(1)
    const userId = userRecords.length > 0 ? userRecords[0].id : 1

    await db.insert(xpTransactions).values({
      userId,
      action: description ? `${resolvedAction}: ${description}` : resolvedAction,
      points: numAmount
    })

    await db.update(users)
      .set({ xp: sql`COALESCE(${users.xp}, 0) + ${numAmount}` })
      .where(eq(users.id, userId))

    return {
      success: true,
      message: `Assegnati +${numAmount} XP con successo`,
      data: { userId, points: numAmount, action: resolvedAction }
    }
  } catch (error: any) {
    console.error('[XP AWARD ERROR]:', error)
    return { success: false, error: error.message || 'Errore durante l\'assegnazione degli XP' }
  }
})