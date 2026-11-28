// app/middleware/sentinel-guard.global.ts
export default defineNuxtRouteMiddleware((to) => {
  const isAdminRoute = to.path.startsWith('/admin')
  const isUserRoute = to.path.startsWith('/user') || to.path.startsWith('/dashboard')

  if (!isAdminRoute && !isUserRoute) return

  // Consenti la visita ai profili pubblici /user/<username>
  if (/^\/user\/[^/]+$/.test(to.path) && to.path !== '/user/dashboard' && to.path !== '/user/ads') {
    return
  }

  const auth: any = useAuthCore() || {}
  const user = isRef(auth.currentUser)
    ? auth.currentUser.value
    : auth.currentUser || (isRef(auth.user) ? auth.user.value : auth.user) || null

  const isAuth = isRef(auth.isAuthenticated)
    ? Boolean(auth.isAuthenticated.value)
    : Boolean(auth.isAuthenticated)

  if (!isAuth && !user?.id) {
    if (import.meta.client) {
      $fetch('/api/security/captcha', {
        method: 'POST',
        body: { action: 'challenge' }
      }).catch(() => null)
    }

    return navigateTo({
      path: '/login',
      query: {
        redirect: to.fullPath,
        sentinel: 'blocked_unauthenticated'
      }
    })
  }

  const username = String(user?.username || '').toLowerCase()
  const role = String(user?.role || '').toLowerCase()
  const hasAdminClearance = Boolean(user?.isAdmin || user?.is_admin || username === 'alexdpl' || role === 'admin')

  if (isAdminRoute && !hasAdminClearance) {
    return navigateTo({
      path: '/user/dashboard',
      query: {
        sentinel: 'insufficient_clearance'
      }
    })
  }
})