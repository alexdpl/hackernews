<!-- app/pages/admin/index.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

useDkpSeo({
  title: 'Sentinel Network Control Panel — DKP v2.6 Pure SQL',
  description: 'Control center centrale, telemetria Pure SQL, moderazione DKP Nodes e Sentinel Network v2.6.',
  noindex: true
})

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

const users = ref<AdminUserKeyItem[]>([])
const nodes = ref<DkpNodeSummary[]>([])
const nodeThreads = ref<ThreadModerationSummary[]>([])
const isLoadingUsers = ref(false)
const isLoadingNodes = ref(false)

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
    description: 'Coordina il ciclo Think-Task-Execute-Verify, il Lazy Loading e la telemetria OpenUI.'
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
    description: 'Presidia i nodi Core Releases & Patch e i bollettini CVE con checklist SHA-256.'
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
      ? '🤖 Sentinel Network (v2.6): Protezione euristica ATTIVATA!'
      : '⚠️ Sentinel Network: Protezione euristica DISATTIVATA.',
    sentinelData.value.autoDefendEnabled ? 'success' : 'warning'
  )
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
      triggerToast(`⚡ Ingestione completata! Inserted: ${res.imported ?? 0}`, 'success')
      await fetchAdminNodesData(1)
    } else {
      triggerToast(`⚠️ Warning: ${res?.error || 'Errore esecuzione'}`, 'warning')
    }
  } catch (err: any) {
    triggerToast(`❌ Errore di rete: ${err?.data?.statusMessage || err?.message}`, 'error')
  } finally {
    isManualTriggering.value = false
  }
}

async function purgeDatabase() {
  if (!confirm('⚠️ Vuoi davvero eliminare i log di ingestione vecchi?')) return
  isPurging.value = true
  try {
    const res = await $fetch<any>('/api/admin/cron/purge', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${DKP_ADMIN_MASTER_KEY}`,
        'x-api-key': DKP_ADMIN_MASTER_KEY
      }
    })
    if (res?.success) triggerToast(`🧹 ${res.message}`, 'success')
  } catch (err: any) {
    triggerToast(`❌ Errore purge: ${err?.message}`, 'error')
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
      $fetch('/api/admin/nodes/posts', { query: { page, limit: threadsLimit } }).catch(() => ({ success: false, data: [] }))
    ])
    if (nodesRes?.success) nodes.value = nodesRes.data || []
    if (threadsRes?.success) {
      nodeThreads.value = threadsRes.data || []
      threadsTotal.value = threadsRes.total || nodeThreads.value.length
    }
  } finally {
    isLoadingNodes.value = false
  }
}

const totalThreadPages = computed(() => Math.max(1, Math.ceil(threadsTotal.value / threadsLimit)))

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
        joined: item.joined || '2026-11-12'
      }))
    }
  } finally {
    isLoadingUsers.value = false
  }
}

const filteredUsers = computed(() => {
  if (!searchQuery.value.trim()) return users.value
  const q = searchQuery.value.toLowerCase()
  return users.value.filter(u =>
    (u.username || '').toLowerCase().includes(q) ||
    (u.licenseKey || '').toLowerCase().includes(q)
  )
})

async function toggleUserStatus(user: AdminUserKeyItem) {
  const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
  try {
    await $fetch('/api/admin/keys', { method: 'POST', body: { id: user.id, status: newStatus } })
    user.status = newStatus
    triggerToast(`Stato licenza aggiornato: ${newStatus}`, 'success')
  } catch (err: any) {
    triggerToast(`Errore modifica licenza`, 'error')
  }
}

async function toggleLockThread(thread: ThreadModerationSummary) {
  try {
    await $fetch(`/api/admin/nodes/posts/${thread.id}`, { method: 'PATCH', body: { action: 'toggle_lock' } })
    thread.isLocked = !thread.isLocked
    triggerToast(thread.isLocked ? '🔒 Thread bloccato' : '🔓 Thread sbloccato', 'warning')
  } catch {
    triggerToast('Impossibile modificare lock.', 'error')
  }
}

async function deleteThread(id: number) {
  if (!confirm('Eliminare definitivamente?')) return
  try {
    await $fetch(`/api/admin/nodes/posts/${id}`, { method: 'DELETE' })
    nodeThreads.value = nodeThreads.value.filter(t => t.id !== id)
    triggerToast('🗑️ Thread rimosso.', 'success')
  } catch {
    triggerToast('Errore cancellazione.', 'error')
  }
}

onMounted(() => {
  fetchSentinelNetworkControl()
  fetchUsers()
  fetchAdminNodesData(1)
})
</script>

<template>
  <div class="bg-[#0f172a] text-[#f1f5f9] font-['Space_Grotesk',sans-serif] min-h-screen bg-grid-pattern relative">
    
    <!-- Background Glows -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden">
      <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
      <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl"></div>
    </div>

    <!-- FLOATING TOAST -->
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
        :class="[
          'fixed top-6 right-6 z-50 p-4 rounded-xl backdrop-blur-md border shadow-2xl max-w-md flex items-center gap-3 font-mono text-xs font-semibold',
          toastType === 'success' ? 'bg-[#1e293b]/95 border-emerald-500/50 text-emerald-300' : 'bg-[#1e293b]/95 border-rose-500/50 text-rose-300'
        ]"
      >
        <span class="text-xl">{{ toastType === 'success' ? '⚡' : '⚠️' }}</span>
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>

    <div class="relative z-10 p-4 md:p-8 max-w-7xl mx-auto flex flex-col gap-6">
      
      <!-- HEADER -->
      <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#1e293b]/80 border border-[#334155] rounded-2xl p-6 shadow-2xl">
        <div>
          <h1 class="text-2xl md:text-4xl font-bold tracking-tight flex items-center gap-3 m-0">
            <svg class="w-10 h-10 text-[#22d3ee]" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.198.698.264 1.074.106.346-.146.638-.42.848-.766.093-.154.174-.315.24-.48l.214-1.281c.09-.543.56-.941 1.11-.941h2.594c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.314.686.645.87.074.04.147.083.22.127.357.198.727.264 1.095.106.355-.146.654-.42.87-.776.093-.154.186-.326.252-.494l.162-.965c.227-.047.46-.047.687 0l.162.965c.066.168.159.34.252.494.216.356.515.63.87.776.368.158.738.092 1.095-.106.073-.044.146-.087.22-.127.332-.184.582-.496.645-.87l.214-1.281c.09-.543.56-.941 1.11-.941h2.594c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.198.698.264 1.074.106.346-.146.638-.42.848-.766..." />
            </svg>
            Sentinel Network Control Panel
          </h1>
          <p class="text-[#64748b] text-xs sm:text-sm mt-1 m-0 font-mono">
            DKP Kernel v2.6 Pure SQL • Cloud Run &amp; BEMYAGENT TTEV Telemetry
          </p>
        </div>

        <div class="flex items-center gap-3">
          <button
            type="button"
            @click="runManualIngestion"
            :disabled="isManualTriggering"
            class="px-4 py-2.5 rounded-xl font-bold text-xs font-mono bg-[#22d3ee] text-[#0f172a] hover:brightness-110 transition-all cursor-pointer disabled:opacity-50"
          >
            {{ isManualTriggering ? 'Syncing...' : '🔄 Sync HackerNews' }}
          </button>
          <button
            type="button"
            @click="purgeDatabase"
            :disabled="isPurging"
            class="px-4 py-2.5 rounded-xl font-bold text-xs font-mono bg-rose-500/10 border border-rose-500/40 text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
          >
            🧹 Purge DB
          </button>
        </div>
      </header>

      <!-- NAVIGATION TABS -->
      <div class="flex gap-2 border-b border-[#334155] pb-3 overflow-x-auto font-mono text-xs">
        <button
          type="button"
          :class="['px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap', activeTab === 'sentinel' ? 'bg-[#1e293b] border border-[#22d3ee] text-[#22d3ee]' : 'text-[#64748b] hover:text-[#f1f5f9]']"
          @click="activeTab = 'sentinel'; fetchSentinelNetworkControl()"
        >
          🛡️ Sentinel Network &amp; TTEV ({{ sentinelLogs.length }})
        </button>
        <button
          type="button"
          :class="['px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap', activeTab === 'users' ? 'bg-[#1e293b] border border-[#10b981] text-[#10b981]' : 'text-[#64748b] hover:text-[#f1f5f9]']"
          @click="activeTab = 'users'"
        >
          🔑 API Keys &amp; Licenze ({{ users.length }})
        </button>
        <button
          type="button"
          :class="['px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap', activeTab === 'nodes' ? 'bg-[#1e293b] border border-[#3b82f6] text-[#3b82f6]' : 'text-[#64748b] hover:text-[#f1f5f9]']"
          @click="activeTab = 'nodes'"
        >
          💬 DKP Nodi &amp; Forum ({{ nodes.length }})
        </button>
        <button
          type="button"
          :class="['px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap', activeTab === 'moderation' ? 'bg-[#1e293b] border border-[#f59e0b] text-[#f59e0b]' : 'text-[#64748b] hover:text-[#f1f5f9]']"
          @click="activeTab = 'moderation'"
        >
          ⚖️ Quarantena Shadowban ({{ shadowbannedUsers.length }})
        </button>
      </div>

      <!-- TAB 1: SENTINEL NETWORK -->
      <div v-if="activeTab === 'sentinel'" class="flex flex-col gap-6">
        <!-- Pannello Test Email Resend -->
        <div class="bg-[#1e293b] border border-[#334155] rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h3 class="text-lg font-bold text-white m-0">Canale Notifiche SMTP &amp; Resend HTTPS</h3>
            <p class="text-xs text-[#64748b] m-0 font-mono mt-1">Invia un test di notifica istantanea per verificare il dispacciamento delle sentinelle.</p>
          </div>
          <div class="flex items-center gap-2 w-full md:w-auto font-mono">
            <input
              v-model="testEmailRecipient"
              type="email"
              placeholder="alex@devkernelpulse.org"
              class="bg-[#0f172a] border border-[#334155] text-white px-3 py-2 rounded-xl text-xs outline-none focus:border-[#22d3ee] flex-1 md:w-64"
            />
            <button
              type="button"
              @click="dispatchSentinelEmailTest"
              :disabled="isTestingEmail"
              class="px-4 py-2 rounded-xl bg-[#3b82f6]/20 border border-[#3b82f6]/50 text-[#3b82f6] hover:bg-[#3b82f6]/30 text-xs font-bold transition-all cursor-pointer"
            >
              {{ isTestingEmail ? 'Invio...' : '✉️ Test Email' }}
            </button>
          </div>
        </div>

        <!-- 4 AGENTI CARDS -->
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div
            v-for="agent in enrichedSentinels"
            :key="agent.username"
            class="bg-[#1e293b] border border-[#334155] hover:border-[#22d3ee]/60 rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all card-glow"
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
              <p class="text-xs font-semibold text-[#22d3ee] mt-0.5 mb-2">{{ agent.roleTitle }}</p>
              <p class="text-xs text-[#64748b] leading-relaxed m-0">{{ agent.description }}</p>
            </div>

            <div class="pt-3 border-t border-[#334155] flex flex-col gap-2 font-mono text-[11px]">
              <div class="flex items-center justify-between">
                <span class="text-[#64748b]">CDM Tier:</span>
                <span class="px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 font-bold">
                  {{ agent.lastCdmTier }}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-[#64748b]">Verdict:</span>
                <span :class="['px-2 py-0.5 rounded font-bold border', agent.lastVerdict === 'FAIL' ? 'bg-red-500/20 text-red-400 border-red-500/40' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40']">
                  {{ agent.lastVerdict }}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-[#64748b]">Email Dispatch:</span>
                <span :class="agent.lastMailSent ? 'text-emerald-400 font-bold' : 'text-[#64748b]'">
                  {{ agent.lastMailSent ? '✉️ DISPATCHED' : 'STANDBY' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- STREAM TTEV + MEMORIA BEMYAGENT -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 bg-[#1e293b] border border-[#334155] rounded-2xl p-5 flex flex-col gap-3 font-mono">
            <div class="flex items-center justify-between border-b border-[#334155] pb-3">
              <span class="text-xs font-bold uppercase tracking-wider text-[#22d3ee]">
                ⚡ Symbiotic Validation &amp; TTEV Audit Stream
              </span>
              <span class="text-[11px] text-[#64748b]">Neon Pure SQL</span>
            </div>

            <div v-if="sentinelLogs.length === 0" class="py-10 text-center text-xs text-[#64748b]">
              Nessuna decisione registrata finora.
            </div>
            <div v-else class="overflow-x-auto max-h-80">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="text-[10px] uppercase text-[#64748b] border-b border-[#334155]">
                    <th class="p-2.5">Sentinella</th>
                    <th class="p-2.5">Azione</th>
                    <th class="p-2.5">Verdetto</th>
                    <th class="p-2.5">Data</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(log, idx) in sentinelLogs" :key="idx" class="border-b border-[#334155]/50 hover:bg-[#0f172a]/50">
                    <td class="p-2.5 font-bold text-[#22d3ee]">@{{ log.sentinel }}</td>
                    <td class="p-2.5 text-slate-200">{{ log.actionType }}</td>
                    <td class="p-2.5">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">{{ log.verdict || 'PASS' }}</span>
                    </td>
                    <td class="p-2.5 text-[#64748b] text-[11px]">{{ log.createdAt ? new Date(log.createdAt).toLocaleString('it-IT') : '' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Memoria Bemyagent -->
          <div class="bg-[#1e293b] border border-[#334155] rounded-2xl p-5 flex flex-col gap-3 font-mono">
            <div class="flex items-center justify-between border-b border-[#334155] pb-3">
              <span class="text-xs font-bold uppercase tracking-wider text-emerald-400">
                🧠 Memoria BEMYAGENT ({{ bemyDocs.length }})
              </span>
              <span class="text-[10px] text-purple-300 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded">
                {{ bemyMilestones.join(', ') || 'milestone-2' }}
              </span>
            </div>

            <select
              v-model="selectedBemyDoc"
              class="bg-[#0f172a] border border-[#334155] text-[#22d3ee] text-xs rounded-xl px-3 py-2 outline-none"
            >
              <option v-for="doc in bemyDocs" :key="doc.name" :value="doc.name">
                📄 {{ doc.name }}
              </option>
            </select>

            <pre class="text-[11px] text-slate-300 whitespace-pre-wrap bg-[#0f172a] border border-[#334155] rounded-xl p-3 max-h-64 overflow-y-auto leading-relaxed">{{ selectedBemyDocContent || 'Nessun documento caricato.' }}</pre>
          </div>
        </div>
      </div>

      <!-- TAB 2: API KEYS -->
      <div v-else-if="activeTab === 'users'" class="flex flex-col gap-4 font-mono">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cerca licenze o API keys..."
          class="bg-[#1e293b] border border-[#334155] px-4 py-3 rounded-xl text-white text-sm outline-none focus:border-[#22d3ee] max-w-md"
        />
        <div class="bg-[#1e293b] border border-[#334155] rounded-2xl overflow-hidden">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-[#0f172a] text-[#64748b] uppercase border-b border-[#334155]">
                <th class="p-4">Utente</th>
                <th class="p-4">API Key</th>
                <th class="p-4">Ruolo</th>
                <th class="p-4">Stato</th>
                <th class="p-4 text-right">Azione</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in filteredUsers" :key="user.id" class="border-b border-[#334155]/60">
                <td class="p-4 font-bold text-white">{{ user.email }}</td>
                <td class="p-4 text-[#22d3ee]">{{ user.licenseKey }}</td>
                <td class="p-4"><span class="bg-[#0f172a] px-2 py-1 rounded text-purple-400 font-bold">{{ user.role }}</span></td>
                <td class="p-4">
                  <span :class="['px-2 py-0.5 rounded font-bold', user.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400']">
                    {{ user.status }}
                  </span>
                </td>
                <td class="p-4 text-right">
                  <button
                    type="button"
                    @click="toggleUserStatus(user)"
                    class="px-3 py-1 rounded bg-[#0f172a] border border-[#334155] hover:border-[#22d3ee] text-white font-bold cursor-pointer"
                  >
                    {{ user.status === 'ACTIVE' ? 'Sospendi' : 'Riattiva' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB 3: NODI -->
      <div v-else-if="activeTab === 'nodes'" class="flex flex-col gap-4 font-mono">
        <div class="bg-[#1e293b] border border-[#334155] rounded-2xl p-6">
          <h3 class="text-white font-bold text-base mb-4 m-0">📚 Moderazione Thread Nodi</h3>
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-[#0f172a] text-[#64748b] uppercase border-b border-[#334155]">
                <th class="p-3">Titolo</th>
                <th class="p-3">Nodo</th>
                <th class="p-3">Autore</th>
                <th class="p-3 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="thread in nodeThreads" :key="thread.id" class="border-b border-[#334155]/60">
                <td class="p-3 font-bold text-white">{{ thread.title }}</td>
                <td class="p-3 text-[#22d3ee]">n/{{ thread.nodeSlug }}</td>
                <td class="p-3 text-[#64748b]">@{{ thread.authorName }}</td>
                <td class="p-3 text-right">
                  <button
                    type="button"
                    @click="deleteThread(thread.id)"
                    class="px-2.5 py-1 bg-rose-500/20 text-rose-400 rounded font-bold cursor-pointer hover:bg-rose-500 hover:text-white"
                  >
                    🗑️ Elimina
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB 4: QUARANTENA -->
      <div v-else-if="activeTab === 'moderation'" class="flex flex-col gap-4 font-mono">
        <div class="bg-[#1e293b] border border-[#334155] rounded-2xl p-6">
          <h3 class="text-amber-400 font-bold text-base mb-4 m-0">⚖️ Utenti in Quarantena (Guardian Bot)</h3>
          <div v-if="shadowbannedUsers.length === 0" class="text-[#64748b] text-xs">Nessun utente in quarantena.</div>
          <table v-else class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-[#0f172a] text-[#64748b] uppercase border-b border-[#334155]">
                <th class="p-3">Utente</th>
                <th class="p-3">Motivo</th>
                <th class="p-3 text-right">Azione</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in shadowbannedUsers" :key="u.id" class="border-b border-[#334155]/60">
                <td class="p-3 font-bold text-white">@{{ u.username }}</td>
                <td class="p-3 text-amber-300">{{ u.banReason || 'Regola Firewall' }}</td>
                <td class="p-3 text-right">
                  <button
                    type="button"
                    @click="revokeShadowban(u.id, u.username)"
                    class="px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded font-bold cursor-pointer"
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
  </div>
</template>

<style scoped>
.bg-grid-pattern {
  background-image:
    linear-gradient(to right, rgba(34, 211, 238, 0.03) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(34, 211, 238, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
}
.card-glow {
  box-shadow: 0 0 0 1px rgba(34, 211, 238, 0.1), 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
.card-glow:hover {
  box-shadow: 0 0 0 1px rgba(34, 211, 238, 0.3), 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}
</style>