<!-- app/components/Header.vue -->
<script setup lang="ts">
const { data: authData, refresh: refreshAuth } = await useFetch('/api/auth/me')
const router = useRouter()

const isAuthenticated = computed(() => authData.value?.authenticated)
const username = computed(() => authData.value?.username)

// Controllo blindato dell'Admin: visibile solo se autenticato ed è l'admin (alexdpl o ruolo admin)
const isAdmin = computed(() => {
  return isAuthenticated.value && (username.value === 'alexdpl' || (authData.value as any)?.role === 'admin')
})

async function handleLogout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await refreshAuth()
  router.push('/')
}
</script>

<template>
  <header class="header">
    <div class="header-content">
      <div class="nav-left">
        <NuxtLink to="/" class="logo">
          <!-- Logo SVG Unico: Terminale + Pulse Wave -->
          <svg class="brand-logo-svg" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="36" height="36" rx="8" fill="#00dc82"/>
            <path d="M10 13L5 18L10 23" stroke="#020420" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M26 13L31 18L26 23" stroke="#020420" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M15 22L18 14L21 22" stroke="#020420" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="logo-title">DevKernel<span class="highlight">Pulse</span></span>
        </NuxtLink>
        
        <nav class="nav-links">
          <NuxtLink to="/news">News</NuxtLink>
          <NuxtLink to="/newest">Newest</NuxtLink>
          <NuxtLink to="/ask">Ask</NuxtLink>
          <NuxtLink to="/show">Show</NuxtLink>
          <NuxtLink to="/jobs">Jobs</NuxtLink>
          <NuxtLink to="/submit" class="submit-link">Invia Link</NuxtLink>
          
          <!-- LINK ADMIN PROTETTO: Appare SOLO all'admin loggato -->
          <NuxtLink v-if="isAdmin" to="/admin" class="admin-link">Admin</NuxtLink>
        </nav>
      </div>

      <div class="nav-right">
        <template v-if="isAuthenticated">
          <NuxtLink :to="`/user/${username}`" class="user-pill">
            👤 {{ username }}
          </NuxtLink>
          <button @click="handleLogout" class="logout-btn">Esci</button>
        </template>
        <template v-else>
          <NuxtLink to="/login" class="login-link">Login</NuxtLink>
        </template>
        
        <a href="https://github.com/alexdpl/hackernews" target="_blank" rel="noopener noreferrer" class="github-link">
          Apri su GitHub ↗
        </a>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header {
  background: #020420;
  border-bottom: 2px solid #00dc82;
  padding: 0.6rem 1rem;
  font-family: ui-sans-serif, system-ui, sans-serif;
}

.header-content {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  text-decoration: none;
}

.brand-logo-svg {
  width: 32px;
  height: 32px;
  box-shadow: 0 2px 4px rgba(0, 220, 130, 0.2);
  border-radius: 6px;
}

.logo-title {
  color: #ffffff;
  font-weight: 700;
  font-size: 1.15rem;
  letter-spacing: -0.01em;
}

.logo-title .highlight {
  color: #00dc82;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.nav-links a {
  color: #cbd5e1;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: color 0.2s;
}

.nav-links a:hover, .nav-links a.router-link-active {
  color: #00dc82;
}

.submit-link {
  color: #00dc82 !important;
  font-weight: 600 !important;
}

/* Stile distintivo per il link Admin protetto */
.admin-link {
  color: #f59e0b !important;
  font-weight: 700 !important;
  background: rgba(245, 158, 11, 0.1);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.admin-link:hover {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24 !important;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.9rem;
}

.user-pill {
  color: #00dc82;
  background: rgba(0, 220, 130, 0.1);
  padding: 0.25rem 0.65rem;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 600;
  border: 1px solid rgba(0, 220, 130, 0.3);
}

.logout-btn {
  background: transparent;
  color: #ef4444;
  border: 1px solid #ef4444;
  padding: 0.2rem 0.55rem;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.logout-btn:hover {
  background: #ef4444;
  color: #ffffff;
}

.login-link {
  color: #00dc82;
  text-decoration: none;
  font-weight: 600;
}

.github-link {
  color: #ffffff;
  text-decoration: none;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  transition: color 0.2s;
}

.github-link:hover {
  color: #00dc82;
}
</style>