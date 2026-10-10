// server/api/feed/[id]/vote.post.ts
import { defineEventHandler, getRouterParam, readBody, setCookie, getCookie } from 'h3'
import { eq, sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { posts, pulseStories } from '~~/drizzle/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event) || {}
  const type = body.type || 'news'

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
    const numericId = Number(id)
    let newPoints = 0

    // BIVIO INTELLIGENTE: Aggiorna la tabella corretta in base al tipo
    // Se proviene dal Crawler (generalmente chiamate pulse_stories)
    if (type === 'crawler' || type === 'story') {
      const [updated] = await db
        .update(pulseStories)
        .set({ points: sql`${pulseStories.points} + 1` })
        .where(eq(pulseStories.id, numericId))
        .returning({ points: pulseStories.points })
      
      newPoints = updated?.points || 0
    } 
    // Se è un post "classico" dello User Hub
    else {
      const [updated] = await db
        .update(posts)
        .set({ points: sql`${posts.points} + 1` })
        .where(eq(posts.id, numericId))
        .returning({ points: posts.points })
      
      newPoints = updated?.points || 0
    }

    setCookie(event, cookieName, 'true', { maxAge: 60 * 60 * 24 }) // 24 ore

    return { 
      success: true, 
      message: 'Voto registrato con successo!',
      points: newPoints
    }
  } catch (error: any) {
    console.error(`Errore durante il voto per ${type} #${id}:`, error.message)
    event.node.res.statusCode = 500
    return { success: false, message: 'Errore interno del server.' }
  }
})