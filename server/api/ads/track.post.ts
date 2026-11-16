// server/api/ads/track.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { getDb } from '../../utils/db'
import { DkpAdsService } from '../../utils/dkpAdsService'

export default defineEventHandler(async (event) => {
  let body: any = await readBody(event).catch(() => ({}))
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      body = {}
    }
  }

  const campaignId = String(body?.campaignId || body?.id || '').trim()
  const rawType = String(body?.type || body?.actionType || '').trim().toLowerCase()
  const type = rawType === 'click' ? 'click' : rawType === 'impression' ? 'impression' : null

  if (!campaignId || !type) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Parametri campaignId e type/actionType (impression|click) obbligatori.'
    })
  }

  try {
    const db = await getDb()
    await DkpAdsService.trackEvent(db, campaignId, type)
  } catch {}

  return {
    success: true,
    tracked: type,
    campaignId
  }
})