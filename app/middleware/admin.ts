// app/middleware/admin.ts
export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  const userState = useState<any>('user', () => null)
  const dkpUserState = useState<any>('dkp_user', () => null)

  let currentUser = userState.value || dkpUserState.value

  if (!currentUser && typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem('dkp_user') || localStorage.getItem('user')
      if (raw) {
        currentUser = JSON.parse(raw)
        userState.value = currentUser
      }
    } catch {
      // Ignora errori di parsing JSON
    }
  }

  const username = String(currentUser?.username || '').toLowerCase()
  const role = String(currentUser?.role || '').toUpperCase()
  const isAdmin =
    Boolean(currentUser) &&
    (username === 'alexdpl' || role === 'ADMIN' || role === 'SUPERADMIN' || currentUser?.isAdmin === true)

  if (!isAdmin && to.path.startsWith('/admin')) {
    return navigateTo('/')
  }
})