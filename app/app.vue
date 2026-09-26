<!-- app/app.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'

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
const isClientReady = ref(false)

onMounted(async () => {
  isClientReady.value = true
  try {
    await initAuth()
  } catch (err) {
    console.warn('⚠️ DKP Auth: Nessuna sessione attiva rilevata all avvio.')
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

    <!-- CHAT PULSE NEXUS - GARANTITA AL 100% -->
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
  background-color: #020617;
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