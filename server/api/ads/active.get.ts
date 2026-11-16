// server/api/ads/active.get.ts
import { defineEventHandler, getQuery } from 'h3'
import { getDb } from '../../utils/db'
import { DkpAdsService, type AdPlacement } from '../../utils/dkpAdsService'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const placement = String(query.placement || 'nodeTalks') as AdPlacement
  const limit = Math.max(1, Math.min(6, Number(query.limit || 3)))

  let db: any = null
  try {
    db = await getDb()
  } catch {
    db = null
  }

  const campaigns = await DkpAdsService.serveBatch(db, placement, limit)

  return {
    success: true,
    circuit: 'DKP-ADS-v2.6-PURE-SQL',
    data: campaigns,
    campaigns
  }
})