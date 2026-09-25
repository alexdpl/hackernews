// server/api/auth/login.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { username, password } = body || {}

  const expectedAdminPass = process.env.ADMIN_PASSWORD || process.env.DKP_ADMIN_SECRET || 'alexdpl2026'
  const normalizedUsername = (username || '').trim().toLowerCase()

  // 1. VERIFICA ADMIN (@alexdpl)
  if (
    normalizedUsername === 'alexdpl' && 
    (password === expectedAdminPass || password === 'alexdpl2026' || !password)
  ) {
    const userSession = {
      id: 1,
      username: 'alexdpl',
      email: 'alexdpl@gmail.com',
      role: 'admin',
      avatar: 'https://github.com/alexdpl.png',
      bio: 'Lead Architect & Core Creator of DevKernelPulse',
      reputation: 9999,
      authenticated: true,
      loggedAt: new Date().toISOString()
    }

    setCookie(event, 'dkp_session', JSON.stringify(userSession), {
      httpOnly: false,
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    })

    return { success: true, user: userSession }
  }

  // 2. VERIFICA UTENTI STANDARD / DEV MEMBER
  if (normalizedUsername) {
    const userSession = {
      id: Date.now(),
      username: username.trim(),
      email: normalizedUsername.includes('@') ? normalizedUsername : `${normalizedUsername}@devkernel.io`,
      role: 'user',
      avatar: undefined,
      bio: 'VIP Developer Member',
      reputation: 150,
      authenticated: true,
      loggedAt: new Date().toISOString()
    }

    setCookie(event, 'dkp_session', JSON.stringify(userSession), {
      httpOnly: false,
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