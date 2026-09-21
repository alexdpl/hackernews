// server/api/admin/jobs/index.ts
import { desc } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { jobs } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const method = event.method
  const config = useRuntimeConfig(event)

  // 1. Chiave segreta di amministrazione
  const expectedSecret =
    config.adminSecret ||
    process.env.ADMIN_SECRET ||
    process.env.NUXT_ADMIN_SECRET

  // Estrazione token dagli header
  const authHeader = getHeader(event, 'authorization')
  const xAdminSecret = getHeader(event, 'x-admin-secret')
  let token = xAdminSecret || (authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader)

  const db = getDb()

  // --------------------------------------------------------------------------
  // GET /api/admin/jobs -> Recupera la lista di tutti i jobs
  // --------------------------------------------------------------------------
  if (method === 'GET') {
    const query = getQuery(event)
    if (!token && query.secret) {
      token = query.secret as string
    }

    if (!expectedSecret || !token || token !== expectedSecret) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Accesso negato. Chiave amministrativa non valida o mancante.'
      })
    }

    try {
      const allJobs = await db
        .select()
        .from(jobs)
        .orderBy(desc(jobs.createdAt))

      return {
        success: true,
        data: allJobs
      }
    } catch (error: any) {
      console.error('Errore durante il recupero dei jobs:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Errore durante la lettura degli annunci dal database.'
      })
    }
  }

  // --------------------------------------------------------------------------
  // POST /api/admin/jobs -> Crea un nuovo annuncio di lavoro
  // --------------------------------------------------------------------------
  if (method === 'POST') {
    const body = await readBody(event).catch(() => ({}))

    if (!token && body?.secret) {
      token = body.secret
    }

    if (!expectedSecret || !token || token !== expectedSecret) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Accesso negato. Chiave amministrativa non valida o mancante.'
      })
    }

    const { title, company, url, location, description } = body

    if (!title || typeof title !== 'string' || !title.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Il titolo dell\'annuncio è un campo obbligatorio.'
      })
    }

    try {
      const newJob = await db
        .insert(jobs)
        .values({
          title: title.trim(),
          company: company?.trim() || null,
          url: url?.trim() || null,
          location: location?.trim() || null,
          description: description?.trim() || null
        })
        .returning()

      return {
        success: true,
        message: 'Annuncio di lavoro inserito con successo.',
        job: newJob[0]
      }
    } catch (error: any) {
      console.error('Errore durante l\'inserimento del job:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Errore durante il salvataggio dell\'annuncio nel database.'
      })
    }
  }

  // Gestione metodi HTTP non consentiti
  throw createError({
    statusCode: 405,
    statusMessage: 'Metodo non supportato. Utilizzare GET o POST.'
  })
})