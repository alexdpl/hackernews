<!-- app/pages/admin/index.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

useDkpSeo({
  title: 'Admin Control Center — DKP Sentinel Trinity v2.6-PURE-SQL',
  description: 'Pannello di controllo centrale, telemetria Pure SQL, moderazione DKP Nodes e Sentinel Trinity AI v2.6.',
  noindex: true
})

// === STATI INTERFACCIA ===
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error' | 'warning'>('success')
const activeTab = ref<'users' | 'nodes' | 'whitelist' | 'infrastructure' | 'sentinel' | 'moderation'>('users')
const searchQuery = ref('')
const isManualTriggering = ref(false)

interface AdminUserKeyItem {
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

const adminModules = [
  { to: '/admin', label: '⚙️ API Gateway', tabTarget: 'users' as const },
  { to: '/admin/mail', label: '📧 Mail' },
  { to: '/admin/newsletter', label: '📣 Newsletter' },
  { to: '/admin/autoresponder', label: '📡 Autoresponder' },
  { to: '/admin/crawler', label: '🤖 Crawler' },
  { to: '/admin/blog', label: '📝 Blog' },
  { to: '/admin/nodes', label: '💬 Nodi', highlight: true },
  { to: '/admin/shop', label: '🛍️ Shop' },
  { to: '/admin/jobs', label: '💼 Jobs' }
]

// === STATI DATI ===
const users = ref<AdminUserKeyItem[]>([])
const nodes = ref<DkpNodeSummary[]>([])
const nodeThreads = ref<ThreadModerationSummary[]>([])
const isLoadingUsers = ref(false)
const isLoadingNodes = ref(false)

// Telemetria Trinity AI v2.6
const sentinelData = ref({
  status: 'ACTIVE_PROTECTION',
  version: 'v2.6-PURE-SQL',
  region: 'europe-west1',
  autoDefendEnabled: true,
  globalThreatIndex: 4,
  blockedRequests24h: 2410,
  activeFirewallRules: 32,
  gcpArmorStatus: 'OPTIMAL',
  dbLatencyMs: 9,
  edgeCacheHitRatio: 99.8,
  lastIngestionTime: new Date().toLocaleTimeString(),
  recentThreats: []
})

const isActionLoading = ref(false)
const notificationMsg = ref('')

function triggerToast(msg: string, type: 'success' | 'error' | 'warning' = 'success') {
  toastMessage.value = msg
  toastType.value = type
  showToast.value = true
  setTimeout(() => { showToast.value = false }, 4000)
}

function toggleAutoDefend() {
  sentinelData.value.autoDefendEnabled = !sentinelData.value.autoDefendEnabled
  triggerToast(
    sentinelData.value.autoDefendEnabled
      ? '🤖 Sentinel Trinity AI (v2.6): Protezione euristica in europe-west1 ATTIVATA!'
      : '⚠️ Sentinel Trinity AI: Protezione euristica DISATTIVATA.',
    sentinelData.value.autoDefendEnabled ? 'success' : 'warning'
  )
  triggerAction('toggle_autodefend', { enabled: sentinelData.value.autoDefendEnabled })
}

async function runManualIngestion() {
  isManualTriggering.value = true
  try {
    const res = await $fetch<any>('/api/admin/cron-trigger', {
      method: 'POST'
    })

    if (res?.success) {
      sentinelData.value.lastIngestionTime = new Date().toLocaleTimeString()
      triggerToast(
        `⚡ Ingestione completata! Inserted: ${res.imported ?? 0} | Cache Purged: ${res.cachePurged ? 'OK' : 'SKIPPED'}`,
        'success'
      )
      await fetchAdminNodesData()
    } else {
      triggerToast(`⚠️ Warning: ${res?.error || 'Errore esecuzione'}`, 'warning')
    }
  } catch (err: any) {
    console.error('Errore chiamata cron-trigger:', err)
    triggerToast(`❌ Errore di rete: ${err?.data?.message || err?.message}`, 'error')
  } finally {
    isManualTriggering.value = false
  }
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
        source: item.source || 'PURE SQL API',
        username: item.email || item.username || 'utente@devkernelpulse.org',
        email: item.email || item.username || 'utente@devkernelpulse.org',
        licenseKey: item.licenseKey || item.keyMasked || item.keyPrefix || 'dkp_live_...',
        role: item.role || 'PRO',
        usage: item.usage ?? item.usageCount ?? 0,
        status: (item.status || 'ACTIVE').toUpperCase(),
        joined: item.joined || (item.createdAt ? new Date(item.createdAt).toLocaleDateString('it-IT') : '2026-11-12')
      }))
    }
  } catch (err) {
    console.warn('Errore caricamento licenze reali:', err)
  } finally {
    isLoadingUsers.value = false
  }
}

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
    notificationMsg.value = `❌ Errore azione: ${err?.data?.statusMessage || err?.message}`
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
      triggerToast(`Stato licenza aggiornato in: ${newStatus}`, 'success')
    }
  } catch (err: any) {
    triggerToast(`Errore modifica licenza: ${err?.data?.statusMessage || err?.message}`, 'error')
  }
}

async function toggleLockThread(thread: ThreadModerationSummary) {
  try {
    const res: any = await $fetch(`/api/admin/nodes/posts/${thread.id}`, {
      method: 'PATCH',
      body: { action: 'toggle_lock' }
    })
    if (res?.success) {
      thread.isLocked = !thread.isLocked
      triggerToast(thread.isLocked ? '🔒 Thread bloccato' : '🔓 Thread sbloccato', 'warning')
    }
  } catch {
    triggerToast('Impossibile modificare stato Lock.', 'error')
  }
}

async function deleteThread(id: number) {
  if (!confirm('Eliminare definitivamente questo thread?')) return
  try {
    const res: any = await $fetch(`/api/admin/nodes/posts/${id}`, { method: 'DELETE' })
    if (res?.success) {
      nodeThreads.value = nodeThreads.value.filter(t => t.id !== id)
      triggerToast('🗑️ Thread rimosso dal forum.', 'success')
    }
  } catch {
    triggerToast('Errore durante la cancellazione.', 'error')
  }
}

onMounted(() => {
  fetchSentinel()
  fetchUsers()
  fetchAdminNodesData()
})
</script>

<template>
  <div class="max-w-7xl mx-auto flex flex-col gap-6 pb-20 px-4 sm:px-6 pt-6 font-sans text-slate-100">
    
    <!-- FLOATING TOAST NOTIFICATION -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="-translate-y-4 opacity-0 scale-95"
      enter-to-class="translate-y-0 opacity-100 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="translate-y-0 opacity-100 scale-100"
      leave-to-class="-translate-y-4 opacity-0 scale-95"
    >
      <div
        v-if="showToast"
        role="status"
        :class="[
          'fixed top-6 right-6 z-50 p-4 rounded-xl backdrop-blur-md border shadow-2xl max-w-md flex items-center gap-3 font-mono text-xs sm:text-sm font-semibold',
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

    <!-- 1. HEADER CONTROL CENTER -->
    <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-gradient-to-r from-[#080d1a] via-[#091124] to-[#040711] border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl gap-6 relative overflow-hidden">
      <div class="absolute -right-20 -top-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -left-20 -bottom-20 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div class="relative z-10">
        <div class="flex items-center gap-3 mb-2 flex-wrap">
          <h1 class="text-2xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-2 m-0">
            🔒 Control Center Admin
          </h1>
          <span class="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-400 border border-emerald-500/40 px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider shadow-[0_0_12px_rgba(0,220,130,0.25)]">
            v2.6 PURE-SQL
          </span>
          <span class="bg-purple-500/10 text-purple-400 border border-purple-500/30 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase">
            Sentinel Trinity AI
          </span>
        </div>
        <p class="text-slate-400 text-xs sm:text-sm max-w-2xl m-0">
          Orchestra la persistenza Pure SQL su NeonDB, l'invalidazione cache dinamica Cloudflare Edge e la sicurezza dei pod Cloud Run.
        </p>
      </div>

      <div class="flex items-center gap-3 relative z-10 w-full sm:w-auto flex-wrap">
        <button
          type="button"
          @click="runManualIngestion"
          :disabled="isManualTriggering"
          class="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl font-black text-xs font-mono bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(0,220,130,0.3)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <span :class="{ 'animate-spin': isManualTriggering }">🔄</span>
          {{ isManualTriggering ? 'Ingestione & Purge in corso...' : 'Run Ingestion & Purge' }}
        </button>

        <div class="bg-slate-900/90 border border-slate-800 px-4 py-2.5 rounded-xl text-xs text-cyan-400 flex items-center gap-2 font-bold shadow-inner font-mono">
          <span class="w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-[0_0_10px_#00dc82] animate-pulse"></span>
          GCP Region: europe-west1
        </div>
      </div>
    </div>

    <!-- 2. NAVBAR MODULI ADMIN -->
    <div class="flex flex-col gap-3 bg-[#080d1a] border border-slate-800/80 rounded-2xl p-4 shadow-xl">
      <div class="flex justify-between items-center pb-3 border-b border-slate-800/60 flex-wrap gap-2">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 bg-cyan-400 rounded-full shadow-[0_0_8px_#38bdf8]"></span>
          <span class="text-cyan-400 font-black text-xs tracking-wider uppercase font-mono">
            DKP ECOSYSTEM MODULES (KERNEL 2.6-PURE-SQL)
          </span>
        </div>
        <NuxtLink
          to="/admin"
          @click="activeTab = 'users'"
          class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-bold text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/40 hover:bg-cyan-500/20 transition-all font-mono no-underline"
        >
          🏠 Dashboard Main
        </NuxtLink>
      </div>

      <nav class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2 font-mono">
        <NuxtLink
          v-for="mod in adminModules"
          :key="mod.label"
          :to="mod.to"
          @click="mod.tabTarget && (activeTab = mod.tabTarget)"
          class="inline-flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-xl font-bold text-xs transition-all no-underline truncate"
          :class="mod.highlight
            ? 'text-sky-400 bg-sky-500/10 border border-sky-500/40 hover:bg-sky-500/20 shadow-[0_0_10px_rgba(56,189,248,0.15)]'
            : 'text-emerald-400 bg-emerald-500/5 border border-emerald-500/30 hover:bg-emerald-500/15 hover:border-emerald-400'"
        >
          {{ mod.label }}
        </NuxtLink>
      </nav>
    </div>

    <!-- 3. SENTINEL TRINITY AI FIREWALL & TELEMETRY BANNER -->
    <div class="bg-gradient-to-br from-[#080d1a] via-[#040814] to-[#02040a] border border-slate-800 border-l-4 border-l-purple-500 rounded-2xl p-6 sm:p-8 shadow-2xl">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800/60 pb-5 mb-5 gap-4">
        <div class="flex items-center gap-4">
          <span class="text-3xl sm:text-4xl drop-shadow-[0_0_16px_rgba(168,85,247,0.7)]">🛡️</span>
          <div>
            <h2 class="text-xl sm:text-2xl font-black text-slate-100 flex items-center gap-3 m-0">
              Pulse Sentinel Trinity AI
              <span class="bg-purple-500/15 text-purple-400 border border-purple-500/30 px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase shadow-[0_0_10px_rgba(168,85,247,0.2)] font-mono">
                {{ sentinelData.version }}
              </span>
            </h2>
            <p class="text-slate-400 text-xs sm:text-sm mt-0.5 mb-0">
              Protezione euristica attiva in Cloud Run (europe-west1) &amp; Cloudflare Edge WAF
            </p>
          </div>
        </div>

        <button
          type="button"
          @click="toggleAutoDefend"
          :class="[
            'px-4 py-2.5 rounded-xl border flex flex-col items-end transition-all cursor-pointer font-mono',
            sentinelData.autoDefendEnabled
              ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(0,220,130,0.15)]'
              : 'border-rose-500/50 bg-rose-500/10 text-rose-400'
          ]"
        >
          <span class="text-[10px] font-extrabold uppercase text-slate-400">Auto-Defend AI</span>
          <strong class="text-xs font-black">{{ sentinelData.autoDefendEnabled ? 'ENABLED 🟢' : 'DISABLED 🔴' }}</strong>
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 font-mono">
        <div class="flex flex-col gap-2">
          <span class="text-[11px] text-slate-400 uppercase font-extrabold tracking-wider">GLOBAL THREAT INDEX</span>
          <div class="flex items-center gap-3">
            <div class="flex-grow h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 transition-all duration-300"
                :style="{ width: (sentinelData.globalThreatIndex || 4) + '%' }"
              ></div>
            </div>
            <span class="text-sky-400 font-black text-sm">{{ sentinelData.globalThreatIndex || 4 }}%</span>
          </div>
        </div>

        <div class="flex flex-col gap-1">
          <span class="text-[11px] text-slate-400 uppercase font-extrabold tracking-wider">MALEVOLE BLOCCATE (24H)</span>
          <span class="text-2xl font-black text-purple-400">{{ (sentinelData.blockedRequests24h || 2410).toLocaleString() }}</span>
        </div>

        <div class="flex flex-col gap-1">
          <span class="text-[11px] text-slate-400 uppercase font-extrabold tracking-wider">GCP ARMOR / REGION</span>
          <span class="text-lg font-black text-emerald-400">{{ sentinelData.gcpArmorStatus || 'OPTIMAL' }} (BE)</span>
        </div>

        <div class="flex flex-col gap-1">
          <span class="text-[11px] text-slate-400 uppercase font-extrabold tracking-wider">REGOLE ATTIVE</span>
          <span class="text-lg font-black text-sky-400">{{ sentinelData.activeFirewallRules || 32 }} Rules</span>
        </div>
      </div>
    </div>

    <!-- NOTIFICA SISTEMA -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="notificationMsg" role="status" class="bg-emerald-500/20 border border-emerald-500 text-emerald-300 px-5 py-3.5 rounded-xl font-bold shadow-xl flex items-center gap-2 font-mono text-sm">
        ⚡ {{ notificationMsg }}
      </div>
    </Transition>

    <!-- 4. METRICHE TOP TELEMETRY DASHBOARD -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-[#080d1a] border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-emerald-500/50 transition-all group shadow-lg">
        <div class="flex justify-between items-center text-xs font-bold text-slate-400 font-mono">
          NeonDB Pure SQL <span class="bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-black border border-emerald-500/30">PURE SQL MODE</span>
        </div>
        <div class="text-2xl sm:text-3xl font-black text-emerald-400 my-2 font-mono group-hover:scale-105 transition-transform">
          {{ sentinelData.dbLatencyMs || 9 }} ms
        </div>
        <div class="text-xs text-slate-500 flex justify-between">
          <span>Lazy Singleton Proxy</span>
          <span class="text-emerald-400 font-mono">HTTP Pool</span>
        </div>
      </div>

      <div class="bg-[#080d1a] border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-sky-500/50 transition-all group shadow-lg">
        <div class="flex justify-between items-center text-xs font-bold text-slate-400 font-mono">
          Cloudflare SWR Edge <span class="bg-sky-500/15 text-sky-400 px-2 py-0.5 rounded text-[10px] font-black border border-sky-500/30">DYNAMIC PURGE</span>
        </div>
        <div class="text-2xl sm:text-3xl font-black text-sky-400 my-2 font-mono group-hover:scale-105 transition-transform">
          {{ sentinelData.edgeCacheHitRatio || 99.8 }}%
        </div>
        <div class="text-xs text-slate-500 flex justify-between">
          <span>Purge API v4 Active</span>
          <span class="text-sky-400 font-mono">PoP MXP</span>
        </div>
      </div>

      <div class="bg-[#080d1a] border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-purple-500/50 transition-all group shadow-lg">
        <div class="flex justify-between items-center text-xs font-bold text-slate-400 font-mono">
          HN Ingestion Cron <span class="bg-purple-500/15 text-purple-400 px-2 py-0.5 rounded text-[10px] font-black border border-purple-500/30">SCHEDULER 15M</span>
        </div>
        <div class="text-2xl sm:text-3xl font-black text-purple-400 my-2 font-mono group-hover:scale-105 transition-transform">
          AUTOMATED
        </div>
        <div class="text-xs text-slate-500 flex justify-between">
          <span>Ultimo sync:</span>
          <span class="text-purple-300 font-mono">{{ sentinelData.lastIngestionTime }}</span>
        </div>
      </div>

      <div class="bg-[#080d1a] border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all group shadow-lg">
        <div class="flex justify-between items-center text-xs font-bold text-slate-400 font-mono">
          Licenze &amp; Keys <span class="bg-cyan-500/15 text-cyan-400 px-2 py-0.5 rounded text-[10px] font-black border border-cyan-500/30">LIVE DB</span>
        </div>
        <div class="text-2xl sm:text-3xl font-black text-white my-2 font-mono group-hover:scale-105 transition-transform">
          {{ users.length }}
        </div>
        <div class="text-xs text-slate-500 flex justify-between">
          <span>Chiavi attive su Neon</span>
          <span class="text-cyan-400 font-mono">{{ nodes.length }} Nodi Forum</span>
        </div>
      </div>
    </div>

    <!-- 5. TAB DI NAVIGAZIONE INTERNA -->
    <div class="flex gap-2 border-b border-slate-800/80 pb-3 overflow-x-auto font-mono">
      <button
        type="button"
        :class="['px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap', activeTab === 'users' ? 'bg-[#080d1a] border border-emerald-500 text-emerald-400 shadow-[0_0_12px_rgba(0,220,130,0.15)]' : 'text-slate-400 hover:text-white']"
        @click="activeTab = 'users'"
      >
        🔑 API Keys &amp; Licenze ({{ users.length }})
      </button>

      <button
        type="button"
        :class="['px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap', activeTab === 'nodes' ? 'bg-[#080d1a] border border-sky-400 text-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.15)]' : 'text-slate-400 hover:text-white']"
        @click="activeTab = 'nodes'"
      >
        💬 DKP Nodes &amp; Forum ({{ nodes.length }})
      </button>

      <button
        type="button"
        :class="['px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap', activeTab === 'whitelist' ? 'bg-[#080d1a] border border-cyan-500 text-cyan-400 shadow-[0_0_12px_rgba(56,189,248,0.15)]' : 'text-slate-400 hover:text-white']"
        @click="activeTab = 'whitelist'"
      >
        🛡️ Whitelist IP &amp; Esenzioni
      </button>

      <button
        type="button"
        :class="['px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap', activeTab === 'infrastructure' ? 'bg-[#080d1a] border border-emerald-500 text-emerald-400 shadow-[0_0_12px_rgba(0,220,130,0.15)]' : 'text-slate-400 hover:text-white']"
        @click="activeTab = 'infrastructure'"
      >
        📊 Telemetria CLI &amp; Cloud Run
      </button>

      <button
        type="button"
        :class="['px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap', activeTab === 'sentinel' ? 'bg-[#080d1a] border border-purple-500 text-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.15)]' : 'text-slate-400 hover:text-white']"
        @click="activeTab = 'sentinel'"
      >
        🤖 Log Minacce &amp; Terminale SSE ({{ sentinelData.recentThreats?.length || 0 }})
      </button>

      <button
        type="button"
        :class="['px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap', activeTab === 'moderation' ? 'bg-[#080d1a] border border-amber-500 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)]' : 'text-slate-400 hover:text-white']"
        @click="activeTab = 'moderation'"
      >
        ⚖️ Coda Moderazione
      </button>
    </div>

    <!-- TAB 1: GESTIONE LICENZE E API KEYS -->
    <div v-if="activeTab === 'users'" class="flex flex-col gap-4">
      <div class="flex justify-between items-center gap-4 flex-wrap">
        <input
          v-model="searchQuery"
          type="text"
          aria-label="Cerca licenze o API keys"
          placeholder="Cerca per email, licenza o sorgente..."
          class="w-full sm:max-w-md bg-[#080d1a] border border-slate-800 px-4 py-3 rounded-xl text-slate-100 text-sm outline-none focus:border-emerald-500 transition-all font-mono"
        />
        <button
          type="button"
          @click="fetchUsers"
          class="px-4 py-3 bg-[#040814] border border-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:border-emerald-500 hover:text-emerald-400 transition-all cursor-pointer font-mono"
        >
          🔄 Ricarica Licenze Reali
        </button>
      </div>

      <div class="bg-[#080d1a] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div v-if="isLoadingUsers" class="p-8 text-center text-slate-400 font-mono text-sm">Caricamento chiavi dal database Neon via Pure SQL...</div>
        <div v-else-if="users.length === 0" class="p-8 text-center text-slate-400 font-mono text-sm">Nessuna licenza o API Key registrata nel database Neon.</div>
        <div v-else class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-[#040814] text-slate-400 font-extrabold text-[11px] uppercase tracking-wider border-b border-slate-800 font-mono">
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
                  <span :class="['px-2.5 py-0.5 rounded text-[10px] font-black font-mono', user.source === 'PURE SQL API' || user.source === 'API GATEWAY' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'bg-purple-500/20 text-purple-400 border border-purple-500/40']">
                    {{ user.source }}
                  </span>
                </td>
                <td class="p-4 font-bold text-white">{{ user.email }}</td>
                <td class="p-4 font-mono text-xs text-sky-400">{{ user.licenseKey }}</td>
                <td class="p-4"><span class="bg-slate-800 text-purple-400 px-2.5 py-1 rounded-md text-xs font-bold font-mono">{{ user.role }}</span></td>
                <td class="p-4 text-xs font-mono text-slate-300">{{ user.usage }}</td>
                <td class="p-4">
                  <span :class="['px-2.5 py-1 rounded-md text-xs font-black uppercase font-mono', user.status === 'ACTIVE' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30']">
                    {{ user.status }}
                  </span>
                </td>
                <td class="p-4 text-slate-400 text-xs font-mono">{{ user.joined }}</td>
                <td class="p-4">
                  <button
                    type="button"
                    @click="toggleUserStatus(user)"
                    :class="['px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer font-mono', user.status === 'ACTIVE' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500 hover:text-white' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-[#020420]']"
                  >
                    {{ user.status === 'ACTIVE' ? 'Sospendi' : 'Riattiva' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 2: GESTIONE INTELLIGENTE DKP NODES & FORUM -->
    <div v-else-if="activeTab === 'nodes'" class="flex flex-col gap-6">
      <div class="bg-sky-500/10 border border-sky-500/30 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div class="flex items-start gap-4">
          <span class="text-3xl">💬</span>
          <div>
            <h4 class="text-sky-400 font-bold text-lg mb-1 mt-0">Panoramica DKP Nodes &amp; Moderazione</h4>
            <p class="text-slate-300 text-sm m-0">Monitora i nodi attivi, gli iscritti e gestisci le discussioni bloccate automaticamente da Sentinel Trinity AI.</p>
          </div>
        </div>
        <NuxtLink
          to="/admin/nodes"
          class="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black rounded-xl text-xs font-mono transition-all flex items-center gap-2 whitespace-nowrap no-underline"
        >
          ⚙️ Gestore Nodi Avanzato ↗
        </NuxtLink>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div v-for="node in nodes" :key="node.id" class="bg-[#080d1a] border border-slate-800/80 rounded-xl p-4 flex items-center justify-between shadow-lg">
          <div class="flex items-center gap-3">
            <span class="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-lg" :style="{ backgroundColor: `${node.color}20`, color: node.color, border: `1px solid ${node.color}40` }">
              {{ node.icon }}
            </span>
            <div>
              <h5 class="text-white font-bold text-sm m-0">n/{{ node.name }}</h5>
              <span class="text-xs text-slate-400 font-mono">/nodes/n/{{ node.slug }}</span>
            </div>
          </div>
          <div class="text-right text-xs font-mono">
            <span class="text-emerald-400 font-bold block">👥 {{ node.subscribersCount }}</span>
            <span class="text-slate-500">💬 {{ node.postsCount || 0 }} thread</span>
          </div>
        </div>
      </div>

      <div class="bg-[#080d1a] border border-slate-800/80 rounded-2xl p-6 shadow-xl">
        <h3 class="text-white font-bold text-base mb-4 mt-0 flex items-center justify-between">
          <span>📚 Ultime Discussioni Aperte nei Nodi</span>
          <span class="text-xs font-mono text-slate-400">Totale: {{ nodeThreads.length }}</span>
        </h3>

        <div v-if="isLoadingNodes" class="text-center py-8 text-sky-400 font-mono text-sm">Sincronizzazione thread via Pure SQL...</div>
        <div v-else-if="nodeThreads.length === 0" class="text-center py-8 text-slate-500 font-mono text-sm">Nessuna discussione aperta nei Nodi.</div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-[#040814] text-slate-400 font-extrabold uppercase border-b border-slate-800 font-mono">
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
                  <span class="bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded font-bold font-mono">
                    {{ thread.nodeIcon }} n/{{ thread.nodeSlug }}
                  </span>
                </td>
                <td class="p-3 text-slate-400">@{{ thread.authorName }}</td>
                <td class="p-3 font-mono font-bold text-emerald-400">▲ {{ thread.karmaScore }}</td>
                <td class="p-3">
                  <span v-if="thread.isLocked" class="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-bold font-mono">🔒 Locked (Sentinel)</span>
                  <span v-else class="bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded font-bold font-mono">🟢 Attivo</span>
                </td>
                <td class="p-3 text-right">
                  <div class="flex justify-end gap-2">
                    <button
                      type="button"
                      @click="toggleLockThread(thread)"
                      class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold cursor-pointer"
                      :title="thread.isLocked ? 'Sblocca' : 'Blocca'"
                    >
                      {{ thread.isLocked ? '🔓' : '🔒' }}
                    </button>
                    <button
                      type="button"
                      @click="deleteThread(thread.id)"
                      class="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white rounded font-bold cursor-pointer"
                      title="Elimina"
                    >
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

    <!-- TAB 3: WHITELIST IP -->
    <div v-else-if="activeTab === 'whitelist'" class="flex flex-col gap-6">
      <AdminWhitelistManager />
    </div>

    <!-- TAB 4: TELEMETRIA INFRASTRUTTURA CLOUD RUN -->
    <div v-else-if="activeTab === 'infrastructure'" class="flex flex-col gap-6">
      <div class="bg-sky-500/10 border border-sky-500/30 rounded-2xl p-6 flex items-start gap-4">
        <span class="text-3xl">📊</span>
        <div>
          <h4 class="text-sky-400 font-bold text-lg mb-1 mt-0">Infrastruttura GCP &amp; Telemetria Cloud Run</h4>
          <p class="text-slate-300 text-sm m-0">
            Stato dei pod attivi su <strong class="text-white">GCP Cloud Run (europe-west1)</strong>, connessione HTTP Neon PostgreSQL ed invalidazione SWR Edge Cloudflare.
          </p>
        </div>
      </div>
      <AdminCliAnalytics />
    </div>

    <!-- TAB 5: SENTINEL LOGS & FIREWALL STREAM -->
    <div v-else-if="activeTab === 'sentinel'" class="flex flex-col gap-6">
      <AdminSentinelBlacklistTable />
      <AdminSentinelLiveStream />
    </div>

    <!-- TAB 6: CODA MODERAZIONE -->
    <div v-else-if="activeTab === 'moderation'" class="flex flex-col gap-4">
      <div class="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 flex items-start gap-4">
        <span class="text-3xl">🛡️</span>
        <div>
          <h4 class="text-amber-400 font-bold text-lg mb-1 mt-0">Coda Moderazione Contenuti &amp; Post</h4>
          <p class="text-slate-300 text-sm m-0">Articoli e discussioni segnalate in attesa di revisione da parte del team di sicurezza DKP.</p>
        </div>
      </div>
    </div>

  </div>
</template>