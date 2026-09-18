// server/api/comments.ts
import { comments } from '~~/server/db/schema'
import { eq, asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)

  // ==========================================
  // 1. RECUPERO DEI COMMENTI (GET /api/comments?postId=X)
  // ==========================================
  if (method === 'GET') {
    const query = getQuery(event)
    const postId = Number(query.postId)

    if (!postId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Il parametro postId è obbligatorio per recuperare i commenti.',
      })
    }

    try {
      // Recuperiamo tutti i commenti del post ordinati cronologicamente
      const postComments = await db
        .select()
        .from(comments)
        .where(eq(comments.postId, postId))
        .orderBy(asc(comments.createdAt))

      return postComments
    } catch (error) {
      console.error('Errore durante il recupero dei commenti da Neon:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Impossibile caricare i commenti.',
      })
    }
  }

  // ==========================================
  // 2. INSERIMENTO DI UN NUOVO COMMENTO (POST /api/comments)
  // ==========================================
  if (method === 'POST') {
    const body = await readBody(event)

    // Validazione dei campi minimi richiesti
    if (!body.postId || !body.content || !body.content.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Il contenuto del commento e il postId sono richiesto.',
      })
    }

    try {
      // Determiniamo l'autore: se passato dal client (es. salvato nei cookie/localStorage), usiamo quello, 
      // altrimenti generiamo un utente casuale in perfetto stile HN (es. user_742)
      const author = body.by && body.by.trim() 
        ? body.by.trim() 
        : `user_${Math.floor(Math.random() * 899) + 100}`

      // Inserimento fisico nel database Neon tramite Drizzle
      const [newComment] = await db
        .insert(comments)
        .values({
          postId: Number(body.postId),
          parentId: body.parentId ? Number(body.parentId) : null, // Gestisce le risposte dirette ad altri commenti
          content: body.content.trim(),
          by: author,
          createdAt: new Date(),
        })
        .returning()

      return {
        success: true,
        comment: newComment,
      }
    } catch (error) {
      console.error('Errore durante il salvataggio del commento su Neon:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Impossibile salvare il commento nel database.',
      })
    }
  }

  // Se viene usato un metodo HTTP non supportato
  throw createError({
    statusCode: 405,
    statusMessage: 'Metodo non consentito.',
  })
})