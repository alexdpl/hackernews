<!-- app/components/AppHeader.vue -->
<script setup lang="ts">
// Integrazione reattiva con DKP Auth Core
const { isAuthenticated, currentUser, isAdmin, logout } = useAuthCore()

// Inizializziamo la sessione all'avvio
onMounted(async () => {
  const { fetchSession } = useAuthCore()
  await fetchSession()
})
</script>

<template>
  <header class="dkp-header">
    <div class="header-container">
      
      <!-- Brand Logo -->
      <NuxtLink to="/" class="brand">
        <span class="logo-badge">DK</span>
        <span class="brand-name">DevKernel<span class="highlight">Pulse</span></span>
      </NuxtLink>

      <!-- Navigazione Principale + Menu a Tendina DKP Tools -->
      <nav class="nav-links">
        <NuxtLink to="/news" class="nav-item">news</NuxtLink>
        <span class="sep">/</span>
        <NuxtLink to="/ask" class="nav-item">ask</NuxtLink>
        <span class="sep">/</span>
        <NuxtLink to="/show" class="nav-item">show</NuxtLink>
        <span class="sep">/</span>
        <NuxtLink to="/jobs" class="nav-item">jobs</NuxtLink>
        <span class="sep">/</span>
        <NuxtLink to="/submit" class="nav-item submit-btn-link">submit</NuxtLink>

        <span class="sep">/</span>

        <!-- Dropdown Menu DKP Tools v2.0 -->
        <div class="tools-dropdown">
          <button class="dropdown-trigger">
            🛠️ DKP Tools <span class="arrow">▼</span>
          </button>
          <div class="dropdown-content">
            <NuxtLink to="/tools/proof-of-code" class="dropdown-link">
              🛡️ Proof of Code (Vault)
            </NuxtLink>
            <NuxtLink to="/tools/ai-scanner" class="dropdown-link">
              🔍 AI Code Scanner v2
            </NuxtLink>
            <NuxtLink to="/tools/terminal" class="dropdown-link">
              💻 Terminal Web Shell
            </NuxtLink>
            <NuxtLink to="/tools/neural-playground" class="dropdown-link">
              🧠 Neural Playground
            </NuxtLink>
          </div>
        </div>

        <!-- Link Admin (Visibile SOLO per Admin via Auth Core) -->
        <template v-if="isAdmin">
          <span class="sep">/</span>
          <NuxtLink to="/admin" class="nav-item admin-pill">⚙️ admin</NuxtLink>
        </template>
      </nav>

      <!-- Sezione Autenticazione & Profilo Utente -->
      <div class="auth-section">
        <template v-if="isAuthenticated">
          <NuxtLink :to="`/user/${currentUser?.username}`" class="user-badge">
            👤 @{{ currentUser?.username }}
          </NuxtLink>
          <button @click="logout" class="logout-link">esci</button>
        </template>
        <template v-else>
          <NuxtLink to="/login" class="login-cta">Accedi</NuxtLink>
        </template>
      </div>

    </div>
  </header>
</template>

<style scoped>
.dkp-header {
  background-color: #020420;
  border-bottom: 2px solid #00dc82;
  padding: 0.75rem 1.25rem;
  font-family: ui-sans-serif, system-ui, sans-serif;
  position: relative;
  z-index: 1000; /* Assicura che il dropdown rimanga sempre sopra ogni elemento */
}

.header-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
}

.logo-badge {
  background: #00dc82;
  color: #020420;
  font-weight: 800;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.9rem;
}

.brand-name {
  color: #ffffff;
  font-weight: 700;
  font-size: 1.1rem;
}

.brand-name .highlight {
  color: #00dc82;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.nav-item {
  color: #cbd5e1;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.nav-item:hover, .nav-item.router-link-active {
  color: #00dc82;
}

.submit-btn-link {
  color: #00dc82 !important;
  font-weight: 700;
}

.sep {
  color: #334155;
  font-size: 0.85rem;
}

/* --- Dropdown Style --- */
.tools-dropdown {
  position: relative;
  display: inline-block;
}

.dropdown-trigger {
  background: transparent;
  border: none;
  color: #38bdf8;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0.2rem 0.4rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-family: inherit;
  transition: color 0.2s;
}

.dropdown-trigger:hover {
  color: #00dc82;
}

.arrow {
  font-size: 0.7rem;
  opacity: 0.8;
}

.dropdown-content {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  background-color: #090d16;
  min-width: 220px;
  border: 1px solid #1e293b;
  border-radius: 8px;
  box-shadow: 0px 10px 25px rgba(0, 0, 0, 0.5);
  padding: 0.5rem 0;
  z-index: 1001;
  margin-top: 0.25rem;
}

/* Apertura al passaggio del mouse */
.tools-dropdown:hover .dropdown-content {
  display: block;
}

.dropdown-link {
  color: #cbd5e1;
  padding: 0.6rem 1rem;
  text-decoration: none;
  display: block;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s;
}

.dropdown-link:hover {
  background-color: rgba(0, 220, 130, 0.12);
  color: #00dc82;
  padding-left: 1.25rem;
}

.admin-pill {
  color: #fbbf24 !important;
  background: rgba(245, 158, 11, 0.15);
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  border: 1px solid rgba(245, 158, 11, 0.3);
  font-weight: 700 !important;
}

.auth-section {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  font-size: 0.9rem;
}

.user-badge {
  color: #00dc82;
  background: rgba(0, 220, 130, 0.1);
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 600;
  border: 1px solid rgba(0, 220, 130, 0.3);
}

.logout-link {
  background: transparent;
  color: #ef4444;
  border: 1px solid #ef4444;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  font-weight: 600;
}

.logout-link:hover {
  background: #ef4444;
  color: #ffffff;
}

.login-cta {
  background: #00dc82;
  color: #020420;
  padding: 0.4rem 0.9rem;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 700;
  font-size: 0.85rem;
}

.login-cta:hover {
  opacity: 0.9;
}
</style>