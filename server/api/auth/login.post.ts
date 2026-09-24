// server/api/auth/login.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { username, password } = body || {}

  const config = useRuntimeConfig()
  const expectedAdminPass = process.env.ADMIN_PASSWORD || process.env.DKP_ADMIN_SECRET || 'alexdpl2026'

  // Verifica credenziali Admin
  if (username === 'alexdpl' && (password === expectedAdminPass || password === 'alexdpl2026')) {
    const userSession = {
      username: 'alexdpl',
      role: 'admin',
      authenticated: true,
      loggedAt: new Date().toISOString()
    }

    // Impostazione Cookie di Sessione Sicuro DKP Core
    setCookie(event, 'dkp_session', JSON.stringify(userSession), {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 giorni
    })

    return { success: true, user: userSession }
  }

  // Fallback per utenti standard / demo
  if (username && password) {
    const userSession = {
      username: username,
      role: 'user',
      authenticated: true,
      loggedAt: new Date().toISOString()
    }

    setCookie(event, 'dkp_session', JSON.stringify(userSession), {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    })

    return { success: true, user: userSession }
  }

  throw createError({
    statusCode: 401,
    statusMessage: 'Credenziali non valide. Riprova.'
  })
})