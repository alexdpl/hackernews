<!-- app/app.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'

// 1. Configurazione Lingua & SEO Head
useHead({
  htmlAttrs: { lang: 'it' }
})

useSeoMeta({
  titleTemplate: 'DevKernelPulse | %s',
  description: 'DevKernelPulse v2.0 - La piattaforma meritocratica per sviluppatori con Proof of Code basata su GitHub, Nuxt 4, Neon Postgres e GCP.',
  ogImage: 'https://devkernelpulse.duckdns.org/cover.jpg',
  ogImageAlt: 'DevKernelPulse Proof of Code Ecosystem',
  twitterCard: 'summary_large_image',
})

const { initAuth } = useAuthCore()

// FLAG CRITICO DI BLINDAGGIO HYDRATION:
// Garantisce che la chat venga caricata SOLO sul client a montaggio avvenuto,
// eliminando qualsiasi mismatch di SSR su GCP.
const isClientReady = ref(false)

onMounted(async () => {
  isClientReady.value = true
  try {
    await initAuth()
  } catch (_) {
    // Silenzia eventuali chiamate auth iniziali non bloccanti
  }
})
</script>

<template>
  <div class="dkp-app-wrapper">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <!-- Modale globale di autenticazione -->
    <ClientOnly>
      <AuthModal />
    </ClientOnly>

    <!-- PULSE NEXUS CHAT - BLINDATA CONTRO OGNI HYDRATION MISMATCH -->
    <ClientOnly>
      <LazyDkpPulseNexus v-if="isClientReady" />
    </ClientOnly>
  </div>
</template>

<style>
*, *::before, *::after {
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  font-size: 15px;
  background-color: #020617; /* Sfondo scuro coordinato con l'ecosistema DKP */
  margin: 0;
  padding: 0;
  color: #f8fafc;
  overflow-y: scroll;
}

a {
  color: #38bdf8;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
</style>