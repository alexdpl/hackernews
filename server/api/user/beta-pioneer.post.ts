// server/api/user/beta-pioneer.post.ts
import { defineEventHandler, createError, readBody } from 'h3'
import { eq, sql } from 'drizzle-orm'
import { getDb } from '~~/server/utils/db'
import { users, dkpCrawlerLicenses } from '~~/drizzle/schema'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const userId = body?.userId ? Number(body.userId) : 1 // Fallback utente di test o sessione

    const db = await getDb()

    // 1. Recupera l'utente corrente
    const [userRecord] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!userRecord) {
      throw createError({ statusCode: 404, statusMessage: 'Utente non trovato nel database.' })
    }

    // 2. Verifica se ha già il badge "Early Pioneer" nei badges JSON
    const currentBadges = Array.isArray(userRecord.badges) ? userRecord.badges : []
    if (currentBadges.includes('Early Pioneer')) {
      return {
        success: true,
        alreadyRegistered: true,
        message: 'Sei già registrato ufficialmente nel Developer Beta Program!'
      }
    }

    // 3. Aggiunge il badge e assegna un bonus XP (+500 XP per i pionieri)
    const updatedBadges = [...currentBadges, 'Early Pioneer', 'Core Developer']
    const newXp = (userRecord.xp || 0) + 500

    await db.update(users)
      .set({
        badges: updatedBadges,
        xp: newXp
      })
      .where(eq(users.id, userId))

    // 4. Aggiunge o potenzia il bonus di chiamate API gratuite (+5000 richieste mensili)
    const [existingLicense] = await db
      .select()
      .from(dkpCrawlerLicenses)
      .where(eq(dkpCrawlerLicenses.userId, userId))
      .limit(1)

    if (existingLicense) {
      // Potenzia la licenza esistente aggiungendo 5000 chiamate
      await db.update(dkpCrawlerLicenses)
        .set({ requestsLimit: (existingLicense.requestsLimit || 1000) + 5000 })
        .where(eq(dkpCrawlerLicenses.id, existingLicense.id))
    } else {
      // Crea una nuova licenza omaggio per il pioniere
      await db.insert(dkpCrawlerLicenses).values({
        userId,
        licenseKey: `dkp_pioneer_${Math.random().toString(36).substring(2, 12)}`,
        tier: 'Early Pioneer Beta',
        requestsLimit: 6000,
        requestsUsed: 0,
        isActive: true
      })
    }

    return {
      success: true,
      message: '🎉 Attivazione completata! Badge "Early Pioneer" sbloccato e +5.000 chiamate API aggiunte.',
      xpAdded: 500
    }

  } catch (err: any) {
    console.error('[BETA PIONEER ERROR]:', err)
    throw createError({ statusCode: 500, statusMessage: `Errore durante l'iscrizione al Beta Program: ${err.message}` })
  }
})