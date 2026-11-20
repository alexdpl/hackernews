<script setup lang="ts">
import { ref } from 'vue'
import DkpAdminShell from '~/components/admin/DkpAdminShell.vue'

definePageMeta({
  middleware: 'admin-only'
})

const isRunning = ref(false)
const activeSource = ref<'all' | 'hackernews' | 'github' | 'jobs'>('all')
const limitCount = ref(10)
const logs = ref<string[]>([
  '[KERNEL] DKP Crawler Engine v2.6-PURE-SQL pronto.',
  '[INFO] Sorgenti configurate: HackerNews Top/Best, GitHub Trending, RemoteOK Tech Jobs.'
])

async function runCrawler(section: 'all' | 'hackernews' | 'github' | 'jobs') {
  isRunning.value = true
  activeSource.value = section
  logs.value.unshift(`[${new Date().toLocaleTimeString('it-IT')}] Avvio pipeline ingestione "${section}" (limit: ${limitCount.value})...`)

  try {
    const res: any = await $fetch('/api/admin/crawler/run', {
      method: 'POST',
      body: { section, limit: limitCount.value }
    })
    logs.value.unshift(`[${new Date().toLocaleTimeString('it-IT')}] Completato! Nuovi record inseriti: ${res?.addedCount ?? 0}.`)
  } catch (err: any) {
    logs.value.unshift(`[${new Date().toLocaleTimeString('it-IT')}] Errore pipeline: ${err?.data?.statusMessage || err?.message || 'Timeout'}`)
  } finally {
    isRunning.value = false
  }
}
</script>

<template>
  <DkpAdminShell
    title="DKP Autonomous Crawler Engine"
    subtitle="Ingestione automatizzata di news tech, repository GitHub e offerte RemoteOK con classificazione Sentinel AI."
    badge="INGESTION PIPELINE v2.6"
    seo-title="Crawler Engine — DKP Admin v2.6"
  >
    <template #actions>
      <select v-model.number="limitCount" class="bg-dkp-bg border border-dkp-border text-cyan-300 font-bold px-3 py-2.5 rounded-xl">
        <option :value="5">Batch: 5 item</option>
        <option :value="10">Batch: 10 item</option>
        <option :value="20">Batch: 20 item</option>
      </select>
      <button
        type="button"
        :disabled="isRunning"
        @click="runCrawler('all')"
        class="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold border-none cursor-pointer disabled:opacity-50"
      >
        {{ isRunning ? 'Ingestione in corso...' : 'Esegui Crawler Completo' }}
      </button>
    </template>

    <section class="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
      <div class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-5 card-glow flex flex-col justify-between gap-4">
        <div>
          <span class="text-amber-400 font-bold uppercase text-[10px]">FEED TECH &amp; KERNEL</span>
          <h3 class="text-white font-bold text-base mt-1 mb-1">HackerNews &amp; ArXiv AI</h3>
          <p class="text-slate-400 m-0">Importa le storie tecniche con punteggio pi&ugrave; alto in <code>pulse_stories</code>.</p>
        </div>
        <button type="button" :disabled="isRunning" @click="runCrawler('hackernews')" class="w-full py-2.5 rounded-xl bg-dkp-bg border border-amber-500/40 text-amber-300 hover:bg-amber-500/15 font-bold cursor-pointer">
          Avvia Sync Stories
        </button>
      </div>

      <div class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-5 card-glow flex flex-col justify-between gap-4">
        <div>
          <span class="text-cyan-400 font-bold uppercase text-[10px]">OPEN SOURCE RADAR</span>
          <h3 class="text-white font-bold text-base mt-1 mb-1">GitHub Trending Repos</h3>
          <p class="text-slate-400 m-0">Scansiona repository Rust, TypeScript, AI e sistemi distribuiti.</p>
        </div>
        <button type="button" :disabled="isRunning" @click="runCrawler('github')" class="w-full py-2.5 rounded-xl bg-dkp-bg border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/15 font-bold cursor-pointer">
          Avvia Sync GitHub
        </button>
      </div>

      <div class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-5 card-glow flex flex-col justify-between gap-4">
        <div>
          <span class="text-emerald-400 font-bold uppercase text-[10px]">CAREERS FEED</span>
          <h3 class="text-white font-bold text-base mt-1 mb-1">RemoteOK Tech Jobs</h3>
          <p class="text-slate-400 m-0">Sincronizza posizioni remote verificate nel Tech Jobs Hub.</p>
        </div>
        <button type="button" :disabled="isRunning" @click="runCrawler('jobs')" class="w-full py-2.5 rounded-xl bg-dkp-bg border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/15 font-bold cursor-pointer">
          Avvia Sync Jobs
        </button>
      </div>
    </section>

    <!-- Console Log Live -->
    <section class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-5 card-glow font-mono text-xs space-y-3">
      <div class="flex items-center justify-between">
        <span class="text-emerald-400 font-bold uppercase">Console Telemetria Crawler</span>
        <button type="button" @click="logs = []" class="text-slate-400 hover:text-white bg-transparent border-none cursor-pointer">Pulisci Log</button>
      </div>
      <div class="bg-dkp-bg border border-dkp-border rounded-xl p-4 max-h-72 overflow-y-auto space-y-1.5 text-[11px]">
        <div v-for="(line, i) in logs" :key="i" class="text-slate-200">{{ line }}</div>
        <div v-if="logs.length === 0" class="text-slate-500">Nessun log attivo.</div>
      </div>
    </section>
  </DkpAdminShell>
</template>