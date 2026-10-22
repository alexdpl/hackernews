// server/api/v2.5/ads/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { getDb } from '~~/server/utils/db'
import { sql } from 'drizzle-orm'
import { dkpAds } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { title, snippet, targetUrl, advertiserEmail, budgetCredits } = body

  if (!title || !targetUrl || !advertiserEmail) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Campi obbligatori mancanti (title, targetUrl, advertiserEmail).'
    })
  }

  try {
    // 🟢 Inizializziamo correttamente l'istanza del database
    const db = getDb()

    // Inserimento reale nel database tramite Drizzle ORM
    const [newAd] = await db.insert(dkpAds).values({
      advertiserEmail,
      title,
      snippet: snippet || '',
      targetUrl,
      budgetCredits: budgetCredits || 100,
      status: 'ACTIVE'
    }).returning({ id: dkpAds.id, status: dkpAds.status })

    return {
      success: true,
      message: 'Campagna DKP Ads registrata con successo su Neon DB.',
      campaignId: newAd.id,
      status: newAd.status
    }
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Errore durante il salvataggio della campagna su Neon DB: ' + err.message
    })
  }
})