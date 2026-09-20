<!-- app/components/AppHeader.vue -->
<script setup lang="ts">
const route = useRoute()
</script>

<template>
  <header class="header-bar">
    <div class="header-container">
      <!-- Sezione Sinistra: Logo + Nome Brand + Link di Navigazione -->
      <div class="nav-left">
        <NuxtLink to="/" class="brand-link">
          <span class="logo-badge">DKP</span>
          <span class="brand-title">DevKernelPulse</span>
        </NuxtLink>

        <!-- Menu Pagine -->
        <nav class="nav-links">
          <NuxtLink to="/" :class="{ active: route.path === '/' }">
            News
          </NuxtLink>
          <NuxtLink to="/newest" :class="{ active: route.path === '/newest' }">
            Newest
          </NuxtLink>
          <NuxtLink to="/ask" :class="{ active: route.path === '/ask' }">
            Ask
          </NuxtLink>
          <NuxtLink to="/show" :class="{ active: route.path === '/show' }">
            Show
          </NuxtLink>
          <NuxtLink to="/jobs" :class="{ active: route.path === '/jobs' }">
            Jobs
          </NuxtLink>
          <NuxtLink to="/submit" :class="{ active: route.path === '/submit' }">
            Invia Link
          </NuxtLink>
        </nav>
      </div>

      <!-- Sezione Destra: Link Repository GitHub -->
      <div class="nav-right">
        <a 
          href="https://github.com/alexdpl/hackernews" 
          target="_blank" 
          rel="noopener noreferrer" 
          class="github-link"
        >
          Apri su GitHub
        </a>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header-bar {
  background-color: #020420; /* Sfondo scuro elegante */
  width: 100%;
  padding: 0.8rem 1.25rem;
  box-sizing: border-box;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
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

.nav-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
}

.logo-badge {
  background-color: #00dc82; /* Verde smeraldo */
  color: #020420;
  font-weight: 800;
  font-size: 0.8rem;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  line-height: 1;
}

.brand-title {
  color: #ffffff;
  font-weight: 700;
  font-size: 1.05rem;
  letter-spacing: -0.02em;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex-wrap: wrap;
}

.nav-links a {
  color: #a1a1aa;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: color 0.15s ease;
}

.nav-links a:hover,
.nav-links a.active {
  color: #00dc82; /* Verde smeraldo attivo */
}

.nav-right {
  display: flex;
  align-items: center;
}

.github-link {
  color: #ffffff;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: opacity 0.15s ease;
}

.github-link:hover {
  opacity: 0.85;
  text-decoration: underline;
}

@media (max-width: 640px) {
  .nav-left {
    gap: 0.8rem;
  }
  .nav-links {
    gap: 0.75rem;
    font-size: 0.85rem;
  }
}
</style>