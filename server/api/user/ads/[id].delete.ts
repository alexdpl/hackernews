// server/api/user/ads/[id].delete.ts
import { defineEventHandler, getRouterParam, getCookie, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { DkpAdsService } from '~~/server/utils/dkpAdsService'

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

function getSessionUser(event: any) {
  const raw = getCookie(event, 'dkp_session')
  if (!raw) return null
  try {
    const parsed = JSON.parse(decodeURIComponent(raw))
    return {
      username: String(parsed?.username || '').trim(),
      email: String(parsed?.email || '').trim(),
      isAdmin: String(parsed?.role || '').toLowerCase() === 'admin' || String(parsed?.username || '').toLowerCase() === 'alexdpl'
    }
  } catch {
    return null
  }
}

export default defineEventHandler(async (event) => {
  const session = getSessionUser(event)
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Autenticazione richiesta.' })
  }

  const id = String(getRouterParam(event, 'id') || '').trim()
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID campagna mancante.' })
  }

  const db = await getDb()
  if (!db) {
    throw createError({ statusCode: 500, statusMessage: 'Database non disponibile.' })
  }

  await DkpAdsService.ensureSchema(db)

  const existing = extractRows(
    await db.execute(sql`SELECT id, buyer_name, buyer_email FROM dkp_ads_campaigns WHERE id = ${id} LIMIT 1;`)
  )[0]

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Campagna non trovata.' })
  }

  const isOwner =
    (session.username && String(existing.buyer_name || '').toLowerCase() === session.username.toLowerCase()) ||
    (session.email && String(existing.buyer_email || '').toLowerCase() === session.email.toLowerCase())

  if (!session.isAdmin && !isOwner) {
    throw createError({ statusCode: 403, statusMessage: 'Non hai i permessi per eliminare questa inserzione.' })
  }

  await db.execute(sql`DELETE FROM dkp_ads_campaigns WHERE id = ${id};`)

  return {
    success: true,
    deletedId: id
  }
})