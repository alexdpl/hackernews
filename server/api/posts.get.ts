// server/api/posts.get.ts
import { defineEventHandler, getQuery, createError } from 'h3'
import { getDb } from '../utils/db'
import { posts } from '../db/schema' // 👈 Importiamo "posts" e non "jobs"
import { desc, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    
    const page = Math.max(1, parseInt(query.page as string) || 1)
    const limit = Math.max(1, Math.min(100, parseInt(query.limit as string) || 30))
    const offset = (page - 1) * limit

    const db = getDb()

    const [dataResult, countResult] = await Promise.all([
      db
        .select()
        .from(posts) // 👈 CORRETTO: ora legge dalla tabella 'posts'
        .orderBy(desc(posts.createdAt))
        .limit(limit)
        .offset(offset),
      
      db
        .select({ count: sql<number>`count(*)` })
        .from(posts) // 👈 CORRETTO: conta i record di 'posts'
    ])

    const totalPosts = Number(countResult[0]?.count || 0)
    const hasMore = offset + dataResult.length < totalPosts

    return {
      success: true,
      data: dataResult,
      pagination: { page, limit, total: totalPosts, hasMore }
    }
  } catch (error: any) {
    console.error('=== [ERROR] FALLIMENTO LETTURA POSTS ===', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Impossibile recuperare i post.',
    })
  }
})