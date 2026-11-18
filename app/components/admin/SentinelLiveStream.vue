<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const logs = ref<string[]>([
  '[BOOT] [BEMYAGENT-TTEV-v1] Inizializzazione telemetria Sentinelle su europe-west4...'
])
const protocolName = ref('BEMYAGENT-TTEV-v1')
const docsCount = ref(0)
let timer: any = null

async function fetchTelemetry() {
  try {
    const res: any = await $fetch('/api/admin/bemyagent', { credentials: 'include' })
    if (res?.success) {
      protocolName.value = res.protocol || 'BEMYAGENT-TTEV-v1'
      docsCount.value = Array.isArray(res.docs) ? res.docs.length : 0

      if (Array.isArray(res.ttevMetrics) && res.ttevMetrics.length > 0) {
        logs.value = res.ttevMetrics.map((m: any) => {
          const ts = m.createdAt ? new Date(m.createdAt).toLocaleTimeString() : '--:--:--'
          const tier = m.cdmTier || 'STANDARD'
          const verdict = m.verdict || 'PASS'
          const mailFlag = m.smtpDispatched ? ' | Mail:SENT' : ''
          return `[${ts}] [CDM:${tier}] [${verdict}] @${m.sentinel} -> ${m.actionType} (${m.modelUsed || 'auto'}${mailFlag})`
        })
      } else {
        logs.value = [
          `[${new Date().toLocaleTimeString()}] [TTEV-READY] 4 Sentinelle attive | ${docsCount.value} docs caricati | In attesa di eventi...`
        ]
      }
    }
  } catch {
    logs.value = [
      `[${new Date().toLocaleTimeString()}] [SENTINEL-CORE] Perimetro attivo su Neon Pure SQL (europe-west4).`
    ]
  }
}

onMounted(() => {
  fetchTelemetry()
  timer = setInterval(fetchTelemetry, 15000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="bg-[#030712] border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col gap-3 font-mono text-xs">
    <div class="flex flex-wrap justify-between items-center gap-2 border-b border-slate-800 pb-3">
      <div class="flex items-center gap-2">
        <span class="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_#00dc82]"></span>
        <span class="text-slate-200 font-bold uppercase tracking-wider">Sentinel TTEV Live Telemetry Stream</span>
      </div>
      <div class="flex items-center gap-2 text-[10px]">
        <span class="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30">{{ protocolName }}</span>
        <span class="text-sky-400">Docs: {{ docsCount }}</span>
      </div>
    </div>

    <div class="h-44 overflow-y-auto flex flex-col gap-1.5 text-slate-300 pr-2">
      <div v-for="(log, idx) in logs" :key="idx" class="py-0.5 border-b border-slate-900/60 font-mono text-[11px] text-emerald-400/90">
        <span class="text-slate-500">&gt;</span> {{ log }}
      </div>
    </div>
  </div>
</template>