import { getDb } from '~~/server/utils/db'
import { DkpAdsService } from '~~/server/utils/dkpAdsService'

export default defineEventHandler(async (event) => {
  const id = decodeURIComponent(String(getRouterParam(event, 'id') || '')).trim()
  if (!id || id.startsWith('house-')) {
    throw createError({ statusCode: 400, statusMessage: 'ID inserzione non valido.' })
  }

  let callerUsername = ''
  let callerRole = ''
  const rawCookie = getCookie(event, 'dkp_user') || ''
  if (rawCookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(rawCookie))
      callerUsername = String(parsed?.username || '').toLowerCase()
      callerRole = String(parsed?.role || '').toUpperCase()
    } catch {
      callerUsername = String(rawCookie).trim().toLowerCase()
    }
  }

  const isAdmin = callerRole === 'ADMIN' || callerUsername === 'alexdpl'

  const db = await getDb()
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database Neon non disponibile.' })
  }

  await DkpAdsService.ensureSchema(db)

  const existingRes: any = await db.execute(sql`
    SELECT id, buyer_name AS "buyerName" FROM dkp_ads_campaigns WHERE id = ${id} LIMIT 1;
  `)
  const rows = Array.isArray(existingRes) ? existingRes : (existingRes?.rows || [])
  const existing = rows[0]

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Inserzione non trovata.' })
  }

  const owner = String(existing.buyerName || '').trim().toLowerCase()
  if (!isAdmin && (!callerUsername || owner !== callerUsername)) {
    throw createError({ statusCode: 403, statusMessage: 'Permessi insufficienti.' })
  }

  const method = event.method.toUpperCase()

  if (method === 'PATCH' || method === 'PUT') {
    const body = await readBody(event).catch(() => ({}))

    if (body?.action === 'topup') {
      const updated = await DkpAdsService.updateCampaign(db, id, {
        type: 'topup',
        addClicks: Number(body?.addClicks ?? 100),
        addImpressions: Number(body?.addImpressions ?? 10000)
      })
      return { success: true, campaign: updated }
    }

    const nextStatus = String(body?.status || 'active').toLowerCase()
    if (nextStatus !== 'active' && nextStatus !== 'paused') {
      throw createError({ statusCode: 400, statusMessage: 'Stato non valido.' })
    }

    const updated = await DkpAdsService.updateCampaign(db, id, {
      type: 'status',
      status: nextStatus
    })

    return { success: true, campaign: updated, status: nextStatus }
  }

  if (method === 'DELETE') {
    await DkpAdsService.deleteCampaign(db, id)
    return { success: true, id }
  }

  throw createError({ statusCode: 405, statusMessage: 'Metodo non consentito.' })
})