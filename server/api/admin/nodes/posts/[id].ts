// server/api/admin/nodes/posts/[id].ts
import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const method = event.node.req.method
  const db = await getDb()
  const postId = Number(getRouterParam(event, 'id'))

  if (!postId || isNaN(postId)) {
    throw createError({ statusCode: 400, statusMessage: 'ID Thread non valido.' })
  }

  // PATCH: Cambia stato isPinned o isLocked
  if (method === 'PATCH') {
    const body = await readBody(event)
    const { action } = body // 'toggle_pin' | 'toggle_lock'

    try {
      if (action === 'toggle_pin') {
        await db.execute(sql`UPDATE node_posts SET is_pinned = NOT is_pinned WHERE id = ${postId}`)
      } else if (action === 'toggle_lock') {
        await db.execute(sql`UPDATE node_posts SET is_locked = NOT is_locked WHERE id = ${postId}`)
      }
      return { success: true, message: 'Stato thread aggiornato.' }
    } catch (err: any) {
      throw createError({ statusCode: 500, statusMessage: err.message })
    }
  }

  // DELETE: Eliminazione definitiva Thread
  if (method === 'DELETE') {
    try {
      await db.execute(sql`DELETE FROM node_posts WHERE id = ${postId}`)
      return { success: true, message: 'Thread eliminato dal forum.' }
    } catch (err: any) {
      throw createError({ statusCode: 500, statusMessage: err.message })
    }
  }
})