<!-- app/pages/tools/ai-scanner.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'

// 1. Estrazione ultra-sicura con Fallback
const auth = useAuthCore() || {}
const currentUser = auth.currentUser || ref({ id: 1 })
const isAuthenticated = auth.isAuthenticated || ref(true)
const userQuota = auth.userQuota
const consumeQuota = auth.consumeQuota || (() => {})

const currentUserId = computed(() => currentUser.value?.id || 1)

useDkpSeo({
  title: 'AI Code Scanner v2.6-PURE-SQL — DKP Tools',
  description: 'Analisi vulnerabilità di sicurezza (OWASP), credenziali esposte, SQL injection e debito tecnico negli snippet di codice.'
})

const rawCode = ref('')
const isScanning = ref(false)
const isNotarizing = ref(false)
const isNotarized = ref(false)
const errorMessage = ref('')
const scanReport = ref<any>(null)

const showToast = ref(false)
const toastMessage = ref('')

function triggerToast(msg: string) {
  toastMessage.value = msg
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3500)
}

function notifyXpUpdate() {
  if (import.meta.client && typeof window !== 'undefined') {
    window.dispatchEvent(new Event('dkp:xp_updated'))
  }
}

// 2. Controllo Quota Blindato
const hasEnoughQuota = computed(() => {
  if (!userQuota || !userQuota.value) return true
  return userQuota.value.remaining > 0
})

function loadSampleCode(type: 'vulnerable' | 'secure') {
  scanReport.value = null
  isNotarized.value = false
  errorMessage.value = ''

  if (type === 'vulnerable') {
    rawCode.value = `// Esempio Query Non Parametrizzata (Rischio SQL Injection)
export async function getUserByEmail(db: any, userInput: string) {
  const apiKey = ['sk', 'demo', 'placeholder', '9912'].join('-')
  const query = "SELECT * FROM users WHERE email = '" + userInput + "'";
  return await db.unsafe(query);
}`
  } else {
    rawCode.value = `// Esempio Query Pure SQL Parametrizzata (DKP v2.6 Standard)
export async function getUserByEmail(sql: any, email: string) {
  const normalized = email.trim().toLowerCase();
  const rows = await sql\`
    SELECT id, username, role, created_at
    FROM users
    WHERE email = \${normalized}
    LIMIT 1
  \`;
  return rows[0] || null;
}`
  }
}

function clearEditor() {
  rawCode.value = ''
  scanReport.value = null
  isNotarized.value = false
  errorMessage.value = ''
}

async function runScanner() {
  errorMessage.value = ''
  if (!rawCode.value.trim()) return

  if (isAuthenticated.value === false) {
    errorMessage.value = 'Autenticazione richiesta per eseguire lo scanner.'
    return
  }

  if (!hasEnoughQuota.value) {
    errorMessage.value = 'Quota API esaurita per il tuo piano attuale.'
    return
  }

  isScanning.value = true
  scanReport.value = null
  isNotarized.value = false

  try {
    const res: any = await $fetch('/api/tools/ai-code-scan', {
      method: 'POST',
      body: { code: rawCode.value, userId: currentUserId.value }
    })

    if (res && res.success) {
      scanReport.value = res.data
      consumeQuota(1)
      notifyXpUpdate()
      triggerToast('✅ Audit SAST completato! +30 XP registrati sul profilo.')
    } else {
      errorMessage.value = res?.error || 'Errore durante l\'analisi.'
    }
  } catch (err: any) {
    errorMessage.value = err?.data?.statusMessage || err?.data?.message || 'Errore di connessione con il server backend DKP.'
  } finally {
    isScanning.value = false
  }
}

async function notarizeToVault() {
  if (!scanReport.value || !rawCode.value.trim() || isNotarizing.value || isNotarized.value) return
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
      isNotarized.value = true
      notifyXpUpdate()
      triggerToast('🛡️ Snippet notarizzato nel Vault! +100 XP extra.')
    }
  } catch {
    triggerToast('❌ Errore durante la notarizzazione Vault.')
  } finally {
    isNotarizing.value = false
  }
}
</script>

<template>
  <div class="max-w-7xl mx-auto my-10 px-4 sm:px-6 font-sans text-slate-100 min-h-[85vh]">
    
    <!-- TOAST NOTIFICATION -->
    <Transition name="fade">
      <div
        v-if="showToast"
        role="status"
        class="fixed top-20 sm:top-5 right-1/2 translate-x-1/2 sm:translate-x-0 sm:right-5 bg-slate-950 border border-emerald-500 text-emerald-400 px-6 py-3 rounded-xl shadow-[0_4px_20px_rgba(16,185,129,0.25)] font-bold text-sm z-50 whitespace-nowrap text-center"
      >
        {{ toastMessage }}
      </div>
    </Transition>

    <!-- HEADER SEZIONE -->
    <div class="mb-10 text-center sm:text-left relative">
      <div class="absolute top-0 left-0 w-full h-32 bg-sky-500/10 blur-[100px] pointer-events-none rounded-full"></div>
      
      <div class="flex flex-col sm:flex-row sm:justify-between items-center mb-4 gap-4 relative z-10">
        <span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-4 py-1.5 rounded-full text-xs font-mono font-black tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.15)] uppercase">
          🤖 DKP CORE TOOL v2.6-PURE-SQL
        </span>
        <NuxtLink to="/tools" class="text-sky-400 text-sm font-bold hover:text-sky-300 hover:underline transition-colors no-underline">
          ← Torna al Toolkit
        </NuxtLink>
      </div>
      
      <h1 class="text-3xl sm:text-5xl font-black text-white mb-4 tracking-tight relative z-10">
        🔍 AI Code Scanner &amp; <span class="text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">Security Audit</span>
      </h1>
      
      <p class="text-slate-400 text-base sm:text-lg max-w-3xl mx-auto sm:mx-0 leading-relaxed relative z-10">
        Analizza i tuoi snippet per individuare vulnerabilità di sicurezza (OWASP), SQL injection, credenziali esposte e calcolare il debito tecnico.
      </p>
    </div>

    <!-- QUOTA BANNER -->
    <div v-if="userQuota" class="bg-[#090d16] border border-slate-800 px-6 py-4 rounded-xl flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 shadow-lg">
      <div class="flex items-center gap-2">
        <span class="text-slate-400 text-sm">⚡ Quota API Rimanente:</span>
        <strong class="font-black text-lg" :class="userQuota.remaining <= 2 ? 'text-red-400 drop-shadow-[0_0_10px_rgba(248,113,113,0.3)]' : 'text-emerald-400'">
          {{ userQuota.remaining }} / {{ userQuota.limit }} req
        </strong>
      </div>
      <NuxtLink to="/shop" class="text-emerald-400 text-sm font-bold hover:text-emerald-300 hover:underline transition-colors no-underline">
        Aumenta Quota ↗
      </NuxtLink>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      <!-- INPUT CARD -->
      <div class="bg-[#090d16] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col">
        <div class="flex flex-wrap items-center justify-between gap-2 mb-5">
          <h2 class="text-lg sm:text-xl text-emerald-400 font-black flex items-center gap-2 m-0">
            <span>⚡</span> Codice Sorgente
          </h2>

          <div class="flex items-center gap-1.5 font-mono">
            <button
              type="button"
              @click="loadSampleCode('vulnerable')"
              class="text-[11px] px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 transition-colors cursor-pointer"
            >
              Test Bug
            </button>
            <button
              type="button"
              @click="loadSampleCode('secure')"
              class="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 transition-colors cursor-pointer"
            >
              Test Pure SQL
            </button>
            <button
              v-if="rawCode"
              type="button"
              @click="clearEditor"
              class="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Pulisci
            </button>
          </div>
        </div>
        
        <textarea
          v-model="rawCode"
          rows="14"
          placeholder="// Incolla qui il codice TypeScript, JavaScript, Python o Pure SQL da analizzare..."
          class="w-full bg-[#020420] border border-slate-700/80 text-sky-400 p-5 rounded-2xl font-mono text-sm leading-relaxed focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50 outline-none transition-all resize-none shadow-inner placeholder:text-slate-600 flex-1"
        ></textarea>

        <div v-if="errorMessage" role="alert" class="bg-red-500/15 border border-red-500/40 text-red-400 p-4 rounded-xl mt-5 font-bold text-sm">
          ⚠️ {{ errorMessage }}
        </div>

        <button
          type="button"
          @click="runScanner"
          :disabled="!rawCode.trim() || isScanning || !hasEnoughQuota"
          class="w-full bg-emerald-500 text-slate-950 font-black py-4 rounded-xl mt-6 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all disabled:opacity-40 disabled:hover:shadow-none hover:-translate-y-0.5 text-sm sm:text-base cursor-pointer"
        >
          {{ isScanning ? '🔎 Analisi AI SAST in corso...' : '🚀 Avvia Audit di Sicurezza' }}
        </button>
      </div>

      <!-- REPORT CARD -->
      <div class="bg-[#090d16] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col relative overflow-hidden">
        
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h2 class="text-lg sm:text-xl text-white font-black flex items-center gap-2 m-0">
            <span>📊</span> Report Audit &amp; Metriche
          </h2>
          <button
            v-if="scanReport"
            type="button"
            @click="notarizeToVault"
            :disabled="isNotarizing || isNotarized"
            class="w-full sm:w-auto font-black px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all disabled:opacity-70 cursor-pointer"
            :class="isNotarized
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-sky-400 text-slate-950 hover:shadow-[0_0_15px_rgba(56,189,248,0.4)]'"
          >
            <span v-if="isNotarizing">Notarizzazione...</span>
            <span v-else-if="isNotarized">✅ Salvato nel Vault</span>
            <span v-else>🛡️ Notarizza nel Vault</span>
          </button>
        </div>

        <template v-if="scanReport">
          <!-- KPI GRID -->
          <div class="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
            <div class="bg-slate-950 border border-slate-800 p-4 rounded-2xl text-center shadow-inner">
              <span class="block text-[9px] sm:text-[10px] text-slate-500 uppercase font-black mb-1.5 tracking-widest">Security Grade</span>
              <span
                class="text-2xl sm:text-3xl font-black"
                :class="{
                  'text-emerald-400': scanReport.securityLevel === 'A+',
                  'text-yellow-400': scanReport.securityLevel === 'B',
                  'text-orange-400': scanReport.securityLevel === 'C',
                  'text-red-500': scanReport.securityLevel === 'F'
                }"
              >
                {{ scanReport.securityLevel }}
              </span>
            </div>
            
            <div class="bg-slate-950 border border-slate-800 p-4 rounded-2xl text-center shadow-inner">
              <span class="block text-[9px] sm:text-[10px] text-slate-500 uppercase font-black mb-1.5 tracking-widest">Health Score</span>
              <span class="text-2xl sm:text-3xl font-black" :class="scanReport.score >= 80 ? 'text-emerald-400' : 'text-red-400'">
                {{ scanReport.score }}<span class="text-xs text-slate-500 font-bold">/100</span>
              </span>
            </div>
            
            <div class="bg-slate-950 border border-slate-800 p-4 rounded-2xl text-center shadow-inner">
              <span class="block text-[9px] sm:text-[10px] text-slate-500 uppercase font-black mb-1.5 tracking-widest">Tech Debt</span>
              <span class="text-2xl sm:text-3xl font-black text-sky-400">
                ~{{ scanReport.metrics?.techDebtHours || 0 }}<span class="text-xs">h</span>
              </span>
            </div>
          </div>

          <!-- ISSUES LIST -->
          <div class="flex-1 flex flex-col min-h-0">
            <h3 class="text-xs sm:text-sm text-slate-300 font-bold mb-4 uppercase tracking-wider">
              📌 Rilievi Trovati ({{ scanReport.issues?.length || 0 }})
            </h3>
            
            <div v-if="!scanReport.issues || scanReport.issues.length === 0" class="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-5 rounded-2xl text-sm font-bold flex items-center gap-3">
              <span class="text-xl">✅</span> Nessuna vulnerabilità nota rilevata! Il codice è pulito e sicuro.
            </div>
            
            <div v-else class="flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar flex-1 max-h-[350px] sm:max-h-full">
              <div
                v-for="(issue, index) in scanReport.issues"
                :key="index"
                class="p-4 sm:p-5 rounded-xl border transition-colors hover:bg-opacity-20"
                :class="{
                  'bg-red-500/10 border-red-500/30 text-red-200': issue.type === 'danger',
                  'bg-sky-400/10 border-sky-400/30 text-sky-200': issue.type === 'info',
                  'bg-yellow-400/10 border-yellow-400/30 text-yellow-200': issue.type === 'warning'
                }"
              >
                <h4
                  class="font-bold mb-2 text-sm"
                  :class="{
                    'text-red-400': issue.type === 'danger',
                    'text-sky-400': issue.type === 'info',
                    'text-yellow-400': issue.type === 'warning'
                  }"
                >
                  {{ issue.title }}
                </h4>
                <p class="text-xs m-0 leading-relaxed opacity-90">{{ issue.desc }}</p>
              </div>
            </div>
          </div>
        </template>

        <!-- EMPTY STATE -->
        <div v-else class="flex flex-col items-center justify-center flex-1 py-16 text-slate-500 text-center">
          <div class="w-20 h-20 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
            <span class="text-4xl">🛡️</span>
          </div>
          <p class="text-sm font-medium leading-relaxed max-w-xs">
            Incolla un frammento di codice a sinistra (o carica un preset) e clicca su <strong class="text-slate-300">"Avvia Audit"</strong> per generare la diagnosi di sicurezza.
          </p>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #1e293b;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #334155;
}
</style>