<script setup lang="ts">
const route = useRoute()

async function handleLogout() {
  // Esegui la cancellazione dei cookie/sessione se presente
  // await $fetch('/api/auth/logout', { method: 'POST' })
  
  // Reindirizza alla Home principale
  await navigateTo('/')
}
</script>

<template>
  <div class="admin-wrapper">
    <header class="admin-header">
      <div class="inner">
        <div class="nav-left">
          <!-- Aprirà la home in una nuova scheda -->
          <NuxtLink to="/" target="_blank" rel="noopener noreferrer" class="nav-link home-link">
            Torna in home ↗
          </NuxtLink>

          <span class="divider">|</span>

          <!-- Navigazione dinamica tra le dashboard admin -->
          <NuxtLink 
            to="/admin" 
            class="nav-link" 
            :class="{ active: route.path === '/admin' }"
          >
            Gestione News & Commenti
          </NuxtLink>

          <NuxtLink 
            to="/admin/jobs" 
            class="nav-link" 
            :class="{ active: route.path === '/admin/jobs' }"
          >
            Gestione Jobs
          </NuxtLink>
        </div>

        <div class="nav-right">
          <button class="logout-btn" @click="handleLogout">
            Esci
          </button>
        </div>
      </div>
    </header>

    <main class="admin-content">
      <slot />
    </main>
  </div>
</template>

<style scoped lang="postcss">
.admin-wrapper {
  min-height: 100vh;
  background-color: #f4f4f5;
}

.admin-header {
  background-color: #020420;
  color: #ffffff;
  padding: 0 15px;
  height: 55px;
  display: flex;
  align-items: center;

  .inner {
    max-width: 1000px;
    width: 100%;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .nav-left {
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .divider {
    color: #4b5563;
  }

  .nav-link {
    color: #9ca3af;
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    transition: color 0.2s ease;

    &:hover, &.active {
      color: #00dc82; /* Verde Smeraldo DevKernelPulse */
    }

    &.home-link {
      color: #ffffff;
      &:hover {
        color: #00dc82;
      }
    }
  }

  .logout-btn {
    background: transparent;
    border: 1px solid #ef4444;
    color: #ef4444;
    padding: 5px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s ease;

    &:hover {
      background-color: #ef4444;
      color: #ffffff;
    }
  }
}

.admin-content {
  max-width: 1000px;
  margin: 20px auto;
  padding: 0 15px;
}
</style>
