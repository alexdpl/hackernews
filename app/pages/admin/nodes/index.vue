<!-- app/pages/admin/nodes/index.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

useHead({
  title: 'DKP Nodes & Forum Control Center v2.6 — DKP Admin',
  meta: [
    { name: 'description', content: 'Gestione Nodi, Subreddits, moderazione discussioni e verifica audit Sentinel AI Vault.' }
  ]
})

const { getMainUrl, getApiUrl } = useDomain()

// --- INTERFACCE DATI ---
interface DkpNode {
  id: number | string
  parentId?: number | string | null
  name: string
  slug: string
  description: string
  icon: string
  color: string
  subscribersCount: number
  postsCount?: number
  isPrivate: boolean
  createdAt?: string
}

interface ThreadPost {
  id: number
  title: string
  content: string
  karmaScore: number
  commentsCount: number
  vaultHash?: string
  isPinned: boolean
  isLocked: boolean
  createdAt: string
  nodeId: number
  nodeName: string
  nodeSlug: string
  nodeIcon: string
  nodeColor: string
  authorName: string
}

// --- STATI GLOBALI ---
const nodes = ref<DkpNode[]>([])
const threads = ref<ThreadPost[]>([])
const isLoading = ref(false)

// Toast System
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error' | 'warning'>('success')

const searchQuery = ref('')
const selectedNodeFilter = ref<string>('')
const activeTab = ref<'all' | 'flagged'>('all')

function triggerToast(msg: string, type: 'success' | 'error' | 'warning' = 'success') {
  toastMessage.value = msg
  toastType.value = type
  showToast.value = true
  setTimeout(() => { showToast.value = false }, 3500)
}

// --- STATO MODALE NODO ---
const isNodeModalOpen = ref(false)
const nodeForm = ref({
  id: null as number | string | null,
  parentId: null as number | string | null,
  name: '',
  slug: '',
  description: '',
  icon: '💬',
  color: '#38bdf8',
  isPrivate: false
})

// --- STATO CATEGORIA EMOJI PICKER ---
const selectedEmojiCategory = ref<string>('ALL')

const emojiCategories = [
  { id: 'ALL', label: '🌟 Tutte le Emoji' },
  { id: 'TECH', label: '💻 Tech, Dev & Code' },
  { id: 'SECURITY', label: '🛡️ Security, Cyber & Vault' },
  { id: 'CLOUD', label: '☁️ Cloud, Infra & DB' },
  { id: 'COMMUNITY', label: '💬 Community, Social & Forum' },
  { id: 'TOOLS', label: '🛠️ Tools & Analytics' }
]

const emojiCatalog: Record<string, string[]> = {
  TECH: ['💻', '⚙️', '🧠', '🤖', '⚡', '🐍', '🦀', '☕', '📦', '📐', '🔬', '🕹️', '📱', '🎮', '🧬', '🧪', '🔌', '🖥️'],
  SECURITY: ['🛡️', '🔒', '🔑', '🔐', '🕵️', '🚨', '🪪', '🎯', '🧱', '🛡', '☣️', '⚓', '👁️‍🗨️'],
  CLOUD: ['☁️', '🐳', '🛰️', '📡', '🌐', '🛜', '🚀', '🗄️', '💾', '⚡', '🏢', '📊', '📉', '📈'],
  COMMUNITY: ['💬', '📢', '🗣️', '💡', '👥', '🏆', '✨', '🔥', '💼', '📚', '🎨', '🛍️', '🎉', '🏅', '🌟'],
  TOOLS: ['🛠️', '🎯', '🔍', '⚙️', '📌', '🏷️', '📝', '⚡', '🧾', '🧰', '🔧', '🔨']
}

const filteredEmojis = computed(() => {
  if (selectedEmojiCategory.value === 'ALL') {
    return Array.from(new Set(Object.values(emojiCatalog).flat()))
  }
  return emojiCatalog[selectedEmojiCategory.value] || []
})

const presetColors = ['#38bdf8', '#00dc82', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#10b981', '#6366f1', '#eab308']

const autoSlug = (text: string) => text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
const handleNodeNameInput = () => { if (!nodeForm.value.id) nodeForm.value.slug = autoSlug(nodeForm.value.name) }

// --- COMPUTED: ORDINAMENTO GERARCHICO (Nodi Principali n/ prima, poi Sub-Nodi n/n/) ---
const sortedNodes = computed(() => {
  const mainNodes = nodes.value.filter(n => !n.parentId)
  const subNodes = nodes.value.filter(n => !!n.parentId)
  
  const result: DkpNode[] = []
  
  mainNodes.forEach(main => {
    result.push(main)
    const children = subNodes.filter(sub => String(sub.parentId) === String(main.id))
    result.push(...children)
  })
  
  const assignedIds = new Set(result.map(r => r.id))
  subNodes.forEach(sub => {
    if (!assignedIds.has(sub.id)) result.push(sub)
  })
  
  return result
})

// --- STATO MODALE VAULT REPORT ---
const isVaultModalOpen = ref(false)
const selectedPostForVault = ref<ThreadPost | null>(null)

// --- CARICAMENTO DATI ---
const fetchNodes = async () => {
  try {
    const res: any = await $fetch('/api/admin/nodes')
    if (res?.success) nodes.value = res.data || []
  } catch (err: any) {
    console.error('Errore fetch nodi:', err)
    triggerToast('Impossibile caricare i Nodi dal DB.', 'error')
  }
}

const fetchThreads = async () => {
  isLoading.value = true
  try {
    const res: any = await $fetch('/api/admin/nodes/posts')
    if (res?.success) threads.value = res.data || []
  } catch (err: any) {
    console.error('Errore fetch thread:', err)
    triggerToast('Impossibile caricare le discussioni.', 'error')
  } finally {
    isLoading.value = false
  }
}

// --- COMPUTED THREAD FILTRATI & COUNTER SENTINEL ---
const filteredThreads = computed(() => {
  return threads.value.filter(t => {
    const matchesSearch = !searchQuery.value || t.title.toLowerCase().includes(searchQuery.value.toLowerCase()) || t.authorName.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesNode = !selectedNodeFilter.value || t.nodeSlug === selectedNodeFilter.value
    const matchesTab = activeTab.value === 'all' ? true : t.isLocked
    return matchesSearch && matchesNode && matchesTab
  })
})

const flaggedCount = computed(() => threads.value.filter(t => t.isLocked).length)

// --- OPERAZIONI NODI ---
const openNodeModal = (node: DkpNode | null = null) => {
  if (node) {
    nodeForm.value = { 
      id: node.id, 
      parentId: node.parentId || null,
      name: node.name, 
      slug: node.slug, 
      description: node.description, 
      icon: node.icon || '💬', 
      color: node.color || '#38bdf8', 
      isPrivate: node.isPrivate 
    }
  } else {
    nodeForm.value = { id: null, parentId: null, name: '', slug: '', description: '', icon: '💬', color: '#38bdf8', isPrivate: false }
  }
  selectedEmojiCategory.value = 'ALL'
  isNodeModalOpen.value = true
}

const saveNode = async () => {
  if (!nodeForm.value.name || !nodeForm.value.slug || !nodeForm.value.description) {
    return triggerToast('Compila Nome, Slug e Descrizione.', 'warning')
  }
  isLoading.value = true
  try {
    const payload = { ...nodeForm.value }
    const url = nodeForm.value.id ? `/api/admin/nodes/${nodeForm.value.id}` : '/api/admin/nodes'
    const method = nodeForm.value.id ? 'PUT' : 'POST'

    const res: any = await $fetch(url, { method, body: payload })
    if (res?.success) {
      triggerToast(nodeForm.value.id ? '✅ Nodo aggiornato con successo!' : '🚀 Nuovo Nodo creato!', 'success')
      await fetchNodes()
      isNodeModalOpen.value = false
    }
  } catch (err: any) {
    triggerToast(`❌ Errore salvataggio nodo: ${err.message || 'DB Error'}`, 'error')
  } finally {
    isLoading.value = false
  }
}

const deleteNode = async (id: number | string) => {
  if (!confirm('⚠️ Sei sicuro di voler eliminare questo Nodo? Tutti i thread e commenti associati verranno cancellati.')) return
  isLoading.value = true
  try {
    const res: any = await $fetch(`/api/admin/nodes/${id}`, { method: 'DELETE' })
    if (res?.success) {
      triggerToast('🗑️ Nodo eliminato dal database.', 'success')
      await fetchNodes()
      await fetchThreads()
    }
  } catch (err: any) {
    triggerToast('❌ Errore durante l\'eliminazione del nodo.', 'error')
  } finally {
    isLoading.value = false
  }
}

// --- AZIONI MODERAZIONE THREAD ---
const togglePinThread = async (post: ThreadPost) => {
  try {
    const res: any = await $fetch(`/api/admin/nodes/posts/${post.id}`, {
      method: 'PATCH',
      body: { action: 'toggle_pin' }
    })
    if (res?.success) {
      post.isPinned = !post.isPinned
      triggerToast(post.isPinned ? '📌 Thread fissato in cima' : '📌 Thread sfissato', 'success')
    }
  } catch (err) {
    triggerToast('Errore cambio stato Pin.', 'error')
  }
}

const toggleLockThread = async (post: ThreadPost) => {
  try {
    const res: any = await $fetch(`/api/admin/nodes/posts/${post.id}`, {
      method: 'PATCH',
      body: { action: 'toggle_lock' }
    })
    if (res?.success) {
      post.isLocked = !post.isLocked
      triggerToast(post.isLocked ? '🔒 Thread bloccato (Sentinel AI)' : '🔓 Thread sbloccato', 'warning')
    }
  } catch (err) {
    triggerToast('Errore cambio stato Lock.', 'error')
  }
}

const deleteThread = async (id: number) => {
  if (!confirm('⚠️ Eliminare definitivamente questo Thread? Non potrà essere recuperato.')) return
  try {
    const res: any = await $fetch(`/api/admin/nodes/posts/${id}`, { method: 'DELETE' })
    if (res?.success) {
      threads.value = threads.value.filter(t => t.id !== id)
      triggerToast('🗑️ Thread rimosso dal database.', 'success')
    }
  } catch (err) {
    triggerToast('Errore durante l\'eliminazione del thread.', 'error')
  }
}

const inspectVault = (post: ThreadPost) => {
  selectedPostForVault.value = post
  isVaultModalOpen.value = true
}

onMounted(() => {
  fetchNodes()
  fetchThreads()
})
</script>

<template>
  <div class="min-h-screen bg-[#020420] text-slate-300 py-10 px-4 sm:px-6 font-sans">
    
    <!-- FLOATING TOAST NOTIFICATION -->
    <Transition name="toast-fade">
      <div 
        v-if="showToast" 
        :class="[
          'fixed top-6 right-6 z-50 p-4 rounded-xl backdrop-blur-md border shadow-2xl max-w-md flex items-center gap-3 font-mono text-xs sm:text-sm font-semibold transition-all',
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

    <div class="max-w-7xl mx-auto flex flex-col gap-6">
      
      <!-- NAVBAR GRID MODULI ADMIN v2.6 -->
      <div class="flex flex-col gap-3 bg-[#080d1a] border border-slate-800/80 rounded-2xl p-4 shadow-xl">
        <div class="flex justify-between items-center pb-3 border-b border-slate-800/60 font-mono">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-[0_0_8px_#00dc82]"></span>
            <span class="text-cyan-400 font-black text-xs tracking-wider uppercase">DKP NODES ADMIN CONTROL CENTER</span>
          </div>

          <NuxtLink :to="getMainUrl('/admin')" external class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-bold text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/40 hover:bg-cyan-500/20 transition-all">
            🏠 Dashboard Main
          </NuxtLink>
        </div>

        <!-- GRID NAVIGATION -->
        <nav class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 font-mono">
          <NuxtLink :to="getApiUrl('/admin/api-gateway')" external class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/30 hover:bg-emerald-500/15 transition-all">
            ⚙️ API Gateway
          </NuxtLink>
          <NuxtLink :to="getMainUrl('/admin/mail')" external class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/30 hover:bg-emerald-500/15 transition-all">
            📧 Mail
          </NuxtLink>
          <NuxtLink :to="getMainUrl('/admin/newsletter')" external class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/30 hover:bg-emerald-500/15 transition-all">
            📣 Newsletter
          </NuxtLink>
          <NuxtLink :to="getMainUrl('/admin/crawler')" external class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/30 hover:bg-emerald-500/15 transition-all">
            🤖 Crawler
          </NuxtLink>
          <NuxtLink :to="getMainUrl('/admin/blog')" external class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/30 hover:bg-emerald-500/15 transition-all">
            📝 Blog
          </NuxtLink>
          <NuxtLink :to="getMainUrl('/admin/nodes')" external class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs text-sky-300 bg-sky-500/20 border border-sky-500/50 shadow-[0_0_10px_rgba(56,189,248,0.2)]">
            💬 Gestione Nodi
          </NuxtLink>
          <NuxtLink :to="getMainUrl('/admin/shop')" external class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/30 hover:bg-emerald-500/15 transition-all">
            🛍️ Shop
          </NuxtLink>
          <NuxtLink :to="getMainUrl('/admin/jobs')" external class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/30 hover:bg-emerald-500/15 transition-all">
            💼 Jobs
          </NuxtLink>
        </nav>
      </div>

      <!-- HEADER HERO NODES & FORUM v2.6-PURE-SQL -->
      <header class="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-gradient-to-r from-[#080d1a] via-[#091124] to-[#040711] border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl gap-6 relative overflow-hidden">
        <!-- Glow Cosmico -->
        <div class="absolute -right-20 -top-20 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -left-20 -bottom-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="relative z-10 flex flex-col gap-2">
          <div class="flex items-center gap-3 mb-1 flex-wrap font-mono">
            <span class="bg-gradient-to-r from-sky-500/20 to-teal-500/20 text-sky-400 border border-sky-500/40 px-3 py-0.5 rounded-full text-xs font-black uppercase shadow-[0_0_12px_rgba(56,189,248,0.25)]">
              DKP NODES &amp; SUBREDDITS CONTROL CENTER v2.6-PURE-SQL
            </span>
          </div>
          <h1 class="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Gestione <span class="text-emerald-400">DKP Nodes &amp; Moderazione</span>
          </h1>
          <p class="text-slate-400 text-xs sm:text-sm max-w-2xl">
            Crea e gestisci i Nodi della community, modera le discussioni ed esamina la coda di audit Sentinel AI.
          </p>
        </div>
      </header>

      <!-- MAIN HYBRID GRID (380px / 1fr) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <!-- ================= COLONNA SINISTRA: NODI (GERARCHIA REDDIT / SUBREDDIT) ================= -->
        <aside class="lg:col-span-5 xl:col-span-4 bg-[#080d1a] border border-slate-800/80 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
          <div class="flex justify-between items-center pb-3 border-b border-slate-800">
            <h3 class="text-white font-bold text-base flex items-center gap-2">
              <span>🏷️ Nodi Attivi ({{ nodes.length }})</span>
            </h3>
            <button 
              @click="openNodeModal()" 
              class="px-3 py-1.5 rounded-lg font-black text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-[0_0_10px_rgba(0,220,130,0.2)] cursor-pointer"
            >
              ➕ Nuovo
            </button>
          </div>

          <div v-if="!nodes.length" class="p-8 text-center text-slate-500 font-mono text-xs">
            Nessun nodo registrato. Creane uno nuovo!
          </div>

          <div v-else class="flex flex-col gap-3 max-h-[70vh] overflow-y-auto pr-1">
            <div 
              v-for="node in sortedNodes" 
              :key="node.id" 
              :class="[
                'bg-[#040814] border border-slate-800/90 rounded-xl p-3.5 transition-all hover:border-slate-700',
                node.parentId ? 'ml-4 border-l-2 border-l-sky-400 bg-[#060b1d]' : ''
              ]"
            >
              <div class="flex justify-between items-start gap-2">
                <div class="flex items-center gap-2.5">
                  <div 
                    class="w-8 h-8 rounded-lg flex items-center justify-center border text-base"
                    :style="{ backgroundColor: `${node.color || '#38bdf8'}20`, color: node.color || '#38bdf8', borderColor: `${node.color || '#38bdf8'}40` }"
                  >
                    <span>{{ node.icon || '💬' }}</span>
                  </div>
                  <div class="flex flex-col">
                    <h4 class="text-white font-bold text-xs sm:text-sm flex items-center gap-1">
                      <span v-if="node.parentId" class="text-[9px] bg-sky-500/20 text-sky-400 px-1 py-0.2 rounded font-mono font-bold">n/n/</span>
                      <span v-else class="text-[9px] bg-emerald-500/20 text-emerald-400 px-1 py-0.2 rounded font-mono font-bold">n/</span>
                      {{ node.name }}
                    </h4>
                    <span class="text-[10px] text-slate-500 font-mono">
                      {{ node.parentId ? `/nodes/n/sub/${node.slug}` : `/nodes/n/${node.slug}` }}
                    </span>
                  </div>
                </div>

                <div class="flex items-center gap-1 font-mono">
                  <button @click="openNodeModal(node)" class="p-1.5 bg-slate-800 hover:bg-sky-500 hover:text-slate-950 text-sky-400 rounded-lg text-xs transition-all cursor-pointer" title="Modifica Nodo">✏️</button>
                  <button @click="deleteNode(node.id)" class="p-1.5 bg-rose-500/15 border border-rose-500/30 hover:bg-rose-500 hover:text-white text-rose-400 rounded-lg text-xs transition-all cursor-pointer" title="Elimina Nodo">🗑️</button>
                </div>
              </div>

              <p class="text-[11px] text-slate-400 my-2 line-clamp-2 leading-relaxed">{{ node.description }}</p>

              <div class="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-800/60">
                <span>👥 {{ node.subscribersCount }} Iscritti</span>
                <span>💬 {{ node.postsCount || 0 }} Thread</span>
                <span v-if="node.isPrivate" class="text-amber-400 font-bold">🔒 Privato</span>
              </div>
            </div>
          </div>
        </aside>

        <!-- ================= COLONNA DESTRA: THREADS & MODERAZIONE ================= -->
        <main class="lg:col-span-7 xl:col-span-8 bg-[#080d1a] border border-slate-800/80 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
          
          <!-- CONTROLLI TAB & FILTRI -->
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800 font-mono text-xs">
            <div class="flex items-center gap-2 flex-wrap">
              <button 
                @click="activeTab = 'all'" 
                :class="[
                  'px-3 py-2 rounded-xl font-bold transition-all cursor-pointer border',
                  activeTab === 'all' ? 'bg-sky-500/15 text-sky-400 border-sky-500/40 shadow-[0_0_10px_rgba(56,189,248,0.2)]' : 'bg-[#040814] text-slate-400 border-slate-800 hover:text-white'
                ]"
              >
                Tutti i Thread ({{ threads.length }})
              </button>
              <button 
                @click="activeTab = 'flagged'" 
                :class="[
                  'px-3 py-2 rounded-xl font-bold transition-all cursor-pointer border flex items-center gap-1.5',
                  activeTab === 'flagged' ? 'bg-amber-500/15 text-amber-400 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'bg-[#040814] text-slate-400 border-slate-800 hover:text-white'
                ]"
              >
                <span>🛡️ Coda Sentinel AI</span>
                <span v-if="flaggedCount > 0" class="bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded-full text-[10px] font-black">
                  {{ flaggedCount }}
                </span>
              </button>
            </div>

            <div class="flex items-center gap-2 w-full sm:w-auto">
              <select 
                v-model="selectedNodeFilter" 
                class="bg-[#040814] border border-slate-800 text-slate-200 px-3 py-2 rounded-xl font-bold outline-none focus:border-sky-500 transition-all text-xs cursor-pointer"
              >
                <option value="">Tutti i Nodi</option>
                <option v-for="n in nodes" :key="n.id" :value="n.slug">n/{{ n.name }}</option>
              </select>
              <input 
                v-model="searchQuery" 
                type="text" 
                placeholder="Cerca thread..." 
                class="bg-[#040814] border border-slate-800 text-slate-200 px-3 py-2 rounded-xl outline-none focus:border-sky-500 transition-all text-xs w-full sm:w-40" 
              />
            </div>
          </div>

          <!-- TABELLA DISCUSSIONI -->
          <div v-if="isLoading" class="text-center py-12 text-sky-400 animate-pulse font-mono text-xs">
            Sincronizzazione discussioni con Neon DB...
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr class="bg-[#040814] text-slate-400 font-extrabold text-[11px] uppercase border-b border-slate-800 font-mono">
                  <th class="p-3.5">TITOLO DISCUSSIONE</th>
                  <th class="p-3.5">NODO</th>
                  <th class="p-3.5">AUTORE</th>
                  <th class="p-3.5">KARMA</th>
                  <th class="p-3.5">STATO</th>
                  <th class="p-3.5 text-right">AZIONI MODERAZIONE</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="post in filteredThreads" 
                  :key="post.id" 
                  :class="[
                    'border-b border-slate-800/60 hover:bg-slate-900/40 transition-colors',
                    post.isLocked ? 'bg-amber-500/5' : ''
                  ]"
                >
                  <td class="p-3.5">
                    <div class="flex flex-col">
                      <NuxtLink :to="`/nodes/thread/${post.id}`" target="_blank" class="font-bold text-white hover:text-sky-400 transition-colors">
                        {{ post.title }}
                      </NuxtLink>
                      <span v-if="post.vaultHash" class="text-[10px] text-purple-400 font-mono mt-0.5" title="Vault Proof-of-Code Certificato">
                        🛡️ Proof-of-Code
                      </span>
                    </div>
                  </td>
                  <td class="p-3.5 font-mono">
                    <span 
                      class="px-2 py-0.5 rounded text-[10px] font-bold border"
                      :style="{ backgroundColor: `${post.nodeColor || '#38bdf8'}15`, color: post.nodeColor || '#38bdf8', borderColor: `${post.nodeColor || '#38bdf8'}30` }"
                    >
                      {{ post.nodeIcon }} n/{{ post.nodeSlug }}
                    </span>
                  </td>
                  <td class="p-3.5 font-mono text-slate-400">@{{ post.authorName }}</td>
                  <td class="p-3.5 font-mono font-bold" :class="post.karmaScore > 0 ? 'text-emerald-400' : 'text-slate-400'">
                    ▲ {{ post.karmaScore }}
                  </td>
                  <td class="p-3.5 font-mono">
                    <span v-if="post.isPinned" class="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 mr-1">
                      📌 Pinned
                    </span>
                    <span v-if="post.isLocked" class="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      🔒 Locked (Sentinel)
                    </span>
                    <span v-if="!post.isPinned && !post.isLocked" class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">
                      Attivo
                    </span>
                  </td>
                  <td class="p-3.5 text-right font-mono">
                    <div class="flex justify-end items-center gap-1.5">
                      <button 
                        v-if="post.vaultHash" 
                        @click="inspectVault(post)" 
                        class="p-1.5 bg-purple-500/15 border border-purple-500/30 hover:bg-purple-500 hover:text-white text-purple-300 rounded-lg text-xs transition-all cursor-pointer" 
                        title="Ispeziona Proof-of-Code Vault"
                      >
                        🛡️
                      </button>
                      <button 
                        @click="togglePinThread(post)" 
                        class="p-1.5 bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 rounded-lg text-xs transition-all cursor-pointer" 
                        :title="post.isPinned ? 'Unpin' : 'Pin in Cima'"
                      >
                        📌
                      </button>
                      <button 
                        @click="toggleLockThread(post)" 
                        class="p-1.5 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-amber-400 rounded-lg text-xs transition-all cursor-pointer" 
                        :title="post.isLocked ? 'Sblocca Discussione' : 'Blocca Discussione'"
                      >
                        🔒
                      </button>
                      <button 
                        @click="deleteThread(post.id)" 
                        class="p-1.5 bg-rose-500/15 border border-rose-500/30 hover:bg-rose-500 hover:text-white text-rose-400 rounded-lg text-xs transition-all cursor-pointer" 
                        title="Elimina Thread"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>

                <tr v-if="filteredThreads.length === 0">
                  <td colspan="6" class="p-12 text-center text-slate-500 font-mono text-xs">
                    📂 Nessun thread trovato per i filtri selezionati.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </main>

      </div>

      <!-- ================= MODALE CREAZIONE / MODIFICA NODO ================= -->
      <Transition name="fade">
        <div 
          v-if="isNodeModalOpen" 
          class="fixed inset-0 z-50 bg-[#020420]/80 backdrop-blur-sm flex items-center justify-center p-4" 
          @click.self="isNodeModalOpen = false"
        >
          <div class="bg-[#080d1a] border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-hidden">
            
            <!-- HEADER MODALE -->
            <div class="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 class="text-cyan-400 font-bold text-base sm:text-lg">
                💬 {{ nodeForm.id ? "Modifica Nodo DKP" : "Nuovo Nodo (Subreddit)" }}
              </h3>
              <button @click="isNodeModalOpen = false" class="text-slate-500 hover:text-white font-bold text-xl cursor-pointer">✕</button>
            </div>

            <!-- FORM SCROLLABILE -->
            <div class="flex flex-col gap-4 overflow-y-auto pr-1 font-mono text-xs">
              
              <!-- SELETTORE GERARCHIA PADRE -->
              <div class="flex flex-col gap-1.5">
                <label class="text-slate-400 font-bold uppercase">TIPO NODO &amp; GERARCHIA *</label>
                <select 
                  v-model="nodeForm.parentId" 
                  class="bg-[#040814] border border-slate-800 text-white px-3.5 py-2.5 rounded-xl font-bold outline-none focus:border-sky-500 transition-all cursor-pointer"
                >
                  <option :value="null">📂 Nodo Principale (n/ reddit)</option>
                  <option 
                    v-for="parent in nodes.filter(n => !n.parentId && n.id !== nodeForm.id)" 
                    :key="parent.id" 
                    :value="parent.id"
                  >
                    ↳ Sub-Nodo di: n/{{ parent.name }} (n/n/ subreddit)
                  </option>
                </select>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="flex flex-col gap-1.5">
                  <label class="text-slate-400 font-bold uppercase">NOME NODO *</label>
                  <input 
                    v-model="nodeForm.name" 
                    @input="handleNodeNameInput" 
                    type="text" 
                    placeholder="Es. devops, rust" 
                    class="bg-[#040814] border border-slate-800 text-white px-3.5 py-2.5 rounded-xl font-bold outline-none focus:border-sky-500 transition-all"
                    required 
                  />
                </div>

                <div class="flex flex-col gap-1.5">
                  <label class="text-slate-400 font-bold uppercase">URL SLUG *</label>
                  <input 
                    v-model="nodeForm.slug" 
                    type="text" 
                    placeholder="devops" 
                    class="bg-[#040814] border border-slate-800 text-white px-3.5 py-2.5 rounded-xl font-bold outline-none focus:border-sky-500 transition-all"
                    required 
                  />
                </div>
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-slate-400 font-bold uppercase">DESCRIZIONE NODO *</label>
                <textarea 
                  v-model="nodeForm.description" 
                  rows="2" 
                  placeholder="Di cosa si parla in questo nodo..." 
                  class="bg-[#040814] border border-slate-800 text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-sky-500 transition-all"
                  required
                ></textarea>
              </div>

              <!-- EMOJI PICKER -->
              <div class="flex flex-col gap-2">
                <div class="flex justify-between items-center">
                  <label class="text-slate-400 font-bold uppercase">ICONA EMOJI NODO *</label>
                  <div class="flex items-center gap-2">
                    <span class="text-[11px] text-slate-500">Custom:</span>
                    <input 
                      v-model="nodeForm.icon" 
                      type="text" 
                      class="w-10 text-center py-1 bg-[#040814] border border-slate-800 rounded-lg text-sm text-white" 
                      maxlength="4" 
                    />
                  </div>
                </div>

                <select 
                  v-model="selectedEmojiCategory" 
                  class="bg-[#040814] border border-slate-800 text-slate-300 px-3 py-2 rounded-xl outline-none focus:border-sky-500 transition-all cursor-pointer text-xs"
                >
                  <option v-for="cat in emojiCategories" :key="cat.id" :value="cat.id">
                    {{ cat.label }}
                  </option>
                </select>

                <div class="grid grid-cols-7 gap-1.5 max-h-28 overflow-y-auto p-2 bg-[#040814] border border-slate-800 rounded-xl">
                  <button 
                    v-for="emoji in filteredEmojis" 
                    :key="emoji" 
                    type="button" 
                    @click="nodeForm.icon = emoji" 
                    :class="[
                      'p-2 rounded-lg text-base flex items-center justify-center border transition-all cursor-pointer',
                      nodeForm.icon === emoji ? 'bg-emerald-500/20 border-emerald-500 text-white scale-110' : 'bg-[#080d1a] border-slate-800 hover:border-slate-700'
                    ]"
                  >
                    {{ emoji }}
                  </button>
                </div>
              </div>

              <!-- PALETTE COLORI -->
              <div class="flex flex-col gap-1.5">
                <label class="text-slate-400 font-bold uppercase">COLORE ACCENT NODO</label>
                <div class="flex items-center gap-2">
                  <span 
                    v-for="color in presetColors" 
                    :key="color" 
                    @click="nodeForm.color = color" 
                    :style="{ backgroundColor: color }" 
                    :class="[
                      'w-6 h-6 rounded-full cursor-pointer transition-all border-2',
                      nodeForm.color === color ? 'border-white scale-110 shadow-lg' : 'border-transparent'
                    ]"
                  ></span>
                  <input v-model="nodeForm.color" type="color" class="w-8 h-8 rounded bg-transparent border-0 cursor-pointer" title="Seleziona colore personalizzato" />
                </div>
              </div>

              <!-- PREVIEW BADGE -->
              <div class="flex items-center gap-3 bg-[#040814] p-3 rounded-xl border border-slate-800">
                <span class="text-slate-500 font-bold text-[11px]">Anteprima Live:</span>
                <span 
                  class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border"
                  :style="{ backgroundColor: `${nodeForm.color}20`, color: nodeForm.color, borderColor: `${nodeForm.color}40` }"
                >
                  <span>{{ nodeForm.icon }}</span>
                  <span class="font-mono">{{ nodeForm.parentId ? 'n/n/' : 'n/' }}</span>{{ nodeForm.name || "nome-nodo" }}
                </span>
              </div>

              <div class="flex items-center gap-2 pt-1">
                <input type="checkbox" id="isPrivateNode" v-model="nodeForm.isPrivate" class="w-4 h-4 accent-emerald-500 rounded cursor-pointer" />
                <label for="isPrivateNode" class="text-slate-300 font-bold cursor-pointer">
                  🔒 Nodo Privato (Visibile solo agli utenti registrati)
                </label>
              </div>

            </div>

            <!-- FOOTER -->
            <div class="border-t border-slate-800 pt-4 flex justify-end gap-3 font-mono">
              <button @click="isNodeModalOpen = false" type="button" class="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer">
                Annulla
              </button>
              <button @click="saveNode" type="button" :disabled="isLoading" class="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50">
                {{ isLoading ? 'Salvataggio...' : '💾 Salva Nodo' }}
              </button>
            </div>

          </div>
        </div>
      </Transition>

      <!-- ================= MODALE VAULT PROOF OF CODE ================= -->
      <Transition name="fade">
        <div 
          v-if="isVaultModalOpen && selectedPostForVault" 
          class="fixed inset-0 z-50 bg-[#020420]/80 backdrop-blur-sm flex items-center justify-center p-4" 
          @click.self="isVaultModalOpen = false"
        >
          <div class="bg-[#080d1a] border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl flex flex-col gap-4 font-mono">
            <div class="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 class="text-purple-400 font-black text-base flex items-center gap-2">
                <span>🛡️ DKP Vault Proof-of-Code Certificate</span>
              </h3>
              <span class="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded font-bold">
                NODES SENTINEL AUDIT
              </span>
            </div>

            <div class="flex flex-col gap-2 my-2 text-xs">
              <h4 class="text-white font-bold text-sm">{{ selectedPostForVault.title }}</h4>
              <p class="text-slate-400">
                Autore: <strong class="text-white">@{{ selectedPostForVault.authorName }}</strong> • Data: {{ new Date(selectedPostForVault.createdAt).toLocaleDateString('it-IT') }}
              </p>
              
              <div class="bg-[#040814] border border-slate-800 rounded-xl p-3 flex flex-col gap-1 mt-2">
                <span class="text-[10px] text-slate-500 font-bold uppercase">SHA-256 PROOF-OF-CODE CHECKSUM:</span>
                <code class="text-purple-400 text-[11px] break-all font-mono font-bold">{{ selectedPostForVault.vaultHash }}</code>
              </div>
            </div>

            <button @click="isVaultModalOpen = false" class="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-all cursor-pointer">
              Chiudi Report
            </button>
          </div>
        </div>
      </Transition>

    </div>
  </div>
</template>

<style scoped>
.toast-fade-enter-active, .toast-fade-leave-active { transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
.toast-fade-enter-from, .toast-fade-leave-to { opacity: 0; transform: translateY(-15px) scale(0.95); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>