<script setup lang="ts">
import { feedsInfo } from '~~/utils/api'

// Utilizziamo useRoute per gestire i link attivi in modo sicuro senza usare \$ nel template
const route = useRoute()
</script>

<template>
  <header class="header">
    <div class="header-container">
      <!-- Logo e Menu Principale uniti nello stesso blocco -->
      <div class="nav-main">
        <!-- Il tuo logo verde smeraldo dello screen -->
        <NuxtLink to="/" class="logo-link">
          <svg class="logo-icon" viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M12 2L2 22h20L12 2zm0 4.8L18.4 19H5.6L12 6.8z"/>
          </svg>
        </NuxtLink>

        <!-- Menu di navigazione unico dello screen -->
        <nav class="nav-links">
          <NuxtLink to="/" class="nav-link text-emerald">News</NuxtLink>
          <NuxtLink to="/newest" class="nav-link">Newest</NuxtLink>
          <NuxtLink to="/ask" class="nav-link">Ask</NuxtLink>
          <NuxtLink to="/show" class="nav-link">Show</NuxtLink>
          
          <!-- FASE 6: Jobs integrato nel menu (Verde smeraldo, grigio al passaggio del mouse) -->
          <NuxtLink to="/jobs/1" class="nav-link nav-link-special">Jobs</NuxtLink>
          
          <!-- FASE 6: Invia Link integrato nel menu (Verde smeraldo, grigio al passaggio del mouse) -->
          <NuxtLink to="/submit" class="nav-link nav-link-special">Invia Link</NuxtLink>
        </nav>
      </div>

      <!-- Link esterno a destra -->
      <div class="nav-right">
        <a href="https://github.com" target="_blank" class="nav-link github-link">Open on GitHub</a>
      </div>
    </div>
  </header>
</template>

<style scoped>
/* Sfondo scuro e layout fedele al tuo screenshot */
.header {
  background-color: #030712; /* Sfondo scuro profondo dello screen */
  padding: 12px 24px;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.nav-main {
  display: flex;
  align-items: center;
  gap: 24px;
}

.logo-link {
  color: #10b981; /* Verde Smeraldo del logo */
  display: flex;
  align-items: center;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 18px;
}

/* Stile base dei link (Grigio chiaro / Bianco) */
.nav-link {
  color: #f3f4f6;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: color 0.2s ease;
}

.nav-link:hover:not(.nav-link-special) {
  color: #10b981; /* I link normali diventano verdi all'hover */
}

/* Colore specifico per il link News attivo */
.text-emerald {
  color: #10b981;
}

/* Link speciali di destra */
.github-link {
  font-size: 13px;
  color: #d1d5db;
}

/* ======================================================== */
/* CONFIGURAZIONE INVERTITA FASE 6 (Jobs & Invia Link)    */
/* ======================================================== */
.nav-link-special {
  color: #059669 !important; /* Verde smeraldo fisso di partenza */
  font-weight: 600;
}

/* Al passaggio del mouse l'effetto si inverte e diventa grigio */
.nav-link-special:hover {
  color: #9ca3af !important; /* Grigio chiaro al passaggio del mouse */
}
</style>