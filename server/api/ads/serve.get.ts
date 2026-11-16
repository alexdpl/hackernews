// server/api/ads/serve.get.ts
import { defineEventHandler, getQuery } from 'h3'
import { getDb } from '../../utils/db'
import { DkpAdsService, type AdPlacement } from '../../utils/dkpAdsService'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const placement = String(query.placement || 'nodeTalks') as AdPlacement

  let db: any = null
  try {
    db = await getDb()
  } catch {
    db = null
  }

  const campaign = await DkpAdsService.serveCampaign(db, placement)

  return {
    success: true,
    circuit: 'DKP-ADS-v2.6-PURE-SQL',
    campaign
  }
})