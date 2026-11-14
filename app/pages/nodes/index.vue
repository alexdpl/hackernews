<!-- app/pages/nodes/index.vue -->
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import DKPAdBanner from '~/components/DKPAdBanner.vue'
import DKPRelatedThreads from '~/components/nodes/DKPRelatedThreads.vue'
import DkpNodesHomeWidget from '~/components/DkpNodesHomeWidget.vue'
import DkpAdStrip from '~/components/DkpAdStrip.vue'
import VaultTrustBadge from '~/components/VaultTrustBadge.vue'
import DKPnodesRichEditor from '~/components/DKPnodesRichEditor.vue'
import { buildCategoryNodeTree, cleanNodeLabel } from '~/composables/useDkpNodes'

useHead({
  title: 'DKP Talks Hub - Discussioni Tecniche, Nodi e Community v2.6-PURE-SQL',
  meta: [
    {
      name: 'description',
      content: 'Esplora i DKP Nodes: discussioni verticali su Rust, JavaScript, AI Models, Web3, Mobile Dev e DevOps con notarizzazione SHA-256.'
    }
  ]
})

const activeSort = ref<'hot' | 'new' | 'top'>('hot')
const selectedNodeSlug = ref<string | null>(null)
const selectedCategoryName = ref<string | null>(null)
const expandedCategories = ref<Record<string, boolean>>({})
const searchNodeQuery = ref('')

const currentPage = ref(1)
const isModalOpen = ref(false)
const toastMsg = ref('')

const { currentUser } = useAuthCore()
const isAdmin = computed(() => String(currentUser.value?.role || '').toUpperCase() === 'ADMIN')

function cleanExcerpt(raw: string): string {
  return String(raw || '')
    .replace(/```[\w-]*\s*/g, '')
    .replace(/```/g, '')
    .replace(/\*\*/g, '')
    .replace(/#{1,6}\s+/g, '')
    .trim()
}

const { data: nodesRes } = await useFetch<any>('/api/nodes')
const vaultConnected = computed(() => nodesRes.value?.vaultConnected !== false)

const nodeTreeState = computed(() => {
  const rawList = Array.isArray(nodesRes.value?.data)
    ? nodesRes.value.data
    : (Array.isArray(nodesRes.value) ? nodesRes.value : [])
  return buildCategoryNodeTree(rawList)
})

const nodes = computed(() => nodeTreeState.value.nodes)
const allCategoryNames = computed(() => nodeTreeState.value.categories)
const allGroupedNodes = computed(() => nodeTreeState.value.groupedNodes)

// Sidebar filtrata dalla barra di ricerca rapida
const groupedNodes = computed<Record<string, any[]>>(() => {
  const q = searchNodeQuery.value.trim().toLowerCase()
  if (!q) return allGroupedNodes.value

  const filtered: Record<string, any[]> = {}
  for (const [cat, list] of Object.entries(allGroupedNodes.value)) {
    const matches = list.filter((node: any) =>
      String(node.name || '').toLowerCase().includes(q) ||
      String(node.slug || '').toLowerCase().includes(q) ||
      cat.toLowerCase().includes(q)
    )
    if (matches.length > 0) filtered[cat] = matches
  }
  return filtered
})

const categoryNames = computed(() => Object.keys(groupedNodes.value))

const activeSelectedNodeId = computed<number | null>(() => {
  if (!selectedNodeSlug.value) return null
  const found = nodes.value.find((n: any) => n.slug === selectedNodeSlug.value)
  return found ? Number(found.id) : null
})

watch(
  groupedNodes,
  (groups) => {
    const keys = Object.keys(groups)
    if (keys.length > 0 && Object.keys(expandedCategories.value).length === 0) {
      expandedCategories.value[keys[0]] = true
    }
  },
  { immediate: true }
)

const { data: postsRes, pending: loadingPosts, refresh: refreshPosts } = await useFetch<any>('/api/nodes/posts', {
  query: computed(() => ({
    sort: activeSort.value,
    nodeSlug: selectedNodeSlug.value || undefined,
    page: currentPage.value
  }))
})

const rawPosts = computed<any[]>(() => {
  const list = Array.isArray(postsRes.value?.posts)
    ? postsRes.value.posts
    : (Array.isArray(postsRes.value?.data) ? postsRes.value.data : (Array.isArray(postsRes.value) ? postsRes.value : []))

  return list.map((p: any) => ({
    ...p,
    nodeName: cleanNodeLabel(p.nodeName || p.nodeSlug || 'General'),
    vaultHash: p.vaultHash || p.vault_hash || null,
    vaultBlockNumber: p.vaultBlockNumber ?? p.vault_block_number ?? null,
    isPinned: Boolean(p.isPinned || p.is_pinned)
  }))
})

const posts = computed(() => {
  if (selectedNodeSlug.value || !selectedCategoryName.value) {
    return rawPosts.value
  }
  const allowedSlugs = new Set((allGroupedNodes.value[selectedCategoryName.value] || []).map((n: any) => n.slug))
  return rawPosts.value.filter((p: any) => allowedSlugs.has(p.nodeSlug))
})

const featuredArticles = ref<any[]>([])

function populateFallbackArticles() {
  featuredArticles.value = [
    { id: 1, title: "Guida all'Architettura Nuxt 4 & Rolldown", category: 'Cloud Native & DevOps', categoryName: 'DevOps', slug: 'nuxt-4-rolldown' },
    { id: 2, title: 'Integrazione Ollama e LLM Locali in Vue 3', category: 'AI & Machine Learning', categoryName: 'AI / LLM', slug: 'ollama-vue3' },
    { id: 3, title: 'Notarizzazione Codice & Hashing SHA-256', category: 'Cybersecurity & Vault', categoryName: 'Security', slug: 'vault-sha256' },
    { id: 4, title: 'Telemetria SSE Live & Worker Nitro v2.6', category: 'Backend Architecture', categoryName: 'Backend', slug: 'sse-nitro-v26' }
  ]
}

onMounted(async () => {
  try {
    const res: any = await $fetch('/api/blog/posts').catch(() => null)
    const raw = res?.success ? res.data : (Array.isArray(res) ? res : [])
    if (raw && raw.length > 0) {
      featuredArticles.value = raw.slice(0, 4)
    } else {
      populateFallbackArticles()
    }
  } catch {
    populateFallbackArticles()
  }
})

watch([activeSort, selectedNodeSlug, selectedCategoryName], () => {
  currentPage.value = 1
})

function nextPage() {
  currentPage.value++
  if (import.meta.client) window.scrollTo({ top: 0, behavior: 'smooth' })
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--
    if (import.meta.client) window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

function showNotification(msg: string) {
  toastMsg.value = msg
  setTimeout(() => {
    toastMsg.value = ''
  }, 4000)
}

function copyPostLink(postId: number) {
  const url = `${window.location.origin}/nodes/thread/${postId}`
  navigator.clipboard.writeText(url)
  showNotification('🔗 Link del thread copiato negli appunti!')
}

async function togglePinPostCard(post: any) {
  const newPinState = !post.isPinned
  try {
    await $fetch(`/api/nodes/posts/${post.id}`, {
      method: 'PATCH',
      body: { is_pinned: newPinState, userId: currentUser.value?.id }
    })
    post.isPinned = newPinState
    showNotification(newPinState ? '📌 Thread fissato in alto!' : '📍 Thread rimosso dai pinned.')
    await refreshPosts()
  } catch {
    showNotification('❌ Errore durante l\'aggiornamento dello stato pinned.')
  }
}

async function onThreadPublished() {
  isModalOpen.value = false
  showNotification('⛓️ Thread pubblicato e notarizzato SHA-256 con successo! +25 XP')
  await refreshPosts()
}

async function handleVote(post: any, direction: 'up' | 'down') {
  const delta = direction === 'up' ? 1 : -1
  post.karmaScore = (post.karmaScore || 0) + delta
  await $fetch(`/api/nodes/posts/${post.id}/vote`, {
    method: 'POST',
    body: { direction, userId: currentUser.value?.id }
  }).catch(() => null)
}

function selectNode(slug: string | null) {
  selectedNodeSlug.value = slug
  if (slug) {
    selectedCategoryName.value = null
  }
}

function selectCategory(catName: string) {
  selectedNodeSlug.value = null
  selectedCategoryName.value = selectedCategoryName.value === catName ? null : catName
  expandedCategories.value[catName] = true
}

function toggleCategoryAccordion(catName: string) {
  expandedCategories.value[catName] = !expandedCategories.value[catName]
}

function resetAllFilters() {
  selectedNodeSlug.value = null
  selectedCategoryName.value = null
}
</script>

<template>
  <div class="min-h-screen bg-[#020420] text-slate-100 font-sans p-4 md:p-8">
    <div
      v-if="toastMsg"
      role="status"
      class="fixed top-6 right-6 z-[10000] bg-[#041a13]/95 border border-emerald-500/50 text-emerald-300 px-4 py-3 rounded-xl shadow-2xl font-mono text-xs font-bold"
    >
      {{ toastMsg }}
    </div>

    <div class="max-w-7xl mx-auto flex flex-col gap-8">
      <!-- HERO HEADER -->
      <section class="relative py-8 px-6 text-center flex flex-col items-center gap-5 bg-[#090d16] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div class="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div class="flex flex-wrap items-center justify-center gap-2.5">
          <div class="inline-flex items-center gap-2 bg-[#020420] border border-purple-500/30 px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.15)]">
            <span class="relative flex h-2.5 w-2.5">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500"></span>
            </span>
            <span class="text-[11px] font-mono font-black text-purple-400 uppercase tracking-widest">
              DKP TALKS HUB v2.6-PURE-SQL
            </span>
          </div>

          <NuxtLink
            to="/nodes/n/blockchain-vault"
            class="inline-flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/35 px-3.5 py-1.5 rounded-full font-mono text-[11px] font-bold text-emerald-400 transition-all no-underline"
          >
            <span>⛓️</span>
            <span>{{ vaultConnected ? 'VAULT ON-CHAIN: n/blockchain-vault' : 'VAULT SYNCING' }}</span>
          </NuxtLink>
        </div>

        <h1 class="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight max-w-4xl m-0">
          DKP <span class="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-sky-400 to-emerald-400">Talks &amp; Nodes</span>
        </h1>

        <p class="text-slate-400 text-sm md:text-base max-w-2xl leading-relaxed font-sans m-0">
          Spazio di discussione verticale per sviluppatori. Ogni thread viene notarizzato crittograficamente in <strong class="text-emerald-400 font-mono">SHA-256</strong> sul nodo pubblico <strong class="text-sky-400 font-mono">n/blockchain-vault</strong>.
        </p>

        <div class="flex flex-wrap gap-3 justify-center relative z-10 font-mono">
          <NuxtLink active-class="!bg-emerald-500 !text-slate-950 !border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]" class="px-5 py-2.5 bg-[#020420] border border-slate-700 hover:border-emerald-400 text-emerald-400 font-extrabold text-xs rounded-xl transition-all shadow-lg no-underline" to="/news">
            DKP Tech Feed
          </NuxtLink>
          <NuxtLink active-class="!bg-purple-500 !text-slate-950 !border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)]" class="px-5 py-2.5 bg-[#020420] border border-slate-700 hover:border-purple-400 text-purple-400 font-extrabold text-xs rounded-xl transition-all shadow-lg no-underline" to="/nodes">
            DKP Talks Hub
          </NuxtLink>
          <NuxtLink active-class="!bg-sky-400 !text-slate-950 !border-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.3)]" class="px-5 py-2.5 bg-[#020420] border border-slate-700 hover:border-sky-400 text-sky-400 font-extrabold text-xs rounded-xl transition-all shadow-lg no-underline" to="/tools">
            Developer Tools
          </NuxtLink>
          <NuxtLink active-class="!bg-emerald-500 !text-slate-950 !border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]" class="px-5 py-2.5 bg-[#020420] border border-slate-700 hover:border-emerald-400 text-emerald-300 font-extrabold text-xs rounded-xl transition-all shadow-lg no-underline" to="/blog">
            DKP Editorial Hub
          </NuxtLink>
        </div>

        <button
          type="button"
          @click="isModalOpen = true"
          class="mt-1 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold font-mono text-xs rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center gap-2 cursor-pointer"
        >
          <span>+</span> Apri Nuovo Thread - Rich Editor (+25 XP)
        </button>
      </section>

      <!-- GRIGLIA 2 COLONNE -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <!-- SIDEBAR SINISTRA (9 Cat - 163 Nodi + Subnodi) -->
        <aside class="lg:col-span-1 flex flex-col gap-6">
          <div class="bg-[#090d16] border border-emerald-500/35 rounded-2xl p-4 shadow-xl flex flex-col gap-2.5 font-mono">
            <div class="flex items-center justify-between">
              <span class="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                ⛓️ Proof-of-Code Vault
              </span>
              <span class="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
                PUBLIC NOTARY
              </span>
            </div>
            <p class="text-[11px] text-slate-400 font-sans m-0 leading-relaxed">
              Nodo pubblico ufficiale di notarizzazione SHA-256 e verifica integrità dei thread DKP.
            </p>
            <div class="flex items-center justify-between pt-1">
              <NuxtLink
                to="/nodes/n/blockchain-vault"
                class="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg no-underline transition-colors"
              >
                Apri n/blockchain-vault →
              </NuxtLink>
              <span class="text-[10px] text-slate-500">SHA-256 MAINNET</span>
            </div>
          </div>

          <div class="bg-[#090d16] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 class="text-sm font-bold tracking-wider text-white font-mono uppercase flex items-center gap-2 m-0">
                <span class="text-purple-400">#</span> Categorie &amp; Nodi
              </h2>
              <span class="text-[10px] bg-purple-500/10 text-purple-400 font-mono px-2 py-0.5 rounded border border-purple-500/20 font-bold">
                {{ categoryNames.length }} Cat - {{ nodes.length }} Nodi
              </span>
            </div>

            <div class="flex flex-col gap-1.5 font-mono text-xs">
              <label for="quick-node-select" class="text-slate-400 text-[11px] font-bold">Salto Rapido Sotto-Nodo:</label>
              <select
                id="quick-node-select"
                :value="selectedNodeSlug || ''"
                @change="selectNode(($event.target as HTMLSelectElement).value || null)"
                class="w-full bg-[#020420] border border-slate-800 hover:border-purple-500/40 rounded-xl p-2.5 text-slate-200 focus:border-purple-400 outline-none transition-all cursor-pointer font-sans text-xs"
              >
                <option value="">Feed Globale (Tutti i {{ nodes.length }} nodi)</option>
                <optgroup v-for="(nodeList, catName) in groupedNodes" :key="catName" :label="`${catName} (${nodeList.length})`">
                  <option v-for="node in nodeList" :key="node.id" :value="node.slug">
                    {{ node.depth > 0 ? `${'—'.repeat(node.depth)}↳ ` : '' }}{{ node.icon || '#' }} n/{{ node.name }} ({{ node.subscribersCount || 0 }})
                  </option>
                </optgroup>
              </select>
            </div>

            <div class="flex flex-col gap-1.5 font-mono text-xs">
              <input
                v-model="searchNodeQuery"
                type="text"
                aria-label="Filtra categoria o sotto-nodo"
                placeholder="Cerca categoria o sotto-nodo..."
                class="w-full bg-[#020420] border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-purple-400 outline-none text-xs"
              />
            </div>

            <div class="max-h-[520px] overflow-y-auto pr-1 flex flex-col gap-2 font-mono text-xs">
              <button
                type="button"
                @click="resetAllFilters"
                class="shrink-0 flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-left cursor-pointer"
                :class="selectedNodeSlug === null && selectedCategoryName === null ? 'bg-purple-500/15 text-purple-300 border border-purple-500/35 font-bold' : 'bg-[#020420] text-slate-400 border border-slate-800/80 hover:text-slate-200'"
              >
                <span class="flex items-center gap-2">Feed Globale</span>
                <span class="text-[10px] text-slate-500">{{ nodes.length }} nodi</span>
              </button>

              <div
                v-for="(nodeList, catName) in groupedNodes"
                :key="catName"
                class="shrink-0 bg-[#020420] border border-slate-800/90 rounded-xl overflow-hidden"
              >
                <div class="flex items-center justify-between px-3 py-2.5 bg-slate-950/70">
                  <button
                    type="button"
                    @click="selectCategory(String(catName))"
                    class="flex-1 text-left bg-transparent border-none p-0 cursor-pointer flex items-center justify-between gap-2 min-w-0"
                  >
                    <span
                      class="font-bold text-xs truncate"
                      :class="selectedCategoryName === catName ? 'text-emerald-400' : 'text-slate-100 hover:text-sky-400'"
                    >
                      {{ catName }}
                    </span>
                    <span class="text-[10px] bg-slate-900 text-sky-400 border border-slate-800 px-1.5 py-0.5 rounded shrink-0">
                      {{ nodeList.length }}
                    </span>
                  </button>

                  <button
                    type="button"
                    @click="toggleCategoryAccordion(String(catName))"
                    :aria-expanded="Boolean(expandedCategories[String(catName)])"
                    class="ml-2 px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 cursor-pointer text-[11px] shrink-0"
                  >
                    {{ expandedCategories[String(catName)] || searchNodeQuery.trim() ? 'v' : '>' }}
                  </button>
                </div>

                <div
                  v-if="expandedCategories[String(catName)] || searchNodeQuery.trim().length > 0"
                  class="p-1.5 flex flex-col gap-1 border-t border-slate-800/70 max-h-64 overflow-y-auto"
                >
                  <div
                    v-for="node in nodeList"
                    :key="node.id"
                    class="shrink-0 flex items-center justify-between gap-1 rounded-lg px-2 py-1.5 transition-all"
                    :style="node.depth > 0 ? { paddingLeft: `${0.5 + node.depth * 0.75}rem` } : undefined"
                    :class="selectedNodeSlug === node.slug ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30 font-bold' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'"
                  >
                    <button
                      type="button"
                      @click="selectNode(node.slug)"
                      class="flex-1 flex items-center gap-1.5 text-left bg-transparent border-none p-0 cursor-pointer truncate text-xs text-inherit"
                    >
                      <span v-if="node.depth > 0" class="text-slate-600">↳</span>
                      <span>{{ node.icon || '#' }}</span>
                      <span class="truncate">n/{{ node.name }}</span>
                      <span
                        v-if="node.subNodesCount > 0"
                        class="text-[9px] px-1.5 py-0.2 rounded bg-slate-900 text-emerald-400 border border-slate-800 shrink-0"
                        :title="`${node.subNodesCount} sotto-nodi`"
                      >
                        +{{ node.subNodesCount }}
                      </span>
                    </button>

                    <NuxtLink
                      :to="`/nodes/n/${node.slug}`"
                      class="text-[10px] text-slate-500 hover:text-emerald-400 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 no-underline shrink-0"
                      title="Apri pagina dedicata del nodo"
                    >
                      -&gt;
                    </NuxtLink>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              @click="isModalOpen = true"
              class="w-full mt-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold font-mono text-xs py-2.5 px-4 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.25)] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>+</span> Nuovo Thread (+25 XP)
            </button>
          </div>

          <DKPAdBanner />
        </aside>

        <!-- MAIN FEED CENTRALE -->
        <main class="lg:col-span-2 flex flex-col gap-6">
          <div class="bg-[#090d16] border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
            <div class="flex items-center gap-2 font-mono">
              <span class="text-xs text-slate-400">Ordinamento:</span>
              <div class="flex bg-[#020420] p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  @click="activeSort = 'hot'"
                  class="px-3 py-1 rounded-lg font-bold transition-all cursor-pointer"
                  :class="activeSort === 'hot' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'text-slate-400 hover:text-slate-200'"
                >
                  Hot
                </button>
                <button
                  type="button"
                  @click="activeSort = 'new'"
                  class="px-3 py-1 rounded-lg font-bold transition-all cursor-pointer"
                  :class="activeSort === 'new' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'text-slate-400 hover:text-slate-200'"
                >
                  New
                </button>
                <button
                  type="button"
                  @click="activeSort = 'top'"
                  class="px-3 py-1 rounded-lg font-bold transition-all cursor-pointer"
                  :class="activeSort === 'top' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'text-slate-400 hover:text-slate-200'"
                >
                  Top
                </button>
              </div>
            </div>

            <div class="font-mono text-xs text-slate-400 flex items-center gap-2">
              <span>Filtro:</span>
              <span class="text-emerald-400 font-bold">
                {{ selectedNodeSlug ? `n/${selectedNodeSlug}` : (selectedCategoryName || 'Tutti i Nodi') }}
              </span>
              <button
                v-if="selectedNodeSlug || selectedCategoryName"
                type="button"
                @click="resetAllFilters"
                class="text-[10px] text-rose-400 hover:underline bg-transparent border-none cursor-pointer"
              >
                (Reset)
              </button>
            </div>
          </div>

          <div v-if="loadingPosts" class="p-12 text-center text-emerald-400 font-mono text-xs bg-[#090d16] rounded-2xl border border-slate-800 animate-pulse">
            Ingestione discussioni e verifica impronte SHA-256 dal DB Neon in corso...
          </div>

          <div v-else-if="posts.length === 0" class="p-12 text-center text-slate-400 font-mono text-xs bg-[#090d16] rounded-2xl border border-slate-800 flex flex-col items-center gap-3">
            <span>Nessun thread pubblicato in questa sezione. Sii il primo a creare una discussione!</span>
            <button
              type="button"
              @click="isModalOpen = true"
              class="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs cursor-pointer"
            >
              Scrivi il primo thread
            </button>
          </div>

          <div v-else class="flex flex-col gap-4">
            <article
              v-for="post in posts"
              :key="post.id"
              class="bg-[#090d16] border border-slate-800 hover:border-purple-500/40 rounded-2xl p-5 shadow-xl transition-all flex gap-4 group"
            >
              <div class="flex flex-col items-center justify-start bg-[#020420] p-2.5 rounded-xl border border-slate-800 font-mono text-xs h-fit min-w-[44px]">
                <button type="button" @click="handleVote(post, 'up')" class="text-slate-500 hover:text-emerald-400 transition-colors text-sm font-bold bg-transparent border-none cursor-pointer">▲</button>
                <span class="font-extrabold my-1 text-slate-200">{{ post.karmaScore || 1 }}</span>
                <button type="button" @click="handleVote(post, 'down')" class="text-slate-500 hover:text-rose-400 transition-colors text-sm font-bold bg-transparent border-none cursor-pointer">▼</button>
              </div>

              <div class="flex-1 flex flex-col gap-2 min-w-0">
                <div class="flex items-center gap-2 font-mono text-[11px] text-slate-400 flex-wrap">
                  <span v-if="post.isPinned" class="text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold">📌 PINNED</span>

                  <NuxtLink v-if="post.nodeSlug" :to="`/nodes/n/${post.nodeSlug}`" class="text-purple-400 hover:text-purple-300 font-bold bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 no-underline">
                    {{ post.nodeIcon || '#' }} n/{{ post.nodeName || post.nodeSlug }}
                  </NuxtLink>
                  <span v-else class="text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                    {{ post.nodeIcon || '#' }} n/{{ post.nodeName || 'General' }}
                  </span>
                  <span>-</span>
                  <span class="text-slate-300 font-semibold">@{{ post.authorUsername || post.authorName || 'community' }}</span>
                  <span>-</span>
                  <span>{{ new Date(post.createdAt || Date.now()).toLocaleDateString('it-IT') }}</span>

                  <div class="ml-auto">
                    <VaultTrustBadge
                      :post-id="post.id"
                      :vault-hash="post.vaultHash"
                      :block-number="post.vaultBlockNumber"
                      :compact="true"
                      @notarized="(h) => { post.vaultHash = h }"
                    />
                  </div>
                </div>

                <NuxtLink :to="`/nodes/thread/${post.id}`" class="text-base font-bold text-slate-100 group-hover:text-purple-400 transition-colors font-sans leading-snug no-underline">
                  {{ post.title }}
                </NuxtLink>

                <p class="text-xs text-slate-400 line-clamp-2 leading-relaxed font-sans m-0">
                  {{ cleanExcerpt(post.content) }}
                </p>

                <div class="flex items-center justify-between gap-4 mt-2 pt-2 border-t border-slate-800/80 font-mono text-[11px] text-slate-400 flex-wrap">
                  <NuxtLink :to="`/nodes/thread/${post.id}`" class="hover:text-emerald-400 transition-colors flex items-center gap-1.5 font-bold no-underline text-sky-400">
                    {{ post.commentsCount || 0 }} Commenti - Apri Thread -&gt;
                  </NuxtLink>

                  <div class="flex items-center gap-3">
                    <button type="button" @click="copyPostLink(post.id)" class="text-slate-400 hover:text-emerald-400 bg-transparent border-none cursor-pointer flex items-center gap-1 transition-colors">
                      🔗 Condividi
                    </button>

                    <button
                      v-if="isAdmin"
                      type="button"
                      @click="togglePinPostCard(post)"
                      class="text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded cursor-pointer font-bold transition-colors"
                    >
                      📌 {{ post.isPinned ? 'Unpin' : 'Pinna' }}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          </div>

          <div class="flex items-center justify-between bg-[#090d16] border border-slate-800 rounded-xl p-4 font-mono text-xs shadow-xl">
            <button type="button" @click="prevPage" :disabled="currentPage === 1" class="px-4 py-2 bg-[#020420] border border-slate-700 hover:border-purple-400 text-slate-200 rounded-lg disabled:opacity-40 cursor-pointer transition-all">
              ← Pagina Precedente
            </button>
            <span class="text-purple-400 font-bold">Pagina {{ currentPage }}</span>
            <button type="button" @click="nextPage" :disabled="posts.length < 10" class="px-4 py-2 bg-[#020420] border border-slate-700 hover:border-purple-400 text-slate-200 rounded-lg disabled:opacity-40 cursor-pointer transition-all">
              Pagina Successiva →
            </button>
          </div>

          <div class="pt-6 border-t border-slate-800">
            <DKPRelatedThreads :currentNodeSlug="selectedNodeSlug || undefined" />
          </div>

          <div v-if="featuredArticles.length > 0" class="pt-6 border-t border-slate-800 flex flex-col gap-4">
            <div class="flex justify-between items-center">
              <h3 class="text-base font-bold text-white flex items-center gap-2 font-mono m-0">
                Approfondimenti dal Vault
              </h3>
              <NuxtLink class="text-xs font-mono font-bold text-emerald-400 hover:underline no-underline" to="/blog">
                Vedi tutti gli articoli -&gt;
              </NuxtLink>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <NuxtLink v-for="art in featuredArticles" :key="art.id" :to="`/blog/${art.slug || art.id}`" class="bg-[#090d16] border border-slate-800 hover:border-emerald-500/50 rounded-xl p-5 flex flex-col justify-between transition-all hover:-translate-y-1 shadow-md group text-left min-h-[160px] no-underline">
                <div>
                  <span class="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                    {{ art.categoryName || art.category || 'Tech' }}
                  </span>
                  <h4 class="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-400 transition-colors leading-snug font-sans m-0">
                    {{ art.title }}
                  </h4>
                </div>
                <span class="text-[11px] font-mono font-bold text-sky-400 group-hover:underline mt-4">
                  Leggi articolo -&gt;
                </span>
              </NuxtLink>
            </div>
          </div>

          <div class="pt-6 border-t border-slate-800">
            <DkpNodesHomeWidget />
          </div>

          <DkpAdStrip categoryTag="DKP NODES TALKS STREAM" />
        </main>
      </div>
    </div>

    <DKPnodesRichEditor
      :is-open="isModalOpen"
      :categories="allCategoryNames"
      :grouped-nodes="allGroupedNodes"
      :initial-category="selectedCategoryName || undefined"
      :initial-node-id="activeSelectedNodeId"
      :is-admin="isAdmin"
      @close="isModalOpen = false"
      @published="onThreadPublished"
    />
  </div>
</template>