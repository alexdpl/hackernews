<!-- app/app.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'

useHead({
  htmlAttrs: { lang: 'it' }
})

useSeoMeta({
  titleTemplate: 'DevKernelPulse | %s',
  description: 'DevKernelPulse v2.3 - Ecosystem & Proof of Code su GCP'
})

const { initAuth } = useAuthCore()
const isClientReady = ref(false)

onMounted(() => {
  // 1. Attiviamo subito il client per garantire la resa dei componenti interattivi
  isClientReady.value = true

  // 2. Eseguiamo l'auth in modo totalmente isolato (un errore qui non blocca l'UI)
  setTimeout(async () => {
    try {
      await initAuth()
    } catch (e) {
      console.warn('[Kernel Auth Check] Inizializzazione eseguita con avviso:', e)
    }
  }, 50)
})
</script>

<template>
  <div class="dkp-app-wrapper">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <!-- Modale globale e Chat Pulse Nexus renderizzati lato Client -->
    <ClientOnly>
      <AuthModal />
      <DkpPulseNexus v-if="isClientReady" />
    </ClientOnly>
  </div>
  
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <!-- BADGE TELEMETRIA PROPRIETARIO DKP KERNEL v2.4 -->
    <DKPKernelBadge />
  </div>
  </template>

<style>
*, *::before, *::after {
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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