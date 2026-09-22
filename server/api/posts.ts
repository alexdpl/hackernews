// server/api/posts.ts
import { defineEventHandler, getQuery } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

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
    // 1. Calcolo del conteggio totale dei post per questo tipo (per gestire centinaia/migliaia di record)
    const countResult: any = await db.execute(sql`
      SELECT COUNT(*) AS total 
      FROM posts 
      WHERE type = ${type}
    `)
    const totalItems = Number(countResult[0]?.total || countResult?.rows?.[0]?.total || 0)
    const totalPages = Math.ceil(totalItems / limit) || 1

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
      // Algoritmo di Classifica Hacker News (Gravity Decay) con Paginazione scalabile
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
      data: posts,
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    }
  } catch (err: any) {
    console.error('Errore recupero posts:', err)
    return {
      success: false,
      data: [],
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalItems: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
      },
      error: err.message
    }
  }
})