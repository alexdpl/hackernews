// app/middleware/admin-only.ts
export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return

  const userState = useState<any>('user', () => null)
  const dkpUserState = useState<any>('dkp_user', () => null)

  let currentUser = userState.value || dkpUserState.value

  // 1. Controlla localStorage
  if (!currentUser && typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem('dkp_user') || localStorage.getItem('user')
      if (raw) {
        currentUser = JSON.parse(raw)
      }
    } catch {
      // Ignora errori JSON
    }
  }

  // 2. Se ancora non idratato, verifica la sessione cookie HTTP-Only lato server
  if (!currentUser) {
    try {
      const sessionRes: any = await $fetch('/api/auth/me').catch(() => null)
      if (sessionRes?.user) {
        currentUser = sessionRes.user
      } else if (sessionRes?.data?.user) {
        currentUser = sessionRes.data.user
      }
    } catch {
      // Nessuna sessione attiva
    }
  }

  if (currentUser) {
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
      currentUser?.isAdmin === true
    )

  if (!isAdmin && to.path.startsWith('/admin')) {
    return navigateTo('/')
  }
})
