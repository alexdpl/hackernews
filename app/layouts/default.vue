<!-- app/layouts/default.vue -->
<script setup lang="ts">
const userCookie = useCookie('dkp_user')
const router = useRouter()

function handleLogout() {
  userCookie.value = null
  router.push('/login')
}
</script>

<template>
  <div class="app-layout">
    <header class="navbar">
      <div class="nav-left">
        <NuxtLink to="/" class="nav-brand">
          <span class="logo-badge">&lt;&gt;</span> DevKernelPulse
        </NuxtLink>
        <nav class="nav-links">
          <NuxtLink to="/news">News</NuxtLink>
          <NuxtLink to="/newest">Newest</NuxtLink>
          <NuxtLink to="/ask">Ask</NuxtLink>
          <NuxtLink to="/show">Show</NuxtLink>
          <NuxtLink to="/jobs">Jobs</NuxtLink>
          <NuxtLink to="/ai-scanner" class="special-nav-link">⚡ AI Scanner</NuxtLink>
          <NuxtLink to="/terminal" class="special-nav-link">💻 Terminal</NuxtLink>
          <NuxtLink to="/submit" class="submit-link">Invia Link</NuxtLink>
        </nav>
      </div>

      <div class="nav-right">
        <!-- Se loggato mostra utente e logout -->
        <template v-if="userCookie">
          <NuxtLink :to="`/user/${userCookie}`" class="user-pill">
            👤 {{ userCookie }}
          </NuxtLink>
          <button @click="handleLogout" class="logout-btn">Esci</button>
        </template>
        <!-- Se non loggato mostra Login -->
        <template v-else>
          <NuxtLink to="/login" class="login-nav-btn">Login</NuxtLink>
        </template>
        
        <a href="https://github.com" target="_blank" rel="noopener" class="github-link">
          Apri su GitHub ↗
        </a>
      </div>
    </header>

    <main class="main-content">
      <slot />
    </main>

    <footer class="footer">
      <div class="footer-links">
        <NuxtLink to="/about">Chi Siamo</NuxtLink> • 
        <NuxtLink to="/guidelines">Linee Guida</NuxtLink> • 
        <NuxtLink to="/terms">Termini d'Uso</NuxtLink> • 
        <NuxtLink to="/privacy">Privacy & Cookie</NuxtLink> • 
        <NuxtLink to="/contact">Contatti</NuxtLink>
      </div>
      <p class="footer-copy">
        © 2026 <strong>DevKernelPulse</strong> — Proudly built with ❤️ by Alessandro De Paola & Gemini AI. Tutti i diritti sono riservati.
      </p>
    </footer>
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #fcfcfc;
  color: #020420;
  font-family: ui-sans-serif, system-ui, sans-serif;
}

.navbar {
  background-color: #020420;
  color: #ffffff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.nav-brand {
  font-weight: 700;
  font-size: 1.1rem;
  color: #ffffff;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.logo-badge {
  background: #00dc82;
  color: #020420;
  padding: 0.1rem 0.3rem;
  border-radius: 4px;
  font-size: 0.9rem;
}

.nav-links {
  display: flex;
  gap: 1rem;
  align-items: center;
  font-size: 0.9rem;
}

.nav-links a {
  color: #cbd5e1;
  text-decoration: none;
  transition: color 0.2s;
}

.nav-links a:hover, .nav-links a.router-link-active {
  color: #00dc82;
}

.special-nav-link {
  color: #38bdf8 !important;
  font-weight: 500;
}

.submit-link {
  color: #00dc82 !important;
  font-weight: 600;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.9rem;
}

.user-pill {
  background: #0f172a;
  color: #00dc82;
  padding: 0.3rem 0.7rem;
  border-radius: 20px;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.85rem;
  border: 1px solid #1e293b;
}

.logout-btn {
  background: transparent;
  border: 1px solid #ef4444;
  color: #ef4444;
  padding: 0.25rem 0.6rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s;
}

.logout-btn:hover {
  background: #ef4444;
  color: #ffffff;
}

.login-nav-btn {
  background: #00dc82;
  color: #020420;
  padding: 0.3rem 0.8rem;
  border-radius: 4px;
  font-weight: 700;
  text-decoration: none;
}

.login-nav-btn:hover {
  opacity: 0.9;
}

.github-link {
  color: #cbd5e1;
  text-decoration: none;
  font-size: 0.85rem;
}

.github-link:hover {
  color: #ffffff;
}

.main-content {
  flex: 1;
}

.footer {
  background-color: #020420;
  color: #94a3b8;
  text-align: center;
  padding: 1.5rem;
  font-size: 0.85rem;
  border-top: 1px solid #0f172a;
  margin-top: auto;
}

.footer-links {
  margin-bottom: 0.5rem;
}

.footer-links a {
  color: #cbd5e1;
  text-decoration: none;
}

.footer-links a:hover {
  color: #00dc82;
}

.footer-copy {
  color: #64748b;
  font-size: 0.75rem;
}
</style>