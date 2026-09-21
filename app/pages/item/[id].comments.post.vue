// server/api/items/[id]/comments.post.ts
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID dell\'item mancante.'
    })
  }

  if (!body || !body.text || !body.text.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Il testo del commento è obbligatorio.'
    })
  }

  try {
    const newComment = {
      id: Date.now(),
      itemId: id,
      text: body.text.trim(),
      author: body.author?.trim() || 'Anonimo',
      createdAt: new Date().toISOString()
    }

    // TODO: Sostituisci con il salvataggio reale nel tuo Database
    // Es: await db.insert(comments).values(newComment)

    return {
      success: true,
      message: 'Commento salvato con successo.',
      comment: newComment
    }
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || 'Errore durante il salvataggio del commento.'
    })
  }
})