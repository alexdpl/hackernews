// server/api/user/ads/[id].patch.ts
import { defineEventHandler, getRouterParam, readBody, getCookie, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { DkpAdsService, resolveSafeAdUrl } from '~~/server/utils/dkpAdsService'

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

  const body = (await readBody(event).catch(() => ({}))) || {}
  const db = await getDb()
  if (!db) {
    throw createError({ statusCode: 500, statusMessage: 'Database non disponibile.' })
  }

  await DkpAdsService.ensureSchema(db)

  const existing = extractRows(
    await db.execute(sql`SELECT * FROM dkp_ads_campaigns WHERE id = ${id} LIMIT 1;`)
  )[0]

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Campagna non trovata.' })
  }

  const isOwner =
    (session.username && String(existing.buyer_name || '').toLowerCase() === session.username.toLowerCase()) ||
    (session.email && String(existing.buyer_email || '').toLowerCase() === session.email.toLowerCase())

  if (!session.isAdmin && !isOwner) {
    throw createError({ statusCode: 403, statusMessage: 'Non hai i permessi per modificare questa inserzione.' })
  }

  // Impedisce all'utente di riattivare da solo una campagna bloccata per moderazione
  if (!session.isAdmin && String(existing.status).toLowerCase() === 'moderated' && body.status === 'active') {
    throw createError({ statusCode: 403, statusMessage: 'Campagna sospesa per moderazione: contatta lo staff DKP.' })
  }

  const nextTitle = body.title !== undefined ? String(body.title).trim().slice(0, 140) : existing.title
  const nextTagline = body.tagline !== undefined ? String(body.tagline).trim().slice(0, 280) : existing.tagline
  const nextCta = body.ctaText !== undefined ? String(body.ctaText).trim().slice(0, 40) : existing.cta_text
  const nextPlacement = body.placement !== undefined ? String(body.placement).trim() : existing.placement
  const nextStatus =
    body.status !== undefined && ['active', 'paused'].includes(String(body.status).toLowerCase())
      ? String(body.status).toLowerCase()
      : existing.status

  let nextUrl = existing.target_url
  let nextIsInternal = existing.is_internal
  if (body.targetUrl !== undefined) {
    const safe = resolveSafeAdUrl(body.targetUrl)
    nextUrl = safe.url
    nextIsInternal = safe.isInternal
  }

  const updated = extractRows(
    await db.execute(sql`
      UPDATE dkp_ads_campaigns
      SET
        title = ${nextTitle},
        tagline = ${nextTagline},
        cta_text = ${nextCta},
        target_url = ${nextUrl},
        is_internal = ${nextIsInternal},
        placement = ${nextPlacement},
        status = ${nextStatus}
      WHERE id = ${id}
      RETURNING *;
    `)
  )[0]

  return {
    success: true,
    campaign: updated
  }
})