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

onMounted(async () => {
  isClientReady.value = true
  try {
    await initAuth()
  } catch (err) {
    // Check iniziale silenzioso
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

    <!-- CHAT PULSE NEXUS: Caricata solo dopo il mount lato client -->
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