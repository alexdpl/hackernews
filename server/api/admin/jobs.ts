// server/api/admin/jobs.ts
import { defineEventHandler, getHeader, getQuery, readBody, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  const method = event.node.req.method
  const body = method === 'POST' ? await readBody(event).catch(() => ({})) : {}
  
  const providedSecret = (getHeader(event, 'x-admin-secret') || query.secret || body?.secret || '') as string
  const expectedSecret = (config.adminSecret || process.env.NUXT_ADMIN_SECRET || process.env.ADMIN_SECRET || 'admin') as string

  // Controllo Autenticazione Admin
  if (expectedSecret && providedSecret !== expectedSecret) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Chiave Admin non valida.'
    })
  }

  const db = getDb()

  try {
    // 1. Lettura Elenco Offerte di Lavoro (GET o POST con action = 'list')
    if (method === 'GET' || body?.action === 'list' || !body?.action) {
      const result: any = await db.execute(sql`
        SELECT id, title, url, text, author, type, points, 
               COALESCE(created_at, NOW()) AS "createdAt"
        FROM posts
        WHERE type = 'job'
        ORDER BY id DESC
      `)
      
      const jobList = Array.isArray(result) ? result : (result?.rows || [])

      return {
        success: true,
        data: jobList
      }
    }

    // 2. Creazione Nuova Offerta di Lavoro (POST con action = 'create')
    if (method === 'POST' && body?.action === 'create') {
      const { title, url, text, author } = body

      if (!title) {
        throw createError({ statusCode: 400, statusMessage: 'Il titolo è obbligatorio.' })
      }

      const result: any = await db.execute(sql`
        INSERT INTO posts (title, url, text, author, type, points, created_at)
        VALUES (
          ${title}, 
          ${url || null}, 
          ${text || null}, 
          ${author || 'Admin'}, 
          'job', 
          1, 
          NOW()
        )
        RETURNING id, title, url, text, author, type, points, created_at AS "createdAt"
      `)

      const newJob = Array.isArray(result) ? result[0] : (result?.rows?.[0] || {})

      return { success: true, data: newJob }
    }

    // 3. Eliminazione Offerta (POST con action = 'delete')
    if (method === 'POST' && body?.action === 'delete') {
      if (!body.id) {
        throw createError({ statusCode: 400, statusMessage: 'ID della richiesta mancante.' })
      }

      await db.execute(sql`
        DELETE FROM posts 
        WHERE id = ${Number(body.id)} AND type = 'job'
      `)

      return { success: true, message: 'Job eliminato con successo.' }
    }

    return { success: true, data: [] }
  } catch (err: any) {
    console.error('Errore API Admin Jobs:', err)
    throw createError({
      statusCode: 500,
      statusMessage: err.message || 'Errore interno del server durante la gestione Jobs.'
    })
  }
})