// server/api/posts.ts
import { defineEventHandler, getQuery } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const type = (query.type as string) || 'story'
  const sort = (query.sort as string) || 'ranking'
  const page = Math.max(1, Number(query.page) || 1)
  const limit = 30
  const offset = (page - 1) * limit

  const db = getDb()

  try {
    let result: any

    if (sort === 'newest') {
      result = await db.execute(sql`
        SELECT id, title, url, text, author, type, points, 
               COALESCE(comments_count, 0) AS "commentsCount",
               COALESCE(created_at, NOW()) AS "createdAt"
        FROM posts
        WHERE type = ${type}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `)
    } else {
      // Algoritmo di Classifica Hacker News (Gravity Decay) con Paginazione
      result = await db.execute(sql`
        SELECT id, title, url, text, author, type, points, 
               COALESCE(comments_count, 0) AS "commentsCount",
               COALESCE(created_at, NOW()) AS "createdAt",
               (
                 CAST(GREATEST(0, points - 1) AS DOUBLE PRECISION) / 
                 POWER(EXTRACT(EPOCH FROM (NOW() - COALESCE(created_at, NOW()))) / 3600.0 + 2.0, 1.8)
               ) AS "rankingScore"
        FROM posts
        WHERE type = ${type}
        ORDER BY "rankingScore" DESC
        LIMIT ${limit} OFFSET ${offset}
      `)
    }

    const posts = Array.isArray(result) ? result : (result?.rows || [])

    return {
      success: true,
      data: posts
    }
  } catch (err: any) {
    console.error('Errore recupero posts:', err)
    return {
      success: false,
      data: [],
      error: err.message
    }
  }
})