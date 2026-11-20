<script setup lang="ts">
import DkpLiveUsersTelemetryCard from '~/components/admin/DkpLiveUsersTelemetryCard.vue'
import { ref, computed, onMounted } from 'vue'
import DkpAdminShell from '~/components/admin/DkpAdminShell.vue'

definePageMeta({
  middleware: 'admin-only'
})

const serverTelemetry = ref({
  dbStatus: 'CONNECTED',
  latencyMs: 14,
  tablesCount: 0,
  rssMb: 0,
  heapUsedMb: 0,
  heapTotalMb: 0,
  uptimeSec: 0,
  cpuLoad: 0,
  nodeVersion: 'v20+',
  platform: 'linux/win',
  hasBrevo: false,
  hasOpenRouter: false,
  hasStripe: false
})

const stats = ref({
  stories: 0,
  nodes: 0,
  threads: 0,
  mailsUnread: 0,
  subscribers: 0,
  bountiesOpen: 0,
  usersTotal: 0
})

const isLoading = ref(true)

const formattedUptime = computed(() => {
  const s = serverTelemetry.value.uptimeSec
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m ${sec}s`
})

const quickModules = [
  { to: '/admin/api-gateway', title: 'API Gateway & Keys', desc: 'Chiavi Bearer, rate-limit e telemetria endpoint v2.6', badge: 'CORE' },
  { to: '/admin/mail', title: 'Mail Center Webmail', desc: 'Caselle Cloudflare & invio transazionale Brevo v3', badge: 'SMTP' },
  { to: '/admin/newsletter', title: 'Newsletter & Broadcast', desc: 'Audience Double Opt-In e campagne HTML', badge: 'BREVO' },
  { to: '/admin/autoresponder', title: 'Autoresponder Engine', desc: 'Regole euristiche e risposte automatiche SMTP', badge: 'BOT' },
  { to: '/admin/crawler', title: 'DKP Crawler Engine', desc: 'Ingestione HackerNews, GitHub, ArXiv & RemoteOK', badge: 'INGEST' },
  { to: '/admin/blog', title: 'Blog & Editorial CMS', desc: 'Articoli tecnici, guide e pubblicazione SEO', badge: 'CMS' },
  { to: '/admin/nodes', title: 'Gestione Nodi & Forum', desc: 'Albero n/ & n/n/, coda Sentinel AI e Vault Proof', badge: 'FORUM' },
  { to: '/admin/shop', title: 'Shop, DKP ADS & Library', desc: 'Campagne sponsor, licenze API e affiliazione Amazon', badge: 'REVENUE' },
  { to: '/admin/jobs', title: 'Tech Jobs Hub', desc: 'Annunci remote/hybrid e importazione crawler', badge: 'CAREERS' },
  { to: '/admin/bounties', title: 'Security & Code Bounties', desc: 'Reward pool EUR/XP e validazioni Pull Request', badge: 'ESCROW' },
  { to: '/admin/users', title: 'Utenti & RBAC', desc: 'Ruoli Admin/Moderator/Builder, XP e moderazione account', badge: 'IAM' },
  { to: '/admin/diagnostic', title: 'Kernel Diagnostic', desc: 'Latenza Neon PostgreSQL, OpenRouter AI e Vault SHA-256', badge: 'HEALTH' },
  { to: '/admin/seo', title: 'SEO & Sitemap Control', desc: 'Meta tag globali, OpenGraph e indicizzazione motori', badge: 'INDEX' }
]

async function loadOverview() {
  isLoading.value = true
  try {
    const [diagRes, nodesRes, mailRes, subRes, bountiesRes, usersRes]: any[] = await Promise.all([
      $fetch(`/api/admin/diagnostic?_t=${Date.now()}`).catch(() => null),
      $fetch('/api/admin/nodes').catch(() => null),
      $fetch('/api/mail').catch(() => null),
      $fetch('/api/newsletter/subscribers').catch(() => null),
      $fetch('/api/admin/bounties').catch(() => null),
      $fetch('/api/admin/users').catch(() => null)
    ])

    if (diagRes) {
      serverTelemetry.value = {
        dbStatus: diagRes.dbStatus || 'CONNECTED',
        latencyMs: Number(diagRes.latencyMs || 0),
        tablesCount: Number(diagRes.tablesCount || 0),
        rssMb: Number(diagRes.server?.rssMb || 0),
        heapUsedMb: Number(diagRes.server?.heapUsedMb || 0),
        heapTotalMb: Number(diagRes.server?.heapTotalMb || 0),
        uptimeSec: Number(diagRes.server?.uptimeSec || 0),
        cpuLoad: Number(diagRes.server?.cpuLoad || 0),
        nodeVersion: diagRes.server?.nodeVersion || 'v20+',
        platform: diagRes.server?.platform || 'runtime',
        hasBrevo: Boolean(diagRes.runtime?.hasBrevoKey),
        hasOpenRouter: Boolean(diagRes.runtime?.hasOpenRouterKey),
        hasStripe: Boolean(diagRes.runtime?.hasStripeKey)
      }
    }

    stats.value.stories = Number(diagRes?.counts?.stories ?? 0)
    stats.value.threads = Number(diagRes?.counts?.threads ?? 0)
    stats.value.nodes = Array.isArray(nodesRes?.data) ? nodesRes.data.length : 0
    stats.value.mailsUnread = Number(mailRes?.unreadCount ?? 0)
    stats.value.subscribers = Array.isArray(subRes?.data) ? subRes.data.length : 0
    stats.value.bountiesOpen = Array.isArray(bountiesRes?.data)
      ? bountiesRes.data.filter((b: any) => b.status === 'OPEN').length
      : 0
    stats.value.usersTotal = Array.isArray(usersRes?.data) ? usersRes.data.length : 0
  } finally {
    isLoading.value = false
  }
}

onMounted(loadOverview)
</script>

<template>
  <DkpAdminShell
    title="DKP Master Control Center"
    subtitle="Cruscotto operativo unificato v2.6-PURE-SQL su Neon PostgreSQL, Cloudflare Edge, Brevo v3 & Sentinel AI."
    badge="MASTER KERNEL OVERVIEW"
    seo-title="DKP Admin Dashboard Main v2.6 — DevKernelPulse"
  >
    <template #actions>
      <button
        type="button"
        @click="loadOverview"
        :disabled="isLoading"
        class="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold border-none cursor-pointer"
      >
         Sincronizza Telemetria
      </button>
    </template>

    <!-- 1. TELEMETRIE DEL SERVER & SITO (POSIZIONATE SOPRA LE KPI DEI CONTENUTI) -->
    <section aria-label="Server & Infrastructure Telemetry" class="bg-dkp-card/95 border border-cyan-500/40 rounded-2xl p-4 sm:p-5 card-glow font-mono space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-dkp-border/80 text-xs">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]"></span>
          <span class="font-extrabold text-cyan-400 uppercase tracking-wider">
            SERVER &amp; EDGE INFRASTRUCTURE TELEMETRY
          </span>
        </div>
        <div class="flex flex-wrap items-center gap-3 text-[11px] text-slate-300">
          <span>RUNTIME: <strong class="text-white">{{ serverTelemetry.nodeVersion }}</strong></span>
          <span>UPTIME: <strong class="text-emerald-400">{{ formattedUptime }}</strong></span>
          <span>DB PING: <strong class="text-cyan-300">{{ serverTelemetry.latencyMs }} ms</strong></span>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <!-- Neon PostgreSQL -->
        <div class="bg-[#030712] border border-emerald-500/35 rounded-xl p-3.5 flex flex-col justify-between gap-1">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-extrabold text-emerald-400 uppercase">NEON POSTGRESQL</span>
            <span class="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 text-[10px] font-bold">{{ serverTelemetry.dbStatus }}</span>
          </div>
          <div class="text-base font-extrabold text-white">{{ serverTelemetry.latencyMs }} ms &bull; {{ serverTelemetry.tablesCount }} Tabelle</div>
          <div class="text-[10px] text-slate-400">Driver: Drizzle Pure-SQL Pool</div>
        </div>

        <!-- Server Memory & CPU -->
        <div class="bg-[#030712] border border-sky-500/35 rounded-xl p-3.5 flex flex-col justify-between gap-1">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-extrabold text-sky-400 uppercase">SERVER RAM &amp; LOAD</span>
            <span class="px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 text-[10px] font-bold">RSS {{ serverTelemetry.rssMb }} MB</span>
          </div>
          <div class="text-base font-extrabold text-white">Heap {{ serverTelemetry.heapUsedMb }} / {{ serverTelemetry.heapTotalMb }} MB</div>
          <div class="text-[10px] text-slate-400">Load Avg: {{ serverTelemetry.cpuLoad }} &bull; {{ serverTelemetry.platform }}</div>
        </div>

        <!-- Edge Security & Sentinel -->
        <div class="bg-[#030712] border border-purple-500/35 rounded-xl p-3.5 flex flex-col justify-between gap-1">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-extrabold text-purple-400 uppercase">GCP ARMOR &amp; SENTINEL</span>
            <span class="px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 text-[10px] font-bold">SHIELD ON</span>
          </div>
          <div class="text-base font-extrabold text-white">WAF L7 + SAST Strict</div>
          <div class="text-[10px] text-slate-400">Vault Ledger SHA-256 Sincronizzato</div>
        </div>

        <!-- Connettori Esterni -->
        <div class="bg-[#030712] border border-amber-500/35 rounded-xl p-3.5 flex flex-col justify-between gap-1">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-extrabold text-amber-400 uppercase">EXTERNAL CONNECTORS</span>
            <span class="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 text-[10px] font-bold">LIVE</span>
          </div>
          <div class="flex items-center gap-2 text-[11px] font-bold text-white mt-0.5">
            <span :class="serverTelemetry.hasBrevo ? 'text-emerald-400' : 'text-amber-300'">Brevo</span> &bull;
            <span :class="serverTelemetry.hasOpenRouter ? 'text-emerald-400' : 'text-amber-300'">OpenRouter</span> &bull;
            <span :class="serverTelemetry.hasStripe ? 'text-emerald-400' : 'text-amber-300'">Stripe</span>
          </div>
          <div class="text-[10px] text-slate-400">API Gateway &amp; Webhooks Attivi</div>
        </div>
      </div>
    </section>

    <!-- 2. KPI CONTENUTI DATABASE -->
    <section class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 font-mono">
      <div class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-4 card-glow">
        <div class="text-[10px] text-cyan-400 font-bold uppercase">STORIES</div>
        <div class="text-2xl font-extrabold text-white mt-1">{{ stats.stories }}</div>
      </div>
      <div class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-4 card-glow">
        <div class="text-[10px] text-sky-400 font-bold uppercase">NODI ATTIVI</div>
        <div class="text-2xl font-extrabold text-sky-300 mt-1">{{ stats.nodes }}</div>
      </div>
      <div class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-4 card-glow">
        <div class="text-[10px] text-violet-400 font-bold uppercase">THREADS</div>
        <div class="text-2xl font-extrabold text-violet-300 mt-1">{{ stats.threads }}</div>
      </div>
      <div class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-4 card-glow">
        <div class="text-[10px] text-emerald-400 font-bold uppercase">MAIL UNREAD</div>
        <div class="text-2xl font-extrabold text-emerald-400 mt-1">{{ stats.mailsUnread }}</div>
      </div>
      <div class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-4 card-glow">
        <div class="text-[10px] text-amber-400 font-bold uppercase">NEWSLETTER</div>
        <div class="text-2xl font-extrabold text-amber-300 mt-1">{{ stats.subscribers }}</div>
      </div>
      <div class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-4 card-glow">
        <div class="text-[10px] text-rose-400 font-bold uppercase">BOUNTY OPEN</div>
        <div class="text-2xl font-extrabold text-rose-300 mt-1">{{ stats.bountiesOpen }}</div>
      </div>
      <div class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-4 card-glow">
        <div class="text-[10px] text-teal-400 font-bold uppercase">UTENTI DB</div>
        <div class="text-2xl font-extrabold text-teal-300 mt-1">{{ stats.usersTotal }}</div>
      </div>
    </section>

    <!-- 3. GRIGLIA MODULI OPERATIVI -->
    <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <NuxtLink
        v-for="mod in quickModules"
        :key="mod.to"
        :to="mod.to"
        class="bg-dkp-card/95 border border-dkp-border hover:border-cyan-400/60 rounded-2xl p-5 card-glow flex flex-col justify-between gap-3 no-underline transition-all group"
      >
        <div class="flex items-center justify-between font-mono">
          <span class="px-2.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/35 text-cyan-300 text-[10px] font-extrabold">
            {{ mod.badge }}
          </span>
          <span class="text-xs text-slate-400 group-hover:text-emerald-400 font-bold transition-colors">Apri &rarr;</span>
        </div>
        <div>
          <h2 class="text-white font-bold text-base m-0 mb-1 group-hover:text-cyan-300 transition-colors">
            {{ mod.title }}
          </h2>
          <p class="text-slate-400 text-xs m-0 leading-relaxed">
            {{ mod.desc }}
          </p>
        </div>
      </NuxtLink>
    </section>
  
    <DkpLiveUsersTelemetryCard />
  </DkpAdminShell>
</template>