import { eq } from 'drizzle-orm'
import { posts, comments } from '~~/server/db/schema'

interface CommentNode {
  id: number
  postId: number
  parentId: number | null
  content: string
  createdAt: Date
  replies: CommentNode[]
}

export default defineEventHandler(async (event) => {
  const method = getMethod(event)

  // ----------------------------------------------------
  // GESTIONE RECUPERO POST + ALBERO COMMENTI (GET)
  // ----------------------------------------------------
  if (method === 'GET') {
    const query = getQuery(event)
    const postId = parseInt(query.postId as string, 10)

    if (!postId || isNaN(postId)) {
      throw createError({ statusCode: 400, statusMessage: 'postId mancante o non valido.' })
    }

    // 1. Recupera il post usando il singleton globale 'db'
    const postResult = await db.select().from(posts).where(eq(posts.id, postId)).limit(1)
    if (postResult.length === 0) {
      throw createError({ statusCode: 404, statusMessage: 'Post non trovato.' })
    }
    const post = postResult[0]

    // Arricchimento mock (come in news.ts)
    const enrichedPost = {
      ...post,
      score: Math.floor(Math.random() * 100) + 1,
      by: 'utente_neon',
      descendants: 0
    }

    // 2. Recupera tutti i commenti del post
    const allComments = await db
      .select()
      .from(comments)
      .where(eq(comments.postId, postId))
      .orderBy(comments.createdAt)

    enrichedPost.descendants = allComments.length

    // 3. Costruzione dell'albero O(N)
    const commentMap: Record<number, CommentNode> = {}
    const rootComments: CommentNode[] = []

    allComments.forEach((c) => {
      commentMap[c.id] = { ...c, replies: [] }
    })

    allComments.forEach((c) => {
      const node = commentMap[c.id]
      if (c.parentId && commentMap[c.parentId]) {
        commentMap[c.parentId].replies.push(node)
      } else {
        rootComments.push(node)
      }
    })

    return {
      post: enrichedPost,
      comments: rootComments
    }
  }

  // ----------------------------------------------------
  // GESTIONE AGGIUNTA NUOVO COMMENTO (POST)
  // ----------------------------------------------------
  if (method === 'POST') {
    const body = await readBody(event)
    const { postId, parentId, content } = body

    if (!postId || !content || content.trim() === '') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Campi obbligatori mancanti (postId, content).'
      })
    }

    // Inserimento record nel DB Neon tramite Drizzle
    const newComment = await db.insert(comments).values({
      postId: parseInt(postId, 10),
      parentId: parentId ? parseInt(parentId, 10) : null,
      content: content.trim(),
      createdAt: new Date()
    }).returning()

    return {
      success: true,
      comment: newComment[0]
    }
  }

  throw createError({ statusCode: 405, statusMessage: 'Metodo non supportato.' })
})