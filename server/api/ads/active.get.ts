// server/api/ads/active.get.ts
import { defineEventHandler, getQuery } from 'h3'
import { getDb } from '../../utils/db'
import { DkpAdsService, type AdPlacement } from '../../utils/dkpAdsService'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const placement = String(query.placement || 'global') as AdPlacement
  const tag = String(query.tag || '').trim().toLowerCase()
  const limit = Math.max(1, Math.min(50, Number(query.limit || 3)))

  let db: any = null
  try {
    db = await getDb()
  } catch {
    db = null
  }

  // Se c'è un tag contestuale, peschiamo un pool più ampio per filtrarlo con fallback automatico
  const fetchCount = tag ? Math.max(limit * 4, 12) : limit
  const batch = await DkpAdsService.serveBatch(db, placement, fetchCount)

  let selected = batch
  if (tag) {
    const matched = batch.filter(
      (c) =>
        String(c.categoryTag || '').toLowerCase().includes(tag) ||
        String(c.badge || '').toLowerCase().includes(tag) ||
        String(c.title || '').toLowerCase().includes(tag) ||
        String(c.tagline || '').toLowerCase().includes(tag)
    )
    selected = (matched.length > 0 ? matched : batch).slice(0, limit)
  } else {
    selected = batch.slice(0, limit)
  }

  // Espone sia lo schema v2.6 sia gli alias v2.5 (snippet, url, tag, provider) per DkpAdStrip e Shop
  const unifiedAds = selected.map((c) => ({
    ...c,
    snippet: c.tagline,
    url: c.targetUrl,
    tag: c.categoryTag || c.badge || 'LIBRI AMAZON',
    provider: c.buyerEmail || c.buyerName || 'DevKernelPulse'
  }))

  return {
    success: true,
    circuit: 'DKP-ADS-v2.6-PURE-SQL',
    ads: unifiedAds,
    data: unifiedAds,
    campaigns: unifiedAds
  }
})