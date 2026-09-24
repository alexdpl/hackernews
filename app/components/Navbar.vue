<!-- app/components/Navbar.vue -->
<script setup lang="ts">
// Sincronizzato con la nuova API di autenticazione sicura e senza cache SSR
const { data: authData, refresh: refreshAuth } = await useFetch('/api/auth/me', {
  key: 'auth-me-navbar',
  getCachedData: () => null
})
const router = useRouter()

const isAuthenticated = computed(() => {
  const data = authData.value as any
  return Boolean(data && data.authenticated === true)
})

const username = computed(() => {
  const data = authData.value as any
  return data?.username || ''
})

// Controllo blindato dell'Admin anche nel Navbar
const isAdmin = computed(() => {
  const data = authData.value as any
  if (!data || !data.authenticated) return false
  return data.username === 'alexdpl' || data.role === 'admin'
})

async function handleLogout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await refreshAuth()
  router.push('/')
}
</script>

<template>
  <header class="navbar-header">
    <div class="navbar-container">
      <!-- Logo e Titolo -->
      <NuxtLink to="/" class="brand">
        <span class="logo">DK</span>
        <span class="brand-title">DevKernelPulse</span>
      </NuxtLink>

      <!-- Menu di Navigazione Principale -->
      <nav class="nav-links">
        <NuxtLink to="/news" class="nav-link" active-class="active">news</NuxtLink>
        <span class="separator">|</span>
        <NuxtLink to="/newest" class="nav-link" active-class="active">newest</NuxtLink>
        <span class="separator">|</span>
        <NuxtLink to="/ask" class="nav-link" active-class="active">ask</NuxtLink>
        <span class="separator">|</span>
        <NuxtLink to="/show" class="nav-link" active-class="active">show</NuxtLink>
        <span class="separator">|</span>
        <NuxtLink to="/jobs" class="nav-link" active-class="active">jobs</NuxtLink>
        <span class="separator">|</span>
        <NuxtLink to="/submit" class="nav-link submit-link" active-class="active">submit</NuxtLink>
        
        <!-- LINK ADMIN PROTETTO: Visibile SOLO all'admin autenticato -->
        <template v-if="isAdmin">
          <span class="separator">|</span>
          <NuxtLink to="/admin" class="nav-link admin-link">admin</NuxtLink>
        </template>
      </nav>

      <!-- Sezione Autenticazione & User Panel Predisposto -->
      <div class="nav-auth">
        <span class="separator">|</span>
        <template v-if="isAuthenticated">
          <!-- Predisposto per il futuro Pannello Utente (Fase 4) -->
          <NuxtLink :to="`/user/${username}`" class="nav-link active-user">@{{ username }}</NuxtLink>
          <span class="separator">|</span>
          <button @click="handleLogout" class="logout-btn">logout</button>
        </template>
        <template v-else>
          <NuxtLink to="/login" class="nav-link" active-class="active">login</NuxtLink>
        </template>
      </div>
    </div>
  </header>
</template>

<style scoped>
.navbar-header {
  background-color: #020420;
  border-bottom: 2px solid #00dc82;
  padding: 8px 12px;
  font-family: ui-sans-serif, system-ui, sans-serif;
}

.navbar-container {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  font-weight: bold;
}

.logo {
  background: #00dc82;
  color: #020420;
  font-weight: bold;
  padding: 2px 6px;
  font-size: 0.85rem;
  border-radius: 4px;
  line-height: 1;
}

.brand-title {
  font-size: 1rem;
  color: #ffffff;
  font-weight: 700;
}

.nav-links, .nav-auth {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
}

.nav-link {
  color: #cbd5e1;
  text-decoration: none;
  font-weight: 500;
}

.nav-link:hover {
  color: #00dc82;
}

.nav-link.active, .active-user {
  color: #00dc82;
  font-weight: bold;
}

.submit-link {
  color: #00dc82 !important;
  font-weight: 600;
}

/* Stile distintivo per il link Admin protetto */
.admin-link {
  color: #f59e0b !important;
  font-weight: 700 !important;
  background: rgba(245, 158, 11, 0.1);
  padding: 1px 6px;
  border-radius: 4px;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.admin-link:hover {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24 !important;
}

.separator {
  color: #334155;
  font-size: 0.8rem;
}

.logout-btn {
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0;
}

.logout-btn:hover {
  text-decoration: underline;
}
</style>