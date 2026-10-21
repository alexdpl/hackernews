// server/api/v2.5/ads/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { title, targetUrl, advertiserEmail, budgetCredits } = body

  if (!title || !targetUrl || !advertiserEmail) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Campi obbligatori mancanti per la campagna DKP Ads.'
    })
  }

  // Corretto l'errore di sintassi della stringa random
  const campaignId = 'dkp-ad-' + Math.random().toString(36).substring(2, 9)

  return {
    success: true,
    message: 'Campagna DKP Ads creata con successo e in attesa di approvazione Vault.',
    campaignId,
    status: 'ACTIVE'
  }
})