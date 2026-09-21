<!-- app/components/AppHeader.vue -->
<script setup lang="ts">
// NuxtLink gestisce l'evidenziazione tramite la rotta attiva
</script>

<template>
  <header class="header-bar">
    <div class="header-container">
      <!-- Sezione Sinistra: Logo + Brand + Navigazione Pubblica -->
      <div class="nav-left">
        <NuxtLink to="/" class="brand-link">
          <svg class="logo-icon" viewBox="0 0 32 32" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 4L2 28H30L16 4Z" fill="#00DC82"></path>
            <path d="M16 12L8.5 25H23.5L16 12Z" fill="#020420"></path>
            <path d="M16 18L12 25H20L16 18Z" fill="#00DC82"></path>
          </svg>
          <span class="logo-badge">DKP</span>
          <span class="brand-title">DevKernelPulse</span>
        </NuxtLink>

        <!-- Menu Pagine Pubbliche -->
        <nav class="nav-links">
          <NuxtLink to="/" active-class="active" exact-active-class="active">News</NuxtLink>
          <NuxtLink to="/newest" active-class="active">Newest</NuxtLink>
          <NuxtLink to="/ask" active-class="active">Ask</NuxtLink>
          <NuxtLink to="/show" active-class="active">Show</NuxtLink>
          <NuxtLink to="/jobs" active-class="active">Jobs</NuxtLink>
          <NuxtLink to="/submit" active-class="active">Invia Link</NuxtLink>
        </nav>
      </div>

      <!-- Sezione Destra: Link GitHub -->
      <div class="nav-right">
        <a 
          href="https://github.com/alexdpl/hackernews" 
          target="_blank" 
          rel="noopener noreferrer" 
          class="github-link"
        >
          Apri su GitHub <span class="external-icon">↗</span>
        </a>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header-bar {
  background-color: #020420;
  width: 100%;
  padding: 0.8rem 1.25rem;
  box-sizing: border-box;
  font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
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
  gap: 0.6rem;
  text-decoration: none;
}

.logo-icon {
  flex-shrink: 0;
}

.logo-badge {
  background-color: #00dc82;
  color: #020420;
  font-weight: 800;
  font-size: 0.75rem;
  padding: 0.2rem 0.45rem;
  border-radius: 4px;
  line-height: 1;
  letter-spacing: 0.05em;
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
  transition: color 0.15s ease, opacity 0.15s ease;
}

.nav-links a:hover,
.nav-links a.active {
  color: #00dc82;
  font-weight: 600;
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
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  transition: color 0.15s ease;
}

.github-link:hover {
  color: #00dc82;
}

.external-icon {
  font-size: 0.8rem;
  opacity: 0.8;
}

@media (max-width: 640px) {
  .header-bar { padding: 0.75rem 1rem; }
  .nav-left { gap: 0.8rem; }
  .nav-links { gap: 0.75rem; font-size: 0.85rem; }
  .brand-title { font-size: 0.95rem; }
}
</style>