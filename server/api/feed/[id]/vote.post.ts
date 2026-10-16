// server/api/feed/[id]/vote.post.ts
import { defineEventHandler, getRouterParam, readBody, setCookie, getCookie } from 'h3'
import { eq, sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { posts, pulseStories, users, xpTransactions } from '~~/drizzle/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event) || {}
  const type = body.type || 'news'
  const userId = body.userId ? Number(body.userId) : 1 // Fallback utente di default

  if (!id || isNaN(Number(id))) {
    return { success: false, message: 'ID non valido' }
  }

  // Protezione anti-spam basilare con cookie
  const cookieName = `voted_item_${type}_${id}`
  const alreadyVoted = getCookie(event, cookieName)

  if (alreadyVoted) {
    event.node.res.statusCode = 409 // Conflict
    return { success: false, message: 'Hai già votato questo elemento.' }
  }

  try {
    const db = await getDb()
    if (!db) throw new Error('Database non disponibile')

    const numericId = Number(id)
    let newPoints = 0

    // BIVIO INTELLIGENTE: Aggiorna la tabella corretta in base al tipo
    if (type === 'crawler' || type === 'story') {
      const [updated] = await db
        .update(pulseStories)
        .set({ points: sql`${pulseStories.points} + 1` })
        .where(eq(pulseStories.id, numericId))
        .returning({ points: pulseStories.points })
      
      newPoints = updated?.points || 0
    } 
    else {
      const [updated] = await db
        .update(posts)
        .set({ points: sql`${posts.points} + 1` })
        .where(eq(posts.id, numericId))
        .returning({ points: posts.points })
      
      newPoints = updated?.points || 0
    }

    // GAMIFICATION v2.5-GOLD: Assegniamo +5 XP all'utente per aver votato nel feed
    const rewardXp = 5
    await db.update(users)
      .set({ xp: sql`COALESCE(xp, 0) + ${rewardXp}` })
      .where(eq(users.id, userId))

    await db.insert(xpTransactions).values({
      userId: userId,
      action: `Vote Feed Item [${type}] #${numericId}`,
      points: rewardXp
    }).catch(() => {})

    setCookie(event, cookieName, 'true', { maxAge: 60 * 60 * 24 }) // 24 ore

    return { 
      success: true, 
      message: 'Voto registrato con successo! +5 XP ⚡',
      points: newPoints,
      xpAwarded: rewardXp
    }
  } catch (error: any) {
    console.error(`Errore durante il voto per ${type} #${id}:`, error.message)
    event.node.res.statusCode = 500
    return { success: false, message: 'Errore interno del server.' }
  }
})