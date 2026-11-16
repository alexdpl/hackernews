// server/api/ads/click.post.ts
import { defineEventHandler, getQuery, readBody, createError } from 'h3'
import { getDb } from '../../utils/db'
import { DkpAdsService } from '../../utils/dkpAdsService'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const body = (await readBody(event).catch(() => ({}))) || {}
  const campaignId = String(body.campaignId || body.id || query.id || '').trim()

  if (!campaignId) {
    throw createError({ statusCode: 400, statusMessage: 'ID campagna mancante.' })
  }

  try {
    const db = await getDb()
    await DkpAdsService.trackEvent(db, campaignId, 'click')
  } catch {}

  return {
    success: true,
    tracked: 'click',
    campaignId
  }
})