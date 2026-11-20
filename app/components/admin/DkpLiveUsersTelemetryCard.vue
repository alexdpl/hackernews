<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface TelemetrySession {
  sessionId: string
  username: string
  role: string
  ipAddress: string
  deviceType: string
  os: string
  browser: string
  currentPath: string
  lastSeen: string
  isOnline: boolean
}

const sessions = ref<TelemetrySession[]>([])
const isLoading = ref(true)
let pollTimer: any = null

const onlineCount = computed(() => sessions.value.filter(s => s.isOnline).length)

async function loadTelemetry() {
  try {
    const res: any = await $fetch(`/api/admin/telemetry?_t=${Date.now()}`).catch(() => null)
    const rawList = Array.isArray(res?.sessions)
      ? res.sessions
      : Array.isArray(res?.activeUsers)
        ? res.activeUsers
        : Array.isArray(res?.data)
          ? res.data
          : []

    sessions.value = rawList.map((item: any, idx: number) => ({
      sessionId: String(item.sessionId || item.session_id || item.id || `sess-${idx}`),
      username: String(item.username || item.user || item.email || 'Guest Visitor'),
      role: String(item.role || (item.username ? 'MEMBER' : 'GUEST')).toUpperCase(),
      ipAddress: String(item.ipAddress || item.ip_address || item.ip || '127.0.0.1'),
      deviceType: String(item.deviceType || item.device_type || item.device || 'Desktop'),
      os: String(item.os || item.platform || 'Windows / Linux'),
      browser: String(item.browser || item.userAgent || 'Modern Browser'),
      currentPath: String(item.currentPath || item.path || '/admin'),
      lastSeen: String(item.lastSeen || item.last_seen || item.updated_at || new Date().toISOString()),
      isOnline: item.isOnline !== false
    }))
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadTelemetry()
  pollTimer = setInterval(loadTelemetry, 20000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<template>
  <section class="bg-dkp-card/95 border border-cyan-500/35 rounded-2xl overflow-hidden card-glow font-mono text-xs">
    <div class="p-4 border-b border-dkp-border flex flex-wrap items-center justify-between gap-2 bg-[#030712]">
      <div class="flex items-center gap-2.5">
        <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
        <h3 class="text-white font-extrabold text-sm m-0">Radar Utenti Live, IP &amp; Device Telemetry</h3>
        <span class="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
          {{ onlineCount }} ONLINE
        </span>
      </div>

      <div class="flex items-center gap-2">
        <NuxtLink to="/admin/telemetry" class="text-cyan-400 hover:underline text-[11px] font-bold no-underline">
          Apri Console Telemetry
        </NuxtLink>
        <button
          type="button"
          @click="loadTelemetry"
          class="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-bold cursor-pointer"
        >
          Aggiorna
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="p-6 text-center text-cyan-400">Scansione sessioni attive, IP e fingerprint device...</div>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-[#020410] border-b border-dkp-border text-slate-400 uppercase text-[10px]">
            <th class="p-3.5">Utente / Ruolo</th>
            <th class="p-3.5">Indirizzo IP</th>
            <th class="p-3.5">Device &amp; Sistema Operativo</th>
            <th class="p-3.5">Browser</th>
            <th class="p-3.5">Pagina Attiva</th>
            <th class="p-3.5 text-right">Ultimo Ping</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-dkp-border/60">
          <tr v-for="s in sessions.slice(0, 12)" :key="s.sessionId" class="hover:bg-slate-900/50">
            <td class="p-3.5">
              <div class="flex items-center gap-2">
                <span :class="['w-2 h-2 rounded-full', s.isOnline ? 'bg-emerald-400' : 'bg-slate-500']"></span>
                <strong class="text-white">{{ s.username }}</strong>
                <span class="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 text-[9px] font-bold">{{ s.role }}</span>
              </div>
            </td>
            <td class="p-3.5 text-amber-300 font-bold">{{ s.ipAddress }}</td>
            <td class="p-3.5 text-slate-200">{{ s.deviceType }} — <span class="text-slate-400">{{ s.os }}</span></td>
            <td class="p-3.5 text-sky-300">{{ s.browser }}</td>
            <td class="p-3.5 text-emerald-300">{{ s.currentPath }}</td>
            <td class="p-3.5 text-right text-slate-400">{{ new Date(s.lastSeen).toLocaleTimeString('it-IT') }}</td>
          </tr>

          <tr v-if="sessions.length === 0">
            <td colspan="6" class="p-6 text-center text-slate-400">
              Nessuna sessione telemetrica registrata negli ultimi minuti.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>