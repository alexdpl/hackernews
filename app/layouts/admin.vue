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
    <!-- Header interno dedicato all'area riservata Admin -->
    <header class="admin-header">
      <div class="admin-nav-container">
        <div class="nav-left">
          <NuxtLink to="/" class="nav-link home-link">
            Torna in home ↗
          </NuxtLink>
          <span class="divider">|</span>
          <NuxtLink to="/admin" class="nav-link" active-class="active" exact-active-class="active">
            Gestione News & Commenti
          </NuxtLink>
          <NuxtLink to="/admin/jobs" class="nav-link" active-class="active">
            Gestione Jobs
          </NuxtLink>
          <NuxtLink to="/admin/health" class="nav-link health-badge" active-class="active">
            ⚡ Health Check
          </NuxtLink>
        </div>

        <div class="nav-right">
          <button @click="logout" class="btn-logout">
            Esci
          </button>
        </div>
      </div>
    </header>

    <!-- Contenuto delle pagine admin -->
    <main class="admin-body">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.admin-layout {
  min-height: 100vh;
  background-color: #f8fafc;
  font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
}

.admin-header {
  background-color: #020420;
  padding: 0.8rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.admin-nav-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex-wrap: wrap;
}

.nav-link {
  color: #94a3b8;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: color 0.15s ease;
}

.nav-link:hover,
.nav-link.active {
  color: #ffffff;
  font-weight: 600;
}

.home-link {
  color: #ffffff;
  font-weight: 600;
}

.divider {
  color: #334155;
  user-select: none;
}

.health-badge {
  color: #00dc82 !important;
  background: rgba(0, 220, 130, 0.1);
  padding: 0.25rem 0.6rem;
  border-radius: 4px;
  border: 1px solid rgba(0, 220, 130, 0.3);
}

.health-badge:hover,
.health-badge.active {
  background: rgba(0, 220, 130, 0.2);
}

.btn-logout {
  background: transparent;
  border: 1px solid #ef4444;
  color: #ef4444;
  padding: 0.3rem 0.8rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-logout:hover {
  background: #ef4444;
  color: #ffffff;
}

.admin-body {
  padding: 1.5rem;
}
</style>