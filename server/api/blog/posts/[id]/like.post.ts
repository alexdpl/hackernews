// server/api/blog/posts/[id]/like.post.ts
import { defineEventHandler, getRouterParam, setCookie, getCookie } from 'h3'
import { eq, sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { blogPosts } from '~~/drizzle/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id || isNaN(Number(id))) {
    return { success: false, message: 'ID non valido' }
  }

  // Semplice protezione anti-spam con cookie (per evitare 1000 click dallo stesso utente non loggato)
  const cookieName = `dkp_liked_${id}`
  const alreadyLiked = getCookie(event, cookieName)

  if (alreadyLiked) {
    return { success: false, message: 'Hai già assegnato karma a questo articolo!' }
  }

  try {
    const db = await getDb()

    // Incrementa in modo atomico il campo likes
    await db
      .update(blogPosts)
      .set({
        likes: sql`${blogPosts.likes} + 1`
      })
      .where(eq(blogPosts.id, Number(id)))

    // Imposta il cookie per 24 ore
    setCookie(event, cookieName, 'true', { maxAge: 60 * 60 * 24 })

    return { success: true, message: 'Karma assegnato!' }
  } catch (error: any) {
    console.error(`Errore incremento like per post ${id}:`, error.message)
    return { success: false, error: error.message }
  }
})