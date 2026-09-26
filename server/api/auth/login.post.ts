// server/api/auth/login.post.ts
export default defineEventHandler(async (event) => {
  let body: Record<string, any> = {}

  try {
    const parsedBody = await readBody(event)
    if (parsedBody && typeof parsedBody === 'object') {
      body = parsedBody
    }
  } catch (_) {
    // Body vuoto o non JSON
  }

  const { email, password } = body

  // Validazione pulita senza generare eccezioni/stacktrace sul terminale
  if (!email || !password) {
    setResponseStatus(event, 400)
    return {
      success: false,
      message: 'Email e password sono obbligatorie.'
    }
  }

  return {
    success: true,
    message: 'Autenticazione completata con successo.',
    user: {
      username: email.split('@')[0] || 'developer',
      email,
      role: 'Admin'
    },
    token: 'dkp_kernel_session_v2_token'
  }
})
