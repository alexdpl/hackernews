// server/api/auth/login.post.ts
export default defineEventHandler(async (event) => {
  let body: Record<string, any> | null = null

  // Lettura sicura del Body con Fallback anti-crash per h3/Nitro
  try {
    body = await readBody(event)
  } catch (err) {
    const rawBody = await readRawBody(event, 'utf-8')
    if (rawBody) {
      try {
        body = JSON.parse(rawBody)
      } catch (_) {
        body = {}
      }
    }
  }

  const { username, password } = body || {}

  const expectedAdminPass = process.env.ADMIN_PASSWORD || process.env.DKP_ADMIN_SECRET || 'alexdpl2026'
  const normalizedUsername = (username || '').trim().toLowerCase()

  // 1. VERIFICA ADMIN (@alexdpl)
  if (normalizedUsername === 'alexdpl' && password === expectedAdminPass) {
    return {
      success: true,
      user: {
        username: 'alexdpl',
        role: 'admin',
        avatar: 'https://github.com/alexdpl.png'
      }
    }
  }

  // 2. VERIFICA UTENTE STANDARD DEMO
  if (username && password) {
    return {
      success: true,
      user: {
        username: normalizedUsername,
        role: 'user',
        avatar: ''
      }
    }
  }

  throw createError({
    statusCode: 400,
    statusMessage: 'Credenziali non valide o parametri mancanti'
  })
})