// server/api/jobs.get.ts
import { defineEventHandler, getQuery, createError } from 'h3'
import { getDb } from '../utils/db'
import { jobs } from '../db/schema'
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
        .from(jobs)
        .orderBy(desc(jobs.createdAt))
        .limit(limit)
        .offset(offset),
      
      db
        .select({ count: sql<number>`count(*)` })
        .from(jobs)
    ])

    const totalJobs = countResult?.count || 0
    const hasMore = offset + dataResult.length < totalJobs

    return {
      success: true,
      data: dataResult,
      pagination: { page, limit, total: totalJobs, hasMore }
    }
  } catch (error: any) {
    console.error('=== [ERROR] FALLIMENTO LETTURA JOBS ===', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Impossibile recuperare le offerte di lavoro.',
    })
  }
})