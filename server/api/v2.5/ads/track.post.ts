// server/api/v2.5/ads/track.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { getDb } from '~~/server/utils/db'
import { dkpAds } from '~~/server/db/schema'
import { eq, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { campaignId, actionType } = body // actionType può essere 'click' o 'impression'

  if (!campaignId || !actionType) {
    return { success: false, message: 'Parametri mancanti per il tracking.' }
  }

  try {
    const db = getDb()
    
    // Recupera l'annuncio per controllare i crediti attuali
    const [ad] = await db.select().from(dkpAds).where(eq(dkpAds.id, campaignId)).limit(1)

    if (!ad) {
      return { success: false, message: 'Campagna non trovata.' }
    }

    if (actionType === 'click') {
      // Scala il credito e aggiorna i contatori
      const newBudget = ad.budgetCredits - 1
      const newStatus = newBudget <= 0 ? 'EXHAUSTED' : ad.status

      await db.update(dkpAds)
        .set({
          clicksCount: ad.clicksCount + 1,
          budgetCredits: newBudget,
          status: newStatus,
          updatedAt: sql`CURRENT_TIMESTAMP`
        })
        .where(eq(dkpAds.id, campaignId))
        
    } else if (actionType === 'impression') {
      // Aggiorna solo le visualizzazioni
      await db.update(dkpAds)
        .set({
          impressionsCount: ad.impressionsCount + 1,
          updatedAt: sql`CURRENT_TIMESTAMP`
        })
        .where(eq(dkpAds.id, campaignId))
    }

    return { success: true, status: 'Tracked' }
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Errore tracking Ads: ' + err.message
    })
  }
})