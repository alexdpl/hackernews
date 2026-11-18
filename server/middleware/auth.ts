// server/middleware/auth.ts
import { defineEventHandler, getRequestPath, getHeader, getQuery, createError } from 'h3'
import { extractDkpUserFromEvent } from '~~/server/utils/session'

export default defineEventHandler((event) => {
  // Popola sempre event.context.user se presente un cookie dkp_session o Bearer JWT valido
  const sessionUser = extractDkpUserFromEvent(event)
  if (sessionUser) {
    event.context.user = sessionUser
  }

  const path = getRequestPath(event)

  // 1. Ignora pagine frontend e asset statici
  if (!path.startsWith('/api/')) {
    return
  }

  // 2. Rotte gestite da sessione utente, OAuth, Admin Auth, AI Gateway (/api/v1, /api/ai) o pubbliche
  const selfAuthenticatedPrefixes = [
    '/api/auth/',
    '/api/nodes/',
    '/api/admin/',
    '/api/user/',
    '/api/ai/',
    '/api/v1/',
    '/api/news',
    '/api/public/',
    '/api/blog/',
    '/api/mail/',
    '/api/newsletter/',
    '/api/vault/',
    '/api/shop/'
  ]

  if (selfAuthenticatedPrefixes.some(prefix => path === prefix || path.startsWith(prefix))) {
    return
  }

  // 3. Rotte Cron (/api/cron/*) - Autenticazione tramite CRON_SECRET
  if (path.startsWith('/api/cron/')) {
    const cronSecret = String(process.env.CRON_SECRET || '').trim()
    const authHeader = getHeader(event, 'authorization') || ''
    const customHeader = getHeader(event, 'x-cron-secret') || ''
    const tokenProvided = customHeader.trim() || authHeader.replace(/^Bearer\s+/i, '').trim()

    if (!cronSecret || tokenProvided !== cronSecret) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Non Autorizzato: CRON_SECRET errato o mancante.'
      })
    }
    return
  }

  // 4. Eventuali altre rotte legacy protette da API_KEY statica (bypassate se utente loggato)
  if (sessionUser) return

  const apiKey = getHeader(event, 'x-api-key') || getQuery(event).apiKey
  const validApiKey = process.env.API_KEY

  if (validApiKey && apiKey !== validApiKey) {
    throw createError({
      statusCode: 401,
      statusMessage: 'API Key non valida o revocata.'
    })
  }
})