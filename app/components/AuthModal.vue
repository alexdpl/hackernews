<!-- app/components/AuthModal.vue -->
<script setup lang="ts">
import { ref } from 'vue'

const { isAuthModalOpen, authTab, closeAuthModal, login, register } = useAuthCore()

const usernameInput = ref('')
const emailInput = ref('')
const passwordInput = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

function switchTab(tab: 'login' | 'register') {
  authTab.value = tab
  errorMessage.value = ''
}

async function handleFormSubmit() {
  errorMessage.value = ''
  isLoading.value = true

  try {
    if (authTab.value === 'login') {
      if (!usernameInput.value.trim()) {
        errorMessage.value = 'Inserisci Username o Email'
        isLoading.value = false
        return
      }
      await login(usernameInput.value, passwordInput.value)
    } else {
      if (!usernameInput.value.trim() || !emailInput.value.trim()) {
        errorMessage.value = 'Compila tutti i campi richiesti'
        isLoading.value = false
        return
      }
      await register(usernameInput.value, emailInput.value, passwordInput.value)
    }
  } catch {
    errorMessage.value = 'Errore durante l\'autenticazione'
  } finally {
    isLoading.value = false
  }
}

// Accesso Rapido One-Click per Test
async function quickLoginAdmin() {
  isLoading.value = true
  await login('alexdpl', 'alexdpl2026')
  isLoading.value = false
}

async function quickLoginUser() {
  isLoading.value = true
  await login('dev_demo', 'demo123')
  isLoading.value = false
}

// Reindirizzamento Social OAuth Provider
function handleSocialLogin(provider: string) {
  isLoading.value = true
  window.location.href = `/api/auth/${provider}`
}
</script>

<template>
  <Transition name="modal-fade">
    <div v-if="isAuthModalOpen" class="modal-overlay" @click.self="closeAuthModal">
      <div class="modal-box">
        
        <!-- Intestazione Modale -->
        <div class="modal-header">
          <div class="brand-title">
            <span class="dk-badge">DK</span>
            <span>DevKernel<span class="pulse-text">Pulse</span> Auth</span>
          </div>
          <button @click="closeAuthModal" class="close-btn">✕</button>
        </div>

        <!-- Selettore Tab: ACCEDI / REGISTRATI -->
        <div class="tabs-nav">
          <button 
            @click="switchTab('login')" 
            class="tab-btn" 
            :class="{ active: authTab === 'login' }"
          >
            Accedi
          </button>
          <button 
            @click="switchTab('register')" 
            class="tab-btn" 
            :class="{ active: authTab === 'register' }"
          >
            Registrati
          </button>
        </div>

        <!-- One-Click Quick Login Presets -->
        <div class="quick-login-box">
          <span class="quick-label">⚡ ACCESSO RAPIDO SVILUPPATORE:</span>
          <div class="quick-btns">
            <button @click="quickLoginAdmin" type="button" class="quick-btn admin-btn">
              🛡️ Admin (@alexdpl)
            </button>
            <button @click="quickLoginUser" type="button" class="quick-btn user-btn">
              🌱 Dev Member
            </button>
          </div>
        </div>

        <!-- Form Autenticazione Credenziali -->
        <form @submit.prevent="handleFormSubmit" class="auth-form">
          <div v-if="errorMessage" class="error-banner">
            ⚠️ {{ errorMessage }}
          </div>

          <div class="input-group">
            <label>Username o Email</label>
            <input 
              v-model="usernameInput" 
              type="text" 
              placeholder="es. alexdpl o dev@kernel.io" 
              required
            />
          </div>

          <div v-if="authTab === 'register'" class="input-group">
            <label>Email Ufficiale</label>
            <input 
              v-model="emailInput" 
              type="email" 
              placeholder="tuonome@dominio.com" 
              required
            />
          </div>

          <div class="input-group">
            <label>Password</label>
            <input 
              v-model="passwordInput" 
              type="password" 
              placeholder="••••••••••••" 
            />
          </div>

          <button type="submit" class="submit-auth-btn" :disabled="isLoading">
            <span v-if="isLoading">⚡ Autenticazione in corso...</span>
            <span v-else>{{ authTab === 'login' ? 'Accedi all\'Ecosistema' : 'Crea Account Developer' }}</span>
          </button>
        </form>

        <!-- Divisore Sezione Social -->
        <div class="divider"><span>OPPURE CONTINUA CON</span></div>

        <!-- Griglia Social Provider 2x2 -->
        <div class="social-grid">
          <button @click="handleSocialLogin('github')" type="button" class="social-btn github-btn">
            <span>🐙</span> GitHub
          </button>
          <button @click="handleSocialLogin('google')" type="button" class="social-btn google-btn">
            <span>🌐</span> Google
          </button>
          <button @click="handleSocialLogin('gitlab')" type="button" class="social-btn gitlab-btn">
            <span>🦊</span> GitLab
          </button>
          <button @click="handleSocialLogin('linkedin')" type="button" class="social-btn linkedin-btn">
            <span>💼</span> LinkedIn
          </button>
        </div>

      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
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
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 14px;
  width: 100%;
  max-width: 440px;
  padding: 1.5rem;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 220, 130, 0.1);
  color: #f8fafc;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.brand-title {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-weight: 800;
  font-size: 1.05rem;
}

.dk-badge {
  background: #00dc82;
  color: #020420;
  font-size: 0.8rem;
  font-weight: 900;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
}

.pulse-text { color: #00dc82; }

.close-btn {
  background: transparent;
  border: none;
  color: #64748b;
  font-size: 1.2rem;
  cursor: pointer;
}

.close-btn:hover { color: #ffffff; }

.tabs-nav {
  display: flex;
  background: #020420;
  padding: 0.25rem;
  border-radius: 8px;
  border: 1px solid #1e293b;
  margin-bottom: 1rem;
}

.tab-btn {
  flex: 1;
  background: transparent;
  border: none;
  color: #94a3b8;
  padding: 0.45rem;
  font-weight: 700;
  font-size: 0.85rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn.active {
  background: #00dc82;
  color: #020420;
}

.quick-login-box {
  background: rgba(0, 220, 130, 0.05);
  border: 1px dashed rgba(0, 220, 130, 0.3);
  padding: 0.65rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.quick-label {
  display: block;
  font-size: 0.7rem;
  font-weight: 800;
  color: #00dc82;
  margin-bottom: 0.4rem;
}

.quick-btns {
  display: flex;
  gap: 0.5rem;
}

.quick-btn {
  flex: 1;
  padding: 0.45rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 800;
  cursor: pointer;
  border: 1px solid transparent;
}

.admin-btn {
  background: rgba(250, 204, 21, 0.15);
  color: #fde047;
  border-color: rgba(250, 204, 21, 0.3);
}

.admin-btn:hover { background: rgba(250, 204, 21, 0.3); }

.user-btn {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  border-color: rgba(56, 189, 248, 0.3);
}

.user-btn:hover { background: rgba(56, 189, 248, 0.3); }

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.error-banner {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid #ef4444;
  color: #f87171;
  padding: 0.5rem;
  border-radius: 6px;
  font-size: 0.8rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.input-group label {
  font-size: 0.78rem;
  font-weight: 700;
  color: #cbd5e1;
}

.input-group input {
  background: #020420;
  border: 1px solid #1e293b;
  border-radius: 6px;
  padding: 0.55rem 0.75rem;
  color: #ffffff;
  font-size: 0.88rem;
}

.input-group input:focus {
  outline: none;
  border-color: #00dc82;
}

.submit-auth-btn {
  background: #00dc82;
  color: #020420;
  font-weight: 800;
  font-size: 0.88rem;
  border: none;
  padding: 0.65rem;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 0.3rem;
  transition: background 0.2s;
}

.submit-auth-btn:hover { background: #00bf71; }

.divider {
  text-align: center;
  position: relative;
  margin: 1rem 0 0.85rem 0;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 1px;
  background: #1e293b;
}

.divider span {
  position: relative;
  background: #090d16;
  padding: 0 0.5rem;
  color: #64748b;
  font-size: 0.7rem;
  font-weight: 800;
}

.social-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}

.social-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.5rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.github-btn { background: #020420; color: #00dc82; border-color: rgba(0, 220, 130, 0.3); }
.github-btn:hover { background: rgba(0, 220, 130, 0.1); border-color: #00dc82; }

.google-btn { background: #020420; color: #38bdf8; border-color: rgba(56, 189, 248, 0.3); }
.google-btn:hover { background: rgba(56, 189, 248, 0.1); border-color: #38bdf8; }

.gitlab-btn { background: rgba(252, 109, 38, 0.1); color: #fc6d26; border-color: rgba(252, 109, 38, 0.3); }
.gitlab-btn:hover { background: rgba(252, 109, 38, 0.2); }

.linkedin-btn { background: rgba(10, 102, 194, 0.1); color: #38bdf8; border-color: rgba(10, 102, 194, 0.3); }
.linkedin-btn:hover { background: rgba(10, 102, 194, 0.2); }

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>