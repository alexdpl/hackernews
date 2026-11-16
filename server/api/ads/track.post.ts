// server/api/ads/track.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { getDb } from '../../utils/db'
import { DkpAdsService } from '../../utils/dkpAdsService'

export default defineEventHandler(async (event) => {
  const body = (await readBody(event).catch(() => ({}))) || {}
  const campaignId = String(body.campaignId || '').trim()
  const type = body.type === 'click' ? 'click' : body.type === 'impression' ? 'impression' : null

  if (!campaignId || !type) {
    throw createError({ statusCode: 400, statusMessage: 'Parametri campaignId e type (impression|click) obbligatori.' })
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