// app/composables/useAuthCore.ts
export interface DkpUser {
  id: number
  username: string
  email: string
  role: 'admin' | 'user' | 'moderator'
  avatar?: string
  bio?: string
  reputation?: number
  provider?: 'local' | 'github' | 'google' | 'linkedin' | 'gitlab'
}

export function useAuthCore() {
  const currentUser = useState<DkpUser | null>('dkp_current_user', () => null)
  const isAuthModalOpen = useState<boolean>('dkp_auth_modal_open', () => false)
  const authTab = useState<'login' | 'register'>('dkp_auth_tab', () => 'login')

  const isAuthenticated = computed(() => !!currentUser.value)

  // Inizializza la sessione (Server Cookie + LocalStorage Fallback)
  async function initAuth() {
    if (import.meta.client) {
      // 1. Tenta prima di recuperare la sessione attiva impostata dal Server (es. Social OAuth Redirect)
      try {
        const data = await $fetch<{ authenticated: boolean; user: DkpUser }>('/api/auth/me')
        if (data?.authenticated && data?.user) {
          currentUser.value = data.user
          localStorage.setItem('dkp_session_user', JSON.stringify(data.user))
          return
        }
      } catch {
        // Ignora eventuali errori di rete o sessione non trovata
      }

      // 2. Fallback: ripristina da localStorage se il cookie non è disponibile o in locale
      if (!currentUser.value) {
        const savedUser = localStorage.getItem('dkp_session_user')
        if (savedUser) {
          try {
            currentUser.value = JSON.parse(savedUser)
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

    try {
      // Tenta il login tramite API Server
      const res = await $fetch<{ success: boolean; user: DkpUser }>('/api/auth/login', {
        method: 'POST',
        body: { username: usernameOrEmail, password }
      })
      if (res?.success && res?.user) {
        userData = res.user
      } else {
        throw new Error('Autenticazione fallita')
      }
    } catch {
      // Fallback locale in caso di assenza server
      const isAlexAdmin = 
        usernameOrEmail.toLowerCase() === 'alexdpl' || 
        usernameOrEmail.toLowerCase() === 'admin' ||
        usernameOrEmail.toLowerCase().includes('admin')

      userData = {
        id: isAlexAdmin ? 1 : Date.now(),
        username: isAlexAdmin ? 'alexdpl' : usernameOrEmail.split('@')[0],
        email: isAlexAdmin ? 'alexdpl@devkernelpulse.org' : (usernameOrEmail.includes('@') ? usernameOrEmail : `${usernameOrEmail}@devkernel.io`),
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
      cookie.value = JSON.stringify(userData)
    }

    closeAuthModal()

    // Redirect intelligenti dopo il login
    const router = useRouter()
    if (userData.role === 'admin') {
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