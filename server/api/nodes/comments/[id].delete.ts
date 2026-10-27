import { defineEventHandler, getRouterParam, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const numericId = Number(getRouterParam(event, 'id'))
  if (!numericId || isNaN(numericId)) throw createError({ statusCode: 400, statusMessage: 'ID non valido' })

  try {
    const db = await getDb()
    if (!db) throw new Error('Database non disponibile.')

    // Recuperiamo il post_id per aggiornare il contatore
    const res: any = await db.execute(sql`SELECT post_id FROM node_comments WHERE id = ${numericId};`)
    const row = Array.isArray(res) ? res[0] : res?.rows?.[0]

    await db.execute(sql`DELETE FROM node_comments WHERE id = ${numericId};`)

    if (row && row.post_id) {
      await db.execute(sql`UPDATE node_posts SET comments_count = GREATEST(COALESCE(comments_count, 1) - 1, 0) WHERE id = ${row.post_id};`).catch(() => {})
    }
    return { success: true, message: 'Commento eliminato con successo.' }
  } catch (err: any) {
    throw createError({ statusCode: 500, statusMessage: 'Errore cancellazione commento.' })
  }
})