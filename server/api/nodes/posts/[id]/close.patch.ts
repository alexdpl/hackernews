// server/api/nodes/posts/[id]/close.patch.ts
import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { extractDkpUserFromEvent } from '~~/server/utils/session'

export default defineEventHandler(async (event) => {
  const sessionUser: any = extractDkpUserFromEvent(event)
  if (!sessionUser?.id) {
    throw createError({ statusCode: 401, statusMessage: 'Autenticazione richiesta per chiudere o riaprire un thread.' })
  }

  const rawId = String(getRouterParam(event, 'id') || '').replace(/\D+/g, '')
  const id = Number(rawId)
  if (!id || Number.isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'ID thread non valido.' })
  }

  const body = await readBody(event).catch(() => ({}))
  const db = await getDb()
  if (!db) {
    throw createError({ statusCode: 500, statusMessage: 'Database non disponibile.' })
  }

  await db.execute(sql`ALTER TABLE node_posts ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;`).catch(() => null)

  const existingRes: any = await db.execute(sql`
    SELECT id, author_id AS "authorId", COALESCE(is_locked, FALSE) AS "isLocked"
    FROM node_posts
    WHERE id = ${id}
    LIMIT 1;
  `)

  const rows = existingRes?.rows || existingRes || []
  const post = rows[0]
  if (!post) {
    throw createError({ statusCode: 404, statusMessage: 'Thread non trovato.' })
  }

  const username = String(sessionUser.username || '').toLowerCase()
  const role = String(sessionUser.role || '').toLowerCase()
  const isAdmin = Boolean(sessionUser.isAdmin || sessionUser.is_admin || username === 'alexdpl' || role === 'admin')
  const isAuthor = Number(sessionUser.id) === Number(post.authorId)

  if (!isAdmin && !isAuthor) {
    throw createError({ statusCode: 403, statusMessage: 'Solo l’autore del thread o un Admin ROOT può chiuderlo.' })
  }

  const nextLocked = body?.isLocked !== undefined ? Boolean(body.isLocked) : !Boolean(post.isLocked)

  const updateRes: any = await db.execute(sql`
    UPDATE node_posts
    SET is_locked = ${nextLocked}
    WHERE id = ${id}
    RETURNING id, is_locked AS "isLocked";
  `)

  const updatedRows = updateRes?.rows || updateRes || []
  const updated = updatedRows[0] || { id, isLocked: nextLocked }

  return {
    success: true,
    id: Number(updated.id),
    isLocked: Boolean(updated.isLocked)
  }
})