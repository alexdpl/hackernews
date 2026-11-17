<!-- app/pages/login.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

interface OAuthProviderItem {
  id: 'github' | 'google' | 'gitlab' | 'bitbucket' | 'stackoverflow'
  label: string
  className: string
  fullWidth?: boolean
}

const route = useRoute()
const router = useRouter()
const authCore = useAuthCore() as any

useSeoMeta({
  title: 'Accedi o Registrati — DevKernelPulse v2.6',
  description: 'Autenticati nel Kernel DevKernelPulse tramite credenziali sicure o provider OAuth per sviluppatori.',
  robots: 'noindex, nofollow'
})

const authMode = ref<'login' | 'register'>('login')
const identifier = ref('')
const registerUsername = ref('')
const registerEmail = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)

const errorMessage = ref('')
const successMessage = ref('')
const isLoading = ref(false)
const activeOAuthProvider = ref<string | null>(null)

const oauthProviders: OAuthProviderItem[] = [
  { id: 'github', label: 'GitHub', className: 'github-btn' },
  { id: 'google', label: 'Google', className: 'google-btn' },
  { id: 'gitlab', label: 'GitLab', className: 'gitlab-btn' },
  { id: 'bitbucket', label: 'Bitbucket', className: 'bitbucket-btn' },
  { id: 'stackoverflow', label: 'Stack Overflow', className: 'stackoverflow-btn', fullWidth: true }
]

const safeRedirectPath = computed(() => {
  const raw = String(route.query.redirect || '').trim()
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\')) {
    return ''
  }
  return raw
})

function formatProviderName(raw: string): string {
  const map: Record<string, string> = {
    github: 'GitHub',
    google: 'Google',
    gitlab: 'GitLab',
    bitbucket: 'Bitbucket',
    stackoverflow: 'Stack Overflow'
  }
  return map[raw.toLowerCase()] || raw
}

onMounted(() => {
  const errCode = String(route.query.error || '').trim()
  const providerName = formatProviderName(String(route.query.provider || ''))

  if (errCode === 'oauth_not_configured') {
    errorMessage.value = `Le variabili CLIENT_ID / CLIENT_SECRET per ${providerName || 'questo provider'} non sono ancora configurate sul server.`
  } else if (errCode === 'oauth_denied') {
    errorMessage.value = `Autorizzazione annullata su ${providerName || 'provider OAuth'}.`
  } else if (errCode === 'oauth_state_invalid') {
    errorMessage.value = 'Sessione OAuth scaduta o non valida (verifica anti-CSRF). Riprova.'
  } else if (errCode === 'oauth_exchange_failed') {
    errorMessage.value = `Impossibile completare lo scambio token con ${providerName || 'il provider OAuth'}.`
  } else if (errCode === 'db_unavailable') {
    errorMessage.value = 'Database Neon temporaneamente non raggiungibile. Riprova tra qualche istante.'
  }
})

function switchMode(mode: 'login' | 'register') {
  if (isLoading.value) return
  authMode.value = mode
  errorMessage.value = ''
  successMessage.value = ''
  password.value = ''
  confirmPassword.value = ''
}

function syncClientUserState(userPayload: any) {
  if (!userPayload) return
  try {
    if (typeof authCore?.setUser === 'function') {
      authCore.setUser(userPayload)
    } else if (authCore?.user && 'value' in authCore.user) {
      authCore.user.value = userPayload
    }
    const globalUserState = useState<any>('dkp_user', () => null)
    globalUserState.value = userPayload
  } catch {}
}

async function handleSubmit() {
  if (isLoading.value) return
  errorMessage.value = ''
  successMessage.value = ''

  if (authMode.value === 'login') {
    const cleanId = identifier.value.trim()
    if (!cleanId || !password.value) {
      errorMessage.value = 'Inserisci username/email e password.'
      return
    }

    isLoading.value = true
    try {
      const res: any = await $fetch('/api/auth/login', {
        method: 'POST',
        body: {
          username: cleanId,
          email: cleanId,
          password: password.value
        }
      })

      if (!res?.success || !res?.user) {
        errorMessage.value = res?.message || 'Credenziali non valide.'
        return
      }

      syncClientUserState(res.user)
      if (typeof authCore?.fetchUser === 'function') {
        await authCore.fetchUser().catch(() => {})
      }

      const isAdmin = String(res.user.role || '').toLowerCase() === 'admin'
      const destination = safeRedirectPath.value || (isAdmin ? '/admin' : '/user/dashboard')
      await router.push(destination)
    } catch (e: any) {
      errorMessage.value =
        e?.data?.statusMessage ||
        e?.data?.message ||
        'Credenziali non valide o errore di autenticazione.'
    } finally {
      isLoading.value = false
    }
    return
  }

  // Modalità Registrazione (DKP v2.6 Pure SQL)
  const cleanUser = registerUsername.value.trim()
  const cleanEmail = registerEmail.value.trim().toLowerCase()

  if (!/^[a-zA-Z0-9_-]{3,30}$/.test(cleanUser)) {
    errorMessage.value = 'Lo username deve avere tra 3 e 30 caratteri (solo lettere, numeri, _ o -).'
    return
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
    errorMessage.value = 'Inserisci un indirizzo email valido.'
    return
  }

  if (password.value.length < 8 || !/[a-zA-Z]/.test(password.value) || !/[0-9]/.test(password.value)) {
    errorMessage.value = 'La password deve avere almeno 8 caratteri, con almeno una lettera e un numero.'
    return
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Le due password non coincidono.'
    return
  }

  isLoading.value = true
  try {
    const res: any = await $fetch('/api/auth/register', {
      method: 'POST',
      body: {
        username: cleanUser,
        email: cleanEmail,
        password: password.value
      }
    })

    if (!res?.success || !res?.user) {
      errorMessage.value = res?.message || 'Impossibile completare la registrazione.'
      return
    }

    syncClientUserState(res.user)
    if (typeof authCore?.fetchUser === 'function') {
      await authCore.fetchUser().catch(() => {})
    }

    successMessage.value = 'Account creato! Accesso al Kernel in corso...'
    const destination = safeRedirectPath.value || '/user/dashboard'
    await router.push(destination)
  } catch (e: any) {
    errorMessage.value =
      e?.data?.statusMessage ||
      e?.data?.message ||
      'Errore durante la creazione dell\'account.'
  } finally {
    isLoading.value = false
  }
}

function handleSocialLogin(providerId: string) {
  if (isLoading.value) return
  errorMessage.value = ''
  isLoading.value = true
  activeOAuthProvider.value = providerId

  const target = safeRedirectPath.value
    ? `/api/auth/${encodeURIComponent(providerId)}?redirect=${encodeURIComponent(safeRedirectPath.value)}`
    : `/api/auth/${encodeURIComponent(providerId)}`

  window.location.href = target
}
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <!-- Logo Brand & Intestazione Cyber-Dark -->
      <div class="brand-header">
        <span class="dk-badge">DK</span>
        <h1>
          {{ authMode === 'login' ? 'Accedi a' : 'Unisciti a' }}
          <span class="brand-text">DevKernel<span class="pulse-text">Pulse</span></span>
        </h1>
      </div>
      <p class="subtitle">
        {{
          authMode === 'login'
            ? 'Autenticazione firmata HMAC-SHA256 o accesso rapido con i 5 provider developer.'
            : 'Crea il tuo profilo sviluppatore verificato nel Kernel DKP v2.6.'
        }}
      </p>

      <!-- Tab Switcher Accedi / Registrati -->
      <div class="mode-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          :aria-selected="authMode === 'login'"
          :class="['mode-tab', { active: authMode === 'login' }]"
          @click="switchMode('login')"
        >
          🔐 Accedi
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="authMode === 'register'"
          :class="['mode-tab', { active: authMode === 'register' }]"
          @click="switchMode('register')"
        >
          🚀 Registrati
        </button>
      </div>

      <div v-if="errorMessage" class="error-banner" role="alert">
        ⚠️ {{ errorMessage }}
      </div>

      <div v-if="successMessage" class="success-banner" role="status">
        ✅ {{ successMessage }}
      </div>

      <!-- Form Credentials -->
      <form @submit.prevent="handleSubmit" class="login-form" novalidate>
        <template v-if="authMode === 'login'">
          <div class="form-group">
            <label for="identifier">Username o Email</label>
            <input
              id="identifier"
              v-model="identifier"
              type="text"
              autocomplete="username"
              placeholder="es. alexdpl o nome@dominio.dev"
              :disabled="isLoading"
              required
            />
          </div>
        </template>

        <template v-else>
          <div class="form-group">
            <label for="reg-username">Username Sviluppatore</label>
            <input
              id="reg-username"
              v-model="registerUsername"
              type="text"
              autocomplete="username"
              placeholder="es. kernel_hacker (3-30 caratteri)"
              :disabled="isLoading"
              required
            />
          </div>

          <div class="form-group">
            <label for="reg-email">Email</label>
            <input
              id="reg-email"
              v-model="registerEmail"
              type="email"
              autocomplete="email"
              placeholder="tuo@indirizzo.dev"
              :disabled="isLoading"
              required
            />
          </div>
        </template>

        <div class="form-group">
          <label for="password">Password</label>
          <div class="password-wrapper">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              :autocomplete="authMode === 'login' ? 'current-password' : 'new-password'"
              placeholder="••••••••••••••••"
              :disabled="isLoading"
              required
            />
            <button
              type="button"
              class="toggle-pwd-btn"
              :aria-label="showPassword ? 'Nascondi password' : 'Mostra password'"
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? '🙈' : '👁️' }}
            </button>
          </div>
        </div>

        <div v-if="authMode === 'register'" class="form-group">
          <label for="confirm-password">Conferma Password</label>
          <input
            id="confirm-password"
            v-model="confirmPassword"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="new-password"
            placeholder="Ripeti la password"
            :disabled="isLoading"
            required
          />
        </div>

        <button type="submit" class="submit-btn" :disabled="isLoading">
          <span v-if="isLoading && !activeOAuthProvider">⚡ Verifica crittografica in corso...</span>
          <span v-else-if="authMode === 'login'">Entra nell'Ecosistema DKP</span>
          <span v-else>Crea Account Sviluppatore</span>
        </button>
      </form>

      <!-- Divisore Sezione Social -->
      <div class="divider">
        <span>OPPURE CONTINUA CON OAUTH 2.0</span>
      </div>

      <!-- Griglia 5 Provider OAuth Attivi -->
      <div class="social-grid">
        <button
          v-for="prov in oauthProviders"
          :key="prov.id"
          type="button"
          :disabled="isLoading"
          :class="['social-btn', prov.className, { 'full-span': prov.fullWidth }]"
          @click="handleSocialLogin(prov.id)"
        >
          <!-- GitHub SVG -->
          <svg v-if="prov.id === 'github'" class="prov-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.05 11.05 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14 0 1.55-.01 2.79-.01 3.17 0 .31.21.68.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
          </svg>

          <!-- Google SVG -->
          <svg v-else-if="prov.id === 'google'" class="prov-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M21.35 11.1h-9.18v2.98h5.27c-.23 1.24-.92 2.29-1.96 2.99v2.48h3.17c1.86-1.71 2.93-4.23 2.93-7.21 0-.69-.06-1.36-.23-1.24ZM12.17 22c2.65 0 4.88-.88 6.5-2.38l-3.17-2.48c-.88.59-2 .94-3.33.94-2.56 0-4.73-1.73-5.51-4.05H3.39v2.55A9.82 9.82 0 0 0 12.17 22ZM6.66 14.03a5.88 5.88 0 0 1 0-3.76V7.72H3.39a9.82 9.82 0 0 0 0 8.86l3.27-2.55Zm5.51-7.95c1.44 0 2.74.5 3.76 1.47l2.82-2.82C17.04 3.14 14.82 2.3 12.17 2.3a9.82 9.82 0 0 0-8.78 5.42l3.27 2.55c.78-2.32 2.95-4.19 5.51-4.19Z" />
          </svg>

          <!-- GitLab SVG -->
          <svg v-else-if="prov.id === 'gitlab'" class="prov-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="m22.65 14.39-1.27-3.92-2.52-7.75a.65.65 0 0 0-1.24 0l-2.52 7.75H8.9L6.38 2.72a.65.65 0 0 0-1.24 0L2.62 10.47 1.35 14.39a1.3 1.3 0 0 0 .47 1.45L12 23.22l10.18-7.38a1.3 1.3 0 0 0 .47-1.45Z" />
          </svg>

          <!-- Bitbucket SVG -->
          <svg v-else-if="prov.id === 'bitbucket'" class="prov-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M2.65 3C2.3 3 2 3.3 2 3.65c0 .06.01.13.02.19l2.73 16.5c.07.42.43.73.85.73h13.05c.31 0 .59-.22.64-.53L21.98 3.84a.65.65 0 0 0-.53-.75.5.5 0 0 0-.11-.01L2.65 3Zm11.43 11.98H9.94l-1.12-5.84h6.36l-1.1 5.84Z" />
          </svg>

          <!-- Stack Overflow SVG -->
          <svg v-else-if="prov.id === 'stackoverflow'" class="prov-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M18.986 21.865v-6.404h2.134V24H1.844v-8.539h2.13v6.404h15.012zM6.111 19.731H16.85v-2.137H6.111v2.137zm.259-4.852 10.48 2.189.451-2.07-10.478-2.187-.453 2.068zm1.359-5.056 9.705 4.53.903-1.95-9.706-4.53-.902 1.95zm2.715-4.785 8.217 6.855 1.359-1.62-8.216-6.853-1.36 1.618zM15.751 0l-1.746 1.294 6.405 8.604 1.746-1.294L15.751 0z" />
          </svg>

          <span>{{ activeOAuthProvider === prov.id ? 'Connessione...' : prov.label }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(85vh - 70px);
  padding: 2rem 1rem;
  background: #020420;
}

.login-card {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 14px;
  padding: 2.25rem;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7), 0 0 25px rgba(0, 220, 130, 0.08);
  text-align: center;
  color: #f8fafc;
}

.brand-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  margin-bottom: 0.5rem;
}

.dk-badge {
  background: #00dc82;
  color: #020420;
  font-weight: 900;
  font-size: 0.9rem;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
}

.brand-header h1 {
  font-size: 1.5rem;
  font-weight: 800;
  color: #ffffff;
  margin: 0;
}

.pulse-text {
  color: #00dc82;
}

.subtitle {
  color: #94a3b8;
  font-size: 0.86rem;
  margin-bottom: 1.4rem;
  line-height: 1.5;
}

.mode-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  background: #020420;
  border: 1px solid #1e293b;
  padding: 0.3rem;
  border-radius: 10px;
  margin-bottom: 1.35rem;
}

.mode-tab {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-weight: 700;
  font-size: 0.85rem;
  padding: 0.55rem;
  border-radius: 7px;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-tab.active {
  background: #0f172a;
  color: #00dc82;
  box-shadow: 0 0 0 1px rgba(0, 220, 130, 0.35);
}

.error-banner {
  background: rgba(239, 68, 68, 0.14);
  border: 1px solid #ef4444;
  color: #fca5a5;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.84rem;
  margin-bottom: 1.2rem;
  text-align: left;
  line-height: 1.4;
}

.success-banner {
  background: rgba(16, 185, 129, 0.14);
  border: 1px solid #10b981;
  color: #6ee7b7;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.84rem;
  margin-bottom: 1.2rem;
  text-align: left;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.05rem;
  text-align: left;
}

.form-group label {
  display: block;
  font-size: 0.8rem;
  font-weight: 700;
  color: #cbd5e1;
  margin-bottom: 0.35rem;
}

.form-group input {
  width: 100%;
  padding: 0.75rem 0.9rem;
  background: #020420;
  border: 1px solid #1e293b;
  border-radius: 8px;
  font-size: 0.93rem;
  color: #ffffff;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.form-group input:focus {
  border-color: #00dc82;
}

.form-group input:disabled {
  opacity: 0.6;
}

.password-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-wrapper input {
  padding-right: 2.75rem;
}

.toggle-pwd-btn {
  position: absolute;
  right: 0.65rem;
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.2rem;
}

.submit-btn {
  width: 100%;
  background: #00dc82;
  color: #020420;
  font-weight: 800;
  padding: 0.85rem;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  cursor: pointer;
  margin-top: 0.4rem;
  transition: all 0.2s;
}

.submit-btn:hover:not(:disabled) {
  background: #00bf71;
  box-shadow: 0 0 15px rgba(0, 220, 130, 0.3);
}

.submit-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.divider {
  position: relative;
  margin: 1.85rem 0 1.35rem 0;
  text-align: center;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #1e293b;
  z-index: 1;
}

.divider span {
  position: relative;
  z-index: 2;
  background: #090d16;
  padding: 0 0.75rem;
  font-size: 0.72rem;
  font-weight: 800;
  color: #64748b;
  letter-spacing: 0.05em;
}

.social-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.social-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  padding: 0.72rem 0.65rem;
  border-radius: 8px;
  font-size: 0.86rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.social-btn.full-span {
  grid-column: span 2;
}

.social-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.prov-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.github-btn {
  background: #020420;
  color: #00dc82;
  border-color: rgba(0, 220, 130, 0.35);
}
.github-btn:hover:not(:disabled) {
  background: rgba(0, 220, 130, 0.12);
  border-color: #00dc82;
}

.google-btn {
  background: #020420;
  color: #38bdf8;
  border-color: rgba(56, 189, 248, 0.35);
}
.google-btn:hover:not(:disabled) {
  background: rgba(56, 189, 248, 0.12);
  border-color: #38bdf8;
}

.gitlab-btn {
  background: rgba(252, 109, 38, 0.1);
  color: #fc6d26;
  border-color: rgba(252, 109, 38, 0.35);
}
.gitlab-btn:hover:not(:disabled) {
  background: rgba(252, 109, 38, 0.22);
  border-color: #fc6d26;
}

.bitbucket-btn {
  background: rgba(0, 82, 204, 0.12);
  color: #4c9aff;
  border-color: rgba(0, 82, 204, 0.35);
}
.bitbucket-btn:hover:not(:disabled) {
  background: rgba(0, 82, 204, 0.25);
  border-color: #2684ff;
}

.stackoverflow-btn {
  background: rgba(244, 128, 36, 0.1);
  color: #f48024;
  border-color: rgba(244, 128, 36, 0.35);
}
.stackoverflow-btn:hover:not(:disabled) {
  background: rgba(244, 128, 36, 0.22);
  border-color: #f48024;
}
</style>