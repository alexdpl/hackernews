Snippet di codice
<!-- app/pages/admin/diagnostic.vue -->
<script setup lang="ts">
import { computed, ref } from 'vue'

useDkpSeo({
  title: 'System Diagnostic & Health - DKP Nexus',
  description: 'DKP Nexus Diagnostic Engine: monitoraggio in tempo reale del database, tabelle e Pulse Sentinel AI.'
})

const { data: healthResponse, pending, error, refresh } = await useFetch('/api/admin/diagnostic/health')

const healthData = computed(() => (healthResponse.value as any) || {})
const isSuccess = computed(() => healthData.value.success === true)

const system = computed(() => healthData.value.system || {})
const dbInfo = computed(() => healthData.value.database || {})
const vault = computed(() => healthData.value.vault || {})
const tables = computed(() => healthData.value.tables || {})
const insights = computed(() => healthData.value.insights || {})

const isScanning = ref(false)
const isRepairing = ref(false)

const runDiagnostic = async () => {
  isScanning.value = true
  await refresh()
  setTimeout(() => {
    isScanning.value = false
  }, 800)
}

const runAutoFix = async () => {
  if (!confirm("Avviare il DKP Repair Engine? Questo script tenterà di migrare gli articoli persi dalla tabella legacy a quella nuova.")) return;
  
  isRepairing.value = true
  try {
    const res: any = await $fetch('/api/admin/diagnostic/repair', { method: 'POST' })
    if (res?.success) {
      alert(`✅ Riparazione completata! Migrati ${res.migratedCount} articoli.`)
      await runDiagnostic()
    } else {
      alert(`❌ Errore durante la riparazione: ${res?.message}`)
    }
  } catch (err: any) {
    alert(`❌ Impossibile avviare la riparazione. Controlla la console.`)
    console.error(err)
  } finally {
    isRepairing.value = false
  }
}
</script>

<template>
  <div class="p-4 md:p-8 min-h-[80vh] bg-[#020420] text-slate-200 font-sans">
    
    <!-- HEADER -->
    <header class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-6 border-b border-slate-800">
      <div>
        <div class="flex items-center gap-3 mb-2">
          <span class="bg-sky-500/10 text-sky-400 border border-sky-500/30 px-2.5 py-1 rounded text-[0.65rem] font-bold uppercase tracking-widest">
            DevKernelPulse Admin
          </span>
          <span v-if="system.status === 'ONLINE'" class="flex items-center gap-1.5 text-[0.7rem] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            <span class="relative flex h-2 w-2"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
            SYSTEM ONLINE
          </span>
          <span v-else-if="system.status === 'WARNING'" class="flex items-center gap-1.5 text-[0.7rem] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            <span class="relative flex h-2 w-2"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span><span class="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span></span>
            SYSTEM WARNING
          </span>
          <span v-else class="flex items-center gap-1.5 text-[0.7rem] font-mono text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
            <span class="h-2 w-2 rounded-full bg-red-500"></span>
            SYSTEM CRITICAL
          </span>
        </div>
        <h1 class="text-3xl font-extrabold text-white tracking-tight">Nexus Diagnostic <span class="text-sky-400">Engine</span></h1>
        <p class="text-sm text-slate-400 mt-1">Monitoraggio in tempo reale del Database, API e Pulse Sentinel AI.</p>
      </div>

      <div class="flex items-center gap-3">
        <button @click="runDiagnostic" :disabled="pending || isScanning" class="flex items-center gap-2 bg-[#090d16] border border-slate-700 hover:border-sky-500 text-slate-300 hover:text-sky-400 px-5 py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-50">
          <span :class="{ 'animate-spin': pending || isScanning }">⚙️</span> 
          {{ pending || isScanning ? 'Scansione...' : 'Esegui Scansione' }}
        </button>
      </div>
    </header>

    <!-- STATO: ERRORE CRITICO -->
    <div v-if="error || !isSuccess" class="bg-red-900/20 border border-red-500/50 rounded-xl p-6 mb-8">
      <h2 class="text-red-400 font-bold text-lg mb-2 flex items-center gap-2"><span>🚨</span> Connessione al Core Fallita</h2>
      <p class="text-red-200 text-sm font-mono">{{ insights?.message || error?.message || 'Impossibile comunicare con il database Neon Postgres.' }}</p>
    </div>

    <!-- MAIN GRID DASHBOARD -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      
      <!-- 1. SYSTEM METRICS -->
      <div class="bg-[#090d16]/80 border border-slate-800 hover:border-sky-500/30 rounded-2xl p-6 backdrop-blur-md shadow-lg transition-colors">
        <div class="border-b border-slate-800 pb-3 mb-4 flex items-center gap-2">
          <span class="text-sky-400 text-lg">⚡</span>
          <h2 class="font-bold text-white uppercase tracking-wider text-sm">System Metrics</h2>
        </div>
        <div class="space-y-4 font-mono text-sm">
          <div class="flex justify-between items-center">
            <span class="text-slate-500">LATENCY:</span>
            <span class="text-emerald-400 font-bold">{{ system.latency || 'N/A' }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-slate-500">ENVIRONMENT:</span>
            <span class="text-sky-400">{{ dbInfo.environment || 'production' }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-slate-500">DATABASE:</span>
            <span class="text-emerald-400 flex items-center gap-2"><span class="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]"></span> {{ dbInfo.status }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-slate-500">LAST CHECK:</span>
            <span class="text-slate-400 text-xs">{{ system.timestamp ? new Date(system.timestamp).toLocaleTimeString('it-IT') : '' }}</span>
          </div>
        </div>
      </div>

      <!-- 2. DATABASE TABLES STATUS -->
      <div class="bg-[#090d16]/80 border border-slate-800 hover:border-amber-500/30 rounded-2xl p-6 backdrop-blur-md shadow-lg transition-colors">
        <div class="border-b border-slate-800 pb-3 mb-4 flex items-center gap-2">
          <span class="text-amber-400 text-lg">📊</span>
          <h2 class="font-bold text-white uppercase tracking-wider text-sm">Tables Integrity</h2>
        </div>
        <div class="space-y-3 font-mono text-sm">
          <div class="flex justify-between items-center p-2.5 rounded-lg bg-[#020420] border border-emerald-500/30 shadow-[inset_0_0_10px_rgba(16,185,129,0.05)]">
            <span class="text-emerald-400 font-semibold">blog_posts (v2.5)</span>
            <span class="text-emerald-400 font-bold text-lg">{{ tables.master_blog_posts || 0 }}</span>
          </div>
          <div class="flex justify-between items-center p-2.5 rounded-lg bg-[#020420] border" :class="tables.legacy_user_posts > 0 && tables.master_blog_posts === 0 ? 'border-amber-500/50 shadow-[inset_0_0_10px_rgba(245,158,11,0.1)]' : 'border-slate-800'">
            <span :class="tables.legacy_user_posts > 0 && tables.master_blog_posts === 0 ? 'text-amber-400 font-semibold' : 'text-slate-400'">posts (Legacy)</span>
            <span :class="tables.legacy_user_posts > 0 && tables.master_blog_posts === 0 ? 'text-amber-400' : 'text-white'" class="font-bold text-lg">{{ tables.legacy_user_posts || 0 }}</span>
          </div>
          <div class="flex justify-between items-center px-2 py-1">
            <span class="text-slate-500 text-xs">pulse_stories</span>
            <span class="text-slate-300 font-bold">{{ tables.crawler_stories || 0 }}</span>
          </div>
          <div class="flex justify-between items-center px-2 py-1">
            <span class="text-slate-500 text-xs">users</span>
            <span class="text-slate-300 font-bold">{{ tables.registered_users || 0 }}</span>
          </div>
        </div>
      </div>

      <!-- 3. PULSE SENTINEL AI / VAULT -->
      <div class="bg-[#090d16]/80 border border-slate-800 hover:border-emerald-500/30 rounded-2xl p-6 backdrop-blur-md shadow-lg transition-colors relative overflow-hidden">
        <div class="absolute -right-12 -top-12 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="border-b border-slate-800 pb-3 mb-4 flex items-center justify-between relative z-10">
          <div class="flex items-center gap-2">
            <span class="text-emerald-400 text-lg">🛡️</span>
            <h2 class="font-bold text-white uppercase tracking-wider text-sm">DKP Vault AI</h2>
          </div>
          <span class="text-[0.65rem] bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded border border-emerald-500/30 font-bold">ACTIVE</span>
        </div>
        <div class="space-y-4 font-mono text-sm relative z-10">
          <div class="text-center py-4 bg-[#020420] rounded-xl border border-slate-800/50 mb-4">
            <div class="text-4xl font-extrabold text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] mb-1">{{ vault.metrics?.totalVerifiedArticles || 0 }}</div>
            <div class="text-[0.65rem] text-emerald-400 uppercase tracking-widest font-bold">Articoli Notarizzati</div>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-slate-500 text-xs">CERTIFICATI VAULT:</span>
            <span class="text-emerald-400 font-bold">{{ vault.metrics?.independentCertsGenerated || 0 }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-slate-500 text-xs">ENGINE:</span>
            <span class="text-sky-400 text-xs">{{ vault.engine }}</span>
          </div>
        </div>
      </div>

      <!-- 4. SMART INSIGHTS & AUTO-FIX -->
      <div class="md:col-span-2 lg:col-span-3 bg-[#090d16]/90 rounded-2xl p-6 md:p-8 backdrop-blur-md shadow-xl transition-colors border" :class="system.status === 'WARNING' ? 'border-amber-500/50 bg-amber-950/20' : 'border-slate-800'">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-3">
              <span class="text-2xl">{{ system.status === 'WARNING' ? '⚠️' : '🧠' }}</span>
              <h2 class="font-bold text-white uppercase tracking-wider text-sm">Diagnostic Insights</h2>
            </div>
            <p class="font-mono text-[0.85rem] leading-relaxed" :class="system.status === 'WARNING' ? 'text-amber-400' : 'text-emerald-400'">
              >_ {{ insights?.message }}
            </p>
          </div>
          
          <!-- Bottone Auto-Fix visibile solo se c'è un WARNING -->
          <div v-if="system.status === 'WARNING'" class="flex-shrink-0">
            <button @click="runAutoFix" :disabled="isRepairing" class="btn-repair w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-amber-950 font-extrabold px-6 py-3 rounded-xl transition-all transform hover:-translate-y-1 disabled:opacity-50 flex items-center justify-center gap-2">
              <span :class="{'animate-spin': isRepairing}">🛠️</span> 
              {{ isRepairing ? 'Riparazione...' : 'Avvia DKP Repair' }}
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
<style scoped>
/* Base Glass Card condivisa */
.glass-card {
  background: rgba(9, 13, 22, 0.6);
  border: 1px solid rgba(30, 41, 59, 0.8);
  border-radius: 16px;
  padding: 1.5rem;
  backdrop-filter: blur(12px);
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.glass-card:hover {
  border-color: rgba(56, 189, 248, 0.3);
  box-shadow: 0 8px 30px -4px rgba(0, 220, 130, 0.1);
  transform: translateY(-2px);
}

/* Modificatori Specifici (Warning & Critical) */
.glass-card.warning-card {
  border-color: rgba(245, 158, 11, 0.3);
  background: rgba(245, 158, 11, 0.05);
}
.glass-card.warning-card:hover {
  border-color: rgba(245, 158, 11, 0.5);
  box-shadow: 0 8px 30px -4px rgba(245, 158, 11, 0.15);
}

/* Pulsante Repair Animation (Glowing Effect) */
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 15px rgba(245, 158, 11, 0.2); }
  50% { box-shadow: 0 0 25px rgba(245, 158, 11, 0.6); }
}

.btn-repair {
  animation: pulse-glow 2s infinite ease-in-out;
}
.btn-repair:hover {
  animation: none;
  box-shadow: 0 0 35px rgba(245, 158, 11, 0.8);
}

/* Fix per barre di scorrimento interne se necessario */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: rgba(9, 13, 22, 0.5);
}
::-webkit-scrollbar-thumb {
  background: rgba(30, 41, 59, 0.8);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(56, 189, 248, 0.5);
}
</style>