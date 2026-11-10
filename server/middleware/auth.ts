// server/middleware/auth.ts
export default defineEventHandler((event) => {
  const path = getRequestPath(event)

  // 1. Ignora le risorse statiche e le pagine frontend (non API)
  if (!path.startsWith('/api/')) {
    return
  }

  // 2. Rotte API pubbliche (servite da cache o ad accesso libero)
  if (path === '/api/news' || path.startsWith('/api/public/')) {
    return
  }

  // 3. Rotte Cron (/api/cron/*) - Autenticazione tramite CRON_SECRET
  if (path.startsWith('/api/cron/')) {
    const cronSecret = process.env.CRON_SECRET
    const authHeader = getHeader(event, 'authorization')
    const customHeader = getHeader(event, 'x-cron-secret')

    const tokenProvided = customHeader || (authHeader ? authHeader.replace(/^Bearer\s+/i, '') : null)

    if (!cronSecret || tokenProvided !== cronSecret) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Non Autorizzato: CRON_SECRET errato o mancante.'
      })
    }

    // Token CRON valido! Consenti il passaggio verso l'endpoint /api/cron/fetch-news
    return
  }

  // 4. Tutte le altre rotte API (/api/*) richiedono API Key classica
  const apiKey = getHeader(event, 'x-api-key') || getQuery(event).apiKey
  const validApiKey = process.env.API_KEY

  if (validApiKey && apiKey !== validApiKey) {
    throw createError({
      statusCode: 401,
      statusMessage: 'API Key non valida o revocata.'
    })
  }
})