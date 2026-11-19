import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { extractDkpUserFromEvent } from '~~/server/utils/session'

export default defineEventHandler(async (event) => {
  const sessionUser = extractDkpUserFromEvent(event)
  if (!sessionUser) {
    throw createError({ statusCode: 401, statusMessage: 'Autenticazione richiesta per chiudere un thread.' })
  }

  const id = Number(getRouterParam(event, 'id'))
  if (!id || Number.isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'ID thread non valido.' })
  }

  const body = await readBody(event).catch(() => ({}))
  const locked = body?.isLocked !== undefined ? Boolean(body.isLocked) : true

  const db = await getDb()
  if (!db) throw createError({ statusCode: 500, statusMessage: 'Database non disponibile.' })

  await db.execute(sql`ALTER TABLE node_posts ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;`).catch(() => null)
  await db.execute(sql`
    UPDATE node_posts
    SET is_locked = ${locked}
    WHERE id = ${id};
  `)

  return { success: true, id, isLocked: locked }
})