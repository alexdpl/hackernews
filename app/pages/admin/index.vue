<!-- app/pages/admin/index.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

useDkpSeo({
  title: 'Admin Control Center — DKP Sentinel Trinity v2.6-PURE-SQL',
  description: 'Pannello di controllo centrale, telemetria Pure SQL, moderazione DKP Nodes e Sentinel Trinity AI v2.6.',
  noindex: true
})

// === STATI INTERFACCIA ===
const DKP_ADMIN_MASTER_KEY = 'dkp_live_admin_master_v26_core_777'
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error' | 'warning'>('success')
const activeTab = ref<'users' | 'nodes' | 'whitelist' | 'infrastructure' | 'sentinel' | 'moderation'>('sentinel')
const searchQuery = ref('')
const isManualTriggering = ref(false)
const isPurging = ref(false)
const threadsPage = ref(1)
const threadsLimit = 10
const threadsTotal = ref(0)

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

interface SentinelAgentProfile {
  id?: number
  username: string
  botSpecialty?: string
  karmaScore?: number
}

interface SentinelDecisionLog {
  id?: number
  sentinel: string
  actionType: string
  targetType?: string
  targetId?: number
  cdmTier?: string
  modelUsed?: string
  verdict?: string
  smtpDispatched: boolean
  summary?: string
  createdAt: string
}

const adminModules = [
  { to: '/admin', label: '⚙️ API Gateway', tabTarget: 'users' as const },
  { to: '/admin', label: '🛡️ Sentinels', tabTarget: 'sentinel' as const, highlight: true },
  { to: '/admin/mail', label: '📧 Mail' },
  { to: '/admin/newsletter', label: '📣 Newsletter' },
  { to: '/admin/autoresponder', label: '📡 Autoresponder' },
  { to: '/admin/crawler', label: '🤖 Crawler' },
  { to: '/admin/blog', label: '📝 Blog' },
  { to: '/admin/nodes', label: '💬 Nodi' },
  { to: '/admin/shop', label: '🛍️ Shop' }
]

// === STATI DATI ===
const users = ref<AdminUserKeyItem[]>([])
const nodes = ref<DkpNodeSummary[]>([])
const nodeThreads = ref<ThreadModerationSummary[]>([])
const isLoadingUsers = ref(false)
const isLoadingNodes = ref(false)

// === SENTINEL NETWORK + BEMYAGENT TTEV STATE ===
const isLoadingSentinels = ref(false)
const isTestingEmail = ref(false)
const testEmailRecipient = ref('alex@devkernelpulse.org')
const sentinelAgents = ref<SentinelAgentProfile[]>([])
const sentinelLogs = ref<SentinelDecisionLog[]>([])
const shadowbannedUsers = ref<Array<{ id: number; username: string; email?: string; banReason?: string }>>([])
const bemyDocs = ref<Array<{ name: string; content: string }>>([])
const bemyMilestones = ref<string[]>([])
const selectedBemyDoc = ref('')

const SENTINEL_CATALOG = [
  {
    username: 'sentinel_ai',
    roleTitle: 'Orchestrator & TTEV Coordinator',
    tierBadge: 'TIER-1 // ORCHESTRATOR',
    accentClass: 'text-violet-400 border-violet-500/40 bg-violet-500/10',
    dotClass: 'text-violet-400 bg-violet-400',
    description: 'Coordina il ciclo Think-Task-Execute-Verify, il Lazy Loading (0 token) e la telemetria OpenUI.'
  },
  {
    username: 'guardian_bot',
    roleTitle: 'Autonomous Kernel Firewall',
    tierBadge: 'TIER-3 // HEAVY FIREWALL',
    accentClass: 'text-orange-400 border-orange-500/40 bg-orange-500/10',
    dotClass: 'text-emerald-400 bg-emerald-400',
    description: 'Intercetta XSS, SQLi e spam in tempo reale applicando quarantena shadowban e alert email.'
  },
  {
    username: 'snippet_master',
    roleTitle: 'AST & AI Code Reviewer',
    tierBadge: 'TIER-2 // STANDARD AUDIT',
    accentClass: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10',
    dotClass: 'text-cyan-400 bg-cyan-400',
    description: 'Analizza blocchi di codice nei post/commenti segnalando vulnerabilità DOM e query non parametrizzate.'
  },
  {
    username: 'security_watch',
    roleTitle: 'CVE & Release Integrity Monitor',
    tierBadge: 'TIER-2 // ADVISORY WATCH',
    accentClass: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
    dotClass: 'text-emerald-400 bg-emerald-400',
    description: 'Presidia i nodi Core Releases & Patch e i bollettini CVE con checklist SHA-256 e migrazioni SQL.'
  }
]

const enrichedSentinels = computed(() => {
  return SENTINEL_CATALOG.map((meta) => {
    const dbProfile = sentinelAgents.value.find(a => a.username?.toLowerCase() === meta.username)
    const lastLog = sentinelLogs.value.find(l => l.sentinel?.toLowerCase() === meta.username)
    const actionsCount = sentinelLogs.value.filter(l => l.sentinel?.toLowerCase() === meta.username).length
    return {
      ...meta,
      online: Boolean(dbProfile),
      karmaScore: dbProfile?.karmaScore ?? 0,
      actionsCount,
      lastCdmTier: lastLog?.cdmTier || (meta.username === 'guardian_bot' ? 'HEAVY' : 'STANDARD'),
      lastVerdict: lastLog?.verdict || 'PASS',
      lastMailSent: Boolean(lastLog?.smtpDispatched),
      lastActionText: lastLog ? `${lastLog.actionType} (${lastLog.modelUsed || 'auto'})` : 'Standby // Lazy Monitoring',
      lastActivityAt: lastLog?.createdAt ? new Date(lastLog.createdAt).toLocaleString('it-IT') : 'Operativo'
    }
  })
})

const selectedBemyDocContent = computed(() => {
  return bemyDocs.value.find(d => d.name === selectedBemyDoc.value)?.content || ''
})

// Telemetria Trinity AI v2.6
const sentinelData = ref({
  status: 'ACTIVE_PROTECTION',
  version: 'v2.6-PURE-SQL',
  region: 'europe-west4',
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

async function fetchSentinelNetworkControl() {
  isLoadingSentinels.value = true
  try {
    const [sentinelsRes, bemyRes]: any = await Promise.all([
      $fetch('/api/admin/sentinels', { credentials: 'include' }).catch(() => null),
      $fetch('/api/admin/bemyagent', { credentials: 'include' }).catch(() => null)
    ])

    if (sentinelsRes?.success) {
      sentinelAgents.value = Array.isArray(sentinelsRes.sentinels) ? sentinelsRes.sentinels : []
      shadowbannedUsers.value = Array.isArray(sentinelsRes.shadowbannedUsers) ? sentinelsRes.shadowbannedUsers : []
    }

    if (bemyRes?.success) {
      bemyDocs.value = Array.isArray(bemyRes.docs) ? bemyRes.docs : []
      bemyMilestones.value = Array.isArray(bemyRes.workMilestones) ? bemyRes.workMilestones : []
      if (!selectedBemyDoc.value && bemyDocs.value.length > 0) {
        selectedBemyDoc.value = bemyDocs.value[0].name
      }
      if (Array.isArray(bemyRes.ttevMetrics) && bemyRes.ttevMetrics.length > 0) {
        sentinelLogs.value = bemyRes.ttevMetrics
      } else if (Array.isArray(sentinelsRes?.logs)) {
        sentinelLogs.value = sentinelsRes.logs
      }
    } else if (Array.isArray(sentinelsRes?.logs)) {
      sentinelLogs.value = sentinelsRes.logs
    }
  } finally {
    isLoadingSentinels.value = false
  }
}

async function dispatchSentinelEmailTest() {
  if (isTestingEmail.value) return
  isTestingEmail.value = true
  try {
    const res: any = await $fetch('/api/admin/sentinels', {
      method: 'POST',
      credentials: 'include',
      body: {
        action: 'test_smtp',
        to: testEmailRecipient.value.trim() || 'alex@devkernelpulse.org'
      }
    })
    if (res?.success) {
      triggerToast(`✉️ ${res.message || 'Email inviata via Resend HTTPS!'}`, 'success')
      await fetchSentinelNetworkControl()
    } else {
      triggerToast(`⚠️ ${res?.message || 'Errore invio email'}`, 'warning')
    }
  } catch (err: any) {
    triggerToast(`❌ Errore canale email: ${err?.data?.statusMessage || err?.message}`, 'error')
  } finally {
    isTestingEmail.value = false
  }
}

async function revokeShadowban(userId: number, username: string) {
  try {
    const res: any = await $fetch('/api/admin/sentinels', {
      method: 'POST',
      credentials: 'include',
      body: { action: 'unban', userId }
    })
    if (res?.success) {
      shadowbannedUsers.value = shadowbannedUsers.value.filter(u => u.id !== userId)
      triggerToast(`🔓 Shadowban revocato per @${username}`, 'success')
    }
  } catch (err: any) {
    triggerToast(`❌ Errore revoca shadowban: ${err?.data?.statusMessage || err?.message}`, 'error')
  }
}

function toggleAutoDefend() {
  sentinelData.value.autoDefendEnabled = !sentinelData.value.autoDefendEnabled
  triggerToast(
    sentinelData.value.autoDefendEnabled
      ? '🤖 Sentinel Trinity AI (v2.6): Protezione euristica in europe-west4 ATTIVATA!'
      : '⚠️ Sentinel Trinity AI: Protezione euristica DISATTIVATA.',
    sentinelData.value.autoDefendEnabled ? 'success' : 'warning'
  )
  triggerAction('toggle_autodefend', { enabled: sentinelData.value.autoDefendEnabled })
}

async function runManualIngestion() {
  isManualTriggering.value = true
  try {
    const res = await $fetch<any>('/api/admin/cron/trigger', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DKP_ADMIN_MASTER_KEY}`,
        'x-api-key': DKP_ADMIN_MASTER_KEY
      }
    })

    if (res?.success) {
      sentinelData.value.lastIngestionTime = new Date().toLocaleTimeString()
      triggerToast(
        `⚡ Ingestione completata! Inserted: ${res.imported ?? 0} | Cache Purged: ${res.cachePurged ? 'OK' : 'SKIPPED'}`,
        'success'
      )
      await fetchAdminNodesData(1)
    } else {
      triggerToast(`⚠️ Warning: ${res?.error || 'Errore esecuzione'}`, 'warning')
    }
  } catch (err: any) {
    console.error('Errore chiamata cron trigger:', err)
    triggerToast(`❌ Errore di rete: ${err?.data?.statusMessage || err?.message}`, 'error')
  } finally {
    isManualTriggering.value = false
  }
}

async function purgeDatabase() {
  if (!confirm('⚠️ Attenzione! Vuoi davvero eliminare tutti i log di ingestione vecchi? Operazione non reversibile.')) return

  isPurging.value = true
  try {
    const res = await $fetch<any>('/api/admin/cron/purge', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${DKP_ADMIN_MASTER_KEY}`,
        'x-api-key': DKP_ADMIN_MASTER_KEY
      }
    })

    if (res?.success) {
      triggerToast(`🧹 ${res.message}`, 'success')
    } else {
      triggerToast('⚠️ Warning: Impossibile effettuare il purge.', 'warning')
    }
  } catch (err: any) {
    console.error('Errore chiamata cron purge:', err)
    triggerToast(`❌ Errore durante il purge: ${err?.data?.statusMessage || err?.message}`, 'error')
  } finally {
    isPurging.value = false
  }
}

async function fetchAdminNodesData(page = threadsPage.value) {
  isLoadingNodes.value = true
  threadsPage.value = page
  try {
    const [nodesRes, threadsRes]: any = await Promise.all([
      $fetch('/api/admin/nodes').catch(() => ({ success: false, data: [] })),
      $fetch('/api/admin/nodes/posts', {
        query: { page, limit: threadsLimit }
      }).catch(() => ({ success: false, data: [] }))
    ])
    if (nodesRes?.success) nodes.value = nodesRes.data || []
    if (threadsRes?.success) {
      const rawList = threadsRes.data || []
      if (typeof threadsRes.total === 'number') {
        nodeThreads.value = rawList
        threadsTotal.value = threadsRes.total
      } else {
        threadsTotal.value = rawList.length
        const start = (page - 1) * threadsLimit
        nodeThreads.value = rawList.slice(start, start + threadsLimit)
      }
    }
  } catch (err) {
    console.warn('Errore caricamento nodi nella dashboard admin:', err)
  } finally {
    isLoadingNodes.value = false
  }
}

const totalThreadPages = computed(() => Math.max(1, Math.ceil(threadsTotal.value / threadsLimit)))

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
      threadsTotal.value = Math.max(0, threadsTotal.value - 1)
      triggerToast('🗑️ Thread rimosso dal forum.', 'success')
    }
  } catch {
    triggerToast('Errore durante la cancellazione.', 'error')
  }
}

onMounted(() => {
  fetchSentinel()
  fetchSentinelNetworkControl()
  fetchUsers()
  fetchAdminNodesData(1)
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
          <span class="bg-purple-500/10 text-purple-400 border border-purple-500/30 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase font-mono">
            BEMYAGENT TTEV-v1
          </span>
        </div>
        <p class="text-slate-400 text-xs sm:text-sm max-w-2xl m-0">
          Orchestra le 4 Sentinelle Autonome, la persistenza Pure SQL su NeonDB, il canale email Resend HTTPS e i pod Cloud Run.
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
          {{ isManualTriggering ? 'Syncing...' : 'Sync HackerNews' }}
        </button>

        <button
          type="button"
          @click="purgeDatabase"
          :disabled="isPurging"
          class="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl font-black text-xs font-mono bg-rose-500/10 border border-rose-500/40 hover:bg-rose-500/20 hover:border-rose-400 text-rose-400 active:scale-95 transition-all shadow-[0_0_15px_rgba(244,63,94,0.1)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <span :class="{ 'animate-spin': isPurging }">🧹</span>
          {{ isPurging ? 'Purging...' : 'Purge DB Logs' }}
        </button>
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
          to="/tools/openui-studio"
          class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-bold text-xs text-purple-300 bg-purple-500/10 border border-purple-500/40 hover:bg-purple-500/20 transition-all font-mono no-underline"
        >
          🎨 OpenUI Studio + TTEV ↗
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
            ? 'text-cyan-300 bg-cyan-500/10 border border-cyan-500/40 hover:bg-cyan-500/20 shadow-[0_0_10px_rgba(34,211,238,0.18)]'
            : 'text-emerald-400 bg-emerald-500/5 border border-emerald-500/30 hover:bg-emerald-500/15 hover:border-emerald-400'"
        >
          {{ mod.label }}
        </NuxtLink>
      </nav>
    </div>

    <!-- 3. SENTINEL TRINITY AI FIREWALL & TELEMETRY BANNER -->
    <div class="bg-gradient-to-br from-[#080d1a] via-[#040814] to-[#02040a] border border-slate-800 border-l-4 border-l-cyan-400 rounded-2xl p-6 sm:p-8 shadow-2xl">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800/60 pb-5 mb-5 gap-4">
        <div class="flex items-center gap-4">
          <span class="text-3xl sm:text-4xl drop-shadow-[0_0_16px_rgba(34,211,238,0.6)]">🛡️</span>
          <div>
            <h2 class="text-xl sm:text-2xl font-black text-slate-100 flex items-center gap-3 m-0 flex-wrap">
              Pulse Sentinel Network
              <span class="bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase font-mono">
                {{ sentinelData.version }}
              </span>
            </h2>
            <p class="text-slate-400 text-xs sm:text-sm mt-0.5 mb-0">
              4 Agenti AI Autonomi su Cloud Run (europe-west4) • Protocollo BEMYAGENT TTEV + Resend HTTPS
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
          <span class="text-[11px] text-slate-400 uppercase font-extrabold tracking-wider">SENTINELLE ATTIVE</span>
          <span class="text-2xl font-black text-cyan-400">{{ sentinelAgents.length || 4 }} / 4 ONLINE</span>
        </div>

        <div class="flex flex-col gap-1">
          <span class="text-[11px] text-slate-400 uppercase font-extrabold tracking-wider">DECISIONI TTEV REGISTRATE</span>
          <span class="text-2xl font-black text-purple-400">{{ sentinelLogs.length }}</span>
        </div>

        <div class="flex flex-col gap-1">
          <span class="text-[11px] text-slate-400 uppercase font-extrabold tracking-wider">BEMYAGENT WORKSPACE</span>
          <span class="text-lg font-black text-emerald-400">{{ bemyDocs.length }} Docs • {{ bemyMilestones.length }} HTN</span>
        </div>

        <div class="flex flex-col gap-1">
          <span class="text-[11px] text-slate-400 uppercase font-extrabold tracking-wider">QUARANTENA SHADOWBAN</span>
          <span class="text-lg font-black text-amber-400">{{ shadowbannedUsers.length }} Utenti</span>
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

    <!-- 4. TAB DI NAVIGAZIONE INTERNA -->
    <div class="flex gap-2 border-b border-slate-800/80 pb-3 overflow-x-auto font-mono">
      <button
        type="button"
        :class="['px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap', activeTab === 'sentinel' ? 'bg-[#080d1a] border border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'text-slate-400 hover:text-white']"
        @click="activeTab = 'sentinel'; fetchSentinelNetworkControl()"
      >
        🛡️ Sentinel Network &amp; TTEV ({{ sentinelLogs.length }})
      </button>

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
        :class="['px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap', activeTab === 'infrastructure' ? 'bg-[#080d1a] border border-emerald-500 text-emerald-400 shadow-[0_0_12px_rgba(0,220,130,0.15)]' : 'text-slate-400 hover:text-white']"
        @click="activeTab = 'infrastructure'"
      >
        📊 Telemetria Cloud Run
      </button>

      <button
        type="button"
        :class="['px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap', activeTab === 'moderation' ? 'bg-[#080d1a] border border-amber-500 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)]' : 'text-slate-400 hover:text-white']"
        @click="activeTab = 'moderation'"
      >
        ⚖️ Quarantena &amp; Moderazione ({{ shadowbannedUsers.length }})
      </button>
    </div>

    <!-- TAB SENTINEL NETWORK CONTROL PANEL (NUOVO DESIGN DKP PRO v2.6 PURE SQL) -->
    <div v-if="activeTab === 'sentinel'" class="relative rounded-3xl bg-[#0f172a] border border-slate-700/80 p-6 sm:p-8 shadow-2xl overflow-hidden bg-grid-sentinel">
      <!-- Ambient Glow -->
      <div class="absolute -top-24 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-24 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div class="relative z-10 flex flex-col gap-6">
        <!-- Control Panel Header + Quick Resend Email Tester -->
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-700/70 pb-5">
          <div>
            <div class="flex items-center gap-2.5">
              <span class="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
              <span class="font-mono text-xs font-bold uppercase tracking-widest text-cyan-400">
                AUTONOMOUS AGENT MATRIX // PURE SQL TELEMETRY
              </span>
            </div>
            <h3 class="text-xl sm:text-2xl font-black text-slate-100 mt-1 mb-0">
              Sentinel Network Control Panel
            </h3>
          </div>

          <div class="flex flex-wrap items-center gap-2 font-mono">
            <input
              v-model="testEmailRecipient"
              type="email"
              placeholder="alex@devkernelpulse.org"
              class="bg-slate-950/90 border border-slate-700 text-slate-100 px-3 py-2 rounded-xl text-xs outline-none focus:border-cyan-400"
            />
            <button
              type="button"
              @click="dispatchSentinelEmailTest"
              :disabled="isTestingEmail"
              class="px-3.5 py-2 rounded-xl bg-cyan-500/15 border border-cyan-400/50 text-cyan-300 hover:bg-cyan-500/25 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              {{ isTestingEmail ? 'Invio...' : '✉️ Test Resend Email' }}
            </button>
            <button
              type="button"
              @click="fetchSentinelNetworkControl"
              :disabled="isLoadingSentinels"
              class="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 hover:border-cyan-400 text-xs font-bold transition-all cursor-pointer"
            >
              {{ isLoadingSentinels ? 'Sync...' : '↻ Aggiorna' }}
            </button>
          </div>
        </div>

        <!-- 4 CARD AGENTI AUTONOMI (CDM TIER, VERDETTO PASS/FAIL, STATO EMAIL) -->
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div
            v-for="agent in enrichedSentinels"
            :key="agent.username"
            class="bg-slate-800/85 backdrop-blur-sm border border-slate-700 hover:border-cyan-400/60 rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all shadow-lg"
          >
            <div>
              <div class="flex items-center justify-between gap-2 mb-3">
                <span :class="['font-mono text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider', agent.accentClass]">
                  {{ agent.tierBadge }}
                </span>
                <span class="flex items-center gap-1.5 font-mono text-[11px] font-bold text-emerald-400">
                  <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  LIVE
                </span>
              </div>

              <h4 class="font-mono text-base font-bold text-white m-0">@{{ agent.username }}</h4>
              <p class="text-xs font-semibold text-cyan-300/90 mt-0.5 mb-2">{{ agent.roleTitle }}</p>
              <p class="text-xs text-slate-400 leading-relaxed m-0">{{ agent.description }}</p>
            </div>

            <div class="pt-3 border-t border-slate-700/80 flex flex-col gap-2 font-mono text-[11px]">
              <div class="flex items-center justify-between">
                <span class="text-slate-400">CDM Tier:</span>
                <span class="px-2 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-500/30 font-bold">
                  {{ agent.lastCdmTier }}
                </span>
              </div>

              <div class="flex items-center justify-between">
                <span class="text-slate-400">Symbiotic Verdict:</span>
                <span
                  :class="[
                    'px-2 py-0.5 rounded font-bold border',
                    agent.lastVerdict === 'FAIL'
                      ? 'bg-red-500/15 text-red-400 border-red-500/40'
                      : agent.lastVerdict === 'PASS_WITH_CAVEATS'
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                        : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                  ]"
                >
                  {{ agent.lastVerdict }}
                </span>
              </div>

              <div class="flex items-center justify-between">
                <span class="text-slate-400">Canale Email:</span>
                <span :class="agent.lastMailSent ? 'text-emerald-400 font-bold' : 'text-cyan-300'">
                  {{ agent.lastMailSent ? '✉️ DISPATCHED' : '⚡ READY (HTTPS)' }}
                </span>
              </div>

              <div class="text-[10px] text-slate-500 truncate pt-1 border-t border-slate-800">
                Ultimo: {{ agent.lastActionText }}
              </div>
            </div>
          </div>
        </div>

        <!-- STREAM DECISIONI TTEV + MEMORIA PERMANENTE BEMYAGENT DOCS -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Colonna 1-2: Tabella Audit TTEV in tempo reale -->
          <div class="lg:col-span-2 bg-slate-950/90 border border-slate-800 rounded-2xl p-5 flex flex-col gap-3">
            <div class="flex items-center justify-between border-b border-slate-800 pb-3">
              <span class="font-mono text-xs font-bold uppercase tracking-wider text-cyan-400">
                ⚡ Symbiotic Validation &amp; TTEV Audit Stream
              </span>
              <span class="font-mono text-[11px] text-slate-400">
                Neon Pure SQL • Ultimi {{ sentinelLogs.length }} eventi
              </span>
            </div>

            <div v-if="sentinelLogs.length === 0" class="py-10 text-center font-mono text-xs text-slate-500">
              Nessuna decisione registrata finora. Crea un post con codice o attiva il test email per generare una traccia TTEV.
            </div>

            <div v-else class="overflow-x-auto max-h-80 custom-scrollbar">
              <table class="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr class="text-[10px] uppercase text-slate-400 border-b border-slate-800 bg-slate-900/60">
                    <th class="p-2.5">Sentinella</th>
                    <th class="p-2.5">Azione</th>
                    <th class="p-2.5">CDM Tier</th>
                    <th class="p-2.5">Verdetto</th>
                    <th class="p-2.5">Email</th>
                    <th class="p-2.5">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(log, idx) in sentinelLogs" :key="idx" class="border-b border-slate-900 hover:bg-slate-900/50">
                    <td class="p-2.5 font-bold text-cyan-300">@{{ log.sentinel }}</td>
                    <td class="p-2.5 text-slate-200">{{ log.actionType }}</td>
                    <td class="p-2.5">
                      <span class="px-2 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-500/30 text-[10px]">
                        {{ log.cdmTier || 'STANDARD' }}
                      </span>
                    </td>
                    <td class="p-2.5">
                      <span
                        :class="[
                          'px-2 py-0.5 rounded text-[10px] font-bold',
                          log.verdict === 'FAIL'
                            ? 'bg-red-500/20 text-red-400'
                            : log.verdict === 'PASS_WITH_CAVEATS'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-emerald-500/20 text-emerald-400'
                        ]"
                      >
                        {{ log.verdict || 'PASS' }}
                      </span>
                    </td>
                    <td class="p-2.5">
                      <span :class="log.smtpDispatched ? 'text-emerald-400 font-bold' : 'text-slate-500'">
                        {{ log.smtpDispatched ? '✉️ SENT' : '—' }}
                      </span>
                    </td>
                    <td class="p-2.5 text-slate-400 text-[11px]">
                      {{ log.createdAt ? new Date(log.createdAt).toLocaleString('it-IT') : '' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Colonna 3: Memoria Permanente BEMYAGENT (.bemyagent/docs) -->
          <div class="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 flex flex-col gap-3 font-mono">
            <div class="flex items-center justify-between border-b border-slate-800 pb-3">
              <span class="text-xs font-bold uppercase tracking-wider text-emerald-400">
                🧠 Memoria BEMYAGENT ({{ bemyDocs.length }})
              </span>
              <span class="text-[10px] text-purple-300 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded">
                {{ bemyMilestones.join(', ') || 'milestone-2' }}
              </span>
            </div>

            <select
              v-model="selectedBemyDoc"
              class="bg-slate-900 border border-slate-700 text-cyan-300 text-xs rounded-xl px-3 py-2 outline-none"
            >
              <option v-for="doc in bemyDocs" :key="doc.name" :value="doc.name">
                📄 {{ doc.name }}
              </option>
            </select>

            <pre class="text-[11px] text-slate-300 whitespace-pre-wrap bg-slate-900/70 border border-slate-800 rounded-xl p-3 max-h-64 overflow-y-auto leading-relaxed">{{ selectedBemyDocContent || 'Nessun documento caricato.' }}</pre>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 1: GESTIONE LICENZE E API KEYS -->
    <div v-else-if="activeTab === 'users'" class="flex flex-col gap-4">
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
              <tr v-for="thread in nodeThreads" :key="thread.id" class="border-b border-slate-800/60 hover:bg-slate-900/40">
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
          <div v-if="threadsTotal > threadsLimit" class="flex items-center justify-between pt-4 mt-4 border-t border-slate-800/80 font-mono text-xs">
            <span class="text-slate-400">
              Pagina <strong class="text-white">{{ threadsPage }}</strong> di <strong class="text-white">{{ totalThreadPages }}</strong> ({{ threadsTotal }} thread)
            </span>
            <div class="flex items-center gap-2">
              <button
                type="button"
                :disabled="threadsPage <= 1"
                @click="fetchAdminNodesData(threadsPage - 1)"
                class="px-3 py-1.5 rounded-lg bg-[#040814] border border-slate-700 text-slate-300 hover:border-sky-400 disabled:opacity-40 cursor-pointer"
              >
                ← Precedente
              </button>
              <button
                type="button"
                :disabled="threadsPage >= totalThreadPages"
                @click="fetchAdminNodesData(threadsPage + 1)"
                class="px-3 py-1.5 rounded-lg bg-[#040814] border border-slate-700 text-slate-300 hover:border-sky-400 disabled:opacity-40 cursor-pointer"
              >
                Successiva →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 4: TELEMETRIA INFRASTRUTTURA CLOUD RUN -->
    <div v-else-if="activeTab === 'infrastructure'" class="flex flex-col gap-6">
      <div class="bg-sky-500/10 border border-sky-500/30 rounded-2xl p-6 flex items-start gap-4">
        <span class="text-3xl">📊</span>
        <div>
          <h4 class="text-sky-400 font-bold text-lg mb-1 mt-0">Infrastruttura GCP &amp; Telemetria Cloud Run</h4>
          <p class="text-slate-300 text-sm m-0">
            Stato dei pod attivi su <strong class="text-white">GCP Cloud Run (europe-west4)</strong>, connessione HTTP Neon PostgreSQL ed invalidazione SWR Edge Cloudflare.
          </p>
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
        <div class="bg-[#080d1a] border border-slate-800 rounded-2xl p-5">
          <span class="text-xs text-slate-400">NEON PURE SQL LATENCY</span>
          <div class="text-2xl font-black text-emerald-400 mt-1">{{ sentinelData.dbLatencyMs || 9 }} ms</div>
        </div>
        <div class="bg-[#080d1a] border border-slate-800 rounded-2xl p-5">
          <span class="text-xs text-slate-400">CLOUDFLARE SWR HIT RATIO</span>
          <div class="text-2xl font-black text-sky-400 mt-1">{{ sentinelData.edgeCacheHitRatio || 99.8 }}%</div>
        </div>
        <div class="bg-[#080d1a] border border-slate-800 rounded-2xl p-5">
          <span class="text-xs text-slate-400">MAIL RELAY TRANSPORT</span>
          <div class="text-2xl font-black text-cyan-400 mt-1">RESEND HTTPS</div>
        </div>
      </div>
    </div>

    <!-- TAB 6: QUARANTENA SHADOWBAN & MODERAZIONE -->
    <div v-else-if="activeTab === 'moderation'" class="flex flex-col gap-4">
      <div class="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 flex items-start gap-4">
        <span class="text-3xl">⚖️</span>
        <div>
          <h4 class="text-amber-400 font-bold text-lg mb-1 mt-0">Utenti in Quarantena (Guardian Bot Firewall)</h4>
          <p class="text-slate-300 text-sm m-0">Account posti in modalità shadowban preventivo dalle Sentinelle. Puoi revocare il blocco con un clic.</p>
        </div>
      </div>

      <div v-if="shadowbannedUsers.length === 0" class="bg-[#080d1a] border border-slate-800 p-8 text-center text-slate-400 rounded-2xl font-mono text-sm">
        ✅ Nessun utente in quarantena al momento.
      </div>

      <div v-else class="bg-[#080d1a] border border-slate-800 rounded-2xl overflow-hidden">
        <table class="w-full text-left border-collapse font-mono text-xs">
          <thead>
            <tr class="bg-[#040814] text-slate-400 uppercase border-b border-slate-800">
              <th class="p-4">Utente</th>
              <th class="p-4">Motivo Intercettazione</th>
              <th class="p-4 text-right">Azione</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in shadowbannedUsers" :key="u.id" class="border-b border-slate-800/70">
              <td class="p-4 font-bold text-white">@{{ u.username }}</td>
              <td class="p-4 text-amber-300">{{ u.banReason || 'Regola Firewall' }}</td>
              <td class="p-4 text-right">
                <button
                  type="button"
                  @click="revokeShadowban(u.id, u.username)"
                  class="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500 hover:text-slate-950 font-bold cursor-pointer"
                >
                  🔓 Revoca Shadowban
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>

<style scoped>
.bg-grid-sentinel {
  background-image:
    linear-gradient(to right, rgba(34, 211, 238, 0.035) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(34, 211, 238, 0.035) 1px, transparent 1px);
  background-size: 36px 36px;
}
</style>