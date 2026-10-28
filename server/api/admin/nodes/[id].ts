// server/api/admin/nodes/[id].ts
import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const method = event.node.req.method
  const db = await getDb()
  const nodeId = Number(getRouterParam(event, 'id'))

  if (!nodeId || isNaN(nodeId)) {
    throw createError({ statusCode: 400, statusMessage: 'ID Nodo non valido.' })
  }

  // PUT: Aggiornamento Nodo
  if (method === 'PUT') {
    const body = await readBody(event)
    const { name, slug, description, icon, color, isPrivate } = body

    try {
      await db.execute(sql`
        UPDATE nodes
        SET 
          name = ${name},
          slug = ${slug},
          description = ${description},
          icon = ${icon},
          color = ${color},
          is_private = ${Boolean(isPrivate)}
        WHERE id = ${nodeId}
      `)
      return { success: true, message: 'Nodo aggiornato.' }
    } catch (err: any) {
      throw createError({ statusCode: 500, statusMessage: err.message })
    }
  }

  // DELETE: Eliminazione Nodo (con pulizia dei thread associati)
  if (method === 'DELETE') {
    try {
      await db.execute(sql`DELETE FROM nodes WHERE id = ${nodeId}`)
      return { success: true, message: 'Nodo eliminato con successo.' }
    } catch (err: any) {
      throw createError({ statusCode: 500, statusMessage: err.message })
    }
  }
})