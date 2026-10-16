// server/api/item/[id].ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { eq, desc } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { posts, comments } from '~~/server/db/schema'

// Interfaccia per la struttura nidificata dei commenti
interface CommentNode {
  id: number
  postId: number
  parentId: number | null
  author?: string
  content: string
  createdAt: Date
  replies: CommentNode[]
}

export default defineEventHandler(async (event) => {
  const idParam = getRouterParam(event, 'id')
  const postId = parseInt(idParam || '', 10)

  if (isNaN(postId) || postId <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID post non valido o mancante.',
    })
  }

  try {
    // 1. Inizializzazione corretta e asincrona di Neon DB (Standard v2.5-GOLD)
    const db = await getDb()
    if (!db) {
      throw createError({ statusCode: 500, statusMessage: 'Database Neon non disponibile.' })
    }

    // 2. Recupera il post dal database
    const postResult = await db.select().from(posts).where(eq(posts.id, postId)).limit(1)
    
    if (postResult.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Post non trovato.',
      })
    }

    const post = postResult[0]

    // Post arricchito con dati reali dal DB (Niente Math.random!)
    const enrichedPost = {
      ...post,
      score: post.points || 1,
      by: post.author || 'community_dev',
      descendants: 0 
    }

    // 3. Recupera tutti i commenti legati a questo postId ordinati per data
    const allComments = await db
      .select()
      .from(comments)
      .where(eq(comments.postId, postId))
      .orderBy(comments.createdAt)

    enrichedPost.descendants = allComments.length

    // 4. Algoritmo per strutturare i commenti ad albero (O(N))
    const commentMap: Record<number, CommentNode> = {}
    const rootComments: CommentNode[] = []

    // Inizializza la mappa
    allComments.forEach((c: any) => {
      commentMap[c.id] = { ...c, replies: [] }
    })

    // Costruisci le relazioni parent-child ricorsive
    allComments.forEach((c: any) => {
      const node = commentMap[c.id]
      if (c.parentId && commentMap[c.parentId]) {
        commentMap[c.parentId].replies.push(node)
      } else {
        rootComments.push(node)
      }
    })

    return {
      success: true,
      post: enrichedPost,
      comments: rootComments,
    }

  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('=== [ITEM DETAIL API ERROR] ===', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Errore durante il recupero del post e dei commenti.',
    })
  }
})