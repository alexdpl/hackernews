// server/api/items/[id].get.ts
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID item non specificato.'
    })
  }

  try {
    // TODO: Sostituisci questo blocco con la tua query DB (es. Prisma, Drizzle, Neon)
    // Es: const item = await db.select().from(posts).where(eq(posts.id, id))
    // Es: const comments = await db.select().from(comments).where(eq(comments.itemId, id))

    /* Esempio di struttura dati restituita */
    const item = {
      id: id,
      title: 'Benvenuti su DevKernelPulse — La nuova piattaforma per sviluppatori',
      url: 'https://github.com/alexdpl/hackernews',
      domain: 'github.com',
      points: 42,
      author: 'admin',
      description: 'Discussione aperta sulla nuova piattaforma per sviluppatori.',
      createdAt: new Date().toISOString(),
      comments: [
        {
          id: 1,
          author: 'Alex',
          text: 'Ottimo progetto, molto veloce con Nuxt 3!',
          createdAt: new Date().toISOString()
        }
      ]
    }

    if (!item) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Post non trovato.'
      })
    }

    return item
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || 'Errore durante il recupero del post.'
    })
  }
})