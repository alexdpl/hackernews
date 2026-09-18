// server/api/submit.ts
import { posts } from '~~/server/db/schema' // Punta alla cartella db nella radice

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.title || !body.url) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Titolo e URL sono obbligatori.',
    })
  }

  try {
    const newPost = await db.insert(posts).values({
      title: body.title,
      url: body.url,
      createdAt: new Date(),
    }).returning()

    return { success: true, post: newPost }
  } catch (error) {
    console.error('Errore durante il salvataggio su Neon:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Impossibile salvare il link nel database.',
    })
  }
})