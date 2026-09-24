<!-- app/components/AppHeader.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const { currentUser, isAuthenticated, isAdmin, logout, fetchSession } = useAuthCore()

const isToolsOpen = ref(false)
const isUserMenuOpen = ref(false)

const toggleUserMenu = () => {
  isUserMenuOpen.value = !isUserMenuOpen.value
  if (isUserMenuOpen.value) isToolsOpen.value = false
}

const toggleToolsMenu = () => {
  isToolsOpen.value = !isToolsOpen.value
  if (isToolsOpen.value) isUserMenuOpen.value = false
}

const closeMenus = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.dropdown-wrapper')) {
    isToolsOpen.value = false
    isUserMenuOpen.value = false
  }
}

onMounted(async () => {
  await fetchSession()
  window.addEventListener('click', closeMenus)
})

onUnmounted(() => {
  window.removeEventListener('click', closeMenus)
})

const handleLogout = async () => {
  isUserMenuOpen.value = false
  await logout()
  navigateTo('/')
}
</script>

<template>
  <header class="dkp-header">
    <div class="header-container">
      <!-- Brand Logo -->
      <NuxtLink to="/" class="brand">
        <span class="brand-icon">⚡</span>
        <span class="brand-name">DevKernelPulse</span>
        <span class="brand-badge">v2.0</span>
      </NuxtLink>

      <!-- Navigation Links -->
      <nav class="nav-links">
        <NuxtLink to="/" class="nav-item">News</NuxtLink>
        <NuxtLink to="/ask" class="nav-item">Ask</NuxtLink>
        <NuxtLink to="/show" class="nav-item">Show</NuxtLink>
        <NuxtLink to="/jobs" class="nav-item">Jobs</NuxtLink>
        <NuxtLink to="/submit" class="nav-item highlight-submit">+ Submit</NuxtLink>

        <!-- Dropdown DKP Tools -->
        <div class="dropdown-wrapper">
          <button @click.stop="toggleToolsMenu" class="tools-btn" :class="{ active: isToolsOpen }">
            🛠️ DKP Tools <span class="arrow">▾</span>
          </button>
          <div v-if="isToolsOpen" class="dropdown-menu">
            <NuxtLink to="/tools/proof-of-code" class="dropdown-item">
              <span>🛡️ Proof of Code</span>
              <small>Vault & Notarizzazione</small>
            </NuxtLink>
            <NuxtLink to="/tools/ai-scanner" class="dropdown-item">
              <span>🔍 AI Code Scanner v2</span>
              <small>Audit & Review IA</small>
            </NuxtLink>
            <NuxtLink to="/tools/terminal" class="dropdown-item">
              <span>💻 Web Terminal</span>
              <small>Shell CLI Browser</small>
            </NuxtLink>
            <NuxtLink to="/tools/neural" class="dropdown-item">
              <span>🧠 Neural Playground</span>
              <small>Testing Prompt IA</small>
            </NuxtLink>
          </div>
        </div>
      </nav>

      <!-- Right Area: Auth / User Profile -->
      <div class="header-right">
        <!-- Utente Loggato -->
        <div v-if="isAuthenticated" class="dropdown-wrapper">
          <button @click.stop="toggleUserMenu" class="user-pill-btn" :class="{ active: isUserMenuOpen }">
            <span class="user-avatar">👤</span>
            <span class="user-name">@{{ currentUser?.username || 'developer' }}</span>
            <span class="arrow">▾</span>
          </button>

          <div v-if="isUserMenuOpen" class="dropdown-menu user-dropdown">
            <div class="user-menu-header">
              <span class="u-title">DevKernelPulse Account</span>
              <span class="u-role" :class="{ admin: isAdmin }">{{ isAdmin ? '⚡ ADMIN CORE' : '🟢 PRO DEVELOPER' }}</span>
            </div>
            <hr class="menu-divider" />
            <NuxtLink to="/user/dashboard" class="dropdown-item" @click="isUserMenuOpen = false">
              <span>📊 Dashboard Personale</span>
              <small>Profilo, Punti e Attività</small>
            </NuxtLink>
            <NuxtLink to="/user/dashboard?tab=vault" class="dropdown-item" @click="isUserMenuOpen = false">
              <span>🛡️ DKP Vault & Certificati</span>
              <small>Hash e Report Salvati</small>
            </NuxtLink>
            <NuxtLink v-if="isAdmin" to="/admin" class="dropdown-item admin-item" @click="isUserMenuOpen = false">
              <span>⚙️ Admin Control Panel</span>
              <small>Gestione Ecosistema DKP</small>
            </NuxtLink>
            <hr class="menu-divider" />
            <button @click="handleLogout" class="dropdown-item logout-btn">
              🚪 Disconnetti
            </button>
          </div>
        </div>

        <!-- Utente Non Loggato -->
        <div v-else class="auth-buttons">
          <NuxtLink to="/login" class="login-btn">Accedi</NuxtLink>
          <NuxtLink to="/login?tab=register" class="register-btn">Registrati</NuxtLink>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.dkp-header {
  background: #020420;
  border-bottom: 1px solid #1e293b;
  position: sticky;
  top: 0;
  z-index: 100;
  font-family: ui-sans-serif, system-ui, sans-serif;
}

.header-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0.75rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
}

.brand-icon { font-size: 1.2rem; }
.brand-name { color: #ffffff; font-weight: 800; font-size: 1.15rem; letter-spacing: -0.5px; }
.brand-badge { background: rgba(0, 220, 130, 0.15); color: #00dc82; font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.4rem; border-radius: 4px; border: 1px solid rgba(0, 220, 130, 0.3); }

.nav-links { display: flex; align-items: center; gap: 1.2rem; }
.nav-item { color: #94a3b8; text-decoration: none; font-size: 0.9rem; font-weight: 600; transition: color 0.2s; }
.nav-item:hover { color: #00dc82; }
.highlight-submit { color: #38bdf8; }
.highlight-submit:hover { color: #00dc82; }

.dropdown-wrapper { position: relative; }

.tools-btn {
  background: transparent;
  border: 1px solid #1e293b;
  color: #38bdf8;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.tools-btn:hover, .tools-btn.active {
  border-color: #00dc82;
  color: #00dc82;
  background: rgba(0, 220, 130, 0.05);
}

.user-pill-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #090d16;
  border: 1px solid #1e293b;
  color: #ffffff;
  padding: 0.4rem 0.85rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.user-pill-btn:hover, .user-pill-btn.active {
  border-color: #38bdf8;
  color: #38bdf8;
}

.user-name { color: #38bdf8; }

.dropdown-menu {
  position: absolute;
  top: calc(100% + 0.6rem);
  right: 0;
  width: 240px;
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 8px;
  padding: 0.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.dropdown-item {
  display: flex;
  flex-direction: column;
  padding: 0.5rem 0.75rem;
  color: #ffffff;
  text-decoration: none;
  border-radius: 6px;
  transition: background 0.2s;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  width: 100%;
}

.dropdown-item:hover { background: #1e293b; }
.dropdown-item span { font-size: 0.85rem; font-weight: 700; color: #38bdf8; }
.dropdown-item:hover span { color: #00dc82; }
.dropdown-item small { font-size: 0.72rem; color: #64748b; margin-top: 2px; }

.user-menu-header { padding: 0.5rem 0.75rem; display: flex; flex-direction: column; gap: 0.2rem; }
.u-title { font-size: 0.7rem; color: #64748b; font-weight: 700; text-transform: uppercase; }
.u-role { font-size: 0.75rem; font-weight: 800; color: #00dc82; }
.u-role.admin { color: #f59e0b; }

.menu-divider { border: 0; height: 1px; background: #1e293b; margin: 0.3rem 0; }

.admin-item span { color: #f59e0b !important; }
.logout-btn span, .logout-btn { color: #ef4444 !important; font-weight: 700; font-size: 0.85rem; }

.auth-buttons { display: flex; align-items: center; gap: 0.75rem; }
.login-btn { color: #38bdf8; text-decoration: none; font-size: 0.85rem; font-weight: 700; }
.register-btn { background: #00dc82; color: #020420; padding: 0.4rem 0.85rem; border-radius: 6px; text-decoration: none; font-size: 0.85rem; font-weight: 800; }
</style>