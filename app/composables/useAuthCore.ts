// app/composables/useAuthCore.ts
import { useState } from '#imports'

export interface DKPUser {
  id: number | string
  username: string
  email?: string
  role: 'admin' | 'user'
  avatar?: string
  provider: 'local' | 'github' | 'google' | 'linkedin' | 'gitlab'
}

export function useAuthCore() {
  const currentUser = useState<DKPUser | null>('dkp_auth_current_user', () => null)
  const isAuthenticated = useState<boolean>('dkp_auth_is_authenticated', () => false)

  // Controllo admin blindato e centralizzato
  const isAdmin = computed(() => {
    if (!isAuthenticated.value || !currentUser.value) return false
    return currentUser.value.username === 'alexdpl' || currentUser.value.role === 'admin'
  })

  // Sincronizzazione con l'API sicura di backend (senza cache SSR)
  const fetchSession = async () => {
    try {
      const data = await $fetch('/api/auth/me', {
        key: 'dkp-auth-core-session',
        getCachedData: () => null
      }) as any
      
      if (data && data.authenticated) {
        currentUser.value = {
          id: data.id || 1,
          username: data.username || 'alexdpl',
          role: data.role || 'user',
          provider: data.provider || 'local'
        }
        isAuthenticated.value = true
      } else {
        currentUser.value = null
        isAuthenticated.value = false
      }
    } catch (e) {
      currentUser.value = null
      isAuthenticated.value = false
    }
  }

  const logout = async () => {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
      currentUser.value = null
      isAuthenticated.value = false
      navigateTo('/')
    } catch (e) {
      console.error('Errore durante il logout:', e)
    }
  }

  return {
    currentUser,
    isAuthenticated,
    isAdmin,
    fetchSession,
    logout
  }
}