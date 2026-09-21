// server/api/job.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { getDb } from '../utils/db'
import { jobs } from '../db/schema'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { title, url, text, company, location } = body

    if (!title || title.trim().length < 3) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Il titolo dell\'offerta di lavoro è obbligatorio.'
      })
    }

    const db = getDb()

    const [newJob] = await db
      .insert(jobs)
      .values({
        title: title.trim(),
        url: url && url.trim() !== '' ? url.trim() : null,
        text: text && text.trim() !== '' ? text.trim() : null,
        company: company && company.trim() !== '' ? company.trim() : null,
        location: location && location.trim() !== '' ? location.trim() : null,
        createdAt: new Date()
      })
      .returning()

    return {
      success: true,
      data: newJob
    }
  } catch (error: any) {
    console.error('=== [ERROR] INSERIMENTO JOB ===', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Errore durante il salvataggio dell\'offerta di lavoro.'
    })
  }
})