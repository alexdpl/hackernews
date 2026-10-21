// server/api/v2.5/ads/active.get.ts
import { defineEventHandler, createError } from 'h3'
import { getDb } from '~~/server/utils/db'
import { dkpAds } from '~~/server/db/schema'
import { eq, and, gt, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const db = getDb()
    
    // Pesca fino a 3 annunci attivi in ordine casuale usando Postgres RANDOM()
    const activeAds = await db.select({
      id: dkpAds.id,
      title: dkpAds.title,
      snippet: dkpAds.snippet,
      url: dkpAds.targetUrl,
      tag: dkpAds.categoryTag,
      provider: dkpAds.advertiserEmail // Mostriamo l'email o un default nel frontend
    })
    .from(dkpAds)
    .where(
      and(
        eq(dkpAds.status, 'ACTIVE'),
        gt(dkpAds.budgetCredits, 0)
      )
    )
    .orderBy(sql`RANDOM()`)
    .limit(3)

    return {
      success: true,
      ads: activeAds
    }
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Errore nel recupero campagne DKP Ads: ' + err.message
    })
  }
})