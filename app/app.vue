<!-- app/app.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useDkpTheme } from '~/composables/useDkpTheme'

useHead({
  htmlAttrs: { lang: 'it' }
})

useSeoMeta({
  titleTemplate: 'DevKernelPulse | %s',
  description: 'DevKernelPulse v2.6-PURE-SQL - Ecosistema Developer, Sentinel Network & Proof of Code su GCP'
})

const { initAuth } = useAuthCore()
const { initTranslator } = useDkpTranslator()
const { initTheme } = useDkpTheme()

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
  initTranslator()
  if (typeof initTheme === 'function') initTheme()
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
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <ClientOnly>
      <AuthModal />
      <button
        v-if="isClientReady && showScrollTop"
        type="button"
        @click="scrollToTop"
        aria-label="Torna su"
        title="Torna all'inizio della pagina"
        class="fixed bottom-6 left-6 z-[9990] inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#080e1e]/95 hover:bg-cyan-500/20 border border-cyan-500/45 hover:border-emerald-400 text-cyan-200 hover:text-emerald-300 font-mono text-xs font-extrabold shadow-[0_8px_30px_rgba(2,6,23,0.85)] backdrop-blur-md cursor-pointer transition-all"
      >
        <span class="text-emerald-400 text-sm leading-none">&#8593;</span>
        <span>Torna su</span>
      </button>
      <DkpPulseNexus v-if="isClientReady" />
    </ClientOnly>

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
  color: #6ee7b7; /* emerald-300 (oppure #34d399 per emerald-400) */
  text-decoration: none;
  transition: color 0.15s ease;
}

a:hover {
  color: #22d3ee; /* cyan-400 */
  text-decoration: underline;
}

.prose a,
.markdown-body a,
article a:not([class]) {
  color: #6ee7b7;
  font-weight: 600;
  text-decoration: none;
}

.prose a:hover,
.markdown-body a:hover,
article a:not([class]):hover {
  color: #22d3ee;
  text-decoration: underline;
}
</style>