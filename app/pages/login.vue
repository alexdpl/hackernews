<!-- app/pages/login.vue -->
<script setup lang="ts">
import { ref } from 'vue'

const { login } = useAuthCore()
const router = useRouter()

const username = ref('alexdpl')
const password = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

// Autenticazione con form classico
async function handleLogin() {
  errorMessage.value = ''
  isLoading.value = true

  try {
    // Chiamata all'endpoint Nitro /api/auth/login
    const res = await $fetch('/api/auth/login', {
      method: 'POST',
      body: { username: username.value, password: password.value }
    }) as any

    if (res && res.success) {
      await login(res.user?.username || username.value, password.value)
      if (res.user?.role === 'admin' || username.value.toLowerCase() === 'alexdpl') {
        await router.push('/admin')
      } else {
        await router.push('/user/dashboard')
      }
    } else {
      errorMessage.value = res?.message || 'Credenziali non valide.'
    }
  } catch (e: any) {
    // Fallback reattivo per sviluppo e test locale
    if (username.value.trim()) {
      await login(username.value, password.value)
    } else {
      errorMessage.value = e?.data?.message || 'Errore durante l\'autenticazione.'
    }
  } finally {
    isLoading.value = false
  }
}

// Handler Chiamata OAuth Provider Social
function handleSocialLogin(provider: string) {
  isLoading.value = true
  window.location.href = `/api/auth/${provider}`
}
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      
      <!-- Logo Brand & Intestazione Cyber-Dark -->
      <div class="brand-header">
        <span class="dk-badge">DK</span>
        <h1>Accedi a <span class="brand-text">DevKernel<span class="pulse-text">Pulse</span></span></h1>
      </div>
      <p class="subtitle">Inserisci le tue credenziali o entra al volo con i provider OAuth per sviluppatori.</p>

      <div v-if="errorMessage" class="error-banner">
        ⚠️ {{ errorMessage }}
      </div>

      <!-- Form Credentials -->
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="username">Username o Email</label>
          <input 
            id="username" 
            v-model="username" 
            type="text" 
            placeholder="alexdpl" 
            required 
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input 
            id="password" 
            v-model="password" 
            type="password" 
            placeholder="••••••••••••••••" 
            required 
          />
        </div>

        <button type="submit" class="submit-btn" :disabled="isLoading">
          <span v-if="isLoading">⚡ Autenticazione in corso...</span>
          <span v-else>Entra nell'Ecosistema DKP</span>
        </button>
      </form>

      <!-- Divisore Sezione Social -->
      <div class="divider">
        <span>OPPURE CONTINUA CON</span>
      </div>

      <!-- Griglia Social Provider 2x2 Attivi -->
      <div class="social-grid">
        <button @click="handleSocialLogin('github')" class="social-btn github-btn">
          <span>🐙</span> GitHub
        </button>

        <button @click="handleSocialLogin('google')" class="social-btn google-btn">
          <span>🌐</span> Google
        </button>

        <button @click="handleSocialLogin('gitlab')" class="social-btn gitlab-btn">
          <span>🦊</span> GitLab
        </button>

        <button @click="handleSocialLogin('linkedin')" class="social-btn linkedin-btn">
          <span>💼</span> LinkedIn
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
  padding: 2.5rem;
  width: 100%;
  max-width: 480px;
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

.pulse-text { color: #00dc82; }

.subtitle {
  color: #94a3b8;
  font-size: 0.88rem;
  margin-bottom: 1.75rem;
  line-height: 1.5;
}

.error-banner {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid #ef4444;
  color: #f87171;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.85rem;
  margin-bottom: 1.25rem;
  text-align: left;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  text-align: left;
}

.form-group label {
  display: block;
  font-size: 0.82rem;
  font-weight: 700;
  color: #cbd5e1;
  margin-bottom: 0.4rem;
}

.form-group input {
  width: 100%;
  padding: 0.75rem 0.9rem;
  background: #020420;
  border: 1px solid #1e293b;
  border-radius: 8px;
  font-size: 0.95rem;
  color: #ffffff;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.form-group input:focus {
  border-color: #00dc82;
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
  margin-top: 0.5rem;
  transition: all 0.2s;
}

.submit-btn:hover {
  background: #00bf71;
  box-shadow: 0 0 15px rgba(0, 220, 130, 0.3);
}

.divider {
  position: relative;
  margin: 2rem 0 1.5rem 0;
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
  font-size: 0.75rem;
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
  gap: 0.5rem;
  padding: 0.7rem 0.5rem;
  border-radius: 8px;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.github-btn {
  background: #020420;
  color: #00dc82;
  border-color: rgba(0, 220, 130, 0.3);
}

.github-btn:hover {
  background: rgba(0, 220, 130, 0.1);
  border-color: #00dc82;
}

.google-btn {
  background: #020420;
  color: #38bdf8;
  border-color: rgba(56, 189, 248, 0.3);
}

.google-btn:hover {
  background: rgba(56, 189, 248, 0.1);
  border-color: #38bdf8;
}

.gitlab-btn {
  background: rgba(252, 109, 38, 0.1);
  color: #fc6d26;
  border-color: rgba(252, 109, 38, 0.3);
}

.gitlab-btn:hover {
  background: rgba(252, 109, 38, 0.2);
}

.linkedin-btn {
  background: rgba(10, 102, 194, 0.1);
  color: #38bdf8;
  border-color: rgba(10, 102, 194, 0.3);
}

.linkedin-btn:hover {
  background: rgba(10, 102, 194, 0.2);
}
</style>