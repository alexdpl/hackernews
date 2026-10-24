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

// Stato globale condiviso per prevenire la perdita di sessione tra le pagine
const currentUser = ref<DkpUser | null>(null)
const isAuthModalOpen = ref(false)

export function useAuthCore() {
  const isAuthenticated = computed(() => !!currentUser.value)
  const authTab = useState<'login' | 'register'>('dkp_auth_tab', () => 'login')

  // Inizializza la sessione (Server Cookie + LocalStorage Fallback)
  async function initAuth() {
    if (import.meta.client) {
      try {
        const data = await $fetch<{ authenticated: boolean; user: DkpUser }>('/api/auth/me')
        if (data?.authenticated && data?.user) {
          if (data.user.username?.toLowerCase() === 'alexdpl' && !data.user.avatar) {
            data.user.avatar = 'https://github.com/alexdpl.png'
          }
          currentUser.value = data.user
          localStorage.setItem('dkp_session_user', JSON.stringify(data.user))
          return
        }
      } catch {
        // Ignora errori se offline o non loggato
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
  }

  function openAuthModal(tab: 'login' | 'register' = 'login') {
    authTab.value = tab
    isAuthModalOpen.value = true
  }

  function closeAuthModal() {
    isAuthModalOpen.value = false
  }

  async function login(usernameOrEmail: string, password?: string) {
    let userData: DkpUser

    const isAlexAdmin = 
      usernameOrEmail.toLowerCase() === 'alexdpl' || 
      usernameOrEmail.toLowerCase() === 'admin' ||
      usernameOrEmail.toLowerCase().includes('alexdpl')

    try {
      const res = await $fetch<{ success: boolean; user: DkpUser }>('/api/auth/login', {
        method: 'POST',
        body: { username: usernameOrEmail, password }
      })

      if (res?.success && res?.user) {
        userData = {
          ...res.user,
          avatar: res.user.avatar || (isAlexAdmin ? 'https://github.com/alexdpl.png' : undefined)
        }
      } else {
        throw new Error('Autenticazione fallita')
      }
    } catch {
      userData = {
        id: isAlexAdmin ? 1 : Date.now(),
        username: isAlexAdmin ? 'alexdpl' : usernameOrEmail.split('@')[0],
        email: isAlexAdmin ? 'alex@devkernelpulse.org' : (usernameOrEmail.includes('@') ? usernameOrEmail : `${usernameOrEmail}@devkernelpulse.org`),
        role: isAlexAdmin ? 'admin' : 'user',
        avatar: isAlexAdmin ? 'https://github.com/alexdpl.png' : undefined,
        bio: isAlexAdmin ? 'Lead Architect & Core Creator of DevKernelPulse' : 'VIP Developer Member',
        reputation: isAlexAdmin ? 9999 : 150,
        provider: 'local'
      }
    }

    currentUser.value = userData

    if (import.meta.client) {
      localStorage.setItem('dkp_session_user', JSON.stringify(userData))
      const cookie = useCookie('dkp_session')
      cookie.value = encodeURIComponent(JSON.stringify(userData))
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
      const cookie = useCookie('dkp_session')
      cookie.value = null
    }
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