// server/api/admin/nodes.post.ts
import { defineEventHandler, readBody, createError, getCookie } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) || {}
  const { name, slug, description, icon, color, isPrivate } = body

  if (!name || !slug || !description) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Nome, slug e descrizione sono obbligatori.'
    })
  }

  // Pulizia e formattazione dello slug
  const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '')
  const nodeName = name.trim().startsWith('n/') ? name.trim() : `n/${name.trim()}`

  // Recupero ID Admin dalla sessione (fallback su ID 1)
  let creatorId = 1
  const sessionCookie = getCookie(event, 'dkp_session')
  if (sessionCookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(sessionCookie))
      if (parsed.id) creatorId = Number(parsed.id)
    } catch (_) {}
  }

  try {
    const db = await getDb()
    if (!db) {
      throw createError({ statusCode: 500, statusMessage: 'Database Neon non disponibile.' })
    }

    const result: any = await db.execute(sql`
      INSERT INTO nodes (name, slug, description, icon, color, creator_id, is_private)
      VALUES (
        ${nodeName},
        ${cleanSlug},
        ${description},
        ${icon || '⚡'},
        ${color || '#38bdf8'},
        ${creatorId},
        ${Boolean(isPrivate)}
      )
      RETURNING id, name, slug, description, icon, color, subscribers_count AS "subscribersCount", is_private AS "isPrivate", created_at AS "createdAt";
    `)

    const newNode = Array.isArray(result) ? result[0] : (result?.rows?.[0] || null)

    return {
      success: true,
      message: `Nodo ${nodeName} creato con successo! 🚀`,
      data: newNode
    }
  } catch (err: any) {
    console.error('❌ [ADMIN NODES CREATE ERROR]:', err)
    if (err.code === '23505') {
      throw createError({
        statusCode: 409,
        statusMessage: 'Esiste già un nodo con questo nome o slug.'
      })
    }
    throw createError({
      statusCode: 500,
      statusMessage: err.message || 'Errore durante la creazione del nodo.'
    })
  }
})