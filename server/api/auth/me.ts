// server/api/me.ts
import { defineEventHandler } from 'h3'

export default defineEventHandler((event) => {
  // 🛡️ Leggiamo i cookie in modo nativo
  const rawCookies = event.node?.req?.headers?.cookie || ''
  let sessionCookie: string | null = null
  
  if (rawCookies) {
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

  // Parsiamo i dati in modo sicuro
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