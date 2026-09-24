// server/api/auth/me.ts
export default defineEventHandler((event) => {
  const sessionCookie = getCookie(event, 'dkp_session')

  if (!sessionCookie) {
    return { authenticated: false, role: 'guest' }
  }

  try {
    const parsed = JSON.parse(sessionCookie)
    return {
      authenticated: true,
      username: parsed.username,
      role: parsed.role
    }
  } catch (e) {
    return { authenticated: false, role: 'guest' }
  }
})