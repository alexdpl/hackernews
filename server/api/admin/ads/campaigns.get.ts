// server/api/admin/ads/campaigns.get.ts
import { defineEventHandler, createError } from 'h3'
import { sql } from 'drizzle-orm'
import { getDb } from '../../../utils/db'
import { DkpAdsService } from '../../../utils/dkpAdsService'

function extractRows(res: any): any[] {
  return Array.isArray(res) ? res : (res?.rows || [])
}

export default defineEventHandler(async () => {
  const db = await getDb()
  if (!db) {
    throw createError({ statusCode: 500, statusMessage: 'Database Neon Pure-SQL non disponibile.' })
  }

  await DkpAdsService.ensureSchema(db)

  const rows = extractRows(
    await db.execute(sql`
      SELECT *
      FROM dkp_ads_campaigns
      ORDER BY created_at DESC
      LIMIT 100;
    `)
  )

  const campaigns = rows.map((r: any) => {
    const impressions = Number(r.impressions_count || 0)
    const clicks = Number(r.clicks_count || 0)
    const ctr = impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(2)) : 0

    return {
      id: String(r.id),
      title: String(r.title),
      tagline: String(r.tagline),
      badge: String(r.badge || 'SPONSORED'),
      ctaText: String(r.cta_text || 'Scopri di più'),
      targetUrl: String(r.target_url),
      isInternal: Boolean(r.is_internal),
      placement: String(r.placement || 'nodeTalks'),
      tier: String(r.tier || 'PRO_NODE'),
      accentColor: String(r.accent_color || 'sky'),
      buyerName: String(r.buyer_name || 'DKP Internal'),
      buyerEmail: String(r.buyer_email || ''),
      pricePaidCents: Number(r.price_paid_cents || 0),
      impressionsCount: impressions,
      clicksCount: clicks,
      ctr,
      maxImpressions: r.max_impressions !== null ? Number(r.max_impressions) : null,
      status: String(r.status || 'active'),
      createdAt: r.created_at,
      expiresAt: r.expires_at
    }
  })

  const stats = campaigns.reduce(
    (acc, c) => {
      if (c.status === 'active') acc.activeCount += 1
      acc.totalImpressions += c.impressionsCount
      acc.totalClicks += c.clicksCount
      acc.totalRevenueCents += c.pricePaidCents
      return acc
    },
    { activeCount: 0, totalImpressions: 0, totalClicks: 0, totalRevenueCents: 0 }
  )

  return {
    success: true,
    campaigns,
    stats
  }
})