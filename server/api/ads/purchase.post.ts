// server/api/ads/purchase.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { getDb } from '~~/server/utils/db'
import { parseSessionUser } from '~~/server/utils/dkpComments'
import { DkpAdsService } from '~~/server/utils/dkpAdsService'

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const session = parseSessionUser(event)

  const title = String(body?.title || '').trim()
  const targetUrl = String(body?.targetUrl || '').trim()

  if (!title || !targetUrl) {
    throw createError({ statusCode: 400, statusMessage: 'Titolo e URL di destinazione sono obbligatori.' })
  }

  const db = await getDb()
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database Neon non disponibile.' })
  }

  const campaign = await DkpAdsService.createPaidCampaign(db, {
    title,
    tagline: String(body?.tagline || body?.snippet || 'Risorsa consigliata dalla redazione DevKernelPulse.'),
    badge: String(body?.badge || 'SPONSORED'),
    categoryTag: String(body?.categoryTag || 'LIBRI AMAZON'),
    ctaText: String(body?.ctaText || 'Scopri di più'),
    targetUrl,
    placement: body?.placement || 'global',
    tier: body?.tier,
    billingModel: body?.billingModel || 'CLICKS',
    maxClicks: body?.maxClicks ? Number(body.maxClicks) : 100,
    maxImpressions: body?.maxImpressions ? Number(body.maxImpressions) : 25000,
    accentColor: body?.accentColor || 'amber',
    buyerName: String(body?.buyerName || session?.username || 'alexdpl'),
    buyerEmail: String(body?.buyerEmail || 'admin@devkernelpulse.org')
  })

  return {
    success: true,
    campaign
  }
})