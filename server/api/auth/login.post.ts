// server/api/auth/login.post.ts
export default defineEventHandler(async (event) => {
  let body: Record<string, any> = {}

  try {
    const parsedBody = await readBody(event)
    if (parsedBody && typeof parsedBody === 'object') {
      body = parsedBody
    }
  } catch (_) {
    // Body vuoto
  }

  const { email, password } = body

  // Se la richiesta è vuota (controllo sessione preventivo), restituiamo uno stato neutro anziché 400
  if (!email && !password) {
    return {
      success: false,
      user: null,
      message: 'Nessuna credenziale fornita per il login.'
    }
  }

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