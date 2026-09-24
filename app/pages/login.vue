<!-- app/pages/login.vue -->
<script setup lang="ts">
import { ref } from 'vue'

const username = ref('alexdpl')
const password = ref('')
const errorMessage = ref('')

async function handleLogin() {
  try {
    const res = await $fetch('/api/auth/login', {
      method: 'POST',
      body: { username: username.value, password: password.value }
    }) as any

    if (res && res.success) {
      window.location.href = '/'
    } else {
      errorMessage.value = res?.message || 'Credenziali non valide.'
    }
  } catch (e: any) {
    errorMessage.value = e?.data?.message || 'Errore durante l autenticazione.'
  }
}
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <h1>Accedi a <span class="brand-badge">DevKernelPulse</span></h1>
      <p class="subtitle">Inserisci le credenziali o usa i provider social per entrare al volo.</p>

      <div v-if="errorMessage" class="error-banner">
        {{ errorMessage }}
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="username">Username</label>
          <input id="username" v-model="username" type="text" placeholder="alexdpl" required />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input id="password" v-model="password" type="password" placeholder="••••••••••••••••" required />
        </div>

        <button type="submit" class="submit-btn">Entra</button>
      </form>

      <!-- Divisore Sezione Social -->
      <div class="divider">
        <span>OPPURE CONTINUA CON</span>
      </div>

      <!-- Griglia Social Provider 2x2 -->
      <div class="social-grid">
        <a href="/api/auth/github" class="social-btn github-btn">
          <span>🐙</span> GitHub
        </a>
        <a href="/api/auth/google" class="social-btn google-btn">
          <span>🌐</span> Google
        </a>
        <a href="/api/auth/gitlab" class="social-btn gitlab-btn">
          <span>🦊</span> GitLab
        </a>
        <a href="/api/auth/linkedin" class="social-btn linkedin-btn">
          <span>💼</span> LinkedIn
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(80vh - 60px);
  padding: 2rem 1rem;
}

.login-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 2.5rem;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
  text-align: center;
}

.login-card h1 {
  font-size: 1.75rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.5rem;
}

.brand-badge {
  background: #020420;
  color: #00dc82;
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
  font-size: 1.5rem;
}

.subtitle {
  color: #64748b;
  font-size: 0.9rem;
  margin-bottom: 1.75rem;
  line-height: 1.4;
}

.error-banner {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.85rem;
  margin-bottom: 1.25rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  text-align: left;
}

.form-group label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 0.4rem;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.95rem;
  outline: none;
  box-sizing: border-box;
}

.form-group input:focus {
  border-color: #00dc82;
}

.submit-btn {
  width: 100%;
  background: #020420;
  color: #00dc82;
  font-weight: 700;
  padding: 0.85rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 0.5rem;
  transition: background 0.2s;
}

.submit-btn:hover {
  background: #0f172a;
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
  background: #e2e8f0;
  z-index: 1;
}

.divider span {
  position: relative;
  z-index: 2;
  background: #ffffff;
  padding: 0 0.75rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: #94a3b8;
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
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.github-btn {
  background: #020420;
  color: #00dc82;
  border-color: #020420;
}

.github-btn:hover {
  background: #0f172a;
}

.google-btn {
  background: #f8fafc;
  color: #0f172a;
  border-color: #cbd5e1;
}

.google-btn:hover {
  background: #f1f5f9;
}

.gitlab-btn {
  background: #fc6d26;
  color: #ffffff;
}

.gitlab-btn:hover {
  opacity: 0.9;
}

.linkedin-btn {
  background: #0a66c2;
  color: #ffffff;
}

.linkedin-btn:hover {
  opacity: 0.9;
}
</style>