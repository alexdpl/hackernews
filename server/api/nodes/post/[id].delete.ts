import { defineEventHandler, getRouterParam, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const numericId = Number(getRouterParam(event, 'id'))
  if (!numericId || isNaN(numericId)) throw createError({ statusCode: 400, statusMessage: 'ID non valido' })

  try {
    const db = await getDb()
    if (!db) throw new Error('Database non disponibile.')

    // Il CASCADE nel database eliminerà in automatico anche i commenti e i voti associati
    await db.execute(sql`DELETE FROM node_posts WHERE id = ${numericId};`)
    return { success: true, message: 'Thread eliminato con successo.' }
  } catch (err: any) {
    throw createError({ statusCode: 500, statusMessage: 'Errore cancellazione thread.' })
  }
})