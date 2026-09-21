<!-- app/layouts/admin.vue -->
<script setup lang="ts">
function logout() {
  if (import.meta.client) {
    sessionStorage.removeItem('dkp_admin_secret')
    navigateTo('/admin')
  }
}
</script>

<template>
  <div class="admin-layout">
    <header class="admin-header">
      <div class="admin-container">
        <div class="admin-nav">
          <NuxtLink to="/" class="admin-link home">Torna in home ↗</NuxtLink>
          <span class="sep">|</span>
          <NuxtLink to="/admin" class="admin-link">Gestione News & Commenti</NuxtLink>
          <NuxtLink to="/admin/jobs" class="admin-link">Gestione Jobs</NuxtLink>
          <NuxtLink to="/admin/health" class="admin-link health-btn">⚡ Health Check</NuxtLink>
        </div>
        <div class="admin-right">
          <button @click="logout" class="btn-exit">Esci</button>
        </div>
      </div>
    </header>
    <main class="admin-content">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.admin-layout {
  min-height: 100vh;
  background-color: #f8fafc;
  font-family: ui-sans-serif, system-ui, sans-serif;
}
.admin-header {
  background-color: #020420;
  padding: 0.8rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.admin-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.admin-nav {
  display: flex;
  align-items: center;
  gap: 1.2rem;
}
.admin-link {
  color: #94a3b8;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
}
.admin-link:hover, .admin-link.router-link-active {
  color: #ffffff;
  font-weight: 600;
}
.home {
  color: #ffffff;
  font-weight: 600;
}
.sep {
  color: #334155;
}
.health-btn {
  color: #00dc82 !important;
  background: rgba(0, 220, 130, 0.1);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  border: 1px solid rgba(0, 220, 130, 0.3);
}
.btn-exit {
  background: transparent;
  border: 1px solid #ef4444;
  color: #ef4444;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}
.btn-exit:hover {
  background: #ef4444;
  color: #fff;
}
.admin-content {
  padding: 1.5rem;
}
</style>