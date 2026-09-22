<!-- app/pages/login.vue -->
<script setup lang="ts">
import { ref } from 'vue'

const username = ref('alexdpl')
const password = ref('admin123')
const loading = ref(false)
const errorMessage = ref('')
const router = useRouter()

async function handleLogin() {
  loading.value = true
  errorMessage.value = ''
  try {
    const res: any = await $fetch('/api/auth/login', {
      method: 'POST',
      body: { username: username.value, password: password.value }
    })
    if (res.success) {
      router.push(`/user/${res.username}`)
    } else {
      errorMessage.value = res.error || 'Errore durante il login'
    }
  } catch (err: any) {
    errorMessage.value = 'Errore di connessione'
  } finally {
    loading.value = false
  }
}

useSeoMeta({
  title: 'Login - DevKernelPulse',
  description: 'Accedi al tuo account DevKernelPulse.'
})
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <h2>Accedi a <span class="brand">DevKernelPulse</span></h2>
      <p class="subtitle">Inserisci le credenziali o usa i provider social per entrare al volo.</p>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label>Username</label>
          <input v-model="username" type="text" required class="form-input" placeholder="es. alexdpl" />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input v-model="password" type="password" required class="form-input" placeholder="••••••••" />
        </div>

        <div v-if="errorMessage" class="error-msg">{{ errorMessage }}</div>

        <button type="submit" :disabled="loading" class="login-btn">
          {{ loading ? 'Accesso in corso...' : 'Entra' }}
        </button>
      </form>

      <!-- Sezione Social Login Integrata -->
      <div class="social-login-container">
        <div class="social-divider">
          <span>oppure continua con</span>
        </div>
        
        <div class="social-buttons">
          <a href="/auth/github" class="social-btn github">
            <span>🐙 GitHub</span>
          </a>
          <a href="/auth/google" class="social-btn google">
            <span>🌐 Google</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 70vh;
  font-family: ui-sans-serif, system-ui, sans-serif;
}

.login-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 2rem;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
}

.login-card h2 {
  color: #020420;
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
}

.brand {
  color: #00dc82;
  background: #020420;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
}

.subtitle {
  color: #64748b;
  font-size: 0.85rem;
  margin-bottom: 1.5rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.form-group label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #334155;
}

.form-input {
  padding: 0.6rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.95rem;
  color: #020420;
}

.form-input:focus {
  outline: none;
  border-color: #00dc82;
}

.error-msg {
  color: #ef4444;
  font-size: 0.85rem;
}

.login-btn {
  background: #020420;
  color: #00dc82;
  border: none;
  padding: 0.7rem;
  border-radius: 6px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s;
}

.login-btn:hover {
  opacity: 0.9;
}

/* Stili Social Login */
.social-login-container {
  margin-top: 1.5rem;
}

.social-divider {
  border-bottom: 1px solid #e2e8f0;
  line-height: 0.1em;
  margin: 1.5rem 0 1rem 0;
  text-align: center;
}

.social-divider span {
  background: #ffffff;
  padding: 0 10px;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.social-buttons {
  display: flex;
  gap: 0.75rem;
}

.social-btn {
  flex: 1;
  padding: 0.6rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s;
  border: 1px solid #cbd5e1;
  color: #020420;
  background: #f8fafc;
}

.social-btn:hover {
  opacity: 0.85;
}

.social-btn.github {
  background: #020420;
  color: #00dc82;
  border-color: #020420;
}
</style>