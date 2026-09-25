// server/api/me.ts
export default defineEventHandler((event) => {
  // 🛡️ Leggiamo i cookie in modo sicuro nativo
  const rawCookies = event.node?.req?.headers?.cookie || ''
  let sessionCookie: string | null = null
  
  if (rawCookies) {
    // Estrazione pulita del cookie
    const match = rawCookies.match(/(?:^|;\s*)dkp_session=([^;]*)/)
    if (match && match[1]) {
      try {
        sessionCookie = decodeURIComponent(match[1])
      } catch (e) {
        sessionCookie = match[1]
      }
    }
  }

  // Se non c'è sessione
  if (!sessionCookie) {
    return { 
      success: false, 
      authenticated: false, 
      user: null 
    }
  }

  // Se c'è sessione, parsiamo i dati dell'utente
  try {
    const user = typeof sessionCookie === 'string' && sessionCookie.startsWith('{') 
      ? JSON.parse(sessionCookie) 
      : sessionCookie

    return { 
      success: true, 
      authenticated: true, 
      user 
    }
  } catch (err) {
    return { 
      success: false, 
      authenticated: false, 
      user: null 
    }
  }
})