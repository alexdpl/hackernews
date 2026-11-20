<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import DkpHomeTelemetry from '~/components/DkpHomeTelemetry.vue'
import DkpThreadCard from '~/components/nodes/DkpThreadCard.vue'
import DkpRelatedBlogWidget from '~/components/widgets/DkpRelatedBlogWidget.vue'
import DkpHomeWidget from '~/components/DkpHomeWidget.vue'
import DkpAdStrip from '~/components/DkpAdStrip.vue'
import { buildCategoryNodeTree, cleanNodeLabel } from '~/composables/useDkpNodes'

useDkpSeo({
  title: 'DKP Nodes & Talks Hub \u2014 Forum Tecnici & Blockchain Vault | DevKernelPulse',
  description: 'Esplora i nodi e i sub-nodi tecnici di DevKernelPulse: Core Releases, AI Agents, Pure SQL e notarizzazione SHA-256.',
  type: 'collection',
  canonicalPath: '/nodes'
})

const heroCards = [
  {
    to: '/news',
    icon: '\uD83C\uDF0D',
    badge: 'LIVE STREAM',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/35',
    title: 'DKP Tech Feed',
    desc: 'Segnali tech e newsroom filtrati in tempo reale da Trinity AI'
  },
  {
    to: '/nodes',
    icon: '\uD83D\uDCAC',
    badge: 'COMMUNITY',
    badgeClass: 'bg-violet-500/15 text-violet-300 border-violet-500/35',
    title: 'DKP Talks Hub',
    desc: 'Nodi tematici, architetture, bounty e discussioni tecniche'
  },
  {
    to: '/tools',
    icon: '\uD83D\uDEE0\uFE0F',
    badge: 'SECURITY & DEV',
    badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/35',
    title: 'Developer Tools',
    desc: 'Utility crittografiche, audit SAST e diagnostica per ingegneri'
  },
  {
    to: '/blog',
    icon: '\uD83D\uDCDD',
    badge: 'VAULT VERIFIED',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/35',
    title: 'DKP Editorial Hub',
    desc: 'Deep-dive tecnici con certificazione SHA-256 immutabile'
  }
]

const nodesList = ref<any[]>([])
const recentThreads = ref<any[]>([])
const isLoading = ref(true)
const searchQuery = ref('')
const selectedNodeGroup = ref('Tutti')
const selectedSubnodeSlug = ref('Tutti')
const { currentUser } = useAuthCore()

const nodeTree = computed(() => buildCategoryNodeTree(nodesList.value))

const nodeGroups = computed(() => {
  const cats = nodeTree.value.categories || []
  return cats.map((catName: string) => ({
    name: catName,
    subnodes: nodeTree.value.groupedNodes[catName] || []
  }))
})

const activeGroupObj = computed(() =>
  nodeGroups.value.find((g: any) => g.name === selectedNodeGroup.value) || null
)

function selectNodeGroup(groupName: string) {
  selectedNodeGroup.value = groupName
  selectedSubnodeSlug.value = 'Tutti'
}

function selectSubnode(subSlug: string) {
  selectedSubnodeSlug.value = subSlug
}

function resetNodeFilters() {
  selectedNodeGroup.value = 'Tutti'
  selectedSubnodeSlug.value = 'Tutti'
  searchQuery.value = ''
}

const filteredThreads = computed<any[]>(() => {
  const q = searchQuery.value.toLowerCase().trim()
  const activeGroup = activeGroupObj.value

  return recentThreads.value.filter((t: any) => {
    const tSlug = String(t.nodeSlug || t.node_slug || '').toLowerCase().replace(/^(n\/)+/i, '')
    const tName = String(t.nodeName || t.node_name || '').toLowerCase()
    const tNodeId = Number(t.nodeId || t.node_id || 0)

    if (selectedNodeGroup.value !== 'Tutti' && activeGroup) {
      const subList = activeGroup.subnodes || []
      const groupSlugs = new Set(subList.map((n: any) => String(n.slug || '').toLowerCase().replace(/^(n\/)+/i, '')))
      const groupNames = new Set(subList.map((n: any) => String(cleanNodeLabel(n.name || '')).toLowerCase()))
      const groupIds = new Set(subList.map((n: any) => Number(n.id || 0)).filter((id: number) => id > 0))
      const matchesGroup =
        groupSlugs.has(tSlug) ||
        groupNames.has(tName) ||
        (tNodeId > 0 && groupIds.has(tNodeId)) ||
        String(t.category || '').toLowerCase() === selectedNodeGroup.value.toLowerCase()
      if (!matchesGroup) return false
    }

    if (selectedSubnodeSlug.value !== 'Tutti') {
      const targetSub = selectedSubnodeSlug.value.toLowerCase().replace(/^(n\/)+/i, '')
      const subObj = (activeGroup?.subnodes || []).find(
        (n: any) => String(n.slug || '').toLowerCase().replace(/^(n\/)+/i, '') === targetSub
      )
      const matchSlug = tSlug === targetSub
      const matchId = subObj?.id && tNodeId > 0 && Number(subObj.id) === tNodeId
      if (!matchSlug && !matchId) return false
    }

    if (q) {
      const hay = `${t.title || ''} ${t.content || ''} ${tSlug} ${tName} ${t.authorUsername || t.author || ''}`.toLowerCase()
      if (!hay.includes(q)) return false
    }

    return true
  })
})

async function loadNodesHub() {
  isLoading.value = true
  try {
    const [nRes, pRes]: any = await Promise.all([
      $fetch('/api/nodes').catch(() => null),
      $fetch('/api/nodes/posts?limit=40&_t=' + Date.now()).catch(() => null)
    ])
    nodesList.value = nRes?.data || []
    recentThreads.value = pRes?.posts || pRes?.data || []
  } finally {
    isLoading.value = false
  }
}

async function handleToggleLock(thread: any) {
  const nextLocked = !thread.isLocked
  const res: any = await $fetch(`/api/nodes/posts/${thread.id}/close`, {
    method: 'PATCH',
    body: { isLocked: nextLocked }
  }).catch(() => null)
  if (res?.success) thread.isLocked = nextLocked
}

onMounted(loadNodesHub)
</script>

<template>
  <div class="bg-dkp-bg text-dkp-text font-display min-h-screen bg-grid-pattern relative">
    <DkpHomeTelemetry />

    <!-- HERO SECTION SPECULARE ALLA HOME, /news E /blog -->
    <section class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-4 text-center">
      <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-dkp-card border border-dkp-border font-mono text-xs text-dkp-accent font-bold mb-6 card-glow">
        <span class="w-2 h-2 rounded-full bg-violet-400"></span>
        <span> DKP TALKS HUB &bull; FORUM TECNICI &amp; SHA-256 VAULT V2.6-PURE-SQL</span>
      </div>

      <h1 class="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight m-0 mb-5">
        <span class="text-white">DKP Nodes &amp; </span>
        <span class="bg-gradient-to-r from-violet-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          Talks Hub
        </span>
      </h1>

      <p class="text-slate-300 text-base sm:text-lg max-w-3xl mx-auto leading-relaxed mb-8">
        Forum tecnici verticali, sub-nodi specializzati, code review e discussioni notarizzate su Neon PostgreSQL dalla community DevKernelPulse.
      </p>

      <!-- 4 CARD PRINCIPALI -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left mb-7">
        <NuxtLink
          v-for="card in heroCards"
          :key="card.to"
          :to="card.to"
          :class="[
            'bg-dkp-card/95 border rounded-2xl p-5 no-underline transition-all card-glow group flex flex-col justify-between gap-4',
            card.to === '/nodes' ? 'border-violet-400/60 shadow-[0_0_20px_rgba(167,139,250,0.16)]' : 'border-dkp-border hover:border-cyan-400/60'
          ]"
        >
          <div class="flex items-center justify-between">
            <span class="text-2xl">{{ card.icon }}</span>
            <span :class="['font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-md border uppercase', card.badgeClass]">
              {{ card.badge }}
            </span>
          </div>
          <div>
            <h2 class="text-base font-bold text-white group-hover:text-dkp-accent transition-colors flex items-center justify-between m-0 mb-1.5">
              <span>{{ card.title }}</span>
              <span class="text-slate-400 group-hover:text-dkp-accent transition-transform group-hover:translate-x-1">&rarr;</span>
            </h2>
            <p class="text-xs text-slate-300 leading-relaxed m-0">{{ card.desc }}</p>
          </div>
        </NuxtLink>
      </div>

      <!-- AZIONI RAPIDE NODI -> PUBBLICA THREAD APRE DASHBOARD -->
      <div class="flex flex-wrap items-center justify-center gap-3 mb-6">
        <NuxtLink
          to="/user/dashboard?tab=content&subtab=nodes&new=1"
          class="px-5 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-mono text-xs sm:text-sm font-extrabold no-underline shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all"
        >
           Pubblica Thread (+50 XP)
        </NuxtLink>

        <NuxtLink
          to="/nodes/n/blockchain-vault"
          class="px-4 py-2.5 rounded-xl bg-dkp-card border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 font-mono text-xs sm:text-sm font-bold no-underline transition-colors"
        >
           n/blockchain-vault
        </NuxtLink>

        <button
          type="button"
          @click="loadNodesHub"
          class="px-4 py-2.5 rounded-xl bg-dkp-card border border-dkp-border hover:border-cyan-400 text-slate-200 font-mono text-xs sm:text-sm font-bold cursor-pointer transition-colors"
        >
           Aggiorna Feed
        </button>
      </div>

      <!-- BARRA RICERCA THREAD -->
      <div class="max-w-3xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
        <div class="relative flex-1">
          <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cerca thread, architetture, nodi (es. BEMYAGENT, Pure SQL, Rust, AI)..."
            class="w-full bg-dkp-card/95 border border-dkp-border focus:border-violet-400 text-white pl-10 pr-4 py-3 rounded-xl font-mono text-xs outline-none box-border"
          />
        </div>
        <div class="px-4 py-3 rounded-xl bg-dkp-card/95 border border-dkp-border font-mono text-xs font-bold text-violet-300 shrink-0">
           {{ filteredThreads.length }} thread
        </div>
      </div>

      <!-- MENU NODi & SUBNODi A PILLOLE SOTTO LA BARRA DI RICERCA (COME CATEGORIE & SOTTOCATEGORIE IN BLOG) -->
      <div v-if="nodeGroups.length > 0" class="max-w-6xl mx-auto text-left bg-dkp-card/90 border border-dkp-border rounded-2xl p-4 space-y-3 card-glow">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="font-mono text-[11px] font-bold text-slate-400 uppercase tracking-wider">
             Nodi &amp; Sub-Nodi
          </span>
          <button
            v-if="selectedNodeGroup !== 'Tutti' || selectedSubnodeSlug !== 'Tutti' || searchQuery"
            type="button"
            @click="resetNodeFilters"
            class="font-mono text-[11px] text-rose-400 hover:text-rose-300 bg-transparent border-none cursor-pointer font-bold"
          >
             Reset filtri
          </button>
        </div>

        <!-- Pillole Macro-Nodi -->
        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            @click="selectNodeGroup('Tutti')"
            :class="[
              'px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold border transition-all cursor-pointer',
              selectedNodeGroup === 'Tutti'
                ? 'bg-violet-500 text-white border-violet-400 shadow-[0_0_12px_rgba(139,92,246,0.3)]'
                : 'bg-[#020420] text-slate-300 border-slate-800 hover:border-violet-400/50'
            ]"
          >
            Tutti i Nodi ({{ recentThreads.length }})
          </button>

          <button
            v-for="grp in nodeGroups"
            :key="grp.name"
            type="button"
            @click="selectNodeGroup(grp.name)"
            :class="[
              'px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold border transition-all cursor-pointer',
              selectedNodeGroup === grp.name
                ? 'bg-violet-500/20 text-violet-200 border-violet-400'
                : 'bg-[#020420] text-slate-300 border-slate-800 hover:border-cyan-400/50'
            ]"
          >
            {{ grp.name }} ({{ grp.subnodes.length }})
          </button>
        </div>

        <!-- Pillole Sub-Nodi del gruppo selezionato -->
        <div
          v-if="activeGroupObj && activeGroupObj.subnodes.length > 0"
          class="flex flex-wrap items-center gap-2 pt-2.5 border-t border-slate-800/80"
        >
          <span class="font-mono text-[10px] text-cyan-400 uppercase font-bold mr-1">Sub-nodi:</span>
          <button
            type="button"
            @click="selectSubnode('Tutti')"
            :class="[
              'px-3 py-1 rounded-lg font-mono text-[11px] font-bold border transition-all cursor-pointer',
              selectedSubnodeSlug === 'Tutti'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                : 'bg-[#020420] text-slate-400 border-slate-800 hover:text-slate-200'
            ]"
          >
            Tutti
          </button>

          <button
            v-for="sub in activeGroupObj.subnodes"
            :key="sub.slug"
            type="button"
            @click="selectSubnode(sub.slug)"
            :class="[
              'px-3 py-1 rounded-lg font-mono text-[11px] font-bold border transition-all cursor-pointer',
              selectedSubnodeSlug === sub.slug
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400'
                : 'bg-[#020420] text-slate-400 border-slate-800 hover:text-emerald-300'
            ]"
          >
            n/{{ cleanNodeLabel(sub.name || sub.slug) }}
          </button>
        </div>
      </div>
    </section>

    <!-- LAYOUT CON SIDEBAR UNIFICATA + THREAD + BLOG & CRAWLER NEWS -->
    <DkpLayout :hide-section-header="true" :show-sidebar-ads="true">
      <!-- Feed Card dei Thread -->
      <div class="space-y-4">
        <div class="flex items-center justify-between px-1">
          <h3 class="text-lg font-bold text-white m-0"> Ultime Discussioni nei Nodi</h3>
          <span class="text-xs font-mono text-emerald-400">{{ filteredThreads.length }} thread</span>
        </div>

        <div v-if="isLoading" class="bg-dkp-card border border-slate-800 rounded-2xl p-10 text-center font-mono text-xs text-emerald-400 animate-pulse">
           Sincronizzazione thread dal database Pure SQL...
        </div>

        <div v-else-if="filteredThreads.length === 0" class="bg-dkp-card border border-slate-800 rounded-2xl p-10 text-center font-mono text-xs text-slate-400">
          Nessuna discussione trovata con i filtri attivi.
        </div>

        <div v-else class="space-y-3.5">
          <DkpThreadCard
            v-for="thread in filteredThreads"
            :key="thread.id"
            :thread="thread"
            :can-moderate="Boolean(currentUser)"
            @toggle-lock="handleToggleLock"
          />
        </div>
      </div>

      <!-- IDENTICO ALLA HOME: Ultimi Articoli dal Blog & Ultime Notizie Crawler AI -->
      <DkpRelatedBlogWidget />
      <DkpHomeWidget />

      <!-- Circuito Approfondimenti dal Vault -->
      <DkpAdStrip
        layout="horizontal"
        category-tag="DKP ADS NETWORK &bull; APPROFONDIMENTI DAL VAULT"
        topic="pure sql ai security architecture"
        :tags="['sql', 'ai', 'security', 'architecture']"
      />
    </DkpLayout>
  </div>
</template>