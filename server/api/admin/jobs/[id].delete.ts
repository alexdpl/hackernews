// server/api/admin/jobs/[id].delete.ts
import { eq } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { jobs } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  
  // 1. Estrazione del parametro :id dalla rotta
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID del job non specificato.'
    })
  }

  // 2. Lettura della chiave segreta dal body della richiesta DELETE
  const body = await readBody(event).catch(() => ({}))
  const secret = body?.secret

  const expectedSecret = 
    config.adminSecret || 
    process.env.ADMIN_SECRET || 
    process.env.NUXT_ADMIN_SECRET

  // 3. Controllo autorizzazione Admin
  if (!secret || secret !== expectedSecret) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Chiave segreta di amministrazione non valida o mancante.'
    })
  }

  try {
    // Converti l'ID in numero se la colonna id nel database è integer/serial
    const numericId = Number(id)
    const targetId = isNaN(numericId) ? id : numericId

    // 4. Esecuzione query di eliminazione con Drizzle ORM
    const deleted = await db
      .delete(jobs)
      .where(eq(jobs.id, targetId as any))
      .returning()

    if (!deleted || deleted.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Annuncio di lavoro non trovato nel database.'
      })
    }

    return {
      success: true,
      message: 'Job eliminato con successo.',
      deletedJob: deleted[0]
    }
  } catch (error: any) {
    // Se l'errore è già gestito tramite createError, lo rilanciamo
    if (error.statusCode) throw error

    console.error('Errore durante l\'eliminazione del Job:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Errore durante l\'eliminazione dell\'annuncio dal database.'
    })
  }
})
