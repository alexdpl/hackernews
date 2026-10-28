<!-- app/app.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'

useHead({
  htmlAttrs: { lang: 'it' }
})

useSeoMeta({
  titleTemplate: 'DevKernelPulse | %s',
  description: 'DevKernelPulse v2.5 - Ecosystem & Proof of Code su GCP'
})

const { initAuth } = useAuthCore()
const isClientReady = ref(false)

onMounted(() => {
  // 1. Attiviamo subito il client per garantire la resa dei componenti interattivi
  isClientReady.value = true

  // 2. Eseguiamo l'auth in modo totalmente isolato
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
  <div class="dkp-app-wrapper min-h-screen bg-[#020617] text-slate-100">
    <!-- LAYOUT E PAGINA UNICI -->
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <!-- Modale globale e Chat Pulse Nexus renderizzati lato Client -->
    <ClientOnly>
      <AuthModal />
      <DkpPulseNexus v-if="isClientReady" />
    </ClientOnly>

    <!-- BADGE TELEMETRIA PROPRIETARIO DKP KERNEL CENTRATO v2.4 -->
    <DKPKernelBadge />
  </div>
</template>

<style>
*, *::before, *::after {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  background-color: #020617;
  color: #f8fafc;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  /* 🟢 Forziamo lo scroll verticale principale senza bloccare il contesto sticky */
  overflow-y: auto;
}

a {
  color: #38bdf8;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
</style>