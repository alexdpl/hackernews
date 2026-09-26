<!-- app/app.vue -->
<script setup lang="ts">
import { onMounted } from 'vue'

// 1. Configurazione Lingua & HTML Head
useHead({
  htmlAttrs: { lang: 'it' }
})

// 2. Head & SEO Meta configuration DKP Kernel v2.0
useSeoMeta({
  titleTemplate: 'DevKernelPulse | %s',
  description: 'DevKernelPulse v2.0 - La piattaforma meritocratica per sviluppatori con Proof of Code basata su GitHub, Nuxt 4, Neon Postgres e GCP.',
  ogImage: 'https://devkernelpulse.duckdns.org/cover.jpg',
  ogImageAlt: 'DevKernelPulse Proof of Code Ecosystem',
  twitterCard: 'summary_large_image'
})

// 3. Inizializzazione Automatica Sessione DKP Auth Core
const { initAuth } = useAuthCore()

onMounted(async () => {
  await initAuth()
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

    <!-- Componente Floating Plugin 7 (Pulse Nexus Chat) -->
    <ClientOnly>
      <DkpPulseNexus />
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