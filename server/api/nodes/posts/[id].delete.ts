// server/api/nodes/posts/[id].delete.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const postId = getRouterParam(event, 'id')
  if (!postId) throw createError({ statusCode: 400, statusMessage: 'ID post mancante' })

  const db = await getDb()
  if (!db) throw createError({ statusCode: 500, statusMessage: 'Database offline' })

  try {
    await db.execute(sql`DELETE FROM node_threads WHERE id = ${Number(postId)}`)
    return { success: true, message: 'Post eliminato correttamente.' }
  } catch (err: any) {
    throw createError({ statusCode: 500, statusMessage: err.message })
  }
})