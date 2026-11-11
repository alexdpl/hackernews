<!-- app/pages/admin/crawler/index.vue -->
<script setup lang="ts">
import { ref } from 'vue'

useHead({
  title: 'Crawler Engine v2.6 — DKP Admin Center',
  meta: [
    { name: 'description', content: 'Ingestione notizie Pure SQL, scraping euristico multi-provider RSS/Atom e sincronizzazione NeonDB in tempo reale.' }
  ]
})

const { getMainUrl, getApiUrl } = useDomain()

// Stato reattivo Crawler Engine v2.6
const selectedSection = ref<'news' | 'ask' | 'show' | 'jobs'>('news')
const selectedLimit = ref(20)
const statusMessage = ref('Pannello Crawler SaaS v2.6-PURE-SQL pronto all\'uso. Attendi input...')
const isRunning = ref(false)
const isLoading = ref(false)
const latestResult = ref<{ itemsFound: number; section: string; timestamp: string } | null>(null)

// Stato Notifiche Toast
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error' | 'warning'>('success')

function triggerToast(msg: string, type: 'success' | 'error' | 'warning' = 'success') {
  toastMessage.value = msg
  toastType.value = type
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3500)
}

// Esecuzione Sub-Engine basata sulla select attiva (Invocazione API Crawler)
async function runSelectedEngine() {
  isRunning.value = true
  statusMessage.value = `[${new Date().toLocaleTimeString()}] Avvio Crawler Engine (Pure SQL Parser) per sezione: '${selectedSection.value.toUpperCase()}' (Limit: ${selectedLimit.value})...`
  latestResult.value = null

  try {
    const res: any = await $fetch('/api/admin/crawler/run', {
      method: 'POST',
      body: { 
        section: selectedSection.value, 
        limit: selectedLimit.value 
      }
    })
    
    const added = res.addedCount ?? res.imported ?? 0
    statusMessage.value = res.message || `Sincronizzazione Pure SQL completata con successo. (+${added} articoli)`
    latestResult.value = { 
      itemsFound: added, 
      section: res.section || selectedSection.value,
      timestamp: new Date().toLocaleTimeString()
    }
    triggerToast(`🚀 Ingestione completata: ${added} nuovi elementi salvati nel DB!`, 'success')
  } catch (err: any) {
    statusMessage.value = `[ERRORE] ${err.data?.statusMessage || err.message || 'Errore durante l\'esecuzione dell\'Engine'}`
    triggerToast('❌ Errore durante l\'esecuzione del Crawler Engine.', 'error')
  } finally {
    isRunning.value = false
  }
}

// Pulizia Duplicati Atomica su NeonDB
async function purgeDatabase() {
  isRunning.value = true
  statusMessage.value = `[${new Date().toLocaleTimeString()}] Rimozione elementi duplicati ed ottimizzazione indici UNIQUE su NeonDB...`
  try {
    const res: any = await $fetch('/api/admin/crawler/purge', { method: 'POST' })
    statusMessage.value = res.message || 'Pulizia duplicati Pure SQL completata.'
    triggerToast('🧹 DB Purge: Duplicati rimossi e indici ottimizzati!', 'success')
  } catch (err: any) {
    statusMessage.value = `[ERRORE] Impossibile completare la pulizia dei duplicati: ${err.data?.statusMessage || err.message}`
    triggerToast('❌ Errore durante la rimozione dei duplicati.', 'error')
  } finally {
    isRunning.value = false
  }
}

// Pulizia Errori & Log Cron Ingestione (/api/admin/cron-trigger)
async function purgeIngestionErrors() {
  isLoading.value = true
  statusMessage.value = `[${new Date().toLocaleTimeString()}] Invio segnale Purge Log a /api/admin/cron-trigger...`
  try {
    const res: any = await $fetch('/api/admin/cron-trigger', {
      method: 'POST',
      body: { action: 'purge' }
    })
    if (res?.success) {
      statusMessage.value = res.message || '🧹 Log di ingestione ed errori del Cron purgati con successo.'
      triggerToast(res.message || '🧹 Log Ingestion azzerati!', 'success')
    }
  } catch (err: any) {
    statusMessage.value = `[ERRORE] ${err.data?.statusMessage || err.message || 'Errore durante la pulizia dei log'}`
    triggerToast(err?.data?.statusMessage || 'Errore durante la pulizia dei log', 'error')
  } finally {
    isLoading.value = false
  }
}

// Cancellazione Totale Dati DB (Truncate / Wipe)
async function wipeDatabase() {
  if (!confirm('⚠️ ATTENZIONE: Sei sicuro di voler ELIMINARE TUTTI i dati ingestiti dal Crawler nel database? L\'operazione è irreversibile.')) {
    return
  }
  
  isRunning.value = true
  statusMessage.value = `[${new Date().toLocaleTimeString()}] INIZIALIZZAZIONE TRUNCATE / WIPE TOTALE TABELLA CRAWLER...`
  try {
    const res: any = await $fetch('/api/admin/crawler/wipe', { method: 'POST' })
    statusMessage.value = res.message || 'Tutti i dati del Crawler sono stati eliminati definitivamente.'
    triggerToast('🗑️ DB Wipe: Dati Crawler azzerati con successo.', 'warning')
  } catch (err: any) {
    statusMessage.value = `[ERRORE] Impossibile svuotare la tabella del database: ${err.data?.statusMessage || err.message}`
    triggerToast('❌ Errore critico durante lo svuotamento del DB.', 'error')
  } finally {
    isRunning.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#020420] text-slate-300 py-10 px-4 sm:px-6 font-sans">
    
    <!-- FLOATING TOAST NOTIFICATION -->
    <Transition name="toast-fade">
      <div 
        v-if="showToast" 
        :class="[
          'fixed top-6 right-6 z-50 p-4 rounded-xl backdrop-blur-md border shadow-2xl max-w-md flex items-center gap-3 font-mono text-xs sm:text-sm font-semibold transition-all',
          toastType === 'success' ? 'bg-[#041a13]/90 border-emerald-500/50 text-emerald-300 shadow-[0_0_20px_rgba(0,220,130,0.2)]' :
          toastType === 'error' ? 'bg-[#1e070a]/90 border-rose-500/50 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.2)]' :
          'bg-[#1a1403]/90 border-amber-500/50 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
        ]"
      >
        <span class="text-xl">
          {{ toastType === 'success' ? '⚡' : toastType === 'error' ? '🚫' : '⚠️' }}
        </span>
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>

    <div class="max-w-7xl mx-auto flex flex-col gap-6">
      
      <!-- NAVBAR GRID MODULI ADMIN v2.6 -->
      <div class="flex flex-col gap-3 bg-[#080d1a] border border-slate-800/80 rounded-2xl p-4 shadow-xl">
        <div class="flex justify-between items-center pb-3 border-b border-slate-800/60 font-mono">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-[0_0_8px_#00dc82]"></span>
            <span class="text-cyan-400 font-black text-xs tracking-wider uppercase">DKP ADMIN CONTROL CENTER</span>
          </div>

          <NuxtLink :to="getMainUrl('/admin')" external class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-bold text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/40 hover:bg-cyan-500/20 transition-all">
            🏠 Dashboard Main
          </NuxtLink>
        </div>

        <!-- GRID NAVIGATION -->
        <nav class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 font-mono">
          <NuxtLink :to="getApiUrl('/admin/api-gateway')" external class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/30 hover:bg-emerald-500/15 transition-all">
            ⚙️ API Gateway
          </NuxtLink>
          <NuxtLink :to="getMainUrl('/admin/mail')" external class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/30 hover:bg-emerald-500/15 transition-all">
            📧 Mail
          </NuxtLink>
          <NuxtLink :to="getMainUrl('/admin/newsletter')" external class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/30 hover:bg-emerald-500/15 transition-all">
            📣 Newsletter
          </NuxtLink>
          <NuxtLink :to="getMainUrl('/admin/crawler')" external class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs text-emerald-400 bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 shadow-[0_0_10px_rgba(0,220,130,0.2)]">
            🤖 Crawler
          </NuxtLink>
          <NuxtLink :to="getMainUrl('/admin/blog')" external class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/30 hover:bg-emerald-500/15 transition-all">
            📝 Blog
          </NuxtLink>
          <NuxtLink :to="getMainUrl('/admin/nodes')" external class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs text-sky-400 bg-sky-500/10 border border-sky-500/40 hover:bg-sky-500/20 transition-all">
            💬 Gestione Nodi
          </NuxtLink>
          <NuxtLink :to="getMainUrl('/admin/shop')" external class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/30 hover:bg-emerald-500/15 transition-all">
            🛍️ Shop
          </NuxtLink>
          <NuxtLink :to="getMainUrl('/admin/jobs')" external class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/30 hover:bg-emerald-500/15 transition-all">
            💼 Jobs
          </NuxtLink>
        </nav>
      </div>

      <!-- HEADER HERO CRAWLER ENGINE v2.6-PURE-SQL -->
      <header class="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-gradient-to-r from-[#080d1a] via-[#091124] to-[#040711] border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl gap-6 relative overflow-hidden">
        <!-- Glow Sfondo Cosmico -->
        <div class="absolute -right-20 -top-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -left-20 -bottom-20 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="relative z-10 flex flex-col gap-2">
          <div class="flex items-center gap-3 mb-1 flex-wrap font-mono">
            <span class="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/40 px-3 py-0.5 rounded-full text-xs font-black uppercase shadow-[0_0_12px_rgba(0,220,130,0.25)]">
              DKP KERNEL CRAWLER ENGINE v2.6-PURE-SQL
            </span>
          </div>
          <h1 class="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Control Center <span class="text-emerald-400">Ingestione Notizie (RSS/Atom)</span>
          </h1>
          <p class="text-slate-400 text-xs sm:text-sm max-w-2xl">
            Interroga i provider tech globali in parallelo (HackerNews, Dev.to, GitHub, GitLab, Reddit, ProductHunt), popola NeonDB in tempo reale ed elimina automaticamente i duplicati.
          </p>
        </div>

        <!-- AZIONI MANUTENZIONE DATABASE -->
        <div class="flex items-center gap-2.5 relative z-10 font-mono w-full sm:w-auto flex-wrap">
          <button 
            type="button"
            @click.prevent="purgeIngestionErrors" 
            :disabled="isRunning || isLoading" 
            class="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl font-bold text-xs bg-cyan-500/10 border border-cyan-500/40 hover:bg-cyan-500/20 text-cyan-300 transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Reset dello stato errori cron via /api/admin/cron-trigger"
          >
            ⚡ Purge Log Cron
          </button>
          <button 
            type="button"
            @click.prevent="purgeDatabase" 
            :disabled="isRunning || isLoading" 
            class="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl font-bold text-xs bg-[#040814] border border-slate-800 hover:border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            🧹 Purge Duplicati DB
          </button>
          <button 
            type="button"
            @click.prevent="wipeDatabase" 
            :disabled="isRunning || isLoading" 
            class="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl font-bold text-xs bg-rose-500/10 border border-rose-500/40 hover:bg-rose-500 hover:text-white text-rose-400 transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            🗑️ Wipe Dati
          </button>
        </div>
      </header>

      <!-- MAIN CRAWLER GRID -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <!-- CONFIGURAZIONE & AZIONI -->
        <section class="bg-[#080d1a] border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col gap-5">
          <h3 class="text-emerald-400 font-black text-lg flex items-center gap-2">
            <span>⚡ Azioni Kernel Istantanee</span>
          </h3>
          
          <div class="flex flex-col gap-2 font-mono">
            <label class="text-slate-400 text-xs font-bold uppercase tracking-wider">Sezione Destinazione</label>
            <select v-model="selectedSection" class="bg-[#040814] border border-slate-800 text-white px-4 py-3 rounded-xl font-bold outline-none focus:border-emerald-500 transition-all cursor-pointer text-xs sm:text-sm">
              <option value="news">📰 Tech News (Hacker News, Dev.to, TechCrunch...)</option>
              <option value="ask">💬 Ask Community (HN Ask, Reddit Prog, CS Career)</option>
              <option value="show">🚀 Show DKP (GitHub/GitLab Trending, ProductHunt)</option>
              <option value="jobs">💼 Tech Jobs Hub (RemoteOK, WeWorkRemotely)</option>
            </select>
          </div>

          <div class="flex flex-col gap-2 font-mono">
            <label class="text-slate-400 text-xs font-bold uppercase tracking-wider">Limite Elementi per Fonte</label>
            <select v-model.number="selectedLimit" class="bg-[#040814] border border-slate-800 text-white px-4 py-3 rounded-xl font-bold outline-none focus:border-emerald-500 transition-all cursor-pointer text-xs sm:text-sm">
              <option :value="5">5 Contenuti per fonte (Veloce)</option>
              <option :value="10">10 Contenuti per fonte (Standard)</option>
              <option :value="20">20 Contenuti per fonte (Raccomandato)</option>
              <option :value="50">50 Contenuti per fonte (Max Batch)</option>
            </select>
          </div>

          <button 
            type="button"
            @click.prevent="runSelectedEngine" 
            :disabled="isRunning || isLoading" 
            class="w-full mt-2 py-3.5 px-4 rounded-xl font-black text-xs sm:text-sm font-mono bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,220,130,0.25)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span v-if="!isRunning && !isLoading">🚀 Avvia Crawler Engine ({{ selectedSection.toUpperCase() }})</span>
            <span v-else class="flex items-center gap-2">
              <span class="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
              Esecuzione in corso...
            </span>
          </button>
        </section>

        <!-- TERMINAL CONSOLE LOGS -->
        <section class="bg-[#080d1a] border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
          <h3 class="text-cyan-400 font-black text-lg flex items-center gap-2">
            <span>📊 Log Console DKP Kernel Engine</span>
          </h3>
          
          <div class="bg-[#040814] border border-slate-800 rounded-xl p-4 min-h-[260px] font-mono text-xs text-slate-300 flex flex-col gap-2 overflow-y-auto">
            <div :class="['leading-relaxed', statusMessage.includes('[ERRORE]') ? 'text-rose-400 font-bold' : 'text-cyan-400']">
              &gt; {{ statusMessage }}
            </div>
            
            <template v-if="latestResult">
              <div class="text-slate-400">&gt; [{{ latestResult.timestamp }}] Ingestione completata con successo.</div>
              <div class="text-slate-200">&gt; Nuovi elementi acquisiti e processati: <strong class="text-emerald-400 font-bold">{{ latestResult.itemsFound }}</strong></div>
              <div class="text-slate-200">&gt; Categoria sincronizzata su NeonDB: <span class="text-amber-400 font-bold">{{ latestResult.section.toUpperCase() }}</span></div>
            </template>

            <div v-if="isRunning || isLoading" class="text-purple-400 flex items-center gap-2 mt-2">
              <span class="w-3 h-3 rounded-full bg-purple-400 animate-ping"></span>
              Operazione Kernel Pure SQL in corso...
            </div>
          </div>
        </section>
      </div>

    </div>
  </div>
</template>

<style scoped>
.toast-fade-enter-active, .toast-fade-leave-active { transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
.toast-fade-enter-from, .toast-fade-leave-to { opacity: 0; transform: translateY(-15px) scale(0.95); }
</style>