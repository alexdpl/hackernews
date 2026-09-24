<!-- app/layouts/admin.vue -->
<script setup lang="ts">
// Integrazione reattiva con DKP Auth Core
const { currentUser, isAdmin, logout } = useAuthCore()

// Sincronizzazione sessione all'avvio del layout admin
onMounted(async () => {
  const { fetchSession } = useAuthCore()
  await fetchSession()
})
</script>

<template>
  <div class="admin-layout">
    <!-- Header Dashboard Admin -->
    <header class="admin-header">
      <div class="admin-container">
        
        <!-- Brand & Navigazione Admin -->
        <div class="admin-left">
          <NuxtLink to="/" class="brand-badge">
            <span class="logo">DKP</span>
            <span class="title">Admin Control Panel</span>
          </NuxtLink>

          <nav class="admin-nav">
            <NuxtLink to="/" class="admin-link home-link">Torna in Home ↗</NuxtLink>
            <span class="sep">|</span>
            <NuxtLink to="/admin" class="admin-link" exact-active-class="active">📰 News & Commenti</NuxtLink>
            <NuxtLink to="/admin/jobs" class="admin-link" active-class="active">💼 Jobs</NuxtLink>
            <NuxtLink to="/admin/settings" class="admin-link" active-class="active">⚙️ Settings</NuxtLink>
            <NuxtLink to="/admin/health" class="admin-link health-btn" active-class="active">⚡ Health Check</NuxtLink>
          </nav>
        </div>

        <!-- Info Utente & Exit via Auth Core -->
        <div class="admin-right">
          <span v-if="currentUser" class="admin-user-pill">
            🛡️ @{{ currentUser.username }}
          </span>
          <button @click="logout" class="btn-exit">Esci</button>
        </div>

      </div>
    </header>

    <!-- Contenuto Pagine Admin -->
    <main class="admin-content">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.admin-layout {
  min-height: 100vh;
  background-color: #090d16;
  color: #f8fafc;
  font-family: ui-sans-serif, system-ui, sans-serif;
}

.admin-header {
  background-color: #020420;
  padding: 0.8rem 1.5rem;
  border-bottom: 2px solid #00dc82;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

.admin-container {
  max-width: 1300px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.admin-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.brand-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
}

.brand-badge .logo {
  background: #00dc82;
  color: #020420;
  font-weight: 800;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
}

.brand-badge .title {
  color: #ffffff;
  font-weight: 700;
  font-size: 0.95rem;
}

.admin-nav {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.85rem;
}

.admin-link {
  color: #94a3b8;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
}

.admin-link:hover, .admin-link.active {
  color: #00dc82;
  background: rgba(0, 220, 130, 0.1);
  font-weight: 600;
}

.home-link {
  color: #38bdf8;
  font-weight: 600;
}

.home-link:hover {
  color: #ffffff;
  text-decoration: underline;
}

.sep {
  color: #1e293b;
}

.health-btn {
  color: #00dc82 !important;
  border: 1px solid rgba(0, 220, 130, 0.3);
}

.admin-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.admin-user-pill {
  color: #fbbf24;
  background: rgba(245, 158, 11, 0.15);
  padding: 0.25rem 0.65rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 700;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.btn-exit {
  background: transparent;
  border: 1px solid #ef4444;
  color: #ef4444;
  padding: 0.3rem 0.8rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-exit:hover {
  background: #ef4444;
  color: #ffffff;
}

.admin-content {
  max-width: 1300px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}
</style>