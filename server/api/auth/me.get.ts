// server/api/auth/me.get.ts
export default defineEventHandler((event) => {
  const sessionCookie = getCookie(event, 'dkp_session')

  if (!sessionCookie) {
    return { authenticated: false, user: null }
  }

  try {
    const user = typeof sessionCookie === 'string' ? JSON.parse(sessionCookie) : sessionCookie
    return { authenticated: true, user }
  } catch {
    return { authenticated: false, user: null }
  }
})