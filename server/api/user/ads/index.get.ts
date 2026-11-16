// server/api/user/ads/index.get.ts
import { defineEventHandler, getQuery, getCookie, createError } from 'h3'
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
      id: Number(parsed?.id || 0),
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
  if (!session || (!session.username && !session.email)) {
    throw createError({ statusCode: 401, statusMessage: 'Effettua il login per gestire i tuoi link e le tue campagne Ads.' })
  }

  const query = getQuery(event)
  const page = Math.max(1, Number(query.page || 1))
  const limit = Math.max(1, Math.min(20, Number(query.limit || 6)))
  const offset = (page - 1) * limit
  const search = String(query.search || '').trim().toLowerCase()
  const statusFilter = String(query.status || 'ALL').trim().toUpperCase()

  const db = await getDb()
  if (!db) {
    throw createError({ statusCode: 500, statusMessage: 'Database Neon non disponibile.' })
  }

  await DkpAdsService.ensureSchema(db)

  // Recupera tutte le campagne intestate all'utente (per username o email)
  const rows = extractRows(
    await db.execute(sql`
      SELECT *
      FROM dkp_ads_campaigns
      WHERE LOWER(COALESCE(buyer_name, '')) = LOWER(${session.username})
         OR (
           ${session.email} <> ''
           AND LOWER(COALESCE(buyer_email, '')) = LOWER(${session.email})
         )
      ORDER BY created_at DESC;
    `)
  )

  const mapped = rows.map((r: any) => {
    const impressions = Number(r.impressions_count || 0)
    const clicks = Number(r.clicks_count || 0)
    const maxImp = r.max_impressions !== null && r.max_impressions !== undefined ? Number(r.max_impressions) : null
    const rawStatus = String(r.status || 'active').toUpperCase()
    const normalizedStatus =
      rawStatus === 'EXHAUSTED' || (maxImp !== null && maxImp > 0 && impressions >= maxImp)
        ? 'EXHAUSTED'
        : rawStatus

    return {
      id: String(r.id),
      title: String(r.title || ''),
      tagline: String(r.tagline || ''),
      badge: String(r.badge || 'SPONSORED'),
      ctaText: String(r.cta_text || 'Scopri di più'),
      targetUrl: String(r.target_url || ''),
      placement: String(r.placement || 'nodeTalks'),
      tier: String(r.tier || 'PRO_NODE'),
      accentColor: String(r.accent_color || 'emerald'),
      buyerName: String(r.buyer_name || session.username),
      buyerEmail: String(r.buyer_email || session.email),
      pricePaidCents: Number(r.price_paid_cents || 0),
      impressionsCount: impressions,
      clicksCount: clicks,
      maxImpressions: maxImp,
      remainingImpressions: maxImp !== null ? Math.max(0, maxImp - impressions) : null,
      ctr: impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(2)) : 0,
      status: normalizedStatus,
      createdAt: r.created_at
    }
  })

  // Statistiche globali dell'utente
  const stats = mapped.reduce(
    (acc, item) => {
      if (item.status === 'ACTIVE') acc.activeCount += 1
      if (item.status === 'PAUSED') acc.pausedCount += 1
      if (item.status === 'MODERATED') acc.moderatedCount += 1
      acc.totalImpressions += item.impressionsCount
      acc.totalClicks += item.clicksCount
      acc.totalInvestedCents += item.pricePaidCents
      return acc
    },
    {
      totalCount: mapped.length,
      activeCount: 0,
      pausedCount: 0,
      moderatedCount: 0,
      totalImpressions: 0,
      totalClicks: 0,
      totalInvestedCents: 0
    }
  )

  // Applica filtri ricerca & stato
  const filtered = mapped.filter((item) => {
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter
    const matchesSearch =
      !search ||
      item.title.toLowerCase().includes(search) ||
      item.tagline.toLowerCase().includes(search) ||
      item.targetUrl.toLowerCase().includes(search) ||
      item.placement.toLowerCase().includes(search)
    return matchesStatus && matchesSearch
  })

  const totalFiltered = filtered.length
  const totalPages = Math.max(1, Math.ceil(totalFiltered / limit))
  const paginated = filtered.slice(offset, offset + limit)

  return {
    success: true,
    data: paginated,
    stats,
    pagination: {
      page,
      limit,
      total: totalFiltered,
      totalPages,
      hasMore: page < totalPages
    }
  }
})