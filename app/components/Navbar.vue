<!-- app/components/Navbar.vue -->
<script setup lang="ts">
const { data: authData, refresh: refreshAuth } = await useFetch('/api/auth/me', {
  key: 'auth-me-navbar-v2',
  getCachedData: () => null
})
const router = useRouter()

const isAuthenticated = computed(() => Boolean((authData.value as any)?.authenticated))
const username = computed(() => (authData.value as any)?.username || '')
const isAdmin = computed(() => {
  const data = authData.value as any
  return data && data.authenticated && (data.username === 'alexdpl' || data.role === 'admin')
})

async function handleLogout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await refreshAuth()
  router.push('/')
}
</script>

<template>
  <header class="dkp-navbar">
    <div class="navbar-container">
      
      <!-- Brand -->
      <NuxtLink to="/" class="brand-logo">
        <span class="logo-box">DK</span>
        <span class="brand-text">DevKernel<span class="highlight">Pulse</span></span>
      </NuxtLink>

      <!-- Menu Principale & Tools Suite -->
      <nav class="nav-menu">
        <NuxtLink to="/news" class="nav-item">news</NuxtLink>
        <span class="divider">/</span>
        <NuxtLink to="/ask" class="nav-item">ask</NuxtLink>
        <span class="divider">/</span>
        <NuxtLink to="/show" class="nav-item">show</NuxtLink>
        <span class="divider">/</span>
        <NuxtLink to="/jobs" class="nav-item">jobs</NuxtLink>
        <span class="divider">/</span>
        <NuxtLink to="/submit" class="nav-item submit-highlight">submit</NuxtLink>

        <span class="divider">/</span>
        <!-- Dropdown / Gruppo Tools Suite -->
        <div class="dropdown">
          <span class="nav-item tools-dropdown-toggle">🛠️ DKP Tools ▼</span>
          <div class="dropdown-menu">
            <NuxtLink to="/tools/proof-of-code" class="dropdown-item">🛡️ Proof of Code (Vault)</NuxtLink>
            <NuxtLink to="/tools/ai-scanner" class="dropdown-item">🔍 AI Code Scanner v2</NuxtLink>
            <NuxtLink to="/tools/terminal" class="dropdown-item">💻 Terminal Web Shell</NuxtLink>
            <NuxtLink to="/tools/neural-playground" class="dropdown-item">🧠 Neural Playground</NuxtLink>
          </div>
        </div>

        <!-- Admin Link Condizionale -->
        <template v-if="isAdmin">
          <span class="divider">/</span>
          <NuxtLink to="/admin" class="nav-item admin-badge">admin</NuxtLink>
        </template>
      </nav>

      <!-- Auth & Shop Slot -->
      <div class="nav-auth-slot">
        <template v-if="isAuthenticated">
          <NuxtLink :to="`/user/${username}`" class="user-pill">👤 @{{ username }}</NuxtLink>
          <button @click="handleLogout" class="logout-btn">esci</button>
        </template>
        <template v-else>
          <NuxtLink to="/login" class="login-btn">Accedi</NuxtLink>
        </template>
      </div>

    </div>
  </header>
</template>

<style scoped>
.dkp-navbar { background-color: #020420; border-bottom: 2px solid #00dc82; padding: 0.75rem 1.25rem; font-family: ui-sans-serif, system-ui, sans-serif; position: relative; z-index: 100; }
.navbar-container { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; }
.brand-logo { display: flex; align-items: center; gap: 0.5rem; text-decoration: none; }
.logo-box { background: #00dc82; color: #020420; font-weight: 800; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.9rem; }
.brand-text { color: #ffffff; font-weight: 700; font-size: 1.05rem; }
.brand-text .highlight { color: #00dc82; }

.nav-menu { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; }
.nav-item { color: #cbd5e1; text-decoration: none; font-weight: 500; transition: color 0.2s; cursor: pointer; }
.nav-item:hover, .nav-item.router-link-active { color: #00dc82; }
.submit-highlight { color: #00dc82 !important; font-weight: 600; }

/* Dropdown Tools */
.dropdown { position: relative; display: inline-block; }
.tools-dropdown-toggle { color: #38bdf8 !important; font-weight: 600; }
.dropdown-menu { display: none; position: absolute; background-color: #090d16; min-width: 210px; box-shadow: 0px 8px 16px rgba(0,0,0,0.4); border: 1px solid #1e293b; border-radius: 8px; z-index: 1; padding: 0.5rem 0; top: 100%; left: 0; }
.dropdown:hover .dropdown-menu { display: block; }
.dropdown-item { color: #cbd5e1; padding: 0.5rem 1rem; text-decoration: none; display: block; font-size: 0.85rem; }
.dropdown-item:hover { background: rgba(0, 220, 130, 0.1); color: #00dc82; }

.admin-badge { color: #fbbf24 !important; background: rgba(245, 158, 11, 0.15); padding: 0.15rem 0.5rem; border-radius: 4px; border: 1px solid rgba(245, 158, 11, 0.3); font-weight: 700 !important; }
.divider { color: #334155; font-size: 0.85rem; }
.nav-auth-slot { display: flex; align-items: center; gap: 1rem; font-size: 0.9rem; }
.user-pill { color: #00dc82; background: rgba(0, 220, 130, 0.1); padding: 0.25rem 0.6rem; border-radius: 6px; text-decoration: none; font-weight: 600; border: 1px solid rgba(0, 220, 130, 0.3); }
.logout-btn { background: transparent; color: #ef4444; border: 1px solid #ef4444; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.8rem; cursor: pointer; font-weight: 600; }
.logout-btn:hover { background: #ef4444; color: #ffffff; }
.login-btn { background: #00dc82; color: #020420; padding: 0.4rem 0.9rem; border-radius: 6px; text-decoration: none; font-weight: 700; font-size: 0.85rem; }
.login-btn:hover { opacity: 0.9; }
</style>