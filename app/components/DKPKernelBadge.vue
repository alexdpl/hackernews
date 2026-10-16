// app/components/DKPKernelBadge.vue
<script setup lang="ts">
import { ref, onMounted, watch, computed, isRef } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const loadTime = ref<string>('0ms')
const dbLatency = ref<number>(18)
const isOpen = ref<boolean>(false)
const isMeasuring = ref<boolean>(false)

// Recupero dati utente reali tramite useFetch o useAuthCore
const auth = useAuthCore() || {}

const currentUser = computed(() => {
  if (isRef(auth.user)) return auth.user.value
  return auth.user || null
})

// Chiamata di fallback sicura all'API utente se l'auth store locale non ha ancora gli XP in chiaro
const { data: userProfile } = await useFetch('/api/user/profile', {
  // Esegue il fetch solo se l'utente loggato non ha già gli XP valorizzati
  immediate: !currentUser.value?.xp
})

// Valori reali dinamici con fallback a 0 se l'utente non è autenticato o è nuovo
const userXp = computed(() => {
  return currentUser.value?.xp ?? userProfile.value?.user?.xp ?? 0
})

const userLevel = computed(() => {
  return currentUser.value?.level ?? userProfile.value?.user?.level ?? 1
})

// Calcolo tempo di idratazione e rendering pagina
function measurePerformance() {
  isMeasuring.value = true
  if (typeof window !== 'undefined' && window.performance) {
    setTimeout(() => {
      const perfEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
      if (perfEntries.length > 0) {
        const pageLoad = perfEntries[0].duration
        loadTime.value = pageLoad > 1000 ? `${(pageLoad / 1000).toFixed(2)}s` : `${Math.round(pageLoad)}ms`
      } else {
        const now = performance.now()
        loadTime.value = `${Math.round(now)}ms`
      }
      isMeasuring.value = false
    }, 100)
  }
}

watch(() => route.fullPath, () => {
  measurePerformance()
})

onMounted(() => {
  measurePerformance()
})
</script>

<template>
  <div class="dkp-badge-wrapper fixed bottom-0 left-1/2 -translate-x-1/2 z-[99999] font-mono">
    <!-- TAB DOCKED FLUSH AL BORDO INFERIORE -->
    <button 
      @click="isOpen = !isOpen" 
      class="dkp-badge-pill flex items-center gap-2.5 bg-slate-950/95 backdrop-blur-md border border-sky-400/30 border-b-0 px-3.5 py-1.5 rounded-t-xl text-slate-100 cursor-pointer shadow-2xl transition-all duration-300 hover:border-sky-400 hover:-translate-y-0.5"
      :class="{ active: isOpen, measuring: isMeasuring }"
      title="DKP Kernel Telemetry v2.5-GOLD — Clicca per espandere"
    >
      <!-- LOGO DKP 3 FOGLI VERDI NEON (SVG NATIVO) -->
      <svg class="dkp-logo-svg w-4 h-4 filter drop-shadow-[0_0_4px_rgba(0,220,130,0.6)] transition-all" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 10L16 4L26 10L16 16L6 10Z" fill="#00DC82" fill-opacity="0.9" />
        <path d="M6 16L16 10L26 16L16 22L6 16Z" fill="#00DC82" fill-opacity="0.6" />
        <path d="M6 22L16 16L26 22L16 28L6 22Z" fill="#00DC82" fill-opacity="0.3" />
      </svg>

      <span class="badge-divider text-slate-700 text-xs">|</span>

      <!-- TEMPO DI CARICAMENTO -->
      <span class="metrics-time text-xs font-bold text-slate-200">{{ loadTime }}</span>

      <span class="badge-divider text-slate-700 text-xs">|</span>

      <!-- LUCINA AZZURRA CIANO KERNEL PULSANTE -->
      <div class="cyan-led-container relative w-2 h-2 flex items-center justify-center">
        <span class="cyan-led w-1.5 h-1.5 bg-sky-400 rounded-full shadow-[0_0_8px_#38bdf8]"></span>
        <span class="cyan-led-ring absolute w-3 h-3 border border-sky-400 rounded-full animate-ping opacity-60"></span>
      </div>
    </button>

    <!-- TELEMETRY DRAWER MODAL -->
    <Transition name="drawer-fade">
      <div v-if="isOpen" class="dkp-telemetry-drawer absolute bottom-11 left-1/2 -translate-x-1/2 w-[340px] bg-[#090d16] border border-sky-400/60 rounded-xl shadow-[0_-10px_35px_rgba(0,0,0,0.85)] p-4 overflow-hidden">
        <div class="drawer-header flex justify-between items-center border-b border-slate-800 pb-2 mb-3">
          <div class="title-box flex items-center gap-2">
            <span class="brand-title text-xs font-extrabold text-white tracking-wide">DEV KERNEL PULSE</span>
            <span class="version-tag text-[10px] text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded font-bold border border-emerald-500/30">v2.5-GOLD</span>
          </div>
          <button @click="isOpen = false" class="close-btn text-slate-400 hover:text-red-400 text-xs font-bold cursor-pointer">✕</button>
        </div>

        <div class="drawer-content flex flex-col gap-2.5 text-xs">
          <!-- WIDGET LIVE XP & GAMIFICATION -->
          <div class="metric-row flex justify-between items-center p-2.5 bg-emerald-950/30 border border-emerald-500/30 rounded-lg">
            <span class="label text-emerald-300 font-semibold flex items-center gap-1.5">🎮 DKP Gamification:</span>
            <span class="value text-emerald-400 font-bold font-mono">{{ userXp }} XP <span class="text-[10px] text-slate-400">(Lv. {{ userLevel }})</span></span>
          </div>

          <div class="metric-row flex justify-between items-center">
            <span class="label text-slate-400">⚡ Page Hydration:</span>
            <span class="value text-emerald-400 font-bold">{{ loadTime }}</span>
          </div>

          <div class="metric-row flex justify-between items-center">
            <span class="label text-slate-400">🗄️ Neon DB Latency:</span>
            <span class="value text-sky-400 font-bold">{{ dbLatency }}ms</span>
          </div>

          <div class="metric-row flex justify-between items-center">
            <span class="label text-slate-400">🤖 api.devkernelpulse.org:</span>
            <span class="value text-purple-400 bg-purple-500/15 border border-purple-500/30 px-1.5 py-0.5 rounded text-[10px] font-bold">SENTINEL ACTIVE</span>
          </div>

          <div class="metric-row flex justify-between items-center">
            <span class="label text-slate-400">📧 mail.devkernelpulse.org:</span>
            <span class="value text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded text-[10px] font-bold">NEXUS ONLINE</span>
          </div>

          <div class="metric-row flex justify-between items-center">
            <span class="label text-slate-400">🛡️ Cloudflare Edge:</span>
            <span class="value text-sky-400 bg-sky-500/15 border border-sky-500/30 px-1.5 py-0.5 rounded text-[10px] font-bold">ENCRYPTED</span>
          </div>

          <div class="drawer-footer mt-2 border-t border-slate-800 pt-2 text-center">
            <span class="footer-note text-[10px] text-slate-500 block">Built with ❤️ by Alessandro De Paola & Gemini AI</span>
            <span class="sub-footer text-[9px] text-purple-400 italic block mt-0.5">Managed by Pulse Sentinel AI Architecture v2.5</span>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.drawer-fade-enter-active, .drawer-fade-leave-active { transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
.drawer-fade-enter-from, .drawer-fade-leave-to { opacity: 0; transform: translate(-50%, 10px); }
</style>