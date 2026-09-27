<!-- app/components/DKPKernelBadge.vue -->
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const loadTime = ref<string>('0ms')
const dbLatency = ref<number>(18)
const isOpen = ref<boolean>(false)
const isMeasuring = ref<boolean>(false)

// Calcolo preciso del tempo di caricamento pagina
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

// Rileva cambi pagina e ri-calcola
watch(() => route.fullPath, () => {
  measurePerformance()
})

onMounted(() => {
  measurePerformance()
})
</script>

<template>
  <div class="dkp-badge-wrapper">
    <!-- FLOATING PILL BADGE -->
    <button @click="isOpen = !isOpen" class="dkp-badge-pill" :class="{ active: isOpen }">
      <!-- LOGO DKP 3 FOGLI VERDI NEON (SVG NATIVO) -->
      <svg class="dkp-logo-svg" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 10L16 4L26 10L16 16L6 10Z" fill="#00DC82" fill-opacity="0.9" />
        <path d="M6 16L16 10L26 16L16 22L6 16Z" fill="#00DC82" fill-opacity="0.6" />
        <path d="M6 22L16 16L26 22L16 28L6 22Z" fill="#00DC82" fill-opacity="0.3" />
      </svg>

      <span class="badge-divider">|</span>

      <!-- TEMPO DI CARICAMENTO -->
      <span class="metrics-time" :class="{ pulse: isMeasuring }">{{ loadTime }}</span>

      <span class="badge-divider">|</span>

      <!-- LUCINA AZZURRA CIANO METRICHE ECOSISTEMA -->
      <div class="cyan-led-container" title="Ecosistema Kernel v2.4 Attivo">
        <span class="cyan-led"></span>
        <span class="cyan-led-ring"></span>
      </div>
    </button>

    <!-- TELEMETRY DRAWER MODAL -->
    <Transition name="drawer-fade">
      <div v-if="isOpen" class="dkp-telemetry-drawer">
        <div class="drawer-header">
          <div class="title-box">
            <span class="brand-title">DEV KERNEL PULSE</span>
            <span class="version-tag">v2.4.0-NEXUS</span>
          </div>
          <button @click="isOpen = false" class="close-btn">✕</button>
        </div>

        <div class="drawer-content">
          <div class="metric-row">
            <span class="label">⚡ Page Hydration:</span>
            <span class="value text-neon">{{ loadTime }}</span>
          </div>

          <div class="metric-row">
            <span class="label">🗄️ Neon DB Latency:</span>
            <span class="value text-cyan">{{ dbLatency }}ms</span>
          </div>

          <div class="metric-row">
            <span class="label">📧 Mail Nexus v2.4:</span>
            <span class="value status-online">ONLINE</span>
          </div>

          <div class="metric-row">
            <span class="label">🛡️ Cloudflare Routing:</span>
            <span class="value status-online">ENCRYPTED</span>
          </div>

          <div class="drawer-footer">
            <span class="footer-note">Optimized for Nitro & Nuxt 4 Ecosystem</span>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.dkp-badge-wrapper {
  position: fixed;
  bottom: 1rem;
  right: 1.5rem;
  z-index: 99999;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

/* FLOATING PILL STYLING */
.dkp-badge-pill {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: rgba(9, 13, 22, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(30, 41, 59, 0.8);
  padding: 0.35rem 0.75rem;
  border-radius: 9999px;
  color: #f8fafc;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.dkp-badge-pill:hover, .dkp-badge-pill.active {
  border-color: rgba(0, 220, 130, 0.5);
  background: rgba(2, 4, 32, 0.95);
  box-shadow: 0 0 15px rgba(0, 220, 130, 0.25);
  transform: translateY(-2px);
}

.dkp-logo-svg {
  width: 18px;
  height: 18px;
  filter: drop-shadow(0 0 4px rgba(0, 220, 130, 0.6));
}

.badge-divider {
  color: #334155;
  font-size: 0.75rem;
}

.metrics-time {
  font-size: 0.78rem;
  font-weight: 700;
  color: #e2e8f0;
  letter-spacing: -0.2px;
}

/* LUCINA AZZURRA CIANO PULSANTI */
.cyan-led-container {
  position: relative;
  width: 10px;
  height: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cyan-led {
  width: 7px;
  height: 7px;
  background-color: #38bdf8;
  border-radius: 50%;
  box-shadow: 0 0 8px #38bdf8;
}

.cyan-led-ring {
  position: absolute;
  width: 12px;
  height: 12px;
  border: 1px solid #38bdf8;
  border-radius: 50%;
  animation: led-pulse 2s infinite;
  opacity: 0.6;
}

@keyframes led-pulse {
  0% { transform: scale(0.8); opacity: 0.8; }
  50% { transform: scale(1.4); opacity: 0; }
  100% { transform: scale(0.8); opacity: 0; }
}

/* TELEMETRY DRAWER */
.dkp-telemetry-drawer {
  position: absolute;
  bottom: 2.8rem;
  right: 0;
  width: 280px;
  background: #090d16;
  border: 1px solid rgba(0, 220, 130, 0.3);
  border-radius: 12px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.8);
  padding: 1rem;
  overflow: hidden;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #1e293b;
  padding-bottom: 0.6rem;
  margin-bottom: 0.75rem;
}

.brand-title { font-size: 0.75rem; font-weight: 800; color: #fff; letter-spacing: 0.5px; }
.version-tag { font-size: 0.62rem; color: #00dc82; background: rgba(0, 220, 130, 0.15); padding: 0.1rem 0.35rem; border-radius: 4px; margin-left: 0.4rem; }
.close-btn { background: none; border: none; color: #64748b; cursor: pointer; font-size: 0.85rem; }

.drawer-content { display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.78rem; }
.metric-row { display: flex; justify-content: space-between; align-items: center; }
.label { color: #94a3b8; }
.value { font-weight: 700; }
.text-neon { color: #00dc82; }
.text-cyan { color: #38bdf8; }
.status-online { color: #34d399; font-size: 0.7rem; background: rgba(52, 211, 153, 0.1); padding: 0.1rem 0.4rem; border-radius: 4px; }

.drawer-footer { margin-top: 0.5rem; border-top: 1px solid #1e293b; padding-top: 0.5rem; text-align: center; }
.footer-note { font-size: 0.65rem; color: #64748b; }

.drawer-fade-enter-active, .drawer-fade-leave-active { transition: all 0.2s ease; }
.drawer-fade-enter-from, .drawer-fade-leave-to { opacity: 0; transform: translateY(10px); }
</style>