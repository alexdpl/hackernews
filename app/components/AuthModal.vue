<!-- app/components/AuthModal.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface OAuthProviderItem {
  id: 'github' | 'google' | 'gitlab' | 'bitbucket' | 'stackoverflow'
  label: string
  className: string
  fullWidth?: boolean
}

const authCore = useAuthCore() as any
const { isAuthModalOpen, authTab, closeAuthModal, login } = authCore

const identifierInput = ref('')
const registerUsername = ref('')
const registerEmail = ref('')
const passwordInput = ref('')
const confirmPasswordInput = ref('')
const showPassword = ref(false)
const isLoading = ref(false)
const activeOAuthProvider = ref<string | null>(null)
const errorMessage = ref('')

const oauthProviders: OAuthProviderItem[] = [
  { id: 'github', label: 'GitHub', className: 'github-btn' },
  { id: 'google', label: 'Google', className: 'google-btn' },
  { id: 'gitlab', label: 'GitLab', className: 'gitlab-btn' },
  { id: 'bitbucket', label: 'Bitbucket', className: 'bitbucket-btn' },
  { id: 'stackoverflow', label: 'Stack Overflow', className: 'stackoverflow-btn', fullWidth: true }
]

function resetFields() {
  errorMessage.value = ''
  passwordInput.value = ''
  confirmPasswordInput.value = ''
  showPassword.value = false
}

function switchTab(tab: 'login' | 'register') {
  if (isLoading.value) return
  authTab.value = tab
  resetFields()
}

function handleClose() {
  if (isLoading.value) return
  resetFields()
  closeAuthModal()
}

async function handleFormSubmit() {
  if (isLoading.value) return
  errorMessage.value = ''

  if (authTab.value === 'login') {
    const cleanId = identifierInput.value.trim()
    if (!cleanId || !passwordInput.value) {
      errorMessage.value = 'Inserisci username/email e password.'
      return
    }

    isLoading.value = true
    try {
      // Chiama direttamente il metodo robusto del composable che gestisce token e redirect
      await login(cleanId, passwordInput.value)
      resetFields()
    } catch (e: any) {
      errorMessage.value =
        e?.data?.statusMessage ||
        e?.data?.message ||
        e?.message ||
        'Credenziali non valide o errore di autenticazione.'
    } finally {
      isLoading.value = false
    }
    return
  }

  // Registrazione DKP v2.6-PURE-SQL
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

  if (passwordInput.value.length < 8 || !/[a-zA-Z]/.test(passwordInput.value) || !/[0-9]/.test(passwordInput.value)) {
    errorMessage.value = 'La password deve avere almeno 8 caratteri, con almeno una lettera e un numero.'
    return
  }

  if (passwordInput.value !== confirmPasswordInput.value) {
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
        password: passwordInput.value
      }
    })

    if (!res?.success) {
      errorMessage.value = res?.message || 'Impossibile completare la registrazione.'
      return
    }

    await login(cleanUser, passwordInput.value)
    resetFields()
  } catch (e: any) {
    errorMessage.value =
      e?.data?.statusMessage ||
      e?.data?.message ||
      e?.message ||
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
  window.location.href = `/api/auth/${encodeURIComponent(providerId)}`
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && isAuthModalOpen.value) {
    handleClose()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Transition name="modal-fade">
    <div
      v-if="isAuthModalOpen"
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dkp-auth-modal-title"
      @click.self="handleClose"
    >
      <div class="modal-box">
        <div class="modal-header">
          <div id="dkp-auth-modal-title" class="brand-title">
            <span class="dk-badge shadow-glow">DK</span>
            <span>DevKernel<span class="pulse-text">Pulse</span></span>
            <span class="version-badge">v2.6-PURE-SQL</span>
          </div>
          <button
            type="button"
            @click="handleClose"
            class="close-btn"
            aria-label="Chiudi finestra di accesso"
            title="Chiudi"
          >
            ✕
          </button>
        </div>

        <div class="tabs-nav" role="tablist">
          <button
            type="button"
            role="tab"
            :aria-selected="authTab === 'login'"
            @click="switchTab('login')"
            class="tab-btn"
            :class="{ active: authTab === 'login' }"
          >
            🔐 Accedi
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="authTab === 'register'"
            @click="switchTab('register')"
            class="tab-btn"
            :class="{ active: authTab === 'register' }"
          >
            🚀 Registrati
          </button>
        </div>

        <form @submit.prevent="handleFormSubmit" class="auth-form" novalidate>
          <div v-if="errorMessage" role="alert" class="error-banner">
            ⚠️ {{ errorMessage }}
          </div>

          <template v-if="authTab === 'login'">
            <div class="input-group">
              <label for="modal-login-identifier">Username o Email</label>
              <input
                id="modal-login-identifier"
                name="username"
                autocomplete="username"
                v-model="identifierInput"
                type="text"
                placeholder="es. alexdpl o nome@dominio.dev"
                :disabled="isLoading"
                required
              />
            </div>
          </template>

          <template v-else>
            <div class="input-group">
              <label for="modal-register-username">Username Sviluppatore</label>
              <input
                id="modal-register-username"
                name="username"
                autocomplete="username"
                v-model="registerUsername"
                type="text"
                placeholder="es. kernel_hacker (3-30 caratteri)"
                :disabled="isLoading"
                required
              />
            </div>

            <div class="input-group">
              <label for="modal-register-email">Email Ufficiale</label>
              <input
                id="modal-register-email"
                name="email"
                autocomplete="email"
                v-model="registerEmail"
                type="email"
                placeholder="tuonome@dominio.dev"
                :disabled="isLoading"
                required
              />
            </div>
          </template>

          <div class="input-group">
            <label for="modal-login-password">Password</label>
            <div class="password-wrapper">
              <input
                id="modal-login-password"
                name="password"
                :autocomplete="authTab === 'login' ? 'current-password' : 'new-password'"
                v-model="passwordInput"
                :type="showPassword ? 'text' : 'password'"
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

          <div v-if="authTab === 'register'" class="input-group">
            <label for="modal-confirm-password">Conferma Password</label>
            <input
              id="modal-confirm-password"
              name="confirmPassword"
              autocomplete="new-password"
              v-model="confirmPasswordInput"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Ripeti la password"
              :disabled="isLoading"
              required
            />
          </div>

          <button type="submit" class="submit-auth-btn" :disabled="isLoading">
            <span v-if="isLoading && !activeOAuthProvider">⚡ Verifica crittografica in corso...</span>
            <span v-else>{{ authTab === 'login' ? 'Accedi all\'Ecosistema' : 'Crea Account Developer' }}</span>
          </button>
        </form>

        <div class="divider"><span>OPPURE CONTINUA CON OAUTH 2.0</span></div>

        <div class="social-grid">
          <button
            v-for="prov in oauthProviders"
            :key="prov.id"
            type="button"
            :disabled="isLoading"
            :class="['social-btn', prov.className, { 'full-span': prov.fullWidth }]"
            @click="handleSocialLogin(prov.id)"
          >
            <svg v-if="prov.id === 'github'" class="prov-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.05 11.05 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14 0 1.55-.01 2.79-.01 3.17 0 .31.21.68.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
            </svg>
            <svg v-else-if="prov.id === 'google'" class="prov-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M21.35 11.1h-9.18v2.98h5.27c-.23 1.24-.92 2.29-1.96 2.99v2.48h3.17c1.86-1.71 2.93-4.23 2.93-7.21 0-.69-.06-1.36-.23-1.24ZM12.17 22c2.65 0 4.88-.88 6.5-2.38l-3.17-2.48c-.88.59-2 .94-3.33.94-2.56 0-4.73-1.73-5.51-4.05H3.39v2.55A9.82 9.82 0 0 0 12.17 22ZM6.66 14.03a5.88 5.88 0 0 1 0-3.76V7.72H3.39a9.82 9.82 0 0 0 0 8.86l3.27-2.55Zm5.51-7.95c1.44 0 2.74.5 3.76 1.47l2.82-2.82C17.04 3.14 14.82 2.3 12.17 2.3a9.82 9.82 0 0 0-8.78 5.42l3.27 2.55c.78-2.32 2.95-4.19 5.51-4.19Z" />
            </svg>
            <svg v-else-if="prov.id === 'gitlab'" class="prov-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="m22.65 14.39-1.27-3.92-2.52-7.75a.65.65 0 0 0-1.24 0l-2.52 7.75H8.9L6.38 2.72a.65.65 0 0 0-1.24 0L2.62 10.47 1.35 14.39a1.3 1.3 0 0 0 .47 1.45L12 23.22l10.18-7.38a1.3 1.3 0 0 0 .47-1.45Z" />
            </svg>
            <svg v-else-if="prov.id === 'bitbucket'" class="prov-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M2.65 3C2.3 3 2 3.3 2 3.65c0 .06.01.13.02.19l2.73 16.5c.07.42.43.73.85.73h13.05c.31 0 .59-.22.64-.53L21.98 3.84a.65.65 0 0 0-.53-.75.5.5 0 0 0-.11-.01L2.65 3Zm11.43 11.98H9.94l-1.12-5.84h6.36l-1.1 5.84Z" />
            </svg>
            <svg v-else-if="prov.id === 'stackoverflow'" class="prov-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M18.986 21.865v-6.404h2.134V24H1.844v-8.539h2.13v6.404h15.012zM6.111 19.731H16.85v-2.137H6.111v2.137zm.259-4.852 10.48 2.189.451-2.07-10.478-2.187-.453 2.068zm1.359-5.056 9.705 4.53.903-1.95-9.706-4.53-.902 1.95zm2.715-4.785 8.217 6.855 1.359-1.62-8.216-6.853-1.36 1.618zM15.751 0l-1.746 1.294 6.405 8.604 1.746-1.294L15.751 0z" />
            </svg>
            <span>{{ activeOAuthProvider === prov.id ? 'Connessione...' : prov.label }}</span>
          </button>
        </div>

        <div class="modal-footer-link">
          <NuxtLink to="/login" @click="handleClose">
            Apri pagina di accesso completa ↗
          </NuxtLink>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(2, 4, 32, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
}
.modal-box {
  background: var(--bg-surface, #090d16);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 16px;
  width: 100%;
  max-width: 460px;
  padding: 1.5rem;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(16, 185, 129, 0.15);
  color: var(--text-main, #f8fafc);
  position: relative;
  overflow-y: auto;
  max-height: 92vh;
}
.modal-box::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #10b981, transparent);
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.15rem;
}
.brand-title {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  font-weight: 800;
  font-size: 1.05rem;
}
.dk-badge {
  background: #10b981;
  color: #020420;
  font-size: 0.8rem;
  font-weight: 900;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
}
.shadow-glow {
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
}
.version-badge {
  background: rgba(16, 185, 129, 0.12);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.3);
  font-family: ui-monospace, monospace;
  font-size: 0.62rem;
  font-weight: 800;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
}
.pulse-text { color: #10b981; }
.close-btn {
  background: transparent;
  border: none;
  color: #64748b;
  font-size: 1.15rem;
  cursor: pointer;
}
.close-btn:hover { color: #ef4444; }
.tabs-nav {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.4rem;
  background: var(--bg-kernel, rgba(2, 4, 32, 0.75));
  padding: 0.28rem;
  border-radius: 10px;
  border: 1px solid var(--border-color, #1e293b);
  margin-bottom: 1.1rem;
}
.tab-btn {
  background: transparent;
  border: none;
  color: var(--text-muted, #94a3b8);
  padding: 0.5rem;
  font-weight: 700;
  font-size: 0.84rem;
  border-radius: 7px;
  cursor: pointer;
}
.tab-btn.active {
  background: #10b981;
  color: #020420;
}
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}
.error-banner {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #fca5a5;
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
}
.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.input-group label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted, #cbd5e1);
}
.input-group input {
  width: 100%;
  background: var(--bg-kernel, rgba(2, 4, 32, 0.85));
  border: 1px solid var(--border-color, #1e293b);
  border-radius: 8px;
  padding: 0.62rem 0.82rem;
  color: var(--text-main, #ffffff);
  font-size: 0.88rem;
}
.input-group input:focus {
  outline: none;
  border-color: #10b981;
}
.password-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}
.password-wrapper input { padding-right: 2.6rem; }
.toggle-pwd-btn {
  position: absolute;
  right: 0.6rem;
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
}
.submit-auth-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #020420;
  font-weight: 800;
  font-size: 0.9rem;
  border: none;
  padding: 0.72rem;
  border-radius: 10px;
  cursor: pointer;
  margin-top: 0.25rem;
}
.submit-auth-btn:disabled { opacity: 0.65; cursor: not-allowed; }
.divider {
  text-align: center;
  position: relative;
  margin: 1.25rem 0 1rem 0;
}
.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 1px;
  background: var(--border-color, #1e293b);
}
.divider span {
  position: relative;
  background: var(--bg-surface, #090d16);
  padding: 0 0.75rem;
  color: #64748b;
  font-size: 0.68rem;
  font-weight: 800;
}
.social-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.6rem;
}
.social-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.58rem 0.65rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid transparent;
}
.social-btn.full-span { grid-column: span 2; }
.prov-icon { width: 15px; height: 15px; }
.github-btn { background: rgba(16, 185, 129, 0.06); color: #10b981; border-color: rgba(16, 185, 129, 0.3); }
.google-btn { background: rgba(56, 189, 248, 0.06); color: #38bdf8; border-color: rgba(56, 189, 248, 0.3); }
.gitlab-btn { background: rgba(252, 109, 38, 0.08); color: #fc6d26; border-color: rgba(252, 109, 38, 0.3); }
.bitbucket-btn { background: rgba(0, 82, 204, 0.1); color: #60a5fa; border-color: rgba(0, 82, 204, 0.35); }
.stackoverflow-btn { background: rgba(244, 128, 36, 0.08); color: #f48024; border-color: rgba(244, 128, 36, 0.3); }
.modal-footer-link { margin-top: 1rem; text-align: center; font-size: 0.72rem; }
.modal-footer-link a { color: #64748b; text-decoration: none; }
.modal-footer-link a:hover { color: #10b981; }
</style>