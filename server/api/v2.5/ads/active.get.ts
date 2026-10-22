// server/api/v2.5/ads/active.get.ts
import { defineEventHandler, getQuery, createError } from 'h3'
import { getDb } from '~~/server/utils/db'
import { dkpAds } from '~~/server/db/schema'
import { eq, and, gt, sql, ilike, or } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const tag = (query.tag as string) || ''
    
    // Assicurati che sia await se la tua utility lo richiede nella v2.5
    const db = await getDb() 
    
    let baseConditions = and(
      eq(dkpAds.status, 'ACTIVE'), // Attenzione: controlla che nel DB siano salvati in maiuscolo (o usa 'active' minuscolo se serve)
      gt(dkpAds.budgetCredits, 0)
    )

    let searchConditions = baseConditions

    // Se la pagina passa un tag (es. dalla sezione Ask o Show), applichiamo lo Smart Match
    if (tag) {
      searchConditions = and(
        baseConditions,
        or(
          ilike(dkpAds.categoryTag, `%${tag}%`),
          ilike(dkpAds.title, `%${tag}%`)
        )
      )
    }

    // 1. Tenta di pescare 3 annunci contestuali
    let activeAds = await db.select({
      id: dkpAds.id,
      title: dkpAds.title,
      snippet: dkpAds.snippet,
      url: dkpAds.targetUrl,
      tag: dkpAds.categoryTag,
      provider: dkpAds.advertiserEmail
    })
    .from(dkpAds)
    .where(searchConditions)
    .orderBy(sql`RANDOM()`)
    .limit(3)

    // 2. Fallback: Se non c'è match col tag, pesca 3 annunci attivi casuali per non lasciare spazi vuoti
    if (activeAds.length === 0 && tag) {
      activeAds = await db.select({
        id: dkpAds.id,
        title: dkpAds.title,
        snippet: dkpAds.snippet,
        url: dkpAds.targetUrl,
        tag: dkpAds.categoryTag,
        provider: dkpAds.advertiserEmail
      })
      .from(dkpAds)
      .where(baseConditions)
      .orderBy(sql`RANDOM()`)
      .limit(3)
    }

    return {
      success: true,
      ads: activeAds // il frontend DkpAdStrip leggerà da qui
    }
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Errore nel recupero campagne Smart DKP Ads: ' + err.message
    })
  }
})