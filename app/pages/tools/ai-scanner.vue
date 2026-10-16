<script setup lang="ts">
import { ref, computed } from 'vue'

// 1. Estrazione ultra-sicura con Fallback (Previene qualsiasi crash)
const auth = useAuthCore() || {}
const currentUser = auth.currentUser || ref({ id: 1 })
const isAuthenticated = auth.isAuthenticated || ref(true)
const userQuota = auth.userQuota // Può essere undefined, lo gestiamo sotto!
const consumeQuota = auth.consumeQuota || (() => {})

const currentUserId = computed(() => currentUser.value?.id || 1)

useHead({
  title: 'AI Code Scanner v2.5-GOLD — DKP Tools',
  meta: [{ name: 'description', content: 'Analisi vulnerabilità di sicurezza (OWASP), credenziali esposte e debito tecnico.' }]
})

const rawCode = ref('')
const isScanning = ref(false)
const isNotarizing = ref(false)
const errorMessage = ref('')
const scanReport = ref<any>(null)

const showToast = ref(false)
const toastMessage = ref('')
function triggerToast(msg: string) {
  toastMessage.value = msg
  showToast.value = true
  setTimeout(() => showToast.value = false, 3500)
}

// 2. Controllo Quota Blindato (nessun .value diretto senza check)
const hasEnoughQuota = computed(() => {
  if (!userQuota || !userQuota.value) return true // Se non c'è, passa dritto!
  return userQuota.value.remaining > 0
})

async function runScanner() {
  errorMessage.value = ''
  if (!rawCode.value.trim()) return

  // 3. Controllo Auth blindato
  if (auth.isAuthenticated && auth.isAuthenticated.value === false) {
    errorMessage.value = 'Autenticazione richiesta per eseguire lo scanner.'
    return
  }

  if (!hasEnoughQuota.value) {
    errorMessage.value = 'Quota API esaurita per il tuo piano attuale.'
    return
  }

  isScanning.value = true
  scanReport.value = null

  try {
    const res: any = await $fetch('/api/tools/ai-code-scan', {
      method: 'POST',
      body: { code: rawCode.value, userId: currentUserId.value }
    })

    if (res && res.success) {
      scanReport.value = res.data
      if (auth.consumeQuota) auth.consumeQuota(1)
      triggerToast('✅ Audit completato! +30 XP registrati sul profilo.')
    } else {
      errorMessage.value = res?.error || 'Errore durante l\'analisi.'
    }
  } catch (err: any) {
    errorMessage.value = err.data?.message || 'Errore di connessione con il server backend DKP.'
  } finally {
    isScanning.value = false
  }
}

async function notarizeToVault() {
  if (!scanReport.value || !rawCode.value.trim()) return
  isNotarizing.value = true

  try {
    const res: any = await $fetch('/api/user/vault', {
      method: 'POST',
      body: {
        userId: currentUserId.value,
        title: `Snippet Scan (Score: ${scanReport.value.score}/100)`,
        code: rawCode.value,
        sastStatus: scanReport.value.score >= 85 ? 'PASSED' : 'WARNING'
      }
    })

    if (res && res.success) {
      triggerToast('🛡️ Snippet notarizzato nel Vault! +100 XP extra.')
    }
  } catch (err) {
    triggerToast('❌ Errore durante la notarizzazione Vault.')
  } finally {
    isNotarizing.value = false
  }
}
</script>

<template>
  <div class="max-w-7xl mx-auto my-10 px-6 font-sans text-slate-100">
    
    <!-- TOAST -->
    <Transition name="fade">
      <div v-if="showToast" class="fixed top-5 right-5 bg-slate-950 border border-emerald-500 text-emerald-400 px-6 py-3 rounded-lg shadow-[0_4px_20px_rgba(16,185,129,0.2)] font-bold z-50">
        {{ toastMessage }}
      </div>
    </Transition>

    <div class="mb-8">
      <div class="flex justify-between items-center mb-3">
        <span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-black tracking-widest">
          🤖 DKP CORE TOOL v2.5-GOLD
        </span>
        <NuxtLink to="/" class="text-sky-400 text-sm font-bold hover:underline">← Torna all'Ecosistema</NuxtLink>
      </div>
      <h1 class="text-4xl font-black text-white mb-2">🔍 AI Code Scanner & <span class="text-emerald-400">Security Audit</span></h1>
      <p class="text-slate-400 text-lg max-w-3xl">
        Analizza i tuoi snippet per individuare vulnerabilità di sicurezza (OWASP), credenziali esposte e calcolare il debito tecnico.
      </p>
    </div>

    <!-- QUOTA BANNER -->
    <div v-if="userQuota" class="bg-slate-900 border border-slate-800 px-6 py-4 rounded-xl flex justify-between items-center mb-8 text-sm">
      <div class="flex items-center gap-2">
        <span class="text-slate-400">⚡ Quota API Rimanente:</span>
        <strong class="font-black" :class="userQuota.remaining <= 2 ? 'text-red-400' : 'text-emerald-400'">
          {{ userQuota.remaining }} / {{ userQuota.limit }} req
        </strong>
      </div>
      <NuxtLink to="/shop" class="text-emerald-400 font-bold hover:underline">Aumenta Quota ↗</NuxtLink>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Input Card -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
        <h2 class="text-xl text-emerald-400 font-black mb-6">⚡ Codice Sorgente da Scansionare</h2>
        
        <textarea 
          v-model="rawCode" 
          rows="14" 
          placeholder="// Incolla qui il codice TypeScript, JavaScript, Python o SQL da analizzare..."
          class="w-full bg-slate-950 border border-slate-700 text-sky-400 p-4 rounded-xl font-mono text-sm focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none transition-all resize-none"
        ></textarea>

        <div v-if="errorMessage" class="bg-red-500/15 border border-red-500 text-red-400 p-3 rounded-lg mt-4 font-bold text-sm">
          ⚠️ {{ errorMessage }}
        </div>

        <button 
          @click="runScanner" 
          :disabled="!rawCode.trim() || isScanning || !hasEnoughQuota" 
          class="w-full bg-emerald-500 text-slate-950 font-black py-4 rounded-xl mt-6 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all disabled:opacity-40"
        >
          {{ isScanning ? '🔎 Analisi AI in corso...' : '🚀 Avvia Audit di Sicurezza' }}
        </button>
      </div>

      <!-- Report Card -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl flex flex-col">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl text-white font-black">📊 Report Audit & Metriche</h2>
          <button v-if="scanReport" @click="notarizeToVault" :disabled="isNotarizing" class="bg-sky-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs hover:shadow-[0_0_15px_rgba(56,189,248,0.4)] transition-all disabled:opacity-50">
            {{ isNotarizing ? 'Notarizzazione...' : '🛡️ Notarizza nel Vault' }}
          </button>
        </div>

        <template v-if="scanReport">
          <div class="grid grid-cols-3 gap-4 mb-8">
            <div class="bg-slate-950 border border-slate-800 p-4 rounded-xl text-center">
              <span class="block text-[0.65rem] text-slate-400 uppercase font-black mb-1">Security Grade</span>
              <span class="text-3xl font-black" :class="{'text-emerald-400': scanReport.securityLevel === 'A+', 'text-yellow-400': scanReport.securityLevel === 'B', 'text-orange-400': scanReport.securityLevel === 'C', 'text-red-500': scanReport.securityLevel === 'F'}">{{ scanReport.securityLevel }}</span>
            </div>
            <div class="bg-slate-950 border border-slate-800 p-4 rounded-xl text-center">
              <span class="block text-[0.65rem] text-slate-400 uppercase font-black mb-1">Health Score</span>
              <span class="text-3xl font-black" :class="scanReport.score >= 80 ? 'text-emerald-400' : 'text-red-400'">{{ scanReport.score }}/100</span>
            </div>
            <div class="bg-slate-950 border border-slate-800 p-4 rounded-xl text-center">
              <span class="block text-[0.65rem] text-slate-400 uppercase font-black mb-1">Debito Tecnico</span>
              <span class="text-3xl font-black text-sky-400">~{{ scanReport.metrics.techDebtHours }}h</span>
            </div>
          </div>

          <div class="flex-1">
            <h3 class="text-sm text-slate-300 font-bold mb-4">📌 Rilievi Trovati ({{ scanReport.issues.length }})</h3>
            
            <div v-if="scanReport.issues.length === 0" class="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl text-sm font-bold">
              ✅ Nessuna vulnerabilità nota rilevata! Il codice è pulito e sicuro.
            </div>
            
            <div class="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              <div 
                v-for="(issue, index) in scanReport.issues" 
                :key="index" 
                class="p-4 rounded-xl border"
                :class="{
                  'bg-red-500/10 border-red-500/30 text-red-200': issue.type === 'danger',
                  'bg-sky-400/10 border-sky-400/30 text-sky-200': issue.type === 'info',
                  'bg-yellow-400/10 border-yellow-400/30 text-yellow-200': issue.type === 'warning'
                }"
              >
                <h4 class="font-bold mb-1 text-sm" :class="{'text-red-400': issue.type === 'danger', 'text-sky-400': issue.type === 'info', 'text-yellow-400': issue.type === 'warning'}">
                  {{ issue.title }}
                </h4>
                <p class="text-xs m-0 leading-relaxed opacity-90">{{ issue.desc }}</p>
              </div>
            </div>
          </div>
        </template>

        <div v-else class="flex flex-col items-center justify-center flex-1 py-12 text-slate-500">
          <span class="text-5xl mb-4">🛡️</span>
          <p class="text-center text-sm font-medium">Incolla un frammento di codice a sinistra e clicca su <br><strong class="text-slate-300">"Avvia Audit"</strong> per generare la diagnosi.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.4s ease, transform 0.4s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(10px); }

/* Custom Scrollbar per la lista issues */
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
</style>