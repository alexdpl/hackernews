import { and, eq } from 'drizzle-orm'
import { posts } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)

  if (method === 'POST') {
    const body = await readBody(event)
    const { title, url } = body

    if (!title || title.trim() === '') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Il titolo è obbligatorio.'
      })
    }

    const cleanTitle = title.trim()
    const cleanUrl = url && url.trim() !== '' ? url.trim() : null

    // --- FILTRO ANTI-DUPLICATI PER I POST ---
    if (cleanUrl) {
      // Se c'è un URL, controlla se quel link è già stato inserito
      const existingPostByUrl = await db
        .select()
        .from(posts)
        .where(eq(posts.url, cleanUrl))
        .limit(1)

      if (existingPostByUrl.length > 0) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Questo link è già stato pubblicato su Hacker News.'
        })
      }
    } else {
      // Se è un post di solo testo (Ask/Show HN), controlla il titolo identico
      const existingPostByTitle = await db
        .select()
        .from(posts)
        .where(eq(posts.title, cleanTitle))
        .limit(1)

      if (existingPostByTitle.length > 0) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Un post con questo identico titolo esiste già.'
        })
      }
    }
    // ----------------------------------------

    // Se passa i controlli, esegue l'inserimento reale
    const newPost = await db.insert(posts).values({
      title: cleanTitle,
      url: cleanUrl,
      createdAt: new Date()
    }).returning()

    return {
      success: true,
      post: newPost[0]
    }
  }

  throw createError({ statusCode: 405, statusMessage: 'Metodo non supportato.' })
})