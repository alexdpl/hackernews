import { eq } from 'drizzle-orm'
import { posts, comments } from '~~/server/db/schema'

// Interfaccia per la struttura nidificata dei commenti
interface CommentNode {
  id: number
  postId: number
  parentId: number | null
  content: string
  createdAt: Date
  replies: CommentNode[]
}

export default defineEventHandler(async (event) => {
  // 1. Recupera l'ID dai parametri della rotta (Nuxt 4 conserva event.context.params)
  const idParam = getRouterParam(event, 'id')
  const postId = parseInt(idParam || '', 10)

  if (isNaN(postId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID post non valido o mancante.',
    })
  }

  // 2. Recupera il post dal database utilizzando il singleton db
  const postResult = await db.select().from(posts).where(eq(posts.id, postId)).limit(1)
  
  if (postResult.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Post non trovato.',
    })
  }

  const post = postResult[0]

  // Mock dei campi Hacker News per consistenza visiva come fatto in news.ts
  const enrichedPost = {
    ...post,
    score: Math.floor(Math.random() * 100) + 1,
    by: 'utente_neon',
    descendants: 0 // Aggiorneremo questo conteggio dinamico tra poco
  }

  // 3. Recupera tutti i commenti legati a questo postId
  const allComments = await db
    .select()
    .from(comments)
    .where(eq(comments.postId, postId))
    .orderBy(comments.createdAt)

  // Aggiorna il numero di discendenti totali nel post mockato
  enrichedPost.descendants = allComments.length

  // 4. Algoritmo per strutturare i commenti ad albero (O(N))
  const commentMap: Record<number, CommentNode> = {}
  const rootComments: CommentNode[] = []

  // Inizializza la mappa
  allComments.forEach((c) => {
    commentMap[c.id] = { ...c, replies: [] }
  })

  // Costruisci le relazioni parent-child
  allComments.forEach((c) => {
    const node = commentMap[c.id]
    if (c.parentId && commentMap[c.parentId]) {
      commentMap[c.parentId].replies.push(node)
    } else {
      // Se non ha parentId o il parent non esiste, è un commento principale
      rootComments.push(node)
    }
  })

  return {
    post: enrichedPost,
    comments: rootComments,
  }
})