<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DkpAdminShell from '~/components/admin/DkpAdminShell.vue'

definePageMeta({
  middleware: 'admin-only'
})

const diag = ref<any>(null)
const isLoading = ref(false)
const checkStatusMsg = ref('')
const endpointChecks = ref<Array<{ name: string; path: string; status: string; ms: number }>>([])

async function runFullDiagnostic() {
  isLoading.value = true
  checkStatusMsg.value = 'Esecuzione diagnostica completa su Neon PostgreSQL e API v2.6...'

  try {
    const res: any = await $fetch(`/api/admin/diagnostic?_t=${Date.now()}`)
    diag.value = res

    const targets = [
      { name: 'Nodes API', path: '/api/admin/nodes' },
      { name: 'Mail Center API', path: '/api/mail' },
      { name: 'Autoresponder API', path: '/api/admin/autoresponder' },
      { name: 'Bounties API', path: '/api/admin/bounties' },
      { name: 'ADS Campaigns API', path: '/api/admin/ads/campaigns' }
    ]

    const results: Array<{ name: string; path: string; status: string; ms: number }> = []
    for (const t of targets) {
      const t0 = performance.now()
      try {
        await $fetch(`${t.path}?_t=${Date.now()}`)
        results.push({ name: t.name, path: t.path, status: '200 OK', ms: Math.round(performance.now() - t0) })
      } catch (e: any) {
        results.push({
          name: t.name,
          path: t.path,
          status: `ERR ${e?.statusCode || 500}`,
          ms: Math.round(performance.now() - t0)
        })
      }
    }
    endpointChecks.value = results
    checkStatusMsg.value = `Diagnostica completata alle ${new Date().toLocaleTimeString('it-IT')} — DB ${res?.dbStatus} (${res?.latencyMs}ms)`
  } catch (err: any) {
    checkStatusMsg.value = `Errore durante il check: ${err?.message || 'Errore di rete'}`
  } finally {
    isLoading.value = false
  }
}

onMounted(runFullDiagnostic)
</script>

<template>
  <DkpAdminShell
    title="Kernel Diagnostic & System Health"
    subtitle="Verifica attiva di Neon PostgreSQL Pure SQL, endpoint API v2.6, Pulse Sentinel AI, GCP Cloud Armor e connettori."
    badge="DIAGNOSTIC SUITE v2.6"
    seo-title="Kernel Diagnostic — DKP Admin v2.6"
  >
    <template #actions>
      <button
        type="button"
        @click="runFullDiagnostic"
        :disabled="isLoading"
        class="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold border-none cursor-pointer disabled:opacity-50"
      >
        {{ isLoading ? 'Verifica in corso...' : '⚡ Esegui Check Diagnostico' }}
      </button>
    </template>

    <div v-if="checkStatusMsg" class="bg-cyan-500/15 border border-cyan-400/50 text-cyan-200 font-mono text-xs font-bold px-4 py-3 rounded-xl">
      {{ checkStatusMsg }}
    </div>

    <!-- KPI DIAGNOSTICI -->
    <section v-if="diag" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
      <div class="bg-dkp-card/95 border border-emerald-500/40 rounded-2xl p-5 card-glow">
        <div class="text-[10px] text-slate-400 font-bold uppercase">NEON POSTGRESQL</div>
        <div class="text-2xl font-extrabold text-emerald-400 mt-1">{{ diag.dbStatus }}</div>
        <div class="text-[11px] text-slate-400 mt-1">Ping: {{ diag.latencyMs }} ms &bull; {{ diag.tablesCount }} tabelle</div>
      </div>

      <div class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-5 card-glow">
        <div class="text-[10px] text-slate-400 font-bold uppercase">BREVO SMTP v3</div>
        <div class="text-2xl font-extrabold mt-1" :class="diag.runtime?.hasBrevoKey ? 'text-cyan-400' : 'text-amber-400'">
          {{ diag.runtime?.hasBrevoKey ? 'CONFIGURED' : 'FALLBACK' }}
        </div>
        <div class="text-[11px] text-slate-400 mt-1">Transactional &amp; Autoresponder</div>
      </div>

      <div class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-5 card-glow">
        <div class="text-[10px] text-slate-400 font-bold uppercase">OPENROUTER SENTINEL AI</div>
        <div class="text-2xl font-extrabold mt-1" :class="diag.runtime?.hasOpenRouterKey ? 'text-cyan-400' : 'text-amber-400'">
          {{ diag.runtime?.hasOpenRouterKey ? 'CONFIGURED' : 'HEURISTIC_SAFE' }}
        </div>
        <div class="text-[11px] text-slate-400 mt-1">SAST Structured Outputs</div>
      </div>

      <div class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-5 card-glow">
        <div class="text-[10px] text-slate-400 font-bold uppercase">RECORD DATABASE</div>
        <div class="text-lg font-extrabold text-white mt-1">
          {{ diag.counts?.stories }} Stories &bull; {{ diag.counts?.nodes }} Nodi
        </div>
        <div class="text-[11px] text-slate-400 mt-1">{{ diag.counts?.threads }} Thread attivi</div>
      </div>
    </section>

    <!-- CHECK ENDPOINT LIVE -->
    <section v-if="endpointChecks.length > 0" class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-5 card-glow font-mono text-xs space-y-3">
      <h3 class="text-cyan-400 font-bold text-sm m-0">Health Check Endpoint Pure SQL</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <div
          v-for="ep in endpointChecks"
          :key="ep.path"
          class="bg-[#030712] border border-slate-800 rounded-xl p-3 flex items-center justify-between"
        >
          <div>
            <div class="text-white font-bold">{{ ep.name }}</div>
            <div class="text-[10px] text-slate-400">{{ ep.path }}</div>
          </div>
          <div class="text-right">
            <span :class="['px-2 py-0.5 rounded text-[10px] font-bold', ep.status === '200 OK' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400']">
              {{ ep.status }}
            </span>
            <div class="text-[10px] text-slate-400 mt-1">{{ ep.ms }} ms</div>
          </div>
        </div>
      </div>
    </section>
  </DkpAdminShell>
</template>