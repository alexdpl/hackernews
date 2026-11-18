// app/composables/useAuthCore.ts
import { ref, computed, useState, useCookie, useRouter } from '#imports'

export interface DkpUser {
  id: number
  username: string
  email: string
  role: 'admin' | 'user' | 'moderator'
  avatar?: string
  bio?: string
  reputation?: number
  provider?: 'local' | 'github' | 'google' | 'linkedin' | 'gitlab' | 'discord' | 'bitbucket'
}

const currentUser = ref<DkpUser | null>(null)
const isAuthModalOpen = ref(false)

export function getDkpAuthToken(): string {
  if (import.meta.client) {
    const lsToken = localStorage.getItem('dkp_auth_token')
    if (lsToken) return lsToken
  }
  const tokenCookie = useCookie<string | null>('dkp_token')
  return tokenCookie.value || ''
}

export function useAuthCore() {
  const isAuthenticated = computed(() => !!currentUser.value)
  const authTab = useState<'login' | 'register'>('dkp_auth_tab', () => 'login')

  async function initAuth() {
    if (!import.meta.client) return

    const token = getDkpAuthToken()
    try {
      const data = await $fetch<{ authenticated: boolean; user: DkpUser | null }>('/api/auth/me', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })

      if (data?.authenticated && data?.user) {
        if (data.user.username?.toLowerCase() === 'alexdpl' && !data.user.avatar) {
          data.user.avatar = 'https://github.com/alexdpl.png'
        }
        currentUser.value = data.user
        localStorage.setItem('dkp_session_user', JSON.stringify(data.user))
        return
      }

      if (data && data.authenticated === false) {
        currentUser.value = null
        localStorage.removeItem('dkp_session_user')
        localStorage.removeItem('dkp_auth_token')
        const tokenCookie = useCookie<string | null>('dkp_token')
        tokenCookie.value = null
        return
      }
    } catch {
      // Fallback offline su cache locale solo in caso di errore di rete
    }

    if (!currentUser.value) {
      const savedUser = localStorage.getItem('dkp_session_user')
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser)
          if (parsed.username?.toLowerCase() === 'alexdpl' && !parsed.avatar) {
            parsed.avatar = 'https://github.com/alexdpl.png'
          }
          currentUser.value = parsed
        } catch {
          localStorage.removeItem('dkp_session_user')
        }
      }
    }
  }

  function openAuthModal(tab: 'login' | 'register' = 'login') {
    authTab.value = tab
    isAuthModalOpen.value = true
  }

  function closeAuthModal() {
    isAuthModalOpen.value = false
  }

  async function login(usernameOrEmail: string, password?: string) {
    const isAlexAdmin =
      usernameOrEmail.toLowerCase() === 'alexdpl' ||
      usernameOrEmail.toLowerCase() === 'admin' ||
      usernameOrEmail.toLowerCase().includes('alexdpl')

    const res = await $fetch<{ success: boolean; user: DkpUser; token?: string }>('/api/auth/login', {
      method: 'POST',
      body: { username: usernameOrEmail, password }
    })

    if (!res?.success || !res?.user) {
      throw new Error('Autenticazione fallita')
    }

    const userData: DkpUser = {
      ...res.user,
      avatar: res.user.avatar || (isAlexAdmin ? 'https://github.com/alexdpl.png' : undefined)
    }

    currentUser.value = userData

    if (import.meta.client) {
      localStorage.setItem('dkp_session_user', JSON.stringify(userData))
      if (res.token) {
        localStorage.setItem('dkp_auth_token', res.token)
        const tokenCookie = useCookie<string | null>('dkp_token', {
          path: '/',
          maxAge: 60 * 60 * 24 * 7,
          sameSite: 'lax'
        })
        tokenCookie.value = res.token
      }
    }

    closeAuthModal()

    const router = useRouter()
    if (userData.role === 'admin' || userData.username === 'alexdpl') {
      await router.push('/admin')
    } else {
      await router.push('/user/dashboard')
    }

    return userData
  }

  async function register(username: string, email: string, password?: string) {
    return await login(username || email, password)
  }

  async function logout() {
    currentUser.value = null
    if (import.meta.client) {
      localStorage.removeItem('dkp_session_user')
      localStorage.removeItem('dkp_auth_token')
      const tokenCookie = useCookie<string | null>('dkp_token', { path: '/' })
      tokenCookie.value = null
    }
    await $fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    const router = useRouter()
    await router.push('/')
  }

  return {
    currentUser,
    isAuthenticated,
    isAuthModalOpen,
    authTab,
    initAuth,
    openAuthModal,
    closeAuthModal,
    login,
    register,
    logout
  }
}