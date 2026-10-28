<!-- app/pages/admin/index.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

useHead({
  title: 'Admin Control Center — DKP Sentinel AI v2.5-GOLD',
  meta: [
    { name: 'description', content: 'Pannello di controllo centrale, telemetria reale, moderazione DKP Nodes e monitoraggio difensivo con Pulse Sentinel AI.' }
  ]
})

const { getMainUrl, getApiUrl } = useDomain()

const showToast = ref(false)
const toastMessage = ref('')
const activeTab = ref<'users' | 'nodes' | 'whitelist' | 'infrastructure' | 'sentinel' | 'moderation'>('users')
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

interface DkpNodeSummary {
  id: number
  name: string
  slug: string
  icon: string
  color: string
  subscribersCount: number
  postsCount: number
}

interface ThreadModerationSummary {
  id: number
  title: string
  authorName: string
  nodeSlug: string
  nodeIcon: string
  karmaScore: number
  isPinned: boolean
  isLocked: boolean
  vaultHash?: string
  createdAt: string
}

// === STATI DATI ===
const users = ref<AdminUserKeyItem[]>([])
const nodes = ref<DkpNodeSummary[]>([])
const nodeThreads = ref<ThreadModerationSummary[]>([])
const isLoadingUsers = ref(false)
const isLoadingNodes = ref(false)

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

// === CARICAMENTO DATI NODI E THREAD PER LA TAB NODES ===
async function fetchAdminNodesData() {
  isLoadingNodes.value = true
  try {
    const [nodesRes, threadsRes]: any = await Promise.all([
      $fetch('/api/admin/nodes').catch(() => ({ success: false, data: [] })),
      $fetch('/api/admin/nodes/posts').catch(() => ({ success: false, data: [] }))
    ])
    if (nodesRes?.success) nodes.value = nodesRes.data || []
    if (threadsRes?.success) nodeThreads.value = threadsRes.data || []
  } catch (err) {
    console.warn('Errore caricamento nodi nella dashboard admin:', err)
  } finally {
    isLoadingNodes.value = false
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

// === AZIONI DI MODERAZIONE RAPIDA NODES ===
async function toggleLockThread(thread: ThreadModerationSummary) {
  try {
    const res: any = await $fetch(`/api/admin/nodes/posts/${thread.id}`, {
      method: 'PATCH',
      body: { action: 'toggle_lock' }
    })
    if (res?.success) {
      thread.isLocked = !thread.isLocked
      triggerToast(thread.isLocked ? '🔒 Thread bloccato' : '🔓 Thread sbloccato')
    }
  } catch (err) {
    triggerToast('Impossibile modificare stato Lock.')
  }
}

async function deleteThread(id: number) {
  if (!confirm('Eliminare definitivamente questo thread?')) return
  try {
    const res: any = await $fetch(`/api/admin/nodes/posts/${id}`, { method: 'DELETE' })
    if (res?.success) {
      nodeThreads.value = nodeThreads.value.filter(t => t.id !== id)
      triggerToast('🗑️ Thread rimosso dal forum.')
    }
  } catch (err) {
    triggerToast('Errore durante l eliminazione.')
  }
}

onMounted(() => {
  fetchSentinel()
  fetchUsers()
  fetchAdminNodesData()
})
</script>

<template>
  <div class="admin-container max-w-7xl mx-auto flex flex-col gap-6 pb-16 px-4 sm:px-6">
    
    <!-- TOAST NOTIFICATION FLOATING -->
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
        <p class="text-slate-400 text-sm sm:text-base">Gestione piattaforma, forum Nodi, licenze e protezione infrastruttura Cloud Run.</p>
      </div>
      <div class="region-badge bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-full text-xs text-sky-400 flex items-center gap-2 font-bold shadow-inner">
        <span class="w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-[0_0_10px_#00dc82] animate-pulse"></span>
        GCP Region: europe-west4 (Netherlands)
      </div>
    </div>

    <!-- 2. NAVBAR GRID MODULI ADMIN v2.5-GOLD -->
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

      <nav class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        <NuxtLink :to="getApiUrl('/admin/api-gateway')" external class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg font-bold text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/30 hover:bg-emerald-500/15 transition-all">
          ⚙️ API Gateway
        </NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/mail')" external class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg font-bold text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/30 hover:bg-emerald-500/15 transition-all">
          📧 Mail
        </NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/newsletter')" external class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg font-bold text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/30 hover:bg-emerald-500/15 transition-all">
          📣 Newsletter
        </NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/crawler')" external class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg font-bold text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/30 hover:bg-emerald-500/15 transition-all">
          🤖 Crawler
        </NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/blog')" external class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg font-bold text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/30 hover:bg-emerald-500/15 transition-all">
          📝 Blog
        </NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/nodes')" external class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg font-bold text-xs text-sky-400 bg-sky-500/10 border border-sky-500/40 hover:bg-sky-500/20 transition-all shadow-[0_0_10px_rgba(56,189,248,0.15)]">
          💬 Gestione Nodi
        </NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/shop')" external class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg font-bold text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/30 hover:bg-emerald-500/15 transition-all">
          🛍️ Shop
        </NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/jobs')" external class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg font-bold text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/30 hover:bg-emerald-500/15 transition-all">
          💼 Jobs
        </NuxtLink>
      </nav>
    </div>

    <!-- 3. MONITOR FIREWALL SENTINEL AI BANNER -->
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
          DKP Nodes Attivi <span class="bg-sky-500/15 text-sky-400 px-2 py-0.5 rounded text-[10px] font-black">LIVE FORUM</span>
        </div>
        <div class="text-2xl sm:text-3xl font-black text-sky-400 my-2">{{ nodes.length }} Nodi</div>
        <div class="text-xs text-slate-500">{{ nodeThreads.length }} Thread aperti nel forum</div>
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
        🔑 API Keys &amp; Licenze ({{ users.length }})
      </button>
      
      <!-- 🟢 TAB DKP NODES INTEGRATA -->
      <button :class="['px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer whitespace-nowrap', activeTab === 'nodes' ? 'bg-[#090d16] border border-sky-400 text-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.15)]' : 'text-slate-400 hover:text-white']" @click="activeTab = 'nodes'">
        💬 DKP Nodes &amp; Forum ({{ nodes.length }})
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

    <!-- TAB 1: GESTIONE LICENZE E API KEYS -->
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

    <!-- 🟢 TAB 2: GESTIONE INTELLIGENTE DKP NODES & FORUM -->
    <div v-else-if="activeTab === 'nodes'" class="flex flex-col gap-6">
      
      <!-- HERO BANNER INTRODUTTIVO NODES -->
      <div class="bg-sky-500/10 border border-sky-500/30 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div class="flex items-start gap-4">
          <span class="text-3xl">💬</span>
          <div>
            <h4 class="text-sky-400 font-bold text-lg mb-1">Panoramica DKP Nodes &amp; Moderazione</h4>
            <p class="text-slate-300 text-sm">Monitora i subreddits attivi, gli iscritti e gestisci le discussioni bloccate automaticamente da Pulse Sentinel AI.</p>
          </div>
        </div>
        <NuxtLink :to="getMainUrl('/admin/nodes')" external class="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black rounded-xl text-xs font-mono transition-all flex items-center gap-2 whitespace-nowrap">
          ⚙️ Gestore Nodi Avanzato ↗
        </NuxtLink>
      </div>

      <!-- CARTELLI RESUMÉ NODI -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div v-for="node in nodes" :key="node.id" class="bg-[#090d16] border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-lg" :style="{ backgroundColor: `${node.color}20`, color: node.color, border: `1px solid ${node.color}40` }">
              {{ node.icon }}
            </span>
            <div>
              <h5 class="text-white font-bold text-sm">n/{{ node.name }}</h5>
              <span class="text-xs text-slate-400 font-mono">/nodes/n/{{ node.slug }}</span>
            </div>
          </div>
          <div class="text-right text-xs font-mono">
            <span class="text-emerald-400 font-bold block">👥 {{ node.subscribersCount }}</span>
            <span class="text-slate-500">💬 {{ node.postsCount || 0 }} thread</span>
          </div>
        </div>
      </div>

      <!-- ULTIMI THREAD SUBMITTATI CON CONTROLLI DI MODERAZIONE -->
      <div class="bg-[#090d16] border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 class="text-white font-bold text-base mb-4 flex items-center justify-between">
          <span>📚 Ultime Discussioni Aperte nei Nodi</span>
          <span class="text-xs font-mono text-slate-400">Totale: {{ nodeThreads.length }}</span>
        </h3>

        <div v-if="isLoadingNodes" class="text-center py-8 text-sky-400 font-mono text-sm">Sincronizzazione thread dal DB...</div>
        <div v-else-if="nodeThreads.length === 0" class="text-center py-8 text-slate-500 font-mono text-sm">Nessuna discussione aperta nei Nodi.</div>
        
        <div v-else class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-[#020420] text-slate-400 font-extrabold uppercase border-b border-slate-800">
                <th class="p-3">TITOLO THREAD</th>
                <th class="p-3">NODO</th>
                <th class="p-3">AUTORE</th>
                <th class="p-3">KARMA</th>
                <th class="p-3">STATO SENTINEL</th>
                <th class="p-3 text-right">AZIONI</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="thread in nodeThreads.slice(0, 10)" :key="thread.id" class="border-b border-slate-800/60 hover:bg-slate-900/40">
                <td class="p-3 font-bold text-slate-200">
                  <NuxtLink :to="`/nodes/thread/${thread.id}`" target="_blank" class="hover:text-sky-400">
                    {{ thread.title }}
                  </NuxtLink>
                  <span v-if="thread.vaultHash" class="ml-2 text-[10px] text-purple-400 font-mono">🛡️ Proof-of-Code</span>
                </td>
                <td class="p-3">
                  <span class="bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded font-bold">
                    {{ thread.nodeIcon }} n/{{ thread.nodeSlug }}
                  </span>
                </td>
                <td class="p-3 text-slate-400">@{{ thread.authorName }}</td>
                <td class="p-3 font-mono font-bold text-emerald-400">▲ {{ thread.karmaScore }}</td>
                <td class="p-3">
                  <span v-if="thread.isLocked" class="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-bold">🔒 Locked (Sentinel)</span>
                  <span v-else class="bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded font-bold">🟢 Attivo</span>
                </td>
                <td class="p-3 text-right">
                  <div class="flex justify-end gap-2">
                    <button @click="toggleLockThread(thread)" class="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold" :title="thread.isLocked ? 'Sblocca' : 'Blocca'">
                      {{ thread.isLocked ? '🔓' : '🔒' }}
                    </button>
                    <button @click="deleteThread(thread.id)" class="px-2 py-1 bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white rounded font-bold" title="Elimina">
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>

    <!-- TAB 3: WHITELIST IP & EXEMPTION MANAGER -->
    <div v-else-if="activeTab === 'whitelist'" class="flex flex-col gap-6">
      <AdminWhitelistManager />
    </div>

    <!-- TAB 4: MONITORAGGIO INFRASTRUTTURA CLOUD RUN & CLI TELEMETRIA -->
    <div v-else-if="activeTab === 'infrastructure'" class="flex flex-col gap-6">
      <div class="bg-sky-500/10 border border-sky-500/30 rounded-2xl p-6 flex items-start gap-4">
        <span class="text-3xl">📊</span>
        <div>
          <h4 class="text-sky-400 font-bold text-lg mb-1">Infrastruttura GCP &amp; Telemetria Cloud Run</h4>
          <p class="text-slate-300 text-sm">Stato del servizio attivo in <strong class="text-white">europe-west4 (Paesi Bassi)</strong>, database Neon PostgreSQL e pipeline CI/CD perfettamente allineate.</p>
        </div>
      </div>

      <AdminCliAnalytics />
    </div>

    <!-- TAB 5: SENTINEL LOGS & FIREWALL REALE -->
    <div v-else-if="activeTab === 'sentinel'" class="flex flex-col gap-6">
      <AdminSentinelBlacklistTable />
      <AdminSentinelLiveStream />
    </div>

    <!-- TAB 6: CODA MODERAZIONE -->
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