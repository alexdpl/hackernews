<!-- app/app.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

useHead({
  htmlAttrs: { lang: 'it' }
})

useSeoMeta({
  titleTemplate: 'DevKernelPulse | %s',
  description: 'DevKernelPulse - Ecosystem & Proof of Code su GCP'
})

const { initAuth } = useAuthCore()
const isClientReady = ref(false)
const showScrollTop = ref(false)

function handleWindowScroll() {
  if (typeof window === 'undefined') return
  showScrollTop.value = window.scrollY > 320
}

function scrollToTop() {
  if (typeof window === 'undefined') return
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  isClientReady.value = true
  handleWindowScroll()
  window.addEventListener('scroll', handleWindowScroll, { passive: true })

  setTimeout(async () => {
    try {
      await initAuth()
    } catch (e) {
      console.warn('[Kernel Auth Check] Inizializzazione eseguita con avviso:', e)
    }
  }, 50)
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', handleWindowScroll)
  }
})
</script>

<template>
  <div class="dkp-app-wrapper min-h-screen bg-[#020617] text-slate-100">
    <!-- LAYOUT E PAGINA UNICI -->
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <!-- Modale globale, Chat Pulse Nexus e Bottone Torna Su a sinistra -->
    <ClientOnly>
      <AuthModal />
      <button
        v-if="isClientReady && showScrollTop"
        type="button"
        @click="scrollToTop"
        aria-label="Torna su"
        title="Torna all'inizio della pagina"
        class="fixed bottom-6 left-6 z-[9990] inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#041224]/95 hover:bg-cyan-500/20 border border-cyan-500/45 hover:border-emerald-400 text-cyan-200 hover:text-emerald-300 font-mono text-xs font-extrabold shadow-[0_8px_30px_rgba(2,6,23,0.85)] backdrop-blur-md cursor-pointer transition-all"
      >
        <span class="text-emerald-400 text-sm leading-none">&#8593;</span>
        <span>Torna su</span>
      </button>
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