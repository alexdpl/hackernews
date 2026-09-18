import { and, eq } from 'drizzle-orm'
import { votes } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)

  if (method === 'POST') {
    const body = await readBody(event)
    const { postId } = body
    
    // Utente simulato in attesa dell'autenticazione reale
    const currentUsername = 'utente_neon' 

    if (!postId) {
      throw createError({ statusCode: 400, statusMessage: 'postId obbligatorio.' })
    }

    try {
      // Controlla se il voto esiste già
      const existingVote = await db
        .select()
        .from(votes)
        .where(
          and(
            eq(votes.postId, parseInt(postId, 10)),
            eq(votes.username, currentUsername)
          )
        )
        .limit(1)

      if (existingVote.length > 0) {
        throw createError({ statusCode: 400, statusMessage: 'Hai già votato questo post.' })
      }

      // Inserisce il voto
      await db.insert(votes).values({
        postId: parseInt(postId, 10),
        username: currentUsername,
      })

      return { success: true, message: 'Upvote registrato con successo.' }
    } catch (error: any) {
      throw createError({
        statusCode: 500,
        statusMessage: error.message || 'Errore durante la registrazione del voto.',
      })
    }
  }

  throw createError({ statusCode: 405, statusMessage: 'Metodo non supportato.' })
})