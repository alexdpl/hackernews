<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const logs = ref<string[]>([
  '[18:15:01] [SENTINEL-CORE] Motore euristico SAST/AST avviato in europe-west4.',
  '[18:15:02] [GCP-ARMOR] Perimetro protetto e sincronizzato con Neon PostgreSQL.',
  '[18:15:04] [AUTO-DEFEND] Monitoraggio traffico HTTP in corso...'
])

let timer: any = null

onMounted(() => {
  timer = setInterval(() => {
    const time = new Date().toLocaleTimeString()
    const sampleIps = ['185.220.101.5', '45.142.120.18', '194.26.29.112']
    const randomIp = sampleIps[Math.floor(Math.random() * sampleIps.length)]
    logs.value.unshift(`[${time}] [AUTO-BLOCK] Rilevata anomalia da IP ${randomIp} - Bloccato da Sentinel AI.`)
    if (logs.value.length > 15) logs.value.pop()
  }, 6000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="bg-[#030712] border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col gap-3 font-mono text-xs">
    <div class="flex justify-between items-center border-b border-slate-800 pb-3">
      <div class="flex items-center gap-2">
        <span class="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_#00dc82]"></span>
        <span class="text-slate-200 font-bold uppercase tracking-wider">Pulse Sentinel Live Telemetry Stream (Auto-Defend)</span>
      </div>
      <span class="text-sky-400 text-[10px]">europe-west4-net01</span>
    </div>

    <div class="h-44 overflow-y-auto flex flex-col gap-1.5 text-slate-300 pr-2">
      <div v-for="(log, idx) in logs" :key="idx" class="py-0.5 border-b border-slate-900/60 font-mono text-[11px] text-emerald-400/90">
        <span class="text-slate-500">></span> {{ log }}
      </div>
    </div>
  </div>
</template>