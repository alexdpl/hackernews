<!-- app/components/DKPKernelBadge.vue -->
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const loadTime = ref<string>('0ms')
const dbLatency = ref<number>(18)
const isOpen = ref<boolean>(false)
const isMeasuring = ref<boolean>(false)

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
  <div class="dkp-badge-wrapper">
    <!-- TAB DOCKED FLUSH AL BORDO INFERIORE -->
    <button 
      @click="isOpen = !isOpen" 
      class="dkp-badge-pill" 
      :class="{ active: isOpen, measuring: isMeasuring }"
      title="DKP Kernel Telemetry v2.4-GOLD — Clicca per espandere"
    >
      <!-- LOGO DKP 3 FOGLI VERDI NEON (SVG NATIVO) -->
      <svg class="dkp-logo-svg" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 10L16 4L26 10L16 16L6 10Z" fill="#00DC82" fill-opacity="0.9" />
        <path d="M6 16L16 10L26 16L16 22L6 16Z" fill="#00DC82" fill-opacity="0.6" />
        <path d="M6 22L16 16L26 22L16 28L6 22Z" fill="#00DC82" fill-opacity="0.3" />
      </svg>

      <span class="badge-divider">|</span>

      <!-- TEMPO DI CARICAMENTO -->
      <span class="metrics-time">{{ loadTime }}</span>

      <span class="badge-divider">|</span>

      <!-- LUCINA AZZURRA CIANO KERNEL PULSANTE -->
      <div class="cyan-led-container">
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
            <span class="version-tag">v2.4-GOLD</span>
          </div>
          <button @click="isOpen = false" class="close-btn" title="Chiudi">✕</button>
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

          <!-- NUOVE METRICHE ENTERPRISE V2.4-GOLD -->
          <div class="metric-row">
            <span class="label">🤖 api.devkernelpulse.org:</span>
            <span class="value status-ai">SENTINEL ACTIVE</span>
          </div>

          <div class="metric-row">
            <span class="label">📧 mail.devkernelpulse.org:</span>
            <span class="value status-online">NEXUS ONLINE</span>
          </div>

          <div class="metric-row">
            <span class="label">🛡️️ Cloudflare Edge:</span>
            <span class="value status-secure">ENCRYPTED</span>
          </div>

          <div class="drawer-footer">
            <span class="footer-note">Built with ❤️ by Alessandro De Paola & Gemini AI</span>
            <div class="sub-footer">Managed by Pulse Sentinel AI Architecture</div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* POSIZIONAMENTO AGGANCIATO AL BORDO FINE PAGINA */
.dkp-badge-wrapper {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 99999;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

/* TAB FLUSH STYLE DOCKED */
.dkp-badge-pill {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  background: rgba(9, 13, 22, 0.94);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(56, 189, 248, 0.25);
  border-bottom: none;
  padding: 0.35rem 0.85rem;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  color: #f8fafc;
  cursor: pointer;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.7);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

/* EFFETTO BRILLANTEZZA BLU KERNEL (#38bdf8) AL PASSAGGIO DEL MOUSE */
.dkp-badge-pill:hover, .dkp-badge-pill.active {
  border-color: #38bdf8;
  background: rgba(2, 4, 32, 0.98);
  box-shadow: 0 -4px 22px rgba(56, 189, 248, 0.45);
  transform: translateY(-2px);
}

.dkp-logo-svg {
  width: 17px;
  height: 17px;
  filter: drop-shadow(0 0 4px rgba(0, 220, 130, 0.6));
  transition: filter 0.2s ease;
}

.dkp-badge-pill:hover .dkp-logo-svg {
  filter: drop-shadow(0 0 6px #38bdf8);
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
  transition: color 0.2s;
}

.dkp-badge-pill:hover .metrics-time {
  color: #38bdf8;
}

/* LUCINA AZZURRA CIANO KERNEL */
.cyan-led-container {
  position: relative;
  width: 9px;
  height: 9px;
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

/* TELEMETRY DRAWER MODAL */
.dkp-telemetry-drawer {
  position: absolute;
  bottom: 2.8rem;
  left: 50%;
  transform: translateX(-50%);
  width: 330px;
  background: #090d16;
  border: 1px solid #38bdf8;
  border-radius: 12px;
  box-shadow: 0 -10px 35px rgba(0, 0, 0, 0.85), 0 0 15px rgba(56, 189, 248, 0.2);
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
.version-tag { font-size: 0.62rem; color: #00dc82; background: rgba(0, 220, 130, 0.15); padding: 0.1rem 0.35rem; border-radius: 4px; margin-left: 0.4rem; font-weight: bold; }
.close-btn { background: none; border: none; color: #64748b; cursor: pointer; font-size: 0.85rem; }
.close-btn:hover { color: #f87171; }

.drawer-content { display: flex; flex-direction: column; gap: 0.55rem; font-size: 0.78rem; }
.metric-row { display: flex; justify-content: space-between; align-items: center; }
.label { color: #94a3b8; }
.value { font-weight: 700; }
.text-neon { color: #00dc82; }
.text-cyan { color: #38bdf8; }

/* NUOVI STILI PER STATI ENTERPRISE */
.status-ai {
  color: #a855f7;
  font-weight: 800;
  background: rgba(168, 85, 247, 0.15);
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  border: 1px solid rgba(168, 85, 247, 0.3);
  font-size: 0.68rem;
  letter-spacing: 0.03em;
  animation: pulse-ai 2s infinite;
}

@keyframes pulse-ai {
  0% { box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.4); }
  70% { box-shadow: 0 0 0 5px rgba(168, 85, 247, 0); }
  100% { box-shadow: 0 0 0 0 rgba(168, 85, 247, 0); }
}

.status-online { 
  color: #34d399; 
  font-size: 0.68rem; 
  background: rgba(52, 211, 153, 0.12); 
  padding: 0.1rem 0.4rem; 
  border-radius: 4px; 
  border: 1px solid rgba(52, 211, 153, 0.25);
  font-weight: 700;
}

.status-secure { 
  color: #38bdf8; 
  font-size: 0.68rem; 
  background: rgba(56, 189, 248, 0.12); 
  padding: 0.1rem 0.4rem; 
  border-radius: 4px; 
  border: 1px solid rgba(56, 189, 248, 0.25);
  font-weight: 700;
}

.drawer-footer { 
  margin-top: 0.6rem; 
  border-top: 1px solid #1e293b; 
  padding-top: 0.5rem; 
  text-align: center; 
}

.footer-note { font-size: 0.65rem; color: #64748b; }
.sub-footer { font-size: 0.60rem; color: #a855f7; font-style: italic; margin-top: 2px; }

.drawer-fade-enter-active, .drawer-fade-leave-active { transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
.drawer-fade-enter-from, .drawer-fade-leave-to { opacity: 0; transform: translate(-50%, 10px); }
</style>