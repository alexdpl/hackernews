// app/middleware/admin-only.ts
export default defineNuxtRouteMiddleware(async (to) => {
  const { currentUser, isAuthenticated, initAuth } = useAuthCore()

  if (import.meta.client && !currentUser.value) {
    await initAuth()
  }

  const isAdmin = 
    isAuthenticated.value && 
    (currentUser.value?.role === 'admin' || currentUser.value?.username?.toLowerCase() === 'alexdpl')

  if (!isAdmin) {
    return navigateTo('/')
  }
})