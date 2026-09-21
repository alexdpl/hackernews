// server/api/posts.get.ts
import { defineEventHandler, getQuery, createError } from 'h3'
import { getDb } from '../utils/db'
import { posts, comments } from '../db/schema'
import { eq, desc, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const type = query.type as string | undefined

    const db = getDb()

    // Definizione della clausola WHERE in base al filtro richiesto
    let whereClause = undefined
    if (type === 'ask') {
      whereClause = eq(posts.type, 'ask')
    } else if (type === 'show') {
      whereClause = eq(posts.type, 'show')
    } else if (type === 'story') {
      whereClause = eq(posts.type, 'story')
    }
    // Se type è 'newest' o undefined, restituisce tutti i post ordinati per data

    const items = await db
      .select({
        id: posts.id,
        title: posts.title,
        url: posts.url,
        text: posts.text,
        author: posts.author,
        points: posts.points,
        type: posts.type,
        createdAt: posts.createdAt,
        commentsCount: sql<number>`count(${comments.id})::int`
      })
      .from(posts)
      .leftJoin(comments, eq(posts.id, comments.postId))
      .where(whereClause)
      .groupBy(posts.id)
      .orderBy(desc(posts.createdAt))

    return {
      success: true,
      data: items
    }
  } catch (error: any) {
    console.error('=== [ERROR] GET POSTS ===', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Errore durante il recupero dei post.'
    })
  }
})