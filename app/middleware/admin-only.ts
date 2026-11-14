// app/middleware/admin-only.ts
export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return

  const userState = useState<any>('user', () => null)
  const dkpUserState = useState<any>('dkp_user', () => null)

  function parseClientToken(raw: unknown): any | null {
    if (!raw) return null
    if (typeof raw === 'object') return (raw as any).user || raw
    if (typeof raw !== 'string') return null

    const str = raw.trim()
    try {
      const decoded = decodeURIComponent(str)
      if (decoded.startsWith('{')) {
        const parsed = JSON.parse(decoded)
        return parsed?.user || parsed
      }
    } catch {}

    const parts = str.split('.')
    if (parts.length === 3 && parts[1]) {
      try {
        const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
        const parsed = JSON.parse(atob(b64))
        return parsed?.user || parsed
      } catch {}
    }
    return null
  }

  let currentUser = userState.value || dkpUserState.value

  // 1. Controlla tutti i cookie accessibili dal browser
  if (!currentUser) {
    for (const cookieName of ['dkp_session', 'dkp_token', 'auth_token', 'token']) {
      const c = useCookie<any>(cookieName)
      currentUser = parseClientToken(c.value)
      if (currentUser) break
    }
  }

  // 2. Controlla localStorage
  if (!currentUser && typeof localStorage !== 'undefined') {
    for (const key of ['dkp_user', 'user', 'dkp_auth', 'auth_user']) {
      try {
        const raw = localStorage.getItem(key)
        currentUser = parseClientToken(raw)
        if (currentUser) break
      } catch {}
    }
  }

  // 3. Verifica sessione HTTP-Only lato server
  if (!currentUser) {
    const res: any = await $fetch('/api/auth/me', { credentials: 'include' }).catch(() => null)
      || await $fetch('/api/me', { credentials: 'include' }).catch(() => null)
    currentUser = res?.user || res?.data?.user || null
  }

  if (currentUser && typeof currentUser === 'object') {
    userState.value = currentUser
    dkpUserState.value = currentUser
  }

  const username = String(currentUser?.username || '').toLowerCase()
  const email = String(currentUser?.email || '').toLowerCase()
  const role = String(currentUser?.role || '').toUpperCase()

  const isAdmin =
    Boolean(currentUser) &&
    (
      username === 'alexdpl' ||
      email.endsWith('@devkernelpulse.org') ||
      role === 'ADMIN' ||
      role === 'SUPERADMIN' ||
      currentUser?.isAdmin === true ||
      currentUser?.is_admin === true
    )

  if (!isAdmin && to.path.startsWith('/admin')) {
    return navigateTo('/')
  }
})