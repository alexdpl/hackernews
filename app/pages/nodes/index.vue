<!-- app/pages/nodes/index.vue -->
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import DKPAdBanner from '~/components/DKPAdBanner.vue'
import DKPRelatedThreads from '~/components/nodes/DKPRelatedThreads.vue'
import DkpNodesHomeWidget from '~/components/DkpNodesHomeWidget.vue'
import DkpAdStrip from '~/components/DkpAdStrip.vue'

useHead({
  title: 'DKP Talks Hub - Discussioni Tecniche, Nodi e Community v2.6-PURE-SQL',
  meta: [
    {
      name: 'description',
      content: 'Esplora i DKP Nodes: discussioni verticali su Rust, JavaScript, AI Models, Web3, Mobile Dev e DevOps.'
    }
  ]
})

const activeSort = ref<'hot' | 'new' | 'top'>('hot')
const selectedNodeSlug = ref<string | null>(null)
const selectedCategoryName = ref<string | null>(null)
const expandedCategories = ref<Record<string, boolean>>({})
const searchNodeQuery = ref('')

const isModalOpen = ref(false)
const composerCategory = ref('')
const newPostNodeId = ref<number | null>(null)
const newPostTitle = ref('')
const newPostContent = ref('')
const newPostVaultHash = ref('')
const editorTab = ref<'write' | 'preview'>('write')
const selectedCodeLang = ref<'typescript' | 'sql' | 'rust' | 'bash' | 'python'>('typescript')
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const isSubmitting = ref(false)
const formError = ref('')
const toastMsg = ref('')

const { currentUser } = useAuthCore()

function cleanNodeLabel(raw: string): string {
  return String(raw || '').replace(/^(n\/)+/i, '').trim()
}

function cleanExcerpt(raw: string): string {
  return String(raw || '')
    .replace(/```[\w-]*\s*/g, '')
    .replace(/```/g, '')
    .replace(/\*\*/g, '')
    .replace(/#{1,6}\s+/g, '')
    .trim()
}

const { data: nodesRes } = await useFetch<any>('/api/nodes')
const nodes = computed<any[]>(() => {
  const rawList = Array.isArray(nodesRes.value?.data)
    ? nodesRes.value.data
    : (Array.isArray(nodesRes.value) ? nodesRes.value : [])

  return rawList.map((n: any) => ({
    ...n,
    name: cleanNodeLabel(n.name || n.slug)
  }))
})

function hasToken(text: string, tokens: string[]): boolean {
  const words = text.split(/[^a-z0-9+#]+/).filter(Boolean)
  for (const t of tokens) {
    if (words.includes(t)) return true
  }
  return false
}

function resolveNodeCategory(node: any): string {
  const dbCat = cleanNodeLabel(String(node.category || node.groupName || ''))
  const lowerDb = dbCat.toLowerCase()
  if (dbCat.length > 0 && lowerDb !== 'generale' && lowerDb !== 'general') {
    return dbCat
  }

  const combined = `${node.slug || ''} ${node.name || ''}`.toLowerCase()

  if (hasToken(combined, ['dkp', 'devkernel', 'devkernelpulse', 'pulse', 'meta', 'announcements', 'talks', 'feedback', 'bounties', 'bounty'])) {
    return '1. DKP Ecosystem & Core'
  }
  if (hasToken(combined, ['web3', 'blockchain', 'crypto', 'ethereum', 'solidity', 'solana', 'defi', 'smart', 'contracts', 'token', 'nft', 'dao', 'bitcoin'])) {
    return '2. Web3, Crypto & Blockchain'
  }
  if (hasToken(combined, ['mobile', 'ios', 'android', 'flutter', 'swift', 'kotlin', 'react-native', 'expo', 'maui', 'dart', 'xcode'])) {
    return '3. Mobile Development'
  }
  if (hasToken(combined, ['ai', 'llm', 'gpt', 'claude', 'neural', 'ml', 'machine', 'deep', 'agent', 'agents', 'rag', 'ollama', 'vision', 'prompt', 'inference'])) {
    return '4. AI, LLM & Neural Agents'
  }
  if (hasToken(combined, ['rust', 'linux', 'kernel', 'cpp', 'c++', 'zig', 'asm', 'os', 'embedded', 'wasm', 'compiler', 'hardware', 'riscv', 'arm'])) {
    return '5. Systems, Rust & Kernel'
  }
  if (hasToken(combined, ['web', 'nuxt', 'vue', 'react', 'ts', 'typescript', 'js', 'javascript', 'css', 'tailwind', 'node', 'frontend', 'backend', 'api', 'svelte', 'angular', 'nextjs'])) {
    return '6. Web, Frontend & Full-Stack'
  }
  if (hasToken(combined, ['cloud', 'gcp', 'aws', 'azure', 'docker', 'k8s', 'kubernetes', 'devops', 'sec', 'security', 'cyber', 'cybersecurity', 'waf', 'sentinel', 'infra', 'linux-sec', 'pentest'])) {
    return '7. Cloud, DevOps & Security'
  }
  if (hasToken(combined, ['sql', 'postgres', 'postgresql', 'neon', 'db', 'database', 'databases', 'data', 'redis', 'kafka', 'duckdb', 'analytics', 'storage'])) {
    return '8. Databases, Pure SQL & Data'
  }
  return '9. Open Source, Tech & Career'
}

const groupedNodes = computed<Record<string, any[]>>(() => {
  const groups: Record<string, any[]> = {}
  const q = searchNodeQuery.value.trim().toLowerCase()

  for (const node of nodes.value) {
    const category = resolveNodeCategory(node)
    if (q) {
      const matchName = String(node.name || '').toLowerCase().includes(q)
      const matchSlug = String(node.slug || '').toLowerCase().includes(q)
      const matchCat = category.toLowerCase().includes(q)
      if (!matchName && !matchSlug && !matchCat) continue
    }

    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(node)
  }

  const sortedEntries = Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  const ordered: Record<string, any[]> = {}
  for (const [cat, list] of sortedEntries) {
    ordered[cat] = list
  }
  return ordered
})

const categoryNames = computed(() => Object.keys(groupedNodes.value))

const composerSubNodes = computed(() => {
  if (!composerCategory.value) return nodes.value
  return groupedNodes.value[composerCategory.value] || nodes.value
})

watch(
  groupedNodes,
  (groups) => {
    const keys = Object.keys(groups)
    if (keys.length > 0 && Object.keys(expandedCategories.value).length === 0) {
      expandedCategories.value[keys[0]] = true
    }
    if (keys.length > 0 && (!composerCategory.value || !groups[composerCategory.value])) {
      composerCategory.value = keys[0]
    }
  },
  { immediate: true }
)

watch(composerCategory, (cat) => {
  const list = groupedNodes.value[cat] || []
  if (list.length > 0 && !list.some((n: any) => n.id === newPostNodeId.value)) {
    newPostNodeId.value = list[0].id
  }
})

const { data: postsRes, pending: loadingPosts, refresh: refreshPosts } = await useFetch<any>('/api/nodes/posts', {
  query: computed(() => ({
    sort: activeSort.value,
    nodeSlug: selectedNodeSlug.value || undefined
  }))
})

const rawPosts = computed<any[]>(() => {
  const list = Array.isArray(postsRes.value?.posts)
    ? postsRes.value.posts
    : (Array.isArray(postsRes.value?.data) ? postsRes.value.data : (Array.isArray(postsRes.value) ? postsRes.value : []))

  return list.map((p: any) => ({
    ...p,
    nodeName: cleanNodeLabel(p.nodeName || p.nodeSlug || 'General')
  }))
})

const posts = computed(() => {
  if (selectedNodeSlug.value || !selectedCategoryName.value) {
    return rawPosts.value
  }
  const allowedSlugs = new Set((groupedNodes.value[selectedCategoryName.value] || []).map((n: any) => n.slug))
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
  } catch (err) {
    console.error('Errore recupero articoli Vault:', err)
    populateFallbackArticles()
  }
})

watch(
  nodes,
  (val) => {
    if (val.length > 0 && !newPostNodeId.value) {
      newPostNodeId.value = val[0].id
    }
  },
  { immediate: true }
)

function showNotification(msg: string) {
  toastMsg.value = msg
  setTimeout(() => {
    toastMsg.value = ''
  }, 4000)
}

function openComposerModal() {
  formError.value = ''
  editorTab.value = 'write'

  if (selectedNodeSlug.value) {
    const activeNode = nodes.value.find((n: any) => n.slug === selectedNodeSlug.value)
    if (activeNode) {
      composerCategory.value = resolveNodeCategory(activeNode)
      newPostNodeId.value = activeNode.id
    }
  } else if (selectedCategoryName.value && groupedNodes.value[selectedCategoryName.value]?.length) {
    composerCategory.value = selectedCategoryName.value
    newPostNodeId.value = groupedNodes.value[selectedCategoryName.value][0].id
  }

  isModalOpen.value = true
}

function applyMarkdown(prefix: string, suffix = '', placeholder = 'testo') {
  const el = textareaRef.value
  if (!el) {
    newPostContent.value += `${prefix}${placeholder}${suffix}`
    return
  }

  const start = el.selectionStart
  const end = el.selectionEnd
  const selected = newPostContent.value.substring(start, end) || placeholder
  const before = newPostContent.value.substring(0, start)
  const after = newPostContent.value.substring(end)

  newPostContent.value = `${before}${prefix}${selected}${suffix}${after}`

  requestAnimationFrame(() => {
    el.focus()
    el.setSelectionRange(start + prefix.length, start + prefix.length + selected.length)
  })
}

function insertCodeBlock() {
  const nl = String.fromCharCode(10)
  const fence = '```'
  applyMarkdown(`${nl}${fence}${selectedCodeLang.value}${nl}`, `${nl}${fence}${nl}`, '// Inserisci qui il tuo codice')
}

function insertHeading() {
  const nl = String.fromCharCode(10)
  applyMarkdown(`${nl}## `, nl, 'Titolo Sezione')
}

function insertQuote() {
  const nl = String.fromCharCode(10)
  applyMarkdown(`${nl}> `, nl, 'Citazione tecnica')
}

const previewHtml = computed(() => {
  const nl = String.fromCharCode(10)
  const escaped = newPostContent.value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')

  const lines = escaped.split(nl)
  const out: string[] = []
  let inCode = false

  for (const line of lines) {
    if (line.startsWith('```')) {
      if (!inCode) {
        inCode = true
        out.push('<pre class="bg-[#020420] border border-slate-800 rounded-xl p-3.5 my-2 overflow-x-auto text-emerald-300 font-mono text-xs"><code>')
      } else {
        inCode = false
        out.push('</code></pre>')
      }
      continue
    }

    if (inCode) {
      out.push(`${line}${nl}`)
      continue
    }

    if (line.startsWith('### ')) {
      out.push(`<h3 class="text-base font-bold text-white mt-3 mb-1">${line.slice(4)}</h3>`)
    } else if (line.startsWith('## ')) {
      out.push(`<h2 class="text-lg font-black text-emerald-400 mt-4 mb-1.5">${line.slice(3)}</h2>`)
    } else if (line.startsWith('&gt; ')) {
      out.push(`<blockquote class="border-l-4 border-purple-400 pl-3 py-1 my-2 text-slate-300 italic bg-purple-500/5 rounded-r">${line.slice(5)}</blockquote>`)
    } else {
      out.push(`${line}<br />`)
    }
  }

  return out.join('')
})

async function handleCreatePost() {
  formError.value = ''

  if (!newPostNodeId.value || !newPostTitle.value.trim() || !newPostContent.value.trim()) {
    formError.value = 'Seleziona un nodo e compila titolo e contenuto della discussione.'
    return
  }

  isSubmitting.value = true
  try {
    const res: any = await $fetch('/api/nodes/posts', {
      method: 'POST',
      body: {
        nodeId: newPostNodeId.value,
        title: newPostTitle.value.trim(),
        content: newPostContent.value.trim(),
        vaultHash: newPostVaultHash.value.trim() || null,
        userId: currentUser.value?.id
      }
    })

    if (res && res.success) {
      if (import.meta.client) {
        window.dispatchEvent(new CustomEvent('dkp:xp_updated'))
      }

      newPostTitle.value = ''
      newPostContent.value = ''
      newPostVaultHash.value = ''
      isModalOpen.value = false
      showNotification('Thread pubblicato con successo! Hai guadagnato +25 XP!')
      await refreshPosts()
    } else {
      formError.value = res?.statusMessage || 'Impossibile pubblicare il thread.'
    }
  } catch (err: any) {
    formError.value = err?.data?.statusMessage || err?.message || 'Errore durante la pubblicazione del thread.'
  } finally {
    isSubmitting.value = false
  }
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

        <div class="inline-flex items-center gap-2 bg-[#020420] border border-purple-500/30 px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.15)]">
          <span class="relative flex h-2.5 w-2.5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500"></span>
          </span>
          <span class="text-[11px] font-mono font-black text-purple-400 uppercase tracking-widest">
            DKP TALKS HUB v2.6-PURE-SQL
          </span>
        </div>

        <h1 class="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight max-w-4xl m-0">
          DKP <span class="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-sky-400 to-emerald-400">Talks &amp; Nodes</span>
        </h1>

        <p class="text-slate-400 text-sm md:text-base max-w-2xl leading-relaxed font-sans m-0">
          Spazio di discussione verticale per sviluppatori. Condividi snippet, analizza architetture cloud, partecipa ai nodi tematici e guadagna XP certificati nel network.
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
          @click="openComposerModal"
          class="mt-1 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold font-mono text-xs rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center gap-2 cursor-pointer"
        >
          <span>+</span> Apri Nuovo Thread - Rich Editor (+25 XP)
        </button>
      </section>

      <!-- GRIGLIA 2 COLONNE -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <!-- SIDEBAR SINISTRA: CATEGORIE & SOTTO-NODI CON SHRINK-0 -->
        <aside class="lg:col-span-1 flex flex-col gap-6">
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
                    {{ node.icon || '#' }} n/{{ node.name }} ({{ node.subscribersCount || 0 }})
                  </option>
                </optgroup>
              </select>
            </div>

            <div class="flex flex-col gap-1.5 font-mono text-xs">
              <input
                v-model="searchNodeQuery"
                type="text"
                aria-label="Filtra categorie o sotto-nodi"
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
                  class="p-1.5 flex flex-col gap-1 border-t border-slate-800/70 max-h-60 overflow-y-auto"
                >
                  <div
                    v-for="node in nodeList"
                    :key="node.id"
                    class="shrink-0 flex items-center justify-between gap-1 rounded-lg px-2 py-1.5 transition-all"
                    :class="selectedNodeSlug === node.slug ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30 font-bold' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'"
                  >
                    <button
                      type="button"
                      @click="selectNode(node.slug)"
                      class="flex-1 flex items-center gap-2 text-left bg-transparent border-none p-0 cursor-pointer truncate text-xs text-inherit"
                    >
                      <span>{{ node.icon || '#' }}</span>
                      <span class="truncate">n/{{ node.name }}</span>
                    </button>

                    <NuxtLink :to="`/nodes/n/${node.slug}`" class="text-[10px] text-slate-500 hover:text-emerald-400 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 no-underline shrink-0" title="Apri pagina dedicata del nodo">
                      -&gt;
                    </NuxtLink>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              @click="openComposerModal"
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
            Ingestione discussioni dal DB Neon in corso...
          </div>

          <div v-else-if="posts.length === 0" class="p-12 text-center text-slate-400 font-mono text-xs bg-[#090d16] rounded-2xl border border-slate-800 flex flex-col items-center gap-3">
            <span>Nessun thread pubblicato in questa sezione. Sii il primo a creare una discussione!</span>
            <button
              type="button"
              @click="openComposerModal"
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
                <button
                  type="button"
                  @click="handleVote(post, 'up')"
                  class="text-slate-500 hover:text-emerald-400 transition-colors text-sm font-bold bg-transparent border-none cursor-pointer"
                >
                  ▲
                </button>
                <span class="font-extrabold my-1 text-slate-200">{{ post.karmaScore || 1 }}</span>
                <button
                  type="button"
                  @click="handleVote(post, 'down')"
                  class="text-slate-500 hover:text-rose-400 transition-colors text-sm font-bold bg-transparent border-none cursor-pointer"
                >
                  ▼
                </button>
              </div>

              <div class="flex-1 flex flex-col gap-2 min-w-0">
                <div class="flex items-center gap-2 font-mono text-[11px] text-slate-400 flex-wrap">
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
                  <span v-if="post.vaultHash" class="ml-auto text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded text-[10px] font-bold">
                    VAULT CERTIFIED
                  </span>
                </div>

                <NuxtLink :to="`/nodes/thread/${post.id}`" class="text-base font-bold text-slate-100 group-hover:text-purple-400 transition-colors font-sans leading-snug no-underline">
                  {{ post.title }}
                </NuxtLink>

                <p class="text-xs text-slate-400 line-clamp-2 leading-relaxed font-sans m-0">
                  {{ cleanExcerpt(post.content) }}
                </p>

                <div class="flex items-center justify-between gap-4 mt-2 pt-2 border-t border-slate-800/80 font-mono text-[11px] text-slate-400">
                  <NuxtLink :to="`/nodes/thread/${post.id}`" class="hover:text-emerald-400 transition-colors flex items-center gap-1.5 font-bold no-underline text-sky-400">
                    {{ post.commentsCount || 0 }} Commenti - Apri Thread -&gt;
                  </NuxtLink>
                </div>
              </div>
            </article>
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

    <!-- MODALE RICH EDITOR CLONATO DAL BLOG DKP -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      @click.self="isModalOpen = false"
    >
      <div class="bg-[#090d16] border border-purple-500/40 rounded-2xl w-full max-w-4xl p-6 shadow-2xl flex flex-col gap-4 font-sans my-auto">
        <div class="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 class="font-mono text-sm sm:text-base font-black text-white flex items-center gap-2 m-0">
            DKP Talks Rich Editor <span class="text-xs text-emerald-400 font-normal">- Blog-Grade Engine</span>
          </h3>
          <button
            type="button"
            @click="isModalOpen = false"
            class="text-slate-400 hover:text-rose-400 font-bold text-sm bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg cursor-pointer"
          >
            X
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 bg-[#020420] p-3.5 rounded-xl border border-slate-800 font-mono text-xs">
          <div>
            <label for="modal-cat-select" class="block text-sky-400 font-bold mb-1 text-[11px]">
              1. Categoria Principale:
            </label>
            <select
              id="modal-cat-select"
              v-model="composerCategory"
              class="w-full bg-[#090d16] border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:border-sky-400 outline-none font-sans"
            >
              <option v-for="cat in categoryNames" :key="cat" :value="cat">
                {{ cat }} ({{ groupedNodes[cat]?.length || 0 }} nodi)
              </option>
            </select>
          </div>

          <div>
            <label for="modal-node-select" class="block text-emerald-400 font-bold mb-1 text-[11px]">
              2. Sotto-Nodo di Destinazione:
            </label>
            <select
              id="modal-node-select"
              v-model="newPostNodeId"
              class="w-full bg-[#090d16] border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:border-emerald-400 outline-none font-sans"
            >
              <option v-for="node in composerSubNodes" :key="node.id" :value="node.id">
                {{ node.icon || '#' }} n/{{ node.name }}
              </option>
            </select>
          </div>
        </div>

        <div class="font-mono text-xs">
          <label for="modal-thread-title" class="block text-slate-400 mb-1">Titolo Thread:</label>
          <input
            id="modal-thread-title"
            v-model="newPostTitle"
            type="text"
            placeholder="Es. [Architecture] Benchmark Pure SQL vs ORM su Cloud Run..."
            class="w-full bg-[#020420] border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-purple-400 outline-none font-sans font-bold text-sm"
          />
        </div>

        <div class="border border-slate-800 rounded-xl overflow-hidden bg-[#020420]">
          <div class="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-[#0b101d] border-b border-slate-800 font-mono">
            <div class="flex flex-wrap items-center gap-1.5">
              <button type="button" @click="applyMarkdown('**', '**', 'grassetto')" class="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-black border border-slate-700 cursor-pointer">
                B
              </button>
              <button type="button" @click="applyMarkdown('*', '*', 'corsivo')" class="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs italic border border-slate-700 cursor-pointer">
                I
              </button>
              <button type="button" @click="insertHeading" class="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700 cursor-pointer">
                H2
              </button>
              <button type="button" @click="applyMarkdown('`', '`', 'codice')" class="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-sky-400 text-xs border border-slate-700 cursor-pointer">
                &lt;/&gt;
              </button>
              <button type="button" @click="insertQuote" class="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs border border-slate-700 cursor-pointer">
                Quote
              </button>
              <button type="button" @click="applyMarkdown('[', '](https://)', 'Link')" class="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs border border-slate-700 cursor-pointer">
                Link
              </button>

              <div class="flex items-center gap-1 pl-2 ml-1 border-l border-slate-800">
                <select
                  v-model="selectedCodeLang"
                  aria-label="Linguaggio codice"
                  class="bg-slate-900 border border-slate-700 text-emerald-400 text-[11px] px-2 py-1 rounded outline-none"
                >
                  <option value="typescript">TS</option>
                  <option value="sql">SQL</option>
                  <option value="rust">Rust</option>
                  <option value="bash">Bash</option>
                  <option value="python">Python</option>
                </select>
                <button
                  type="button"
                  @click="insertCodeBlock"
                  class="px-2.5 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-bold border border-emerald-500/35 cursor-pointer"
                >
                  + Code Block
                </button>
              </div>
            </div>

            <div class="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                @click="editorTab = 'write'"
                class="px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer"
                :class="editorTab === 'write' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'"
              >
                Scrivi
              </button>
              <button
                type="button"
                @click="editorTab = 'preview'"
                class="px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer"
                :class="editorTab === 'preview' ? 'bg-sky-400 text-slate-950' : 'text-slate-400 hover:text-white'"
              >
                Anteprima
              </button>
            </div>
          </div>

          <textarea
            v-if="editorTab === 'write'"
            ref="textareaRef"
            v-model="newPostContent"
            rows="8"
            placeholder="Scrivi il corpo della discussione o incolla il tuo snippet tecnico..."
            class="w-full bg-transparent p-4 text-slate-100 outline-none font-mono text-xs sm:text-sm leading-relaxed resize-y"
          ></textarea>

          <div
            v-else
            class="p-4 min-h-[200px] text-sm text-slate-200 leading-relaxed"
            v-html="previewHtml || '<span class=\'text-slate-500 font-mono text-xs\'>Nessun contenuto in anteprima...</span>'"
          ></div>
        </div>

        <div class="font-mono text-xs">
          <label for="modal-vault-hash" class="block text-slate-400 mb-1">Vault SHA-256 Hash (Opzionale):</label>
          <input
            id="modal-vault-hash"
            v-model="newPostVaultHash"
            type="text"
            placeholder="Incolla l'hash del DKP Vault per certificarne l'autenticita"
            class="w-full bg-[#020420] border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-purple-400 outline-none"
          />
        </div>

        <div v-if="formError" role="alert" class="bg-rose-500/15 border border-rose-500/40 text-rose-300 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold">
          {{ formError }}
        </div>

        <div class="flex justify-between items-center pt-3 border-t border-slate-800 flex-wrap gap-3">
          <span class="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
            Inviando questo post riceverai +25 XP!
          </span>
          <div class="flex gap-2 font-mono">
            <button
              type="button"
              @click="isModalOpen = false"
              class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs rounded-xl cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="button"
              @click="handleCreatePost"
              :disabled="isSubmitting"
              class="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-[0_0_12px_rgba(16,185,129,0.3)] cursor-pointer disabled:opacity-50"
            >
              {{ isSubmitting ? 'Invio in corso...' : 'Pubblica Thread' }}
            </button>
          </div>
        </div>
      </div>
	  </div>
  </div>
</template>