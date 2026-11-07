<!-- app/pages/tools/ai-repo-scanner.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'

useDkpSeo({
  title: 'AI Repository & Link Scanner v2.5-GOLD - DKP Tools',
  description: 'Analizza repository GitHub, misura il rank di reputazione, la sicurezza del codice e ottieni un piano d audit per scalare la classifica DKP.'
})

const { currentUser } = useAuthCore()
const currentUserId = computed(() => currentUser.value?.id || 1)

const targetUrl = ref('')
const loading = ref(false)
const isNotarizing = ref(false)
const scanResult = ref<any>(null)
const errorMessage = ref('')

const showToast = ref(false)
const toastMessage = ref('')

function triggerToast(msg: string) {
  toastMessage.value = msg
  showToast.value = true
  setTimeout(() => showToast.value = false, 3500)
}

async function runScan() {
  if (!targetUrl.value.trim()) return
  loading.value = true
  scanResult.value = null
  errorMessage.value = ''

  try {
    const res: any = await $fetch('/api/tools/ai-scan', {
      method: 'POST',
      body: { url: targetUrl.value, userId: currentUserId.value }
    })

    if (res && res.success) {
      scanResult.value = res.data
      triggerToast('✅ Audit completato! +50 XP registrati sul profilo.')
    } else {
      errorMessage.value = res?.error || 'Errore durante l\'analisi.'
    }
  } catch (err: any) {
    errorMessage.value = 'Errore di connessione con il server backend DKP.'
  } finally {
    loading.value = false
  }
}

async function notarizeToVault() {
  if (!scanResult.value) return
  isNotarizing.value = true

  try {
    const res: any = await $fetch('/api/user/vault', {
      method: 'POST',
      body: {
        userId: currentUserId.value,
        title: `Audit Repo: ${scanResult.value.repoName}`,
        code: JSON.stringify({
          url: scanResult.value.url,
          score: scanResult.value.overallScore,
          tier: scanResult.value.rankTier
        }, null, 2),
        sastStatus: scanResult.value.overallScore >= 85 ? 'PASSED' : 'WARNING'
      }
    })

    if (res && res.success) {
      triggerToast('🛡️ Audit notarizzato nel Vault! +100 XP extra.')
    }
  } catch (err) {
    triggerToast('❌ Errore durante la notarizzazione Vault.')
  } finally {
    isNotarizing.value = false
  }
}

function loadPreset(url: string) {
  targetUrl.value = url
  runScan()
}
</script>

<template>
  <div class="max-w-5xl mx-auto my-8 px-4 sm:px-6 font-sans text-slate-100 relative min-h-[80vh]">
    
    <!-- TOAST NOTIFICATION -->
    <Transition name="fade">
      <div v-if="showToast" class="fixed top-20 sm:top-5 right-1/2 translate-x-1/2 sm:translate-x-0 sm:right-5 bg-slate-950 border border-emerald-500 text-emerald-400 px-6 py-3 rounded-xl shadow-[0_4px_20px_rgba(16,185,129,0.25)] font-bold text-sm z-50 whitespace-nowrap text-center">
        {{ toastMessage }}
      </div>
    </Transition>

    <!-- HEADER HERO -->
    <header class="bg-[#090d16] border border-slate-800 rounded-3xl p-8 sm:p-14 text-center shadow-2xl mb-10 relative overflow-hidden">
      <!-- Glow background effect -->
      <div class="absolute -top-10 left-1/2 -translate-x-1/2 w-3/4 h-40 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div class="mb-5 relative z-10">
        <span class="inline-block bg-emerald-500/10 text-emerald-400 border border-emerald-500/50 px-4 py-1.5 rounded-full text-xs font-black tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.15)]">
          🤖 DKP AI CORE ENGINE v2.5-GOLD
        </span>
      </div>
      
      <h1 class="text-3xl sm:text-5xl font-black mb-4 text-white tracking-tight relative z-10">
        AI Repository & <span class="text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">Link Scanner</span>
      </h1>
      
      <p class="text-slate-400 max-w-2xl mx-auto mb-10 text-base sm:text-lg leading-relaxed relative z-10">
        Incolla l'URL di un repository o progetto: il motore IA analizzerà lo stack, calcolerà il <strong>Rank DKP</strong> e ti farà guadagnare punti XP!
      </p>

      <!-- SEARCH INPUT E BOTTONE -->
      <div class="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto relative z-10">
        <div class="relative flex-1">
          <span class="absolute left-4 top-1/2 -translate-y-1/2 text-xl pointer-events-none">🔗</span>
          <input 
            v-model="targetUrl" 
            type="url" 
            placeholder="https://github.com/username/repo..." 
            @keyup.enter="runScan"
            class="w-full py-3.5 px-4 pl-12 rounded-xl border border-slate-700 bg-slate-950 text-white focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50 outline-none transition-all placeholder:text-slate-500 shadow-inner"
          />
        </div>
        <button 
          @click="runScan" 
          :disabled="loading" 
          class="bg-emerald-500 text-slate-950 px-8 py-3.5 rounded-xl font-black hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:-translate-y-0.5 transition-all disabled:opacity-50 whitespace-nowrap"
        >
          {{ loading ? 'Scansione IA...' : 'Avvia Audit ⚡' }}
        </button>
      </div>

      <!-- PRESETS -->
      <div class="flex items-center justify-center gap-3 mt-8 flex-wrap relative z-10">
        <span class="text-xs text-slate-500 font-bold uppercase tracking-wider">Esempi rapidi:</span>
        <button @click="loadPreset('https://github.com/nuxt/nuxt')" class="bg-slate-950 border border-slate-700 text-sky-400 text-xs px-3 py-1.5 rounded-md hover:border-sky-400 hover:bg-sky-400/10 font-mono transition-colors">nuxt/nuxt</button>
        <button @click="loadPreset('https://github.com/alexdpl/dkp-core')" class="bg-slate-950 border border-slate-700 text-sky-400 text-xs px-3 py-1.5 rounded-md hover:border-sky-400 hover:bg-sky-400/10 font-mono transition-colors">dkp-core</button>
      </div>

      <!-- ERROR MESSAGE -->
      <div v-if="errorMessage" class="bg-red-500/15 border border-red-500/50 text-red-400 p-4 rounded-xl mt-6 font-bold text-sm max-w-2xl mx-auto relative z-10">
        ⚠️ {{ errorMessage }}
      </div>
    </header>

    <!-- RISULTATI SCAN -->
    <Transition name="fade">
      <div v-if="scanResult" class="bg-[#090d16] border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl">
        
        <!-- TOP BAR: NOME, RANK E SCORE -->
        <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center border-b border-slate-800 pb-6 mb-8 gap-6">
          <div class="w-full lg:w-auto">
            <span class="bg-sky-400/10 text-sky-400 border border-sky-400/30 text-[10px] font-black px-2.5 py-1 rounded tracking-widest uppercase">AUDIT REPORT DKP</span>
            <h2 class="text-2xl sm:text-3xl font-black text-white mt-3 mb-1 truncate">{{ scanResult.repoName }}</h2>
            <a :href="scanResult.url" target="_blank" class="text-xs sm:text-sm text-emerald-400 hover:underline font-mono truncate block max-w-full lg:max-w-md">{{ scanResult.url }} 🔗</a>
          </div>

          <div class="flex items-center gap-4 bg-slate-950 border border-slate-800 rounded-2xl p-4 w-full lg:w-auto justify-between lg:justify-start flex-wrap">
            <div class="flex flex-col items-center justify-center pr-4 border-r border-slate-800">
              <span class="text-[9px] sm:text-[10px] text-slate-500 font-black tracking-widest mb-1">RANK</span>
              <span class="text-base sm:text-lg text-purple-400 font-black drop-shadow-[0_0_10px_rgba(168,85,247,0.4)] leading-none">{{ scanResult.rankTier }}</span>
            </div>
            <div class="flex items-baseline bg-emerald-500/10 border border-emerald-500/40 px-3 py-2 rounded-xl">
              <span class="text-2xl sm:text-3xl font-black text-emerald-400 leading-none">{{ scanResult.overallScore }}</span>
              <span class="text-[10px] text-slate-400 font-bold ml-1">/100</span>
            </div>
            <button 
              @click="notarizeToVault" 
              :disabled="isNotarizing" 
              class="w-full sm:w-auto bg-sky-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs sm:text-sm hover:shadow-[0_0_15px_rgba(56,189,248,0.4)] transition-all disabled:opacity-50 mt-2 sm:mt-0"
            >
              {{ isNotarizing ? 'Notarizzazione...' : '🛡️ Salva nel Vault' }}
            </button>
          </div>
        </div>

        <!-- METRICHE -->
        <div class="mb-10">
          <h3 class="text-lg text-emerald-400 font-black mb-5 flex items-center gap-2">
            <span>📊</span> Valutazione Dettagliata
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div v-for="(metric, idx) in scanResult.rankMetrics" :key="idx" class="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-inner">
              <div class="flex justify-between items-center mb-3 text-sm font-bold">
                <span class="text-slate-300">{{ metric.label }}</span>
                <span :class="metric.color" class="font-black">{{ metric.score }}%</span>
              </div>
              <div class="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all duration-1000" :class="metric.bg" :style="{ width: metric.score + '%' }"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- STACK & SICUREZZA -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div class="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-inner">
            <h4 class="text-[11px] text-slate-500 font-black tracking-widest uppercase mb-4 flex items-center gap-2">
              <span>🔒</span> Sicurezza
            </h4>
            <p class="text-emerald-400 font-bold m-0 text-sm md:text-base">{{ scanResult.securityStatus }}</p>
          </div>
          
          <div class="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-inner">
            <h4 class="text-[11px] text-slate-500 font-black tracking-widest uppercase mb-4 flex items-center gap-2">
              <span>🛠️</span> Tech Stack
            </h4>
            <div class="flex gap-2 flex-wrap">
              <span 
                v-for="tech in scanResult.detectedStack" 
                :key="tech" 
                class="bg-sky-400/10 text-sky-400 border border-sky-400/30 px-3 py-1.5 rounded-lg text-xs font-bold"
              >
                {{ tech }}
              </span>
            </div>
          </div>
        </div>

        <!-- SUMMARY DELL'IA -->
        <div class="bg-emerald-500/10 border border-emerald-500/30 p-6 sm:p-8 rounded-2xl mb-10">
          <h4 class="text-emerald-400 font-black mb-3 text-sm flex items-center gap-2">
            <span>🤖</span> Sintesi dell'Agente Pulse Nexus
          </h4>
          <p class="text-slate-300 text-sm leading-relaxed m-0">{{ scanResult.aiSummary }}</p>
        </div>

        <!-- ACTION PLAN -->
        <div class="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8">
          <div class="mb-6">
            <h3 class="text-xl text-white font-black flex items-center gap-2">
              <span>🚀</span> Roadmap Miglioramenti
            </h3>
            <span class="text-xs sm:text-sm text-slate-400 mt-1 block">Risolvi questi task per sbloccare XP extra nel DB.</span>
          </div>

          <div class="flex flex-col gap-3">
            <div 
              v-for="(item, idx) in scanResult.improvementActionPlan" 
              :key="idx" 
              class="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-[#090d16] border border-slate-800 p-4 sm:p-5 rounded-xl transition-colors hover:border-emerald-500/30"
            >
              <div class="text-[10px] font-black px-2.5 py-1 rounded tracking-widest border shrink-0 uppercase" :class="item.color">
                {{ item.priority }}
              </div>
              <div class="flex-1">
                <p class="text-sm text-slate-200 font-medium m-0 leading-snug">{{ item.task }}</p>
              </div>
              <div class="shrink-0 mt-2 sm:mt-0">
                <span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-black px-2.5 py-1.5 rounded-lg shadow-sm">
                  ⭐ {{ item.xpGain }}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* Transizione fluida e premium per i risultati IA */
.fade-enter-active, .fade-leave-active { 
  transition: opacity 0.5s ease-out, transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
}
.fade-enter-from, .fade-leave-to { 
  opacity: 0; 
  transform: translateY(15px) scale(0.98); 
}
</style>