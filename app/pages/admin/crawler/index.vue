<script setup lang="ts">
import { ref } from 'vue'
import DkpAdminShell from '~/components/admin/DkpAdminShell.vue'

const selectedSection = ref<'news' | 'ask' | 'show' | 'jobs'>('news')
const selectedLimit = ref(20)
const statusMessage = ref('Pannello Crawler SaaS v2.6-PURE-SQL pronto all\'uso. Attendi input...')
const isRunning = ref(false)
const isLoading = ref(false)
const latestResult = ref<{ itemsFound: number; section: string; timestamp: string } | null>(null)

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

    const added = res.addedCount ?? res.imported ?? res.inserted ?? 0
    statusMessage.value = res.message || `Sincronizzazione Pure SQL completata con successo. (+${added} articoli)`
    latestResult.value = {
      itemsFound: added,
      section: res.section || selectedSection.value,
      timestamp: new Date().toLocaleTimeString()
    }
    triggerToast(`Ingestione completata: ${added} nuovi elementi salvati nel DB!`, 'success')
  } catch (err: any) {
    statusMessage.value = `[ERRORE] ${err.data?.statusMessage || err.message || 'Errore durante l\'esecuzione dell\'Engine'}`
    triggerToast('Errore durante l\'esecuzione del Crawler Engine.', 'error')
  } finally {
    isRunning.value = false
  }
}

async function purgeDatabase() {
  isRunning.value = true
  statusMessage.value = `[${new Date().toLocaleTimeString()}] Rimozione elementi duplicati ed ottimizzazione indici UNIQUE su NeonDB...`
  try {
    const res: any = await $fetch('/api/admin/crawler/purge', { method: 'POST' })
    statusMessage.value = res.message || 'Pulizia duplicati Pure SQL completata.'
    triggerToast('DB Purge: Duplicati rimossi e indici ottimizzati!', 'success')
  } catch (err: any) {
    statusMessage.value = `[ERRORE] Impossibile completare la pulizia dei duplicati: ${err.data?.statusMessage || err.message}`
    triggerToast('Errore durante la rimozione dei duplicati.', 'error')
  } finally {
    isRunning.value = false
  }
}

async function purgeIngestionErrors() {
  isLoading.value = true
  statusMessage.value = `[${new Date().toLocaleTimeString()}] Invio segnale Purge Log a /api/admin/cron-trigger...`
  try {
    const res: any = await $fetch('/api/admin/cron-trigger', {
      method: 'POST',
      body: { action: 'purge' }
    })
    if (res?.success) {
      statusMessage.value = res.message || 'Log di ingestione ed errori del Cron purgati con successo.'
      triggerToast(res.message || 'Log Ingestion azzerati!', 'success')
    }
  } catch (err: any) {
    statusMessage.value = `[ERRORE] ${err.data?.statusMessage || err.message || 'Errore durante la pulizia dei log'}`
    triggerToast(err?.data?.statusMessage || 'Errore durante la pulizia dei log', 'error')
  } finally {
    isLoading.value = false
  }
}

async function wipeDatabase() {
  if (!confirm('ATTENZIONE: Sei sicuro di voler ELIMINARE TUTTI i dati ingestiti dal Crawler nel database? L\'operazione \u00e8 irreversibile.')) {
    return
  }

  isRunning.value = true
  statusMessage.value = `[${new Date().toLocaleTimeString()}] INIZIALIZZAZIONE TRUNCATE / WIPE TOTALE TABELLA CRAWLER...`
  try {
    const res: any = await $fetch('/api/admin/crawler/wipe', { method: 'POST' })
    statusMessage.value = res.message || 'Tutti i dati del Crawler sono stati eliminati definitivamente.'
    triggerToast('DB Wipe: Dati Crawler azzerati con successo.', 'warning')
  } catch (err: any) {
    statusMessage.value = `[ERRORE] Impossibile svuotare la tabella del database: ${err.data?.statusMessage || err.message}`
    triggerToast('Errore critico durante lo svuotamento del DB.', 'error')
  } finally {
    isRunning.value = false
  }
}
</script>

<template>
  <DkpAdminShell
    title="Control Center Ingestione Notizie (RSS/Atom & Round-Robin)"
    subtitle="Interroga i provider tech globali e italiani in parallelo (HackerNews, Reddit, GitHub, GitLab, Datapizza IT, TechCompenso), popola NeonDB ed elimina i duplicati."
    badge="DKP KERNEL CRAWLER ENGINE v2.6-PURE-SQL"
    seo-title="Crawler Engine v2.6 — DKP Admin Center"
    seo-description="Ingestione notizie Pure SQL, scraping euristico multi-provider RSS/Atom e sincronizzazione NeonDB in tempo reale."
  >
    <template #actions>
      <button
        type="button"
        @click.prevent="purgeIngestionErrors"
        :disabled="isRunning || isLoading"
        class="px-3.5 py-2.5 rounded-xl font-bold text-xs bg-cyan-500/15 border border-cyan-500/40 hover:bg-cyan-500/25 text-cyan-300 transition-all cursor-pointer disabled:opacity-50"
        title="Reset dello stato errori cron via /api/admin/cron-trigger"
      >
        Purge Log Cron
      </button>
      <button
        type="button"
        @click.prevent="purgeDatabase"
        :disabled="isRunning || isLoading"
        class="px-3.5 py-2.5 rounded-xl font-bold text-xs bg-dkp-bg border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/15 transition-all cursor-pointer disabled:opacity-50"
      >
        Purge Duplicati DB
      </button>
      <button
        type="button"
        @click.prevent="wipeDatabase"
        :disabled="isRunning || isLoading"
        class="px-3.5 py-2.5 rounded-xl font-bold text-xs bg-rose-500/15 border border-rose-500/40 hover:bg-rose-500 hover:text-white text-rose-300 transition-all cursor-pointer disabled:opacity-50"
      >
        Wipe Dati
      </button>
    </template>

    <!-- FLOATING TOAST -->
    <Transition name="toast-fade">
      <div
        v-if="showToast"
        :class="[
          'fixed top-6 right-6 z-50 p-4 rounded-xl backdrop-blur-md border shadow-2xl max-w-md flex items-center gap-3 font-mono text-xs sm:text-sm font-semibold',
          toastType === 'success' ? 'bg-dkp-card/95 border-emerald-500/60 text-emerald-300' :
          toastType === 'error' ? 'bg-dkp-card/95 border-rose-500/60 text-rose-300' :
          'bg-dkp-card/95 border-amber-500/60 text-amber-300'
        ]"
      >
        <span>{{ toastType === 'success' ? '\u26A1' : toastType === 'error' ? '\u26D4' : '\u26A0\uFE0F' }}</span>
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>

    <!-- MAIN CRAWLER GRID -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- CONFIGURAZIONE & AZIONI -->
      <section class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-6 card-glow flex flex-col gap-5">
        <h3 class="text-emerald-400 font-black text-lg m-0 flex items-center gap-2">
          <span>Azioni Kernel Istantanee</span>
        </h3>

        <div class="flex flex-col gap-2 font-mono">
          <label class="text-slate-400 text-xs font-bold uppercase tracking-wider">Sezione Destinazione</label>
          <select v-model="selectedSection" class="bg-dkp-bg border border-dkp-border text-white px-4 py-3 rounded-xl font-bold outline-none focus:border-emerald-400 cursor-pointer text-xs sm:text-sm">
            <option value="news">Tech News (Hacker News, Reddit Tech)</option>
            <option value="ask">Ask Community (HN Ask, Reddit AskProgramming)</option>
            <option value="show">Show DKP (GitHub &amp; GitLab Open Source)</option>
            <option value="jobs">Tech Jobs Hub Italia (Datapizza IT &amp; TechCompenso RAL)</option>
          </select>
        </div>

        <div class="flex flex-col gap-2 font-mono">
          <label class="text-slate-400 text-xs font-bold uppercase tracking-wider">Limite Elementi per Fonte</label>
          <select v-model.number="selectedLimit" class="bg-dkp-bg border border-dkp-border text-white px-4 py-3 rounded-xl font-bold outline-none focus:border-emerald-400 cursor-pointer text-xs sm:text-sm">
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
          class="w-full mt-2 py-3.5 px-4 rounded-xl font-extrabold text-xs sm:text-sm font-mono bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-none transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <span v-if="!isRunning && !isLoading">Avvia Crawler Engine ({{ selectedSection.toUpperCase() }})</span>
          <span v-else class="flex items-center gap-2">
            <span class="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
            Esecuzione in corso...
          </span>
        </button>
      </section>

      <!-- TERMINAL CONSOLE LOGS -->
      <section class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-6 card-glow flex flex-col gap-4">
        <h3 class="text-cyan-400 font-black text-lg m-0 flex items-center gap-2">
          <span>Log Console DKP Kernel Engine</span>
        </h3>

        <div class="bg-dkp-bg border border-dkp-border rounded-xl p-4 min-h-[260px] font-mono text-xs text-slate-300 flex flex-col gap-2 overflow-y-auto">
          <div :class="['leading-relaxed', statusMessage.includes('[ERRORE]') ? 'text-rose-400 font-bold' : 'text-cyan-400']">
            &gt; {{ statusMessage }}
          </div>

          <template v-if="latestResult">
            <div class="text-slate-400">&gt; [{{ latestResult.timestamp }}] Ingestione completata con successo.</div>
            <div class="text-slate-200">&gt; Nuovi elementi acquisiti e processati: <strong class="text-emerald-400 font-bold">{{ latestResult.itemsFound }}</strong></div>
            <div class="text-slate-200">&gt; Categoria sincronizzata su NeonDB: <span class="text-amber-400 font-bold">{{ latestResult.section.toUpperCase() }}</span></div>
          </template>

          <div v-if="isRunning || isLoading" class="text-violet-400 flex items-center gap-2 mt-2">
            <span class="w-3 h-3 rounded-full bg-violet-400 animate-ping"></span>
            Operazione Kernel Pure SQL in corso...
          </div>
        </div>
      </section>
    </div>
  </DkpAdminShell>
</template>

<style scoped>
.toast-fade-enter-active, .toast-fade-leave-active { transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
.toast-fade-enter-from, .toast-fade-leave-to { opacity: 0; transform: translateY(-15px) scale(0.95); }
</style>