// server/api/auth/me.get.ts
export default defineEventHandler((event) => {
  // 🛡️ Fallback Sicuro: Leggiamo i cookie direttamente dall'oggetto nativo Node.js 
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

  if (!sessionCookie) {
    return { authenticated: false, user: null }
  }

  try {
    const user = typeof sessionCookie === 'string' && sessionCookie.startsWith('{') 
      ? JSON.parse(sessionCookie) 
      : sessionCookie

    return { authenticated: true, user }
  } catch (err) {
    return { authenticated: false, user: null }
  }
})