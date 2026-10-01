import { defineEventHandler, readBody, createError, getMethod } from 'h3'
import { eq } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { licenses } from '~~/drizzle/schema'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const db = getDb()

  // 1. GET: Restituisce tutte le licenze registrate per la tabella Admin
  if (method === 'GET') {
    try {
      const allLicenses = await db
        .select()
        .from(licenses)
        .orderBy(licenses.createdAt)

      return { success: true, data: allLicenses }
    } catch (error: any) {
      console.error('Errore recupero gateway data:', error)
      throw createError({
        statusCode: 500,
        statusMessage: `Errore durante il recupero delle licenze: ${error.message}`
      })
    }
  }

  // 2. POST: Modifica limiti (maxDownloads), resetta uso (downloadsCount) o aggiorna lo stato
  if (method === 'POST') {
    const body = (await readBody(event)) || {}
    const { id, maxDownloads, status, resetUsage } = body

    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'ID licenza mancante.' })
    }

    try {
      // Se è richiesto un Reset della Quota
      if (resetUsage) {
        const [updated] = await db
          .update(licenses)
          .set({ downloadsCount: 0 })
          .where(eq(licenses.id, id))
          .returning()

        return { success: true, message: 'Quota azzerata con successo!', data: updated }
      }

      // Aggiornamento standard di Limiti e Stato
      const updateData: any = {}
      if (maxDownloads !== undefined) updateData.maxDownloads = Number(maxDownloads)
      if (status) updateData.status = status

      const [updated] = await db
        .update(licenses)
        .set(updateData)
        .where(eq(licenses.id, id))
        .returning()

      return { success: true, message: 'Licenza aggiornata!', data: updated }
    } catch (error: any) {
      console.error('Errore aggiornamento licenza:', error)
      throw createError({
        statusCode: 500,
        statusMessage: `Errore aggiornamento: ${error.message}`
      })
    }
  }
})