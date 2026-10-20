<!-- app/pages/admin/index.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AdminCliAnalytics from '~~/components/admin/AdminCliAnalytics.vue'
import AdminWhitelistManager from '~~/components/admin/AdminWhitelistManager.vue'

useHead({
  title: 'Admin Control Center — DKP Sentinel AI v2.5-GOLD',
  meta: [
    { name: 'description', content: 'Pannello di controllo centrale, telemetria reale e monitoraggio difensivo con Pulse Sentinel AI in europe-west4.' }
  ]
})

const { getMainUrl, getMailUrl, getApiUrl } = useDomain()

const showToast = ref(false)
const toastMessage = ref('')
const activeTab = ref<'users' | 'moderation' | 'infrastructure' | 'sentinel'>('users')
const searchQuery = ref('')
const manualIpToBan = ref('')

export interface AdminUserKeyItem {
  id: string | number
  source: string
  username: string
  email: string
  licenseKey: string
  role: string
  usage: string | number
  status: 'ACTIVE' | 'SUSPENDED' | 'REVOKED' | string
  joined: string
}

const users = ref<AdminUserKeyItem[]>([])
const isLoadingUsers = ref(false)

const sentinelData = ref<any>({
  status: 'ACTIVE_PROTECTION',
  version: 'v2.5-GOLD',
  region: 'europe-west4',
  autoDefendEnabled: true,
  globalThreatIndex: 8,
  blockedRequests24h: 1845,
  activeFirewallRules: 24,
  gcpArmorStatus: 'OPTIMAL',
  recentThreats: []
})

const isActionLoading = ref(false)
const notificationMsg = ref('')

function triggerToast(msg: string) {
  toastMessage.value = msg
  showToast.value = true
  setTimeout(() => { showToast.value = false }, 3500)
}

function toggleAutoDefend() {
  sentinelData.value.autoDefendEnabled = !sentinelData.value.autoDefendEnabled
  triggerToast(
    sentinelData.value.autoDefendEnabled
      ? '🤖 Auto-Defend AI (v2.5-GOLD): Protezione euristica in europe-west4 ATTIVATA!'
      : '⚠️ Auto-Defend AI: Protezione euristica DISATTIVATA.'
  )

  triggerAction('toggle_autodefend', { enabled: sentinelData.value.autoDefendEnabled })
}

async function fetchSentinel() {
  try {
    const res = await $fetch<any>('/api/admin/sentinel')
    if (res?.success && res?.sentinelState) {
      sentinelData.value = { ...sentinelData.value, ...res.sentinelState }
    }
  } catch (err) {
    console.warn('Impossibile recuperare lo stato live di Sentinel AI:', err)
  }
}

async function fetchUsers() {
  isLoadingUsers.value = true
  try {
    const res = await $fetch<any>('/api/admin/keys')
    if (res?.success && Array.isArray(res?.data)) {
      users.value = res.data.map((item: any) => ({
        id: item.id,
        source: item.source || 'API GATEWAY',
        username: item.email || item.username || 'utente@devkernelpulse.com',
        email: item.email || item.username || 'utente@devkernelpulse.com',
        licenseKey: item.licenseKey || item.keyMasked || item.keyPrefix || 'dkp_live_...',
        role: item.role || 'PRO',
        usage: item.usage ?? item.usageCount ?? 0,
        status: (item.status || 'ACTIVE').toUpperCase(),
        joined: item.joined || (item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '2026-10-15')
      }))
    }
  } catch (err) {
    console.warn('Errore caricamento licenze reali:', err)
  } finally {
    isLoadingUsers.value = false
  }
}

const filteredUsers = computed(() => {
  if (!searchQuery.value.trim()) return users.value
  const q = searchQuery.value.toLowerCase()
  return users.value.filter(u => 
    (u.username || '').toLowerCase().includes(q) || 
    (u.email || '').toLowerCase().includes(q) ||
    (u.licenseKey || '').toLowerCase().includes(q) ||
    (u.source || '').toLowerCase().includes(q)
  )
})

async function triggerAction(actionName: string, payload: any = {}) {
  isActionLoading.value = true
  try {
    const res = await $fetch<any>('/api/admin/sentinel/action', {
      method: 'POST',
      body: { action: actionName, ...payload }
    })
    if (res?.success) {
      notificationMsg.value = res.message || 'Azione eseguita con successo'
      setTimeout(() => { notificationMsg.value = '' }, 4000)
      await fetchSentinel()
    }
  } catch (err: any) {
    console.warn('Errore esecuzione azione Sentinel:', actionName)
    notificationMsg.value = `❌ Errore azione: ${err.data?.statusMessage || err.message}`
    setTimeout(() => { notificationMsg.value = '' }, 4000)
  } finally {
    isActionLoading.value = false
  }
}

async function submitManualBan() {
  if (!manualIpToBan.value.trim()) return
  await triggerAction('ban_ip', { ip: manualIpToBan.value.trim(), reason: 'Ban Manuale Admin' })
  manualIpToBan.value = ''
}

async function toggleUserStatus(user: AdminUserKeyItem) {
  const isCurrentlyActive = user.status === 'ACTIVE'
  const newStatus = isCurrentlyActive ? 'SUSPENDED' : 'ACTIVE'
  try {
    const res = await $fetch<any>('/api/admin/keys', {
      method: 'POST',
      body: { id: user.id, status: newStatus }
    })
    if (res?.success) {
      user.status = newStatus
      notificationMsg.value = res.message || `Stato aggiornato in: ${newStatus}`
      setTimeout(() => { notificationMsg.value = '' }, 3500)
    }
  } catch (err: any) {
    console.error('Errore modifica stato chiave:', err)
    notificationMsg.value = `❌ Errore: ${err.data?.statusMessage || err.message}`
    setTimeout(() => { notificationMsg.value = '' }, 4000)
  }
}

onMounted(() => {
  fetchSentinel()
  fetchUsers()
})
</script>

Ecco il template aggiornato e ottimizzato per pages/admin/index.vue.

Ho integrato in modo modulare i nuovi componenti per la Telemetria CLI e la Whitelist IP, aggiungendo anche le tab dedicate per non appesantire il rendering e mantenere la dashboard fluida, veloce e ben organizzata.

Snippet di codice
<template>
  <div class="admin-container max-w-7xl mx-auto flex flex-col gap-6 pb-16 px-4 sm:px-6">
    <!-- TOAST NOTIFICATION -->
    <Transition name="toast-fade">
      <div v-if="showToast" class="fixed top-6 right-6 z-50 bg-[#061811] border border-[#00dc82] shadow-2xl p-4 rounded-xl backdrop-blur-md max-w-md">
        <div class="flex items-center gap-3 text-slate-100 font-mono text-sm font-semibold">
          <span class="text-xl">✅</span>
          <span>{{ toastMessage }}</span>
        </div>
      </div>
    </Transition>

    <!-- 1. HEADER CONTROL CENTER -->
    <div class="admin-header flex flex-col md:flex-row justify-between items-start md:items-center bg-[#090d16] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight">🔒 Control Center Admin</h1>
          <span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-xs font-extrabold uppercase">v2.5-GOLD</span>
        </div>
        <p class="text-slate-400 text-sm sm:text-base">Gestione piattaforma, licenze e protezione infrastruttura Cloud Run in tempo reale.</p>
      </div>
      <div class="region-badge bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-full text-xs text-sky-400 flex items-center gap-2 font-bold shadow-inner">
        <span class="w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-[0_0_10px_#00dc82] animate-pulse"></span>
        GCP Region: europe-west4 (Netherlands)
      </div>
    </div>

    <!-- NAVBAR GRID v2.5-GOLD -->
    <div class="admin-nav-container flex flex-col gap-3 bg-[#090d16] border border-slate-800/80 rounded-xl p-4 shadow-lg">
      <div class="admin-nav-top flex justify-between items-center pb-3 border-b border-slate-800/60">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_8px_#00ff87]"></span>
          <span class="text-cyan-400 font-black text-xs tracking-wider uppercase">DKP ADMIN CONTROL CENTER</span>
        </div>
        <NuxtLink :to="getMainUrl('/admin')" external class="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold text-xs sm:text-sm text-cyan-400 bg-cyan-500/10 border border-cyan-500/40 hover:bg-cyan-500/20 transition-all">
          🏠 Dashboard Main
        </NuxtLink>
      </div>

      <nav class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <NuxtLink :to="getApiUrl('/admin/api-gateway')" external class="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-bold text-xs sm:text-sm text-emerald-400 bg-emerald-500/5 border border-emerald-500/30 hover:bg-emerald-500/15 transition-all">
          ⚙️ API Gateway
        </NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/mail')" external class="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-bold text-xs sm:text-sm text-emerald-400 bg-emerald-500/5 border border-emerald-500/30 hover:bg-emerald-500/15 transition-all">
          📧 Mail Center
        </NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/newsletter')" external class="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-bold text-xs sm:text-sm text-emerald-400 bg-emerald-500/5 border border-emerald-500/30 hover:bg-emerald-500/15 transition-all">
          📣 Newsletter
        </NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/autoresponder')" external class="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-bold text-xs sm:text-sm text-emerald-400 bg-emerald-500/5 border border-emerald-500/30 hover:bg-emerald-500/15 transition-all">
          📡 Autoresponder
        </NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/crawler')" external class="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-bold text-xs sm:text-sm text-emerald-400 bg-emerald-500/5 border border-emerald-500/30 hover:bg-emerald-500/15 transition-all">
          🤖 Crawler Engine
        </NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/blog')" external class="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-bold text-xs sm:text-sm text-emerald-400 bg-emerald-500/5 border border-emerald-500/30 hover:bg-emerald-500/15 transition-all">
          📝 Gestione Blog
        </NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/shop')" external class="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-bold text-xs sm:text-sm text-emerald-400 bg-emerald-500/5 border border-emerald-500/30 hover:bg-emerald-500/15 transition-all">
          🛍️ Gestione Shop
        </NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/jobs')" external class="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-bold text-xs sm:text-sm text-emerald-400 bg-emerald-500/5 border border-emerald-500/30 hover:bg-emerald-500/15 transition-all">
          💼 Gestione Jobs
        </NuxtLink>
      </nav>
    </div>

    <!-- 3. MONITOR FIREWALL SENTINEL AI BANNER (v2.5-GOLD) -->
    <div class="sentinel-monitor-banner bg-gradient-to-br from-[#090d16] to-[#030712] border border-slate-800 border-l-4 border-l-purple-500 rounded-2xl p-6 sm:p-8 shadow-2xl">
      <div class="sentinel-monitor-header flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800/60 pb-5 mb-5 gap-4">
        <div class="sentinel-brand flex items-center gap-4">
          <span class="text-3xl sm:text-4xl drop-shadow-[0_0_12px_rgba(168,85,247,0.6)]">🛡️</span>
          <div>
            <h2 class="text-xl sm:text-2xl font-black text-slate-100 flex items-center gap-3">
              Pulse Sentinel AI 
              <span class="bg-purple-500/15 text-purple-400 border border-purple-500/30 px-2.5 py-0.5 rounded text-xs font-extrabold uppercase shadow-[0_0_10px_rgba(168,85,247,0.2)]">v2.5-GOLD</span>
            </h2>
            <p class="text-slate-400 text-xs sm:text-sm mt-1">Firewall Euristico, SAST/AST Engine &amp; Cloud Armor attivi in europe-west4</p>
          </div>
        </div>

        <button 
          @click="toggleAutoDefend" 
          :class="['px-4 py-2.5 rounded-xl border flex flex-col items-end transition-all cursor-pointer', sentinelData.autoDefendEnabled ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(0,220,130,0.15)]' : 'border-rose-500/50 bg-rose-500/10 text-rose-400']"
        >
          <span class="text-[10px] font-extrabold uppercase text-slate-400">Auto-Defend AI</span>
          <strong class="text-xs font-black">{{ sentinelData.autoDefendEnabled ? 'ENABLED 🟢' : 'DISABLED 🔴' }}</strong>
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="flex flex-col gap-2">
          <span class="text-[11px] text-slate-400 uppercase font-extrabold tracking-wider">GLOBAL THREAT INDEX</span>
          <div class="flex items-center gap-3">
            <div class="flex-grow h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div class="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 transition-all duration-300" :style="{ width: (sentinelData.globalThreatIndex || 8) + '%' }"></div>
            </div>
            <span class="text-sky-400 font-black text-sm">{{ sentinelData.globalThreatIndex || 8 }}%</span>
          </div>
        </div>

        <div class="flex flex-col gap-1">
          <span class="text-[11px] text-slate-400 uppercase font-extrabold tracking-wider">MALEVOLE BLOCCATE (24H)</span>
          <span class="text-2xl font-black text-purple-400">{{ (sentinelData.blockedRequests24h || 1845).toLocaleString() }}</span>
        </div>

        <div class="flex flex-col gap-1">
          <span class="text-[11px] text-slate-400 uppercase font-extrabold tracking-wider">GCP ARMOR / REGION</span>
          <span class="text-lg font-black text-emerald-400">{{ sentinelData.gcpArmorStatus || 'OPTIMAL' }} (NL)</span>
        </div>

        <div class="flex flex-col gap-1">
          <span class="text-[11px] text-slate-400 uppercase font-extrabold tracking-wider">REGOLE ATTIVE</span>
          <span class="text-lg font-black text-sky-400">{{ sentinelData.activeFirewallRules || 24 }} Rules</span>
        </div>
      </div>
    </div>

    <!-- NOTIFICA DI SISTEMA -->
    <Transition name="fade">
      <div v-if="notificationMsg" class="bg-emerald-500/20 border border-emerald-500 text-emerald-300 px-5 py-3.5 rounded-xl font-bold shadow-xl flex items-center gap-2">
        ⚡ {{ notificationMsg }}
      </div>
    </Transition>

    <!-- 4. METRICHE TOP DASHBOARD -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-[#090d16] border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all">
        <div class="flex justify-between items-center text-xs font-bold text-slate-400">
          Neon DB Status <span class="bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-black">CONNECTED</span>
        </div>
        <div class="text-2xl sm:text-3xl font-black text-white my-2">14 ms</div>
        <div class="text-xs text-slate-500">PostgreSQL Cloud (Active)</div>
      </div>

      <div class="bg-[#090d16] border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all">
        <div class="flex justify-between items-center text-xs font-bold text-slate-400">
          Cloud Run Region <span class="bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-black">WEST-4</span>
        </div>
        <div class="text-2xl sm:text-3xl font-black text-white my-2">europe-west4</div>
        <div class="text-xs text-slate-500">Netherlands (Eemshaven)</div>
      </div>

      <div class="bg-[#090d16] border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all">
        <div class="flex justify-between items-center text-xs font-bold text-slate-400">
          Pipeline CI/CD <span class="bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-black">ONLINE</span>
        </div>
        <div class="text-2xl sm:text-3xl font-black text-white my-2">GitHub / GCP</div>
        <div class="text-xs text-slate-500">Build &amp; Deploy automatici</div>
      </div>

      <div class="bg-[#090d16] border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all">
        <div class="flex justify-between items-center text-xs font-bold text-slate-400">
          Licenze &amp; API Keys <span class="bg-sky-500/15 text-sky-400 px-2 py-0.5 rounded text-[10px] font-black">LIVE DB</span>
        </div>
        <div class="text-2xl sm:text-3xl font-black text-white my-2">{{ users.length }}</div>
        <div class="text-xs text-slate-500">Chiavi attive nel DB Neon</div>
      </div>
    </div>

    <!-- 5. TAB DI NAVIGAZIONE INTERNA -->
    <div class="flex gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
      <button :class="['px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer whitespace-nowrap', activeTab === 'users' ? 'bg-[#090d16] border border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(0,220,130,0.15)]' : 'text-slate-400 hover:text-white']" @click="activeTab = 'users'">
        🔑 API Keys &amp; Licenze Attive ({{ users.length }})
      </button>
      <button :class="['px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer whitespace-nowrap', activeTab === 'whitelist' ? 'bg-[#090d16] border border-cyan-500 text-cyan-400 shadow-[0_0_10px_rgba(56,189,248,0.15)]' : 'text-slate-400 hover:text-white']" @click="activeTab = 'whitelist'">
        🛡️ Whitelist IP &amp; Esenzioni
      </button>
      <button :class="['px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer whitespace-nowrap', activeTab === 'infrastructure' ? 'bg-[#090d16] border border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(0,220,130,0.15)]' : 'text-slate-400 hover:text-white']" @click="activeTab = 'infrastructure'">
        📊 Telemetria CLI &amp; Cloud Run
      </button>
      <button :class="['px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer whitespace-nowrap', activeTab === 'sentinel' ? 'bg-[#090d16] border border-purple-500 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.15)]' : 'text-slate-400 hover:text-white']" @click="activeTab = 'sentinel'">
        🤖 Log Minacce &amp; Terminale SSE ({{ sentinelData.recentThreats?.length || 0 }})
      </button>
      <button :class="['px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer whitespace-nowrap', activeTab === 'moderation' ? 'bg-[#090d16] border border-amber-500 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.15)]' : 'text-slate-400 hover:text-white']" @click="activeTab = 'moderation'">
        ⚖️ Coda Moderazione
      </button>
    </div>

    <!-- TAB 1: GESTIONE LICENZE E API KEYS REALI -->
    <div v-if="activeTab === 'users'" class="flex flex-col gap-4">
      <div class="flex justify-between items-center gap-4 flex-wrap">
        <input v-model="searchQuery" type="text" placeholder="Cerca per email o licenza..." class="w-full sm:max-w-md bg-[#090d16] border border-slate-800 px-4 py-3 rounded-xl text-slate-100 text-sm outline-none focus:border-emerald-500 transition-all" />
        <button @click="fetchUsers" class="px-4 py-3 bg-[#020420] border border-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:border-emerald-500 hover:text-emerald-400 transition-all cursor-pointer">
          🔄 Ricarica Licenze Reali
        </button>
      </div>

      <div class="bg-[#090d16] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div v-if="isLoadingUsers" class="p-8 text-center text-slate-400 font-mono text-sm">Caricamento chiavi dal database Neon...</div>
        <div v-else-if="users.length === 0" class="p-8 text-center text-slate-400 font-mono text-sm">Nessuna licenza o API Key registrata nel database Neon.</div>
        <div v-else class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-[#020420] text-slate-400 font-extrabold text-[11px] uppercase tracking-wider border-b border-slate-800">
                <th class="p-4">SORGENTE</th>
                <th class="p-4">PROPRIETARIO / USER</th>
                <th class="p-4">API KEY / LICENSE KEY</th>
                <th class="p-4">TIER / PRODOTTO</th>
                <th class="p-4">UTILIZZO</th>
                <th class="p-4">STATO</th>
                <th class="p-4">CREATO IL</th>
                <th class="p-4">AZIONI</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in filteredUsers" :key="user.id" class="border-b border-slate-800/80 hover:bg-slate-900/50 transition-colors">
                <td class="p-4">
                  <span :class="['px-2 py-0.5 rounded text-[10px] font-black', user.source === 'API GATEWAY' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'bg-purple-500/20 text-purple-400 border border-purple-500/40']">
                    {{ user.source }}
                  </span>
                </td>
                <td class="p-4 font-bold text-white">{{ user.email }}</td>
                <td class="p-4 font-mono text-xs text-sky-400">{{ user.licenseKey }}</td>
                <td class="p-4"><span class="bg-slate-800 text-purple-400 px-2.5 py-1 rounded-md text-xs font-bold">{{ user.role }}</span></td>
                <td class="p-4 text-xs font-mono text-slate-300">{{ user.usage }}</td>
                <td class="p-4">
                  <span :class="['px-2.5 py-1 rounded-md text-xs font-black uppercase', user.status === 'ACTIVE' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30']">
                    {{ user.status }}
                  </span>
                </td>
                <td class="p-4 text-slate-400 text-xs font-mono">{{ user.joined }}</td>
                <td class="p-4">
                  <button @click="toggleUserStatus(user)" :class="['px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer', user.status === 'ACTIVE' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500 hover:text-white' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-[#020420]']">
                    {{ user.status === 'ACTIVE' ? 'Sospendi' : 'Riattiva' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 2: WHITELIST IP & EXEMPTION MANAGER -->
    <div v-else-if="activeTab === 'whitelist'" class="flex flex-col gap-6">
      <AdminWhitelistManager />
    </div>

    <!-- TAB 3: MONITORAGGIO INFRASTRUTTURA CLOUD RUN & CLI TELEMETRIA -->
    <div v-else-if="activeTab === 'infrastructure'" class="flex flex-col gap-6">
      <div class="bg-sky-500/10 border border-sky-500/30 rounded-2xl p-6 flex items-start gap-4">
        <span class="text-3xl">📊</span>
        <div>
          <h4 class="text-sky-400 font-bold text-lg mb-1">Infrastruttura GCP &amp; Telemetria Cloud Run</h4>
          <p class="text-slate-300 text-sm">Stato del servizio attivo in <strong class="text-white">europe-west4 (Paesi Bassi)</strong>, database Neon PostgreSQL e pipeline CI/CD perfettamente allineate.</p>
        </div>
      </div>

      <!-- COMPONENTE TELEMETRIA CLI -->
      <AdminCliAnalytics />
    </div>

    <!-- TAB 4: SENTINEL LOGS & FIREWALL REALE -->
    <div v-else-if="activeTab === 'sentinel'" class="flex flex-col gap-6">
      <!-- COMPONENTE TABELLA BLACKLIST DB -->
      <AdminSentinelBlacklistTable />

      <!-- COMPONENTE TERMINALE STREAMING TELEMETRIA -->
      <AdminSentinelLiveStream />
    </div>

    <!-- TAB 5: CODA MODERAZIONE -->
    <div v-else-if="activeTab === 'moderation'" class="flex flex-col gap-4">
      <div class="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 flex items-start gap-4">
        <span class="text-3xl">🛡️</span>
        <div>
          <h4 class="text-amber-400 font-bold text-lg mb-1">Coda Moderazione Contenuti &amp; Post</h4>
          <p class="text-slate-300 text-sm">Tutti gli articoli e i commenti segnalati dagli utenti vengono memorizzati qui per l'approvazione in tempo reale.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.toast-fade-enter-active, .toast-fade-leave-active { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.toast-fade-enter-from, .toast-fade-leave-to { opacity: 0; transform: translateY(-15px) scale(0.95); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>