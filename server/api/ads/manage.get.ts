// server/api/ads/manage.get.ts
import { defineEventHandler, getQuery, getCookie, setResponseHeaders } from 'h3'
import { getDb } from '~~/server/utils/db'
import { DkpAdsService } from '~~/server/utils/dkpAdsService'

function readCallerIdentity(event: any, query: any) {
  let cookieUsername = ''
  let cookieRole = ''
  const rawCookie = getCookie(event, 'dkp_user') || ''

  if (rawCookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(rawCookie))
      cookieUsername = String(parsed?.username || '')
      cookieRole = String(parsed?.role || '')
    } catch {
      cookieUsername = String(rawCookie).trim()
    }
  }

  const buyerName = String(query.buyer || cookieUsername || '').trim()
  const buyerEmail = String(query.email || '').trim()
  const isAdmin =
    cookieRole.toUpperCase() === 'ADMIN' ||
    buyerName.toLowerCase() === 'alexdpl'

  return { buyerName, buyerEmail, isAdmin }
}

export default defineEventHandler(async (event) => {
  setResponseHeaders(event, {
    'X-Cloud-Region': 'europe-west4',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  })

  const query = getQuery(event)
  const { buyerName, buyerEmail, isAdmin } = readCallerIdentity(event, query)
  const scope = String(query.scope || '').toLowerCase() === 'mine' ? 'mine' : 'all'

  try {
    const db = await getDb()
    if (!db) {
      return { success: false, error: 'Connessione Neon DB non disponibile.', data: [] }
    }

    const { campaigns, diagnostics } = await DkpAdsService.listCampaigns(db, {
      buyerName,
      buyerEmail,
      isAdmin,
      scope
    })

    return {
      success: true,
      data: campaigns,
      diagnostics
    }
  } catch (err: any) {
    console.error('❌ Errore /api/ads/manage:', err?.message || err)
    return {
      success: false,
      error: err?.message || 'Errore query dkp_ads_campaigns',
      data: []
    }
  }
})