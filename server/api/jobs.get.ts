// server/api/jobs.get.ts
import { defineEventHandler, createError } from 'h3'
import { getDb } from '../utils/db'
import { jobs } from '../db/schema'
import { desc } from 'drizzle-orm'

export default defineEventHandler(async () => {
  try {
    const db = getDb()

    const allJobs = await db
      .select({
        id: jobs.id,
        title: jobs.title,
        url: jobs.url,
        text: jobs.text,
        company: jobs.company,
        location: jobs.location,
        createdAt: jobs.createdAt
      })
      .from(jobs)
      .orderBy(desc(jobs.createdAt))

    return {
      success: true,
      data: allJobs
    }
  } catch (error: any) {
    console.error('=== [ERROR] GET JOBS ===', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Errore durante il recupero delle offerte di lavoro.'
    })
  }
})