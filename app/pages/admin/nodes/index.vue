<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import DkpAdminShell from '~/components/admin/DkpAdminShell.vue'

definePageMeta({
  middleware: 'admin-only'
})

interface DkpNode {
  id: number
  parentId: number | null
  category?: string | null
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
  vaultBlockNumber?: number | null
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

const defaultCategories = [
  '1. DKP Ecosystem & Core',
  '2. AI, LLM & Neural Agents',
  '3. Systems, Rust & Kernel Dev',
  '4. Web, Cloud & Pure SQL',
  '5. Security, Web3 & Vault'
]

const nodes = ref<DkpNode[]>([])
const threads = ref<ThreadPost[]>([])
const isLoading = ref(false)
const isSavingNode = ref(false)

const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error' | 'warning'>('success')

const searchQuery = ref('')
const selectedNodeFilter = ref<string>('')
const sidebarNodeSearch = ref('')
const activeTab = ref<'all' | 'flagged'>('all')
const currentPage = ref(1)
const pageSize = ref(15)
const serverTotalThreads = ref<number | null>(null)

const expandedParents = ref<Record<string, boolean>>({})
const quickParentId = ref<number | null>(null)
const quickName = ref('')

const cleanNodePrefix = (val: string) => String(val || '').replace(/^(n\/)+/i, '').trim()

function normalizeNullableId(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '' || raw === 'null' || raw === 0 || raw === '0') {
    return null
  }
  const num = Number(raw)
  return Number.isInteger(num) && num > 0 ? num : null
}

function triggerToast(msg: string, type: 'success' | 'error' | 'warning' = 'success') {
  toastMessage.value = msg
  toastType.value = type
  showToast.value = true
  setTimeout(() => { showToast.value = false }, 3500)
}

const isNodeModalOpen = ref(false)
const nodeForm = ref({
  id: null as number | null,
  parentId: null as number | null,
  category: '1. DKP Ecosystem & Core',
  name: '',
  slug: '',
  description: '',
  icon: '💬',
  color: '#38bdf8',
  isPrivate: false
})

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

const autoSlug = (text: string) =>
  cleanNodePrefix(text)
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')

const handleNodeNameInput = () => {
  if (!nodeForm.value.id) nodeForm.value.slug = autoSlug(nodeForm.value.name)
}

const mainNodes = computed(() => nodes.value.filter(n => n.parentId === null))

const availableParentTargets = computed(() => {
  return mainNodes.value.filter(n => n.id !== nodeForm.value.id)
})

const nodeTree = computed(() => {
  const q = sidebarNodeSearch.value.toLowerCase().trim()
  const childrenByParent = new Map<number, DkpNode[]>()
  const mainIds = new Set(mainNodes.value.map(m => m.id))
  const orphans: DkpNode[] = []

  nodes.value.forEach(n => {
    if (n.parentId === null) return
    if (!mainIds.has(n.parentId)) {
      if (!q || n.name.toLowerCase().includes(q) || n.slug.toLowerCase().includes(q)) {
        orphans.push(n)
      }
      return
    }
    const list = childrenByParent.get(n.parentId) || []
    list.push(n)
    childrenByParent.set(n.parentId, list)
  })

  const groups = mainNodes.value
    .map(parent => {
      const allChildren = childrenByParent.get(parent.id) || []
      if (!q) return { parent, children: allChildren }

      const parentMatches = parent.name.toLowerCase().includes(q) || parent.slug.toLowerCase().includes(q)
      const matchingChildren = allChildren.filter(
        c => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)
      )

      if (parentMatches || matchingChildren.length > 0) {
        return { parent, children: parentMatches ? allChildren : matchingChildren }
      }
      return null
    })
    .filter((g): g is { parent: DkpNode; children: DkpNode[] } => g !== null)

  return { groups, orphans }
})

const toggleParentDropdown = (parentId: number) => {
  const key = String(parentId)
  expandedParents.value[key] = !expandedParents.value[key]
}

const expandAllNodes = (expand: boolean) => {
  const next: Record<string, boolean> = {}
  mainNodes.value.forEach(m => {
    next[String(m.id)] = expand
  })
  expandedParents.value = next
}

const isVaultModalOpen = ref(false)
const selectedPostForVault = ref<ThreadPost | null>(null)
const liveVaultProof = ref<any>(null)
const isVerifyingVault = ref(false)

const fetchNodes = async () => {
  try {
    const res: any = await $fetch('/api/admin/nodes')
    if (res?.success && Array.isArray(res.data)) {
      nodes.value = res.data.map((raw: any) => {
        const normalizedId = Number(raw.id)
        const normalizedParent = normalizeNullableId(raw.parentId ?? raw.parent_id)
        return {
          ...raw,
          id: normalizedId,
          parentId: normalizedParent === normalizedId ? null : normalizedParent,
          category: raw.category || '1. DKP Ecosystem & Core',
          name: cleanNodePrefix(raw.name),
          slug: cleanNodePrefix(raw.slug),
          subscribersCount: Number(raw.subscribersCount ?? raw.subscribers_count ?? 0),
          postsCount: Number(raw.postsCount ?? raw.posts_count ?? 0),
          isPrivate: Boolean(raw.isPrivate ?? raw.is_private)
        }
      })

      if (Object.keys(expandedParents.value).length === 0) {
        expandAllNodes(nodes.value.length <= 25)
      }
    }
  } catch (err: any) {
    console.error('Errore fetch nodi:', err)
    triggerToast('Impossibile caricare i Nodi dal DB.', 'error')
  }
}

const fetchThreads = async () => {
  isLoading.value = true
  try {
    const res: any = await $fetch('/api/admin/nodes/posts', {
      query: {
        page: currentPage.value,
        limit: pageSize.value,
        search: searchQuery.value || undefined,
        node: selectedNodeFilter.value || undefined,
        status: activeTab.value === 'flagged' ? 'locked' : undefined
      }
    })
    if (res?.success && Array.isArray(res.data)) {
      threads.value = res.data.map((t: any) => ({
        ...t,
        nodeName: cleanNodePrefix(t.nodeName || t.node_name),
        nodeSlug: cleanNodePrefix(t.nodeSlug || t.node_slug)
      }))
      serverTotalThreads.value = typeof res.total === 'number' ? res.total : null
    }
  } catch (err: any) {
    console.error('Errore fetch thread:', err)
    triggerToast('Impossibile caricare le discussioni.', 'error')
  } finally {
    isLoading.value = false
  }
}

const filteredThreads = computed(() => {
  if (serverTotalThreads.value !== null) return threads.value

  return threads.value.filter(t => {
    const q = searchQuery.value.toLowerCase().trim()
    const matchesSearch =
      !q ||
      (t.title || '').toLowerCase().includes(q) ||
      (t.authorName || '').toLowerCase().includes(q)
    const matchesNode = !selectedNodeFilter.value || t.nodeSlug === selectedNodeFilter.value
    const matchesTab = activeTab.value === 'all' ? true : t.isLocked
    return matchesSearch && matchesNode && matchesTab
  })
})

const totalThreadsCount = computed(() =>
  serverTotalThreads.value !== null ? serverTotalThreads.value : filteredThreads.value.length
)

const totalPages = computed(() => Math.max(1, Math.ceil(totalThreadsCount.value / pageSize.value)))

const paginatedThreads = computed(() => {
  if (serverTotalThreads.value !== null) return threads.value
  const start = (currentPage.value - 1) * pageSize.value
  return filteredThreads.value.slice(start, start + pageSize.value)
})

const visiblePageNumbers = computed(() => {
  const total = totalPages.value
  const cur = currentPage.value
  const pages: number[] = []
  const start = Math.max(1, cur - 2)
  const end = Math.min(total, cur + 2)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

const flaggedCount = computed(() => threads.value.filter(t => t.isLocked).length)

watch([searchQuery, selectedNodeFilter, activeTab, pageSize], () => {
  currentPage.value = 1
  if (serverTotalThreads.value !== null) {
    fetchThreads()
  }
})

const goToPage = (page: number) => {
  const target = Math.min(Math.max(1, page), totalPages.value)
  if (target === currentPage.value) return
  currentPage.value = target
  if (serverTotalThreads.value !== null) {
    fetchThreads()
  }
}

const createQuickNode = async () => {
  const cleanName = cleanNodePrefix(quickName.value)
  if (!cleanName) {
    return triggerToast('Inserisci il nome del Nodo o Sub-nodo.', 'warning')
  }
  const slug = autoSlug(cleanName)
  if (!slug) {
    return triggerToast('Nome nodo non valido per generare lo slug.', 'warning')
  }

  isSavingNode.value = true
  try {
    const explicitParentId = normalizeNullableId(quickParentId.value)
    const parentObj = explicitParentId
      ? mainNodes.value.find(m => m.id === explicitParentId)
      : null

    const payload = {
      parentId: explicitParentId,
      parent_id: explicitParentId,
      category: parentObj?.category || '1. DKP Ecosystem & Core',
      name: cleanName,
      slug,
      description: parentObj
        ? `Sub-nodo ufficiale di n/${parentObj.name} dedicato a ${cleanName}.`
        : `Community ufficiale DKP dedicata a ${cleanName}.`,
      icon: parentObj?.icon || '💬',
      color: parentObj?.color || '#38bdf8',
      isPrivate: false
    }

    const res: any = await $fetch('/api/admin/nodes', { method: 'POST', body: payload })
    if (res?.success) {
      triggerToast(
        explicitParentId
          ? `Sub-nodo n/n/${slug} creato sotto n/${parentObj?.name || 'parent'}!`
          : `Nodo principale n/${slug} creato a livello Root!`,
        'success'
      )
      if (explicitParentId) {
        expandedParents.value[String(explicitParentId)] = true
      }
      quickName.value = ''
      quickParentId.value = null
      await fetchNodes()
    }
  } catch (err: any) {
    triggerToast(`Errore creazione rapida: ${err?.data?.statusMessage || err?.message || 'DB Error'}`, 'error')
  } finally {
    isSavingNode.value = false
  }
}

const openNodeModal = (node: DkpNode | null = null, presetParentId: number | null = null) => {
  if (node) {
    nodeForm.value = {
      id: Number(node.id),
      parentId: normalizeNullableId(node.parentId),
      category: node.category || '1. DKP Ecosystem & Core',
      name: cleanNodePrefix(node.name),
      slug: cleanNodePrefix(node.slug),
      description: node.description || '',
      icon: node.icon || '💬',
      color: node.color || '#38bdf8',
      isPrivate: Boolean(node.isPrivate)
    }
  } else {
    const explicitParent = normalizeNullableId(presetParentId)
    const parentObj = explicitParent
      ? mainNodes.value.find(m => m.id === explicitParent)
      : null

    nodeForm.value = {
      id: null,
      parentId: explicitParent,
      category: parentObj?.category || '1. DKP Ecosystem & Core',
      name: '',
      slug: '',
      description: '',
      icon: parentObj?.icon || '💬',
      color: parentObj?.color || '#38bdf8',
      isPrivate: false
    }
  }
  selectedEmojiCategory.value = 'ALL'
  isNodeModalOpen.value = true
}

const saveNode = async () => {
  const cleanName = cleanNodePrefix(nodeForm.value.name)
  const cleanSlug = autoSlug(nodeForm.value.slug || cleanName)
  if (!cleanName || !cleanSlug || !nodeForm.value.description.trim()) {
    return triggerToast('Compila Nome, Slug e Descrizione.', 'warning')
  }

  const normalizedParent = normalizeNullableId(nodeForm.value.parentId)
  if (nodeForm.value.id && normalizedParent === Number(nodeForm.value.id)) {
    return triggerToast('Un nodo non può essere padre di se stesso.', 'error')
  }

  isSavingNode.value = true
  try {
    const payload = {
      parentId: normalizedParent,
      parent_id: normalizedParent,
      category: nodeForm.value.category || '1. DKP Ecosystem & Core',
      name: cleanName,
      slug: cleanSlug,
      description: nodeForm.value.description.trim(),
      icon: nodeForm.value.icon || '💬',
      color: nodeForm.value.color || '#38bdf8',
      isPrivate: Boolean(nodeForm.value.isPrivate)
    }

    const url = nodeForm.value.id ? `/api/admin/nodes/${nodeForm.value.id}` : '/api/admin/nodes'
    const method = nodeForm.value.id ? 'PUT' : 'POST'

    const res: any = await $fetch(url, { method, body: payload })
    if (res?.success) {
      triggerToast(
        nodeForm.value.id
          ? 'Nodo e gerarchia aggiornati nel DB!'
          : normalizedParent
            ? 'Nuovo Sub-nodo creato!'
            : 'Nuovo Nodo Principale (Root) creato!',
        'success'
      )
      if (normalizedParent) {
        expandedParents.value[String(normalizedParent)] = true
      }
      quickName.value = ''
      quickParentId.value = null
      await fetchNodes()
      isNodeModalOpen.value = false
    }
  } catch (err: any) {
    triggerToast(`Errore salvataggio nodo: ${err?.data?.statusMessage || err?.message || 'DB Error'}`, 'error')
  } finally {
    isSavingNode.value = false
  }
}

const deleteNode = async (id: number) => {
  if (!confirm('Sei sicuro di voler eliminare questo Nodo?')) return
  isSavingNode.value = true
  try {
    const res: any = await $fetch(`/api/admin/nodes/${id}`, { method: 'DELETE' })
    if (res?.success) {
      triggerToast('Nodo eliminato dal database.', 'success')
      if (selectedNodeFilter.value) selectedNodeFilter.value = ''
      await fetchNodes()
      await fetchThreads()
    }
  } catch {
    triggerToast('Errore durante l\'eliminazione del nodo.', 'error')
  } finally {
    isSavingNode.value = false
  }
}

const togglePinThread = async (post: ThreadPost) => {
  try {
    const res: any = await $fetch(`/api/admin/nodes/posts/${post.id}`, {
      method: 'PATCH',
      body: { action: 'toggle_pin' }
    })
    if (res?.success) {
      post.isPinned = !post.isPinned
      triggerToast(post.isPinned ? 'Thread fissato in cima' : 'Thread sfissato', 'success')
    }
  } catch {
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
      triggerToast(post.isLocked ? 'Thread bloccato (Sentinel AI)' : 'Thread sbloccato', 'warning')
    }
  } catch {
    triggerToast('Errore cambio stato Lock.', 'error')
  }
}

const deleteThread = async (id: number) => {
  if (!confirm('Eliminare definitivamente questo Thread? Non potrà essere recuperato.')) return
  try {
    const res: any = await $fetch(`/api/admin/nodes/posts/${id}`, { method: 'DELETE' })
    if (res?.success) {
      threads.value = threads.value.filter(t => t.id !== id)
      if (serverTotalThreads.value !== null) {
        serverTotalThreads.value = Math.max(0, serverTotalThreads.value - 1)
      }
      if (paginatedThreads.value.length === 0 && currentPage.value > 1) {
        currentPage.value--
      }
      triggerToast('Thread rimosso dal database.', 'success')
    }
  } catch {
    triggerToast('Errore durante l\'eliminazione del thread.', 'error')
  }
}

const inspectVault = async (post: ThreadPost) => {
  selectedPostForVault.value = post
  liveVaultProof.value = null
  isVaultModalOpen.value = true
  isVerifyingVault.value = true

  try {
    const res: any = await $fetch('/api/vault/verify', {
      query: { postId: post.id, entityType: 'forum' }
    })
    if (res?.proof) {
      liveVaultProof.value = res.proof
      post.vaultHash = res.proof.vaultHash
    }
  } catch {
    triggerToast('Errore verifica live su DKP Vault.', 'warning')
  } finally {
    isVerifyingVault.value = false
  }
}

const forceNotarizeThread = async (post: ThreadPost) => {
  isVerifyingVault.value = true
  try {
    const res: any = await $fetch('/api/vault/notarize', {
      method: 'POST',
      body: { entityType: 'forum', entityId: post.id }
    })
    if (res?.proof) {
      liveVaultProof.value = res.proof
      post.vaultHash = res.proof.vaultHash
      triggerToast(`Thread #${post.id} notarizzato sul Block #${res.proof.blockNumber}!`, 'success')
    }
  } catch {
    triggerToast('Errore durante la notarizzazione on-chain.', 'error')
  } finally {
    isVerifyingVault.value = false
  }
}

onMounted(() => {
  fetchNodes()
  fetchThreads()
})
</script>

<template>
  <DkpAdminShell
    title="Gestione DKP Nodes & Moderazione"
    subtitle="Organizza Nodi principali (n/) e Sub-nodi (n/n/) con gerarchia esplicita, modera i thread paginati ed esamina la coda Sentinel AI Vault."
    badge="DKP NODES & SUBREDDITS v2.6-PURE-SQL"
    seo-title="DKP Nodes & Forum Control Center v2.6 — DKP Admin"
    seo-description="Gestione Nodi, Subreddits, moderazione discussioni e verifica audit Sentinel AI Vault."
  >
    <template #actions>
      <button
        type="button"
        @click="openNodeModal(null, null)"
        class="px-4 py-2.5 rounded-xl font-extrabold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-none transition-all shadow-[0_0_15px_rgba(0,220,130,0.3)] cursor-pointer"
      >
        + Nuovo Nodo Principale (Root)
      </button>
    </template>

    <!-- FLOATING TOAST -->
    <div
      v-if="showToast"
      :class="[
        'fixed top-6 right-6 z-50 p-4 rounded-xl backdrop-blur-md border shadow-2xl max-w-md flex items-center gap-3 font-mono text-xs font-semibold',
        toastType === 'success' ? 'bg-[#041a13]/95 border-emerald-500/50 text-emerald-300' :
        toastType === 'error' ? 'bg-[#1e070a]/95 border-rose-500/50 text-rose-300' :
        'bg-[#1a1403]/95 border-amber-500/50 text-amber-300'
      ]"
    >
      <span>{{ toastType === 'success' ? '⚡' : toastType === 'error' ? '🚫' : '⚠️' }}</span>
      <span>{{ toastMessage }}</span>
    </div>

    <!-- MAIN HYBRID GRID -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- COLONNA SINISTRA: CRUD GERARCHICO A DROPDOWN -->
      <aside class="lg:col-span-5 xl:col-span-4 bg-dkp-card/95 border border-dkp-border rounded-2xl p-5 card-glow flex flex-col gap-4">
        <div class="flex justify-between items-center pb-3 border-b border-dkp-border">
          <h3 class="text-white font-bold text-base m-0">
            Gerarchia Nodi ({{ nodes.length }})
          </h3>
          <div class="flex items-center gap-1.5 font-mono text-[10px]">
            <button
              type="button"
              @click="expandAllNodes(true)"
              class="px-2 py-1 rounded bg-dkp-bg border border-dkp-border text-slate-400 hover:text-sky-400 cursor-pointer"
            >
               Apri
            </button>
            <button
              type="button"
              @click="expandAllNodes(false)"
              class="px-2 py-1 rounded bg-dkp-bg border border-dkp-border text-slate-400 hover:text-sky-400 cursor-pointer"
            >
               Chiudi
            </button>
          </div>
        </div>

        <!-- QUICK-CREATE DROPDOWN BOX -->
        <form @submit.prevent="createQuickNode" class="bg-dkp-bg border border-dkp-border rounded-xl p-3 flex flex-col gap-2.5 font-mono text-xs">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-black uppercase text-sky-400 tracking-wider">Inserimento Rapido Gerarchico</span>
            <button
              type="button"
              @click="openNodeModal(null, quickParentId)"
              class="text-[10px] text-emerald-400 hover:underline cursor-pointer bg-transparent border-0 p-0"
            >
              Icona &amp; Colori &nearr;
            </button>
          </div>

          <select
            v-model="quickParentId"
            aria-label="Seleziona nodo padre o principale"
            class="w-full bg-dkp-card border border-dkp-border text-slate-200 px-3 py-2 rounded-lg font-bold outline-none focus:border-sky-500 text-xs cursor-pointer"
          >
            <option :value="null">Livello Root: Nodo Principale (n/)</option>
            <option v-for="parent in mainNodes" :key="parent.id" :value="parent.id">
              Sub-nodo sotto: {{ parent.icon }} n/{{ parent.name }}
            </option>
          </select>

          <div class="flex gap-2">
            <input
              v-model="quickName"
              type="text"
              :placeholder="quickParentId ? 'Nome sub-nodo (es. kubernetes)...' : 'Nome nodo root (es. vault)...'"
              class="flex-1 min-w-0 bg-dkp-card border border-dkp-border text-white px-3 py-2 rounded-lg outline-none focus:border-emerald-500 text-xs box-border"
            />
            <button
              type="submit"
              :disabled="isSavingNode || !quickName.trim()"
              class="px-3 py-2 rounded-lg font-black text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-none cursor-pointer disabled:opacity-40 whitespace-nowrap"
            >
              + Crea
            </button>
          </div>
        </form>

        <!-- DROPDOWN NAVIGAZIONE RAPIDA -->
        <div class="flex flex-col gap-1.5 font-mono">
          <label class="text-[10px] text-slate-400 font-bold uppercase">Filtra Thread per Nodo (Dropdown)</label>
          <select
            v-model="selectedNodeFilter"
            class="w-full bg-dkp-bg border border-dkp-border text-slate-200 px-3 py-2 rounded-xl font-bold outline-none focus:border-sky-500 text-xs cursor-pointer"
          >
            <option value="">Tutti i Nodi &amp; Sub-nodi ({{ nodes.length }})</option>
            <optgroup v-for="group in nodeTree.groups" :key="group.parent.id" :label="`${group.parent.icon || '💬'} n/${group.parent.name}`">
              <option :value="group.parent.slug">
                n/{{ group.parent.name }} (Principale)
              </option>
              <option v-for="sub in group.children" :key="sub.id" :value="sub.slug">
                n/n/{{ sub.name }}
              </option>
            </optgroup>
            <optgroup v-if="nodeTree.orphans.length > 0" label="Sub-nodi senza padre">
              <option v-for="orphan in nodeTree.orphans" :key="orphan.id" :value="orphan.slug">
                n/n/{{ orphan.name }}
              </option>
            </optgroup>
          </select>

          <input
            v-model="sidebarNodeSearch"
            type="text"
            placeholder="Cerca nell'albero nodi..."
            class="w-full bg-dkp-bg border border-dkp-border text-slate-200 px-3 py-1.5 rounded-lg outline-none focus:border-sky-500 text-xs mt-1 box-border"
          />
        </div>

        <div v-if="!nodes.length" class="p-8 text-center text-slate-500 font-mono text-xs">
          Nessun nodo registrato. Creane uno dal box qui sopra!
        </div>

        <!-- ALBERO COLLASSABILE NODI & SUBNODI -->
        <div v-else class="flex flex-col gap-2.5 max-h-[58vh] overflow-y-auto pr-1">
          <div
            v-for="group in nodeTree.groups"
            :key="group.parent.id"
            class="shrink-0 bg-dkp-bg border border-dkp-border rounded-xl transition-all hover:border-slate-700"
          >
            <div class="p-3.5">
              <div class="flex justify-between items-start gap-2">
                <button
                  type="button"
                  @click="toggleParentDropdown(group.parent.id)"
                  class="flex items-center gap-2.5 text-left bg-transparent border-0 p-0 cursor-pointer flex-1 min-w-0"
                >
                  <div
                    class="w-8 h-8 rounded-lg flex items-center justify-center border text-base shrink-0"
                    :style="{ backgroundColor: `${group.parent.color || '#38bdf8'}20`, color: group.parent.color || '#38bdf8', borderColor: `${group.parent.color || '#38bdf8'}40` }"
                  >
                    <span>{{ group.parent.icon || '💬' }}</span>
                  </div>
                  <div class="flex flex-col min-w-0">
                    <h4 class="text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 m-0">
                      <span class="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold shrink-0">n/</span>
                      <span class="truncate">{{ group.parent.name }}</span>
                      <span
                        v-if="group.children.length > 0"
                        class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-500/15 text-sky-400 border border-sky-500/30 shrink-0"
                      >
                        {{ expandedParents[String(group.parent.id)] ? '▾' : '▸' }} {{ group.children.length }}
                      </span>
                    </h4>
                    <span class="text-[10px] text-slate-500 font-mono truncate">/nodes/n/{{ group.parent.slug }}</span>
                  </div>
                </button>

                <div class="flex items-center gap-1 font-mono shrink-0">
                  <button
                    type="button"
                    @click="openNodeModal(null, group.parent.id)"
                    class="px-2 py-1 bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 rounded-lg text-[10px] font-black cursor-pointer"
                    title="Aggiungi Sub-nodo"
                  >
                    +Sub
                  </button>
                  <button
                    type="button"
                    @click="openNodeModal(group.parent)"
                    class="px-2 py-1 bg-slate-800 hover:bg-sky-500 hover:text-slate-950 text-sky-400 border-none rounded-lg text-[10px] font-bold cursor-pointer"
                    title="Modifica Nodo"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    @click="deleteNode(group.parent.id)"
                    class="px-2 py-1 bg-rose-500/15 border border-rose-500/30 hover:bg-rose-500 hover:text-white text-rose-400 rounded-lg text-[10px] font-bold cursor-pointer"
                    title="Elimina Nodo"
                  >
                    Del
                  </button>
                </div>
              </div>

              <p class="text-[11px] text-slate-400 my-2 line-clamp-1 leading-relaxed">{{ group.parent.description }}</p>

              <div class="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-dkp-border/60">
                <span>{{ group.parent.subscribersCount }} Iscritti</span>
                <span>{{ group.parent.postsCount || 0 }} Thread</span>
                <span v-if="group.parent.isPrivate" class="text-amber-400 font-bold">Privato</span>
              </div>
            </div>

            <!-- SUB-NODI DROPDOWN EXPANDED -->
            <div
              v-if="group.children.length > 0 && expandedParents[String(group.parent.id)]"
              class="bg-[#060b1d] border-t border-dkp-border/80 px-3 py-2.5 flex flex-col gap-2"
            >
              <div
                v-for="sub in group.children"
                :key="sub.id"
                class="shrink-0 bg-dkp-bg border border-dkp-border border-l-2 border-l-sky-400 rounded-lg p-2.5 flex items-center justify-between gap-2"
              >
                <div class="flex items-center gap-2 min-w-0">
                  <span class="text-sm shrink-0">{{ sub.icon || '💬' }}</span>
                  <div class="min-w-0">
                    <div class="text-xs font-bold text-slate-200 flex items-center gap-1">
                      <span class="text-[9px] bg-sky-500/20 text-sky-400 px-1 rounded font-mono shrink-0">n/n/</span>
                      <span class="truncate">{{ sub.name }}</span>
                    </div>
                    <span class="text-[10px] text-slate-500 font-mono block truncate">
                      /nodes/n/{{ sub.slug }} &bull; {{ sub.postsCount || 0 }} thread
                    </span>
                  </div>
                </div>

                <div class="flex items-center gap-1 font-mono shrink-0">
                  <button
                    type="button"
                    @click="openNodeModal(sub)"
                    class="px-1.5 py-1 bg-slate-800 hover:bg-sky-500 hover:text-slate-950 text-sky-400 border-none rounded text-[10px] cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    @click="deleteNode(sub.id)"
                    class="px-1.5 py-1 bg-rose-500/15 hover:bg-rose-500 text-rose-400 hover:text-white border-none rounded text-[10px] cursor-pointer"
                  >
                    Del
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div
            v-for="orphan in nodeTree.orphans"
            :key="orphan.id"
            class="shrink-0 bg-[#060b1d] border border-dkp-border border-l-2 border-l-amber-400 rounded-xl p-3 flex items-center justify-between gap-2"
          >
            <div class="min-w-0">
              <span class="text-xs font-bold text-white block truncate">{{ orphan.icon }} n/n/{{ orphan.name }}</span>
              <span class="text-[10px] text-amber-400 font-mono">Nodo padre non trovato</span>
            </div>
            <div class="flex items-center gap-1 font-mono shrink-0">
              <button type="button" @click="openNodeModal(orphan)" class="px-2 py-1 bg-slate-800 text-sky-400 border-none rounded-lg text-xs cursor-pointer">Edit</button>
              <button type="button" @click="deleteNode(orphan.id)" class="px-2 py-1 bg-rose-500/15 text-rose-400 border-none rounded-lg text-xs cursor-pointer">Del</button>
            </div>
          </div>
        </div>
      </aside>

      <!-- COLONNA DESTRA: THREADS PAGINATI & MODERAZIONE -->
      <main class="lg:col-span-7 xl:col-span-8 bg-dkp-card/95 border border-dkp-border rounded-2xl p-5 card-glow flex flex-col gap-4 min-w-0">
        <div class="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3 pb-4 border-b border-dkp-border font-mono text-xs">
          <div class="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              @click="activeTab = 'all'"
              :class="[
                'px-3 py-2 rounded-xl font-bold transition-all cursor-pointer border',
                activeTab === 'all' ? 'bg-sky-500/15 text-sky-400 border-sky-500/40' : 'bg-dkp-bg text-slate-400 border-dkp-border hover:text-white'
              ]"
            >
              Tutti i Thread ({{ totalThreadsCount }})
            </button>
            <button
              type="button"
              @click="activeTab = 'flagged'"
              :class="[
                'px-3 py-2 rounded-xl font-bold transition-all cursor-pointer border flex items-center gap-1.5',
                activeTab === 'flagged' ? 'bg-amber-500/15 text-amber-400 border-amber-500/40' : 'bg-dkp-bg text-slate-400 border-dkp-border hover:text-white'
              ]"
            >
              <span>Coda Sentinel AI</span>
              <span v-if="flaggedCount > 0" class="bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded-full text-[10px] font-black">
                {{ flaggedCount }}
              </span>
            </button>
          </div>

          <div class="flex items-center gap-2 w-full xl:w-auto flex-wrap">
            <select
              v-model="selectedNodeFilter"
              aria-label="Filtra per nodo"
              class="bg-dkp-bg border border-dkp-border text-slate-200 px-3 py-2 rounded-xl font-bold outline-none focus:border-sky-500 text-xs cursor-pointer max-w-[175px]"
            >
              <option value="">Tutti i Nodi</option>
              <optgroup v-for="group in nodeTree.groups" :key="group.parent.id" :label="`${group.parent.icon || '💬'} n/${group.parent.name}`">
                <option :value="group.parent.slug">n/{{ group.parent.name }}</option>
                <option v-for="sub in group.children" :key="sub.id" :value="sub.slug">
                  n/n/{{ sub.name }}
                </option>
              </optgroup>
            </select>

            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cerca thread..."
              class="bg-dkp-bg border border-dkp-border text-slate-200 px-3 py-2 rounded-xl outline-none focus:border-sky-500 text-xs flex-1 sm:w-36 box-border"
            />

            <select
              v-model.number="pageSize"
              aria-label="Thread per pagina"
              class="bg-dkp-bg border border-dkp-border text-slate-300 px-2.5 py-2 rounded-xl font-bold outline-none focus:border-sky-500 text-xs cursor-pointer"
            >
              <option :value="10">10 / pag</option>
              <option :value="15">15 / pag</option>
              <option :value="25">25 / pag</option>
              <option :value="50">50 / pag</option>
            </select>
          </div>
        </div>

        <div v-if="isLoading" class="text-center py-12 text-sky-400 font-mono text-xs">
          Sincronizzazione discussioni paginazione Pure SQL...
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-dkp-bg text-slate-400 font-extrabold text-[10px] uppercase border-b border-dkp-border font-mono">
                <th class="p-2.5">TITOLO DISCUSSIONE</th>
                <th class="p-2.5">NODO</th>
                <th class="p-2.5">AUTORE</th>
                <th class="p-2.5">KARMA</th>
                <th class="p-2.5">STATO</th>
                <th class="p-2.5 text-right">AZIONI</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="post in paginatedThreads"
                :key="post.id"
                :class="[
                  'border-b border-dkp-border/60 hover:bg-slate-900/40 transition-colors',
                  post.isLocked ? 'bg-amber-500/5' : ''
                ]"
              >
                <td class="p-2.5 max-w-[230px]">
                  <div class="flex flex-col">
                    <NuxtLink :to="`/nodes/thread/${post.id}`" target="_blank" class="font-bold text-white hover:text-sky-400 transition-colors line-clamp-2 no-underline">
                      {{ post.title }}
                    </NuxtLink>
                    <span v-if="post.vaultHash" class="text-[10px] text-emerald-400 font-mono mt-0.5">
                      Proof-of-Code
                    </span>
                  </div>
                </td>
                <td class="p-2.5 font-mono">
                  <span
                    class="px-2 py-0.5 rounded text-[10px] font-bold border inline-block max-w-[145px] truncate"
                    :style="{ backgroundColor: `${post.nodeColor || '#38bdf8'}15`, color: post.nodeColor || '#38bdf8', borderColor: `${post.nodeColor || '#38bdf8'}30` }"
                    :title="`n/${post.nodeSlug}`"
                  >
                    {{ post.nodeIcon }} n/{{ post.nodeSlug }}
                  </span>
                </td>
                <td class="p-2.5 font-mono text-slate-400 whitespace-nowrap">@{{ post.authorName }}</td>
                <td class="p-2.5 font-mono font-bold whitespace-nowrap" :class="post.karmaScore > 0 ? 'text-emerald-400' : 'text-slate-400'">
                   {{ post.karmaScore }}
                </td>
                <td class="p-2.5 font-mono whitespace-nowrap">
                  <span v-if="post.isPinned" class="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 mr-1">
                    Pinned
                  </span>
                  <span v-if="post.isLocked" class="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    Locked
                  </span>
                  <span v-if="!post.isPinned && !post.isLocked" class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">
                    Attivo
                  </span>
                </td>
                <td class="p-2.5 text-right font-mono whitespace-nowrap">
                  <div class="flex justify-end items-center gap-1">
                    <button
                      type="button"
                      @click="inspectVault(post)"
                      class="px-2 py-1 bg-purple-500/15 border border-purple-500/30 hover:bg-purple-500 hover:text-white text-purple-300 rounded-lg text-[10px] font-bold cursor-pointer"
                      title="Verifica On-Chain / Notarizza Vault"
                    >
                      Vault
                    </button>
                    <button
                      type="button"
                      @click="togglePinThread(post)"
                      class="px-2 py-1 bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 border-none rounded-lg text-[10px] font-bold cursor-pointer"
                    >
                      Pin
                    </button>
                    <button
                      type="button"
                      @click="toggleLockThread(post)"
                      class="px-2 py-1 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-amber-400 border-none rounded-lg text-[10px] font-bold cursor-pointer"
                    >
                      Lock
                    </button>
                    <button
                      type="button"
                      @click="deleteThread(post.id)"
                      class="px-2 py-1 bg-rose-500/15 border border-rose-500/30 hover:bg-rose-500 hover:text-white text-rose-400 rounded-lg text-[10px] font-bold cursor-pointer"
                    >
                      Del
                    </button>
                  </div>
                </td>
              </tr>

              <tr v-if="paginatedThreads.length === 0">
                <td colspan="6" class="p-12 text-center text-slate-500 font-mono text-xs">
                  Nessun thread trovato per i filtri selezionati.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- PAGINAZIONE -->
        <div
          v-if="totalThreadsCount > 0"
          class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-dkp-border/80 font-mono text-xs"
        >
          <div class="text-slate-400">
            Pagina <strong class="text-white">{{ currentPage }}</strong> di <strong class="text-white">{{ totalPages }}</strong>
            &bull; Totale: <strong class="text-sky-400">{{ totalThreadsCount }}</strong> thread
          </div>

          <div class="flex items-center gap-1.5 flex-wrap">
            <button type="button" :disabled="currentPage <= 1" @click="goToPage(1)" class="px-2.5 py-1.5 rounded-lg bg-dkp-bg border border-dkp-border text-slate-300 hover:border-sky-500 disabled:opacity-40 cursor-pointer">&laquo;</button>
            <button type="button" :disabled="currentPage <= 1" @click="goToPage(currentPage - 1)" class="px-3 py-1.5 rounded-lg bg-dkp-bg border border-dkp-border text-slate-300 hover:border-sky-500 disabled:opacity-40 cursor-pointer">&larr; Prec</button>

            <button
              v-for="p in visiblePageNumbers"
              :key="p"
              type="button"
              @click="goToPage(p)"
              :class="[
                'px-3 py-1.5 rounded-lg border font-bold cursor-pointer',
                p === currentPage
                  ? 'bg-sky-500 text-slate-950 border-sky-400'
                  : 'bg-dkp-bg border-dkp-border text-slate-300 hover:border-sky-500'
              ]"
            >
              {{ p }}
            </button>

            <button type="button" :disabled="currentPage >= totalPages" @click="goToPage(currentPage + 1)" class="px-3 py-1.5 rounded-lg bg-dkp-bg border border-dkp-border text-slate-300 hover:border-sky-500 disabled:opacity-40 cursor-pointer">Succ &rarr;</button>
            <button type="button" :disabled="currentPage >= totalPages" @click="goToPage(totalPages)" class="px-2.5 py-1.5 rounded-lg bg-dkp-bg border border-dkp-border text-slate-300 hover:border-sky-500 disabled:opacity-40 cursor-pointer">&raquo;</button>
          </div>
        </div>
      </main>
    </div>

    <!-- MODALE CREAZIONE / MODIFICA NODO -->
    <Teleport to="body">
      <div
        v-if="isNodeModalOpen"
        class="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
        @click.self="isNodeModalOpen = false"
      >
        <div class="bg-dkp-card border border-dkp-border rounded-2xl w-full max-w-lg p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-hidden">
          <div class="flex justify-between items-center border-b border-dkp-border pb-3">
            <h3 class="text-cyan-400 font-bold text-base m-0">
              {{ nodeForm.id ? 'Modifica Nodo DKP' : 'Nuovo Nodo / Sub-nodo DKP' }}
            </h3>
            <button type="button" @click="isNodeModalOpen = false" class="text-slate-500 hover:text-white font-bold text-lg cursor-pointer bg-transparent border-0"></button>
          </div>

          <div class="flex flex-col gap-4 overflow-y-auto pr-1 font-mono text-xs">
            <div class="flex flex-col gap-1.5">
              <label class="text-slate-400 font-bold uppercase">TIPO NODO &amp; GERARCHIA *</label>
              <select
                v-model="nodeForm.parentId"
                class="bg-dkp-bg border border-dkp-border text-white px-3.5 py-2.5 rounded-xl font-bold outline-none focus:border-sky-500 cursor-pointer"
              >
                <option :value="null">Nodo Principale (n/ root &mdash; Nessun Padre)</option>
                <option v-for="parent in availableParentTargets" :key="parent.id" :value="parent.id">
                  Sub-Nodo di: {{ parent.icon }} n/{{ parent.name }} (n/n/)
                </option>
              </select>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-slate-400 font-bold uppercase">CATEGORIA ECOSISTEMA</label>
              <select
                v-model="nodeForm.category"
                class="bg-dkp-bg border border-dkp-border text-slate-200 px-3.5 py-2.5 rounded-xl font-bold outline-none focus:border-sky-500 cursor-pointer"
              >
                <option v-for="cat in defaultCategories" :key="cat" :value="cat">
                  {{ cat }}
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
                  placeholder="Es. vault, rust"
                  class="bg-dkp-bg border border-dkp-border text-white px-3.5 py-2.5 rounded-xl font-bold outline-none focus:border-sky-500 box-border"
                  required
                />
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-slate-400 font-bold uppercase">URL SLUG *</label>
                <input
                  v-model="nodeForm.slug"
                  type="text"
                  placeholder="vault"
                  class="bg-dkp-bg border border-dkp-border text-white px-3.5 py-2.5 rounded-xl font-bold outline-none focus:border-sky-500 box-border"
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
                class="bg-dkp-bg border border-dkp-border text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-sky-500 box-border"
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
                    class="w-10 text-center py-1 bg-dkp-bg border border-dkp-border rounded-lg text-sm text-white"
                    maxlength="4"
                  />
                </div>
              </div>

              <select
                v-model="selectedEmojiCategory"
                class="bg-dkp-bg border border-dkp-border text-slate-300 px-3 py-2 rounded-xl outline-none focus:border-sky-500 cursor-pointer text-xs"
              >
                <option v-for="cat in emojiCategories" :key="cat.id" :value="cat.id">
                  {{ cat.label }}
                </option>
              </select>

              <div class="grid grid-cols-7 gap-1.5 max-h-28 overflow-y-auto p-2 bg-dkp-bg border border-dkp-border rounded-xl">
                <button
                  v-for="emoji in filteredEmojis"
                  :key="emoji"
                  type="button"
                  @click="nodeForm.icon = emoji"
                  :class="[
                    'p-2 rounded-lg text-base flex items-center justify-center border cursor-pointer',
                    nodeForm.icon === emoji ? 'bg-emerald-500/20 border-emerald-500 text-white' : 'bg-dkp-card border-dkp-border'
                  ]"
                >
                  {{ emoji }}
                </button>
              </div>
            </div>

            <!-- PALETTE COLORI -->
            <div class="flex flex-col gap-1.5">
              <label class="text-slate-400 font-bold uppercase">COLORE ACCENT NODO</label>
              <div class="flex items-center gap-2 flex-wrap">
                <span
                  v-for="color in presetColors"
                  :key="color"
                  @click="nodeForm.color = color"
                  :style="{ backgroundColor: color }"
                  :class="[
                    'w-6 h-6 rounded-full cursor-pointer border-2',
                    nodeForm.color === color ? 'border-white scale-110' : 'border-transparent'
                  ]"
                ></span>
                <input v-model="nodeForm.color" type="color" class="w-8 h-8 rounded bg-transparent border-0 cursor-pointer" />
              </div>
            </div>

            <div class="flex items-center gap-3 bg-dkp-bg p-3 rounded-xl border border-dkp-border">
              <span class="text-slate-500 font-bold text-[11px]">Anteprima Live:</span>
              <span
                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border"
                :style="{ backgroundColor: `${nodeForm.color}20`, color: nodeForm.color, borderColor: `${nodeForm.color}40` }"
              >
                <span>{{ nodeForm.icon }}</span>
                <span class="font-mono">{{ nodeForm.parentId ? 'n/n/' : 'n/' }}</span>{{ nodeForm.name || 'nome-nodo' }}
              </span>
            </div>

            <div class="flex items-center gap-2 pt-1">
              <input type="checkbox" id="isPrivateNode" v-model="nodeForm.isPrivate" class="w-4 h-4 accent-emerald-500 rounded cursor-pointer" />
              <label for="isPrivateNode" class="text-slate-300 font-bold cursor-pointer">
                Nodo Privato (Visibile solo agli utenti registrati)
              </label>
            </div>
          </div>

          <div class="border-t border-dkp-border pt-4 flex justify-end gap-3 font-mono">
            <button @click="isNodeModalOpen = false" type="button" class="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border-none rounded-xl text-xs font-bold cursor-pointer">
              Annulla
            </button>
            <button @click="saveNode" type="button" :disabled="isSavingNode" class="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-none font-extrabold rounded-xl text-xs cursor-pointer disabled:opacity-50">
              {{ isSavingNode ? 'Salvataggio...' : 'Salva Nodo' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- MODALE VAULT PROOF OF CODE LIVE -->
    <Teleport to="body">
      <div
        v-if="isVaultModalOpen && selectedPostForVault"
        class="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
        @click.self="isVaultModalOpen = false"
      >
        <div class="bg-dkp-card border border-emerald-500/40 rounded-2xl w-full max-w-lg p-6 shadow-2xl flex flex-col gap-4 font-mono">
          <div class="flex justify-between items-center border-b border-dkp-border pb-3">
            <h3 class="text-emerald-400 font-black text-base m-0">
              DKP Vault Proof-of-Code Live Audit
            </h3>
            <span class="text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-bold">
              {{ liveVaultProof?.status || 'CHECKING...' }}
            </span>
          </div>

          <div class="flex flex-col gap-2.5 my-1 text-xs">
            <h4 class="text-white font-bold text-sm m-0 font-sans">{{ selectedPostForVault.title }}</h4>
            <p class="text-slate-400 m-0">
              Autore: <strong class="text-white">@{{ selectedPostForVault.authorName }}</strong> &bull; Data: {{ new Date(selectedPostForVault.createdAt).toLocaleDateString('it-IT') }}
            </p>

            <div v-if="isVerifyingVault" class="py-4 text-center text-emerald-400">
              Verifica crittografica SHA-256 on-chain in corso...
            </div>

            <template v-else>
              <div class="bg-dkp-bg border border-dkp-border rounded-xl p-3 flex flex-col gap-1">
                <span class="text-[10px] text-slate-500 font-bold uppercase">SHA-256 PROOF-OF-CODE CHECKSUM:</span>
                <code class="text-emerald-400 text-[11px] break-all font-mono font-bold">
                  {{ liveVaultProof?.vaultHash || selectedPostForVault.vaultHash || 'Non ancora notarizzato' }}
                </code>
              </div>

              <div v-if="liveVaultProof" class="grid grid-cols-2 gap-2 text-[11px]">
                <div class="bg-dkp-bg border border-dkp-border rounded-lg p-2.5">
                  <span class="text-slate-500 block text-[10px]">BLOCK NUMBER</span>
                  <span class="text-sky-400 font-bold">#{{ liveVaultProof.blockNumber }}</span>
                </div>
                <div class="bg-dkp-bg border border-dkp-border rounded-lg p-2.5 truncate">
                  <span class="text-slate-500 block text-[10px]">MERKLE ROOT</span>
                  <span class="text-purple-400">{{ liveVaultProof.merkleRoot?.slice(0, 16) }}&hellip;</span>
                </div>
              </div>
            </template>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="forceNotarizeThread(selectedPostForVault)"
              :disabled="isVerifyingVault"
              class="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-none font-extrabold rounded-xl text-xs cursor-pointer disabled:opacity-50"
            >
              Ri-Notarizza On-Chain
            </button>
            <button
              type="button"
              @click="isVaultModalOpen = false"
              class="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border-none font-bold rounded-xl text-xs cursor-pointer"
            >
              Chiudi
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </DkpAdminShell>
</template>