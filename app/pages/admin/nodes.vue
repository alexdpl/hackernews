<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import DkpAdminShell from '~/components/admin/DkpAdminShell.vue'
import DKPnodesRichEditor from '~/components/DKPnodesRichEditor.vue'

definePageMeta({
  middleware: 'admin-only'
})

const nodesList = ref<any[]>([])
const threadsList = ref<any[]>([])
const isLoadingNodes = ref(true)
const isLoadingThreads = ref(true)
const isRebuildingTree = ref(false)

const selectedNodeFilter = ref<number | null>(null)
const treeFilter = ref<'ALL' | 'ROOT' | 'SUB'>('ALL')
const searchNodeQuery = ref('')
const expandedRootIds = ref<Record<number, boolean>>({})

const feedbackMsg = ref('')
const feedbackType = ref<'success' | 'error'>('success')

function notify(msg: string, type: 'success' | 'error' = 'success') {
  feedbackMsg.value = msg
  feedbackType.value = type
}

function cleanNodeLabel(raw: any): string {
  return String(raw || '').replace(/^(n\/)+/i, '').trim()
}

function slugifyNode(raw: string): string {
  return cleanNodeLabel(raw)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Form Creazione Nuovo Nodo / Sub-Nodo
const showNodeForm = ref(false)
const isSavingNode = ref(false)
const newNode = ref({
  name: '',
  slug: '',
  description: '',
  category: '1. DKP Ecosystem & Core',
  parentId: null as number | null,
  icon: '#',
  color: '#38bdf8',
  isPrivate: false
})

function openAddSubNodeForm(parentNode: any) {
  newNode.value = {
    name: '',
    slug: '',
    description: '',
    category: String(parentNode.category || '3. Dev, Tech & Architecture'),
    parentId: Number(parentNode.id),
    icon: '#',
    color: String(parentNode.color || '#38bdf8'),
    isPrivate: false
  }
  expandedRootIds.value[Number(parentNode.id)] = true
  showNodeForm.value = true
}

// Modale Modifica Nodo / Sub-Nodo (PUT /api/admin/nodes/[id])
const editingNode = ref<any | null>(null)
const isUpdatingNode = ref(false)

function openEditNodeModal(node: any) {
  editingNode.value = {
    id: Number(node.id),
    name: cleanNodeLabel(node.name),
    slug: String(node.slug || slugifyNode(node.name)),
    description: String(node.description || ''),
    category: String(node.category || '3. Dev, Tech & Architecture'),
    parentId: node.parentId ? Number(node.parentId) : null,
    icon: String(node.icon || '#'),
    color: String(node.color || '#38bdf8'),
    isPrivate: Boolean(node.isPrivate)
  }
}

// Modale Unisci / Sposta Nodo (POST /api/admin/nodes/merge)
const mergeSourceNode = ref<any | null>(null)
const mergeTargetNodeId = ref<number | null>(null)
const isMergingNode = ref(false)

function openMergeNodeModal(node: any) {
  mergeSourceNode.value = node
  const firstOther = nodesList.value.find((n) => Number(n.id) !== Number(node.id))
  mergeTargetNodeId.value = firstOther ? Number(firstOther.id) : null
}

// Editor Rich Text per Threads
const isThreadEditorOpen = ref(false)
const editingThread = ref<any>(null)
const editorInitialCategory = ref('')
const editorInitialNodeId = ref<number | null>(null)

const rootNodesCount = computed(() => nodesList.value.filter((n) => !n.parentId).length)
const subNodesCount = computed(() => nodesList.value.filter((n) => Boolean(n.parentId)).length)

const categoriesList = computed<string[]>(() => {
  const set = new Set<string>()
  for (const n of nodesList.value) {
    const cat = String(n.category || '3. Dev, Tech & Architecture').trim()
    if (cat) set.add(cat)
  }
  return set.size > 0 ? Array.from(set).sort((a, b) => a.localeCompare(b, 'it', { numeric: true })) : ['General']
})

const groupedNodesMap = computed<Record<string, any[]>>(() => {
  const map: Record<string, any[]> = {}
  for (const n of nodesList.value) {
    const cat = String(n.category || '3. Dev, Tech & Architecture').trim() || 'General'
    if (!map[cat]) map[cat] = []
    map[cat].push(n)
  }
  return map
})

// Albero gerarchico Root -> Children per Accordion UI
const hierarchicalTree = computed(() => {
  const q = searchNodeQuery.value.toLowerCase().trim()
  const byId = new Map<number, any>()
  const childrenMap = new Map<number, any[]>()

  for (const raw of nodesList.value) {
    const item = {
      ...raw,
      id: Number(raw.id),
      parentId: raw.parentId ? Number(raw.parentId) : null,
      name: cleanNodeLabel(raw.name)
    }
    byId.set(item.id, item)
  }

  for (const item of byId.values()) {
    if (item.parentId && byId.has(item.parentId) && item.parentId !== item.id) {
      if (!childrenMap.has(item.parentId)) childrenMap.set(item.parentId, [])
      childrenMap.get(item.parentId)!.push(item)
    }
  }

  const collectDescendants = (parentId: number, depth = 1): any[] => {
    const direct = (childrenMap.get(parentId) || []).sort((a, b) => a.name.localeCompare(b.name))
    const out: any[] = []
    for (const child of direct) {
      out.push({ ...child, depth })
      out.push(...collectDescendants(child.id, depth + 1))
    }
    return out
  }

  const roots = Array.from(byId.values())
    .filter((n) => !n.parentId || !byId.has(n.parentId))
    .sort((a, b) => {
      const catCmp = String(a.category || '').localeCompare(String(b.category || ''), 'it', { numeric: true })
      return catCmp !== 0 ? catCmp : a.name.localeCompare(b.name)
    })

  return roots
    .map((root) => {
      const descendants = collectDescendants(root.id, 1)
      const rootMatches =
        !q ||
        root.name.toLowerCase().includes(q) ||
        String(root.slug || '').toLowerCase().includes(q) ||
        String(root.category || '').toLowerCase().includes(q)

      const matchingDescendants = descendants.filter(
        (d) =>
          !q ||
          d.name.toLowerCase().includes(q) ||
          String(d.slug || '').toLowerCase().includes(q) ||
          String(d.category || '').toLowerCase().includes(q)
      )

      if (treeFilter.value === 'SUB' && descendants.length === 0) return null
      if (q && !rootMatches && matchingDescendants.length === 0) return null

      return {
        ...root,
        descendants: treeFilter.value === 'ROOT' ? [] : (q && !rootMatches ? matchingDescendants : descendants),
        totalDescendants: descendants.length
      }
    })
    .filter(Boolean) as any[]
})

function toggleRootAccordion(rootId: number) {
  expandedRootIds.value[rootId] = !isRootExpanded(rootId)
}

function isRootExpanded(rootId: number): boolean {
  if (searchNodeQuery.value.trim().length > 0 || treeFilter.value === 'SUB') return true
  return Boolean(expandedRootIds.value[rootId])
}

function expandAllRoots() {
  for (const r of hierarchicalTree.value) {
    expandedRootIds.value[r.id] = true
  }
}

function collapseAllRoots() {
  expandedRootIds.value = {}
}

const filteredThreads = computed(() => {
  if (!selectedNodeFilter.value) return threadsList.value
  return threadsList.value.filter(
    (t) => Number(t.nodeId ?? t.node_id) === Number(selectedNodeFilter.value)
  )
})

async function fetchNodes() {
  isLoadingNodes.value = true
  try {
    const res: any = await $fetch(`/api/admin/nodes?_t=${Date.now()}`)
    nodesList.value = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.nodes) ? res.nodes : [])
    // Espande automaticamente i primi 3 nodi Root con sottonodi per visibilità immediata
    if (Object.keys(expandedRootIds.value).length === 0) {
      const rootsWithKids = nodesList.value.filter((n) => !n.parentId).slice(0, 4)
      for (const r of rootsWithKids) {
        expandedRootIds.value[Number(r.id)] = true
      }
    }
  } catch (err: any) {
    notify(err?.data?.statusMessage || 'Errore caricamento nodi.', 'error')
  } finally {
    isLoadingNodes.value = false
  }
}

async function rebuildDatabaseTree() {
  isRebuildingTree.value = true
  try {
    const res: any = await $fetch('/api/admin/nodes/rebuild-tree', { method: 'POST' })
    notify(res?.message || 'Albero nodi ricostruito su PostgreSQL!', 'success')
    await fetchNodes()
  } catch (err: any) {
    notify(err?.data?.statusMessage || 'Errore ricostruzione albero nodi.', 'error')
  } finally {
    isRebuildingTree.value = false
  }
}

async function fetchThreads() {
  isLoadingThreads.value = true
  try {
    const res: any = await $fetch(`/api/admin/nodes/posts?_t=${Date.now()}`).catch(() => null)
    if (Array.isArray(res?.data)) {
      threadsList.value = res.data
    } else {
      const pubRes: any = await $fetch(`/api/nodes/posts?limit=100&_t=${Date.now()}`).catch(() => null)
      threadsList.value = Array.isArray(pubRes?.data) ? pubRes.data : (Array.isArray(pubRes?.posts) ? pubRes.posts : [])
    }
  } finally {
    isLoadingThreads.value = false
  }
}

async function createNode() {
  const cleanName = cleanNodeLabel(newNode.value.name)
  if (!cleanName) return
  const computedSlug = slugifyNode(newNode.value.slug || cleanName)
  if (!computedSlug) {
    notify('Inserisci uno slug valido per il nodo.', 'error')
    return
  }

  isSavingNode.value = true
  try {
    const res: any = await $fetch('/api/admin/nodes', {
      method: 'POST',
      body: {
        name: cleanName,
        slug: computedSlug,
        description: newNode.value.description.trim(),
        category: newNode.value.category.trim() || '3. Dev, Tech & Architecture',
        parentId: newNode.value.parentId,
        icon: newNode.value.icon.trim() || '#',
        color: newNode.value.color || '#38bdf8',
        isPrivate: Boolean(newNode.value.isPrivate)
      }
    })
    if (res?.success !== false) {
      notify(`Nodo n/${computedSlug} creato con successo!`, 'success')
      if (newNode.value.parentId) {
        expandedRootIds.value[newNode.value.parentId] = true
      }
      newNode.value = {
        name: '',
        slug: '',
        description: '',
        category: '1. DKP Ecosystem & Core',
        parentId: null,
        icon: '#',
        color: '#38bdf8',
        isPrivate: false
      }
      showNodeForm.value = false
      await fetchNodes()
    }
  } catch (err: any) {
    notify(err?.data?.statusMessage || err?.message || 'Errore creazione nodo.', 'error')
  } finally {
    isSavingNode.value = false
  }
}

async function saveEditedNode() {
  if (!editingNode.value) return
  const id = Number(editingNode.value.id)
  const cleanName = cleanNodeLabel(editingNode.value.name)
  const cleanSlug = slugifyNode(editingNode.value.slug || cleanName)

  if (!cleanName || !cleanSlug) {
    notify('Nome e slug sono obbligatori.', 'error')
    return
  }

  isUpdatingNode.value = true
  try {
    await $fetch(`/api/admin/nodes/${id}`, {
      method: 'PUT',
      body: {
        name: cleanName,
        slug: cleanSlug,
        description: editingNode.value.description,
        category: editingNode.value.category,
        parentId: editingNode.value.parentId,
        icon: editingNode.value.icon,
        color: editingNode.value.color,
        isPrivate: Boolean(editingNode.value.isPrivate)
      }
    })
    notify(`Nodo n/${cleanSlug} aggiornato con successo!`, 'success')
    editingNode.value = null
    await Promise.all([fetchNodes(), fetchThreads()])
  } catch (err: any) {
    notify(err?.data?.statusMessage || err?.message || 'Errore aggiornamento nodo.', 'error')
  } finally {
    isUpdatingNode.value = false
  }
}

async function promoteSubNodeToRoot(node: any) {
  try {
    await $fetch('/api/admin/nodes/merge', {
      method: 'POST',
      body: {
        mode: 'move',
        sourceNodeId: Number(node.id),
        targetParentId: null
      }
    })
    notify(`Sub-nodo n/${cleanNodeLabel(node.name)} promosso a Nodo Root!`, 'success')
    await fetchNodes()
  } catch (err: any) {
    notify(err?.data?.statusMessage || err?.message || 'Errore promozione sub-nodo.', 'error')
  }
}

async function executeMergeNode() {
  if (!mergeSourceNode.value || !mergeTargetNodeId.value) return
  isMergingNode.value = true
  try {
    const res: any = await $fetch('/api/admin/nodes/merge', {
      method: 'POST',
      body: {
        mode: 'merge',
        sourceNodeId: Number(mergeSourceNode.value.id),
        targetNodeId: Number(mergeTargetNodeId.value)
      }
    })
    notify(res?.message || 'Nodi consolidati con successo.', 'success')
    if (selectedNodeFilter.value === Number(mergeSourceNode.value.id)) {
      selectedNodeFilter.value = null
    }
    mergeSourceNode.value = null
    await Promise.all([fetchNodes(), fetchThreads()])
  } catch (err: any) {
    notify(err?.data?.statusMessage || err?.message || 'Errore consolidamento nodi.', 'error')
  } finally {
    isMergingNode.value = false
  }
}

async function deleteNode(node: any) {
  const label = cleanNodeLabel(node.name)
  const kind = node.parentId ? 'il sub-nodo' : 'il nodo Root'
  if (!confirm(`Eliminare definitivamente ${kind} n/${label}? (Eventuali sub-nodi figli verranno riassegnati al livello superiore)`)) return

  try {
    await $fetch(`/api/admin/nodes/${Number(node.id)}`, {
      method: 'DELETE'
    })
    if (selectedNodeFilter.value === Number(node.id)) {
      selectedNodeFilter.value = null
    }
    notify(`Eliminato n/${label} dal database.`, 'success')
    await Promise.all([fetchNodes(), fetchThreads()])
  } catch (err: any) {
    notify(err?.data?.statusMessage || err?.message || 'Errore eliminazione nodo.', 'error')
  }
}

function openNewThreadEditor(node?: any) {
  editingThread.value = null
  if (node) {
    editorInitialCategory.value = String(node.category || categoriesList.value[0] || 'General')
    editorInitialNodeId.value = Number(node.id)
  } else {
    editorInitialCategory.value = categoriesList.value[0] || 'General'
    editorInitialNodeId.value = selectedNodeFilter.value || (nodesList.value[0]?.id ? Number(nodesList.value[0].id) : null)
  }
  isThreadEditorOpen.value = true
}

function openEditThreadEditor(thread: any) {
  editingThread.value = {
    id: Number(thread.id),
    title: String(thread.title || ''),
    content: String(thread.content || ''),
    nodeId: Number(thread.nodeId ?? thread.node_id ?? 0),
    nodeSlug: String(thread.nodeSlug ?? thread.node_slug ?? ''),
    vaultHash: thread.vaultHash ?? thread.vault_hash ?? null,
    isPinned: Boolean(thread.isPinned ?? thread.is_pinned ?? false)
  }
  isThreadEditorOpen.value = true
}

async function togglePinThread(thread: any) {
  try {
    await $fetch(`/api/admin/nodes/posts/${thread.id}`, {
      method: 'PATCH',
      body: { action: 'toggle_pin' }
    })
    notify('Stato Pin del thread aggiornato.', 'success')
    await fetchThreads()
  } catch (err: any) {
    notify(err?.data?.statusMessage || 'Errore aggiornamento Pin.', 'error')
  }
}

async function notarizeThread(thread: any) {
  try {
    const res: any = await $fetch(`/api/admin/nodes/posts/${thread.id}`, {
      method: 'PATCH',
      body: { action: 'notarize' }
    })
    notify(res?.message || 'Thread notarizzato SHA-256 nel Vault!', 'success')
    await fetchThreads()
  } catch (err: any) {
    notify(err?.data?.statusMessage || 'Errore notarizzazione thread.', 'error')
  }
}

async function deleteThread(thread: any) {
  if (!confirm(`Eliminare definitivamente il thread "${thread.title}"?`)) return
  try {
    await $fetch(`/api/admin/nodes/posts/${thread.id}`, { method: 'DELETE' })
    notify('Thread eliminato.', 'success')
    await fetchThreads()
  } catch (err: any) {
    notify(err?.data?.statusMessage || 'Errore eliminazione thread.', 'error')
  }
}

async function onThreadSaved() {
  notify('Thread salvato e sincronizzato con Proof-of-Code Vault!', 'success')
  await Promise.all([fetchNodes(), fetchThreads()])
}

onMounted(async () => {
  await Promise.all([fetchNodes(), fetchThreads()])
})
</script>

<template>
  <DkpAdminShell
    title="Gestione Gerarchica Nodi, Sub-Nodi & DKP Talks"
    subtitle="Albero Padre-Figlio sincronizzato con /nodes: crea, modifica, aggiungi sub-nodi, consolida o riallinea l'intero DB Pure SQL."
    badge="NODES TREE v2.6 • PURE SQL"
    seo-title="Gestione Gerarchica Nodi & Sub-Nodi - DKP Admin v2.6"
  >
    <template #actions>
      <button
        type="button"
        :disabled="isRebuildingTree"
        @click="rebuildDatabaseTree"
        class="px-3.5 py-2.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/40 font-bold cursor-pointer disabled:opacity-50"
        title="Riallinea parent_id e categorie di tutti i nodi nel database"
      >
        {{ isRebuildingTree ? 'Riallineamento...' : 'Riallinea Albero DB' }}
      </button>
      <button
        type="button"
        @click="fetchNodes(); fetchThreads()"
        class="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold cursor-pointer"
      >
        Aggiorna
      </button>
      <button
        type="button"
        @click="newNode.parentId = null; showNodeForm = !showNodeForm"
        class="px-3.5 py-2.5 rounded-xl bg-[#030712] border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 font-bold cursor-pointer"
      >
        + Nuovo Nodo Root
      </button>
      <button
        type="button"
        @click="openNewThreadEditor()"
        class="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold border-none cursor-pointer shadow-[0_0_16px_rgba(16,185,129,0.25)]"
      >
        + Nuovo Thread (Rich Editor)
      </button>
    </template>

    <div
      v-if="feedbackMsg"
      :class="[
        'font-mono text-xs font-bold px-4 py-3 rounded-xl flex items-center justify-between border',
        feedbackType === 'error'
          ? 'bg-rose-500/15 border-rose-500/50 text-rose-300'
          : 'bg-emerald-500/15 border-emerald-400 text-emerald-300'
      ]"
    >
      <span>{{ feedbackMsg }}</span>
      <button type="button" @click="feedbackMsg = ''" class="bg-transparent border-none text-current cursor-pointer font-bold">X</button>
    </div>

    <!-- FORM CREAZIONE NUOVO NODO / SUB-NODO -->
    <form v-if="showNodeForm" @submit.prevent="createNode" class="bg-dkp-card/95 border border-cyan-500/40 rounded-2xl p-5 card-glow font-mono text-xs space-y-3">
      <div class="flex items-center justify-between">
        <span class="font-bold text-cyan-300 text-sm">
          {{ newNode.parentId ? `Crea Nuovo Sub-Nodo dentro Nodo #${newNode.parentId}` : 'Crea Nuovo Nodo Root (n/)' }}
        </span>
        <button type="button" @click="showNodeForm = false" class="text-slate-400 hover:text-white bg-transparent border-none cursor-pointer">Chiudi</button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <input
          v-model="newNode.name"
          @input="newNode.slug = slugifyNode(newNode.name)"
          type="text"
          required
          placeholder="Nome (es. Rust Async) *"
          class="bg-[#030712] border border-slate-700 text-white px-3.5 py-2.5 rounded-xl outline-none box-border"
        />
        <input
          v-model="newNode.slug"
          type="text"
          required
          placeholder="Slug (es. rust-async) *"
          class="bg-[#030712] border border-slate-700 text-emerald-300 px-3.5 py-2.5 rounded-xl outline-none box-border"
        />
        <input
          v-model="newNode.category"
          type="text"
          placeholder="Categoria (es. 10. Programming Languages & Systems)"
          class="bg-[#030712] border border-slate-700 text-white px-3.5 py-2.5 rounded-xl outline-none box-border"
        />
        <select v-model="newNode.parentId" class="bg-[#030712] border border-slate-700 text-cyan-300 px-3.5 py-2.5 rounded-xl cursor-pointer">
          <option :value="null">Livello: Nodo Root (n/)</option>
          <option v-for="n in nodesList" :key="n.id" :value="Number(n.id)">
            Sub-Nodo di n/{{ cleanNodeLabel(n.name) }}
          </option>
        </select>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <input
          v-model="newNode.description"
          type="text"
          placeholder="Descrizione breve del nodo o sub-nodo..."
          class="sm:col-span-8 bg-[#030712] border border-slate-700 text-white px-3.5 py-2.5 rounded-xl outline-none box-border"
        />
        <input
          v-model="newNode.icon"
          type="text"
          placeholder="Icona"
          class="sm:col-span-1 text-center bg-[#030712] border border-slate-700 text-white px-2 py-2.5 rounded-xl outline-none"
        />
        <button
          type="submit"
          :disabled="isSavingNode"
          class="sm:col-span-3 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl border-none cursor-pointer disabled:opacity-50"
        >
          {{ isSavingNode ? 'Creazione...' : 'Salva Nuovo Nodo' }}
        </button>
      </div>
    </form>

    <!-- LAYOUT A 2 COLONNE: ALBERO GERARCHICO ACCORDION (SX) + THREADS (DX) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 font-mono text-xs">
      <!-- COLONNA SINISTRA: ALBERO GERARCHICO ACCORDION -->
      <section class="lg:col-span-7 bg-dkp-card/95 border border-dkp-border rounded-2xl overflow-hidden card-glow flex flex-col">
        <div class="p-4 border-b border-dkp-border space-y-2.5">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="font-bold text-white">
              Albero Gerarchico Nodi ({{ nodesList.length }}: {{ rootNodesCount }} Root, {{ subNodesCount }} Sub-Nodi)
            </span>
            <div class="flex items-center gap-2">
              <button
                type="button"
                @click="expandAllRoots"
                class="text-[10px] text-emerald-400 bg-transparent border-none cursor-pointer underline"
              >
                Espandi tutti
              </button>
              <button
                type="button"
                @click="collapseAllRoots"
                class="text-[10px] text-slate-400 bg-transparent border-none cursor-pointer underline"
              >
                Comprimi
              </button>
              <button
                v-if="selectedNodeFilter !== null"
                type="button"
                @click="selectedNodeFilter = null"
                class="text-[10px] text-cyan-400 bg-transparent border-none cursor-pointer underline"
              >
                Tutti i thread
              </button>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              @click="treeFilter = 'ALL'"
              :class="['px-2.5 py-1 rounded-lg border font-bold cursor-pointer text-[10px]', treeFilter === 'ALL' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'bg-[#030712] border-slate-800 text-slate-400']"
            >
              Albero Completo ({{ nodesList.length }})
            </button>
            <button
              type="button"
              @click="treeFilter = 'ROOT'"
              :class="['px-2.5 py-1 rounded-lg border font-bold cursor-pointer text-[10px]', treeFilter === 'ROOT' ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300' : 'bg-[#030712] border-slate-800 text-slate-400']"
            >
              Solo Root ({{ rootNodesCount }})
            </button>
            <button
              type="button"
              @click="treeFilter = 'SUB'"
              :class="['px-2.5 py-1 rounded-lg border font-bold cursor-pointer text-[10px]', treeFilter === 'SUB' ? 'bg-purple-500/20 border-purple-400 text-purple-300' : 'bg-[#030712] border-slate-800 text-slate-400']"
            >
              Con Sub-Nodi ({{ subNodesCount }})
            </button>
          </div>

          <input
            v-model="searchNodeQuery"
            type="text"
            placeholder="Filtra albero per nome, slug, categoria o sub-nodo..."
            class="w-full bg-[#030712] border border-slate-700 text-white px-3 py-2 rounded-xl outline-none box-border"
          />
        </div>

        <div v-if="isLoadingNodes" class="p-8 text-center text-cyan-400">Caricamento albero gerarchico nodi...</div>

        <div v-else class="divide-y divide-dkp-border/70 max-h-[700px] overflow-y-auto">
          <div
            v-for="root in hierarchicalTree"
            :key="root.id"
            class="bg-[#070b15]"
          >
            <!-- RIGA NODO ROOT (ACCORDION HEADER) -->
            <div
              @click="selectedNodeFilter = Number(root.id)"
              :class="[
                'p-3.5 flex items-start justify-between gap-2 cursor-pointer transition-colors',
                selectedNodeFilter === Number(root.id) ? 'bg-cyan-500/15 border-l-2 border-cyan-400' : 'hover:bg-slate-900/60'
              ]"
            >
              <div class="min-w-0 flex items-start gap-2">
                <button
                  type="button"
                  @click.stop="toggleRootAccordion(root.id)"
                  class="mt-0.5 w-5 h-5 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-cyan-300 flex items-center justify-center shrink-0 cursor-pointer"
                  :title="isRootExpanded(root.id) ? 'Comprimi sub-nodi' : 'Espandi sub-nodi'"
                >
                  {{ root.totalDescendants > 0 ? (isRootExpanded(root.id) ? '▾' : '▸') : '•' }}
                </button>

                <div class="min-w-0">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="text-sm">{{ root.icon || '#' }}</span>
                    <strong class="text-white truncate">n/{{ cleanNodeLabel(root.name) }}</strong>
                    <span class="px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-[9px] font-bold">
                      ROOT
                    </span>
                    <span
                      v-if="root.totalDescendants > 0"
                      @click.stop="toggleRootAccordion(root.id)"
                      class="px-1.5 py-0.5 rounded bg-purple-500/15 border border-purple-500/35 text-purple-300 text-[9px] font-bold"
                    >
                      {{ root.totalDescendants }} sub-nodi
                    </span>
                  </div>
                  <div class="text-[10px] text-slate-400 mt-0.5">
                    slug: <span class="text-slate-300">{{ root.slug }}</span> &bull; {{ root.category || 'General' }} &bull; {{ root.postsCount || 0 }} thread
                  </div>
                </div>
              </div>

              <!-- AZIONI SU NODO ROOT: [Aggiungi Sub] [Modifica] [Unisci] [Elimina] -->
              <div class="flex items-center gap-1 flex-wrap justify-end shrink-0" @click.stop>
                <button
                  type="button"
                  @click="openAddSubNodeForm(root)"
                  class="px-2 py-1 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500 hover:text-slate-950 font-bold cursor-pointer"
                  title="Aggiungi Sub-Nodo figlio diretto"
                >
                  + Sub
                </button>
                <button
                  type="button"
                  @click="openEditNodeModal(root)"
                  class="px-2 py-1 rounded bg-sky-500/15 border border-sky-500/40 text-sky-300 hover:bg-sky-500 hover:text-slate-950 font-bold cursor-pointer"
                >
                  Modifica
                </button>
                <button
                  type="button"
                  @click="openMergeNodeModal(root)"
                  class="px-2 py-1 rounded bg-amber-500/15 border border-amber-500/35 text-amber-300 hover:bg-amber-500 hover:text-slate-950 font-bold cursor-pointer"
                >
                  Unisci
                </button>
                <button
                  type="button"
                  @click="deleteNode(root)"
                  class="px-2 py-1 rounded bg-rose-500/15 border border-rose-500/35 text-rose-300 hover:bg-rose-500 hover:text-white font-bold cursor-pointer"
                >
                  Elimina
                </button>
              </div>
            </div>

            <!-- SOTTONODI INDENTATI (FIGLI DEL ROOT) -->
            <div
              v-if="isRootExpanded(root.id) && root.descendants.length > 0"
              class="border-t border-slate-800/70 bg-[#03060f] divide-y divide-slate-800/40"
            >
              <div
                v-for="sub in root.descendants"
                :key="sub.id"
                @click="selectedNodeFilter = Number(sub.id)"
                :style="{ paddingLeft: `${20 + Math.min(3, Number(sub.depth || 1)) * 16}px` }"
                :class="[
                  'pr-3.5 py-2.5 flex items-start justify-between gap-2 cursor-pointer transition-colors',
                  selectedNodeFilter === Number(sub.id) ? 'bg-purple-500/15 border-l-2 border-purple-400' : 'hover:bg-slate-900/50'
                ]"
              >
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="text-purple-400 font-bold">&#8627;</span>
                    <span class="text-xs">{{ sub.icon || '#' }}</span>
                    <strong class="text-slate-100 truncate">n/{{ cleanNodeLabel(sub.name) }}</strong>
                    <span class="px-1.5 py-0.5 rounded bg-purple-500/15 border border-purple-500/35 text-purple-300 text-[9px] font-bold">
                      SUB L{{ sub.depth || 1 }}
                    </span>
                  </div>
                  <div class="text-[10px] text-slate-400 mt-0.5">
                    slug: <span class="text-slate-300">{{ sub.slug }}</span> &bull; {{ sub.postsCount || 0 }} thread
                  </div>
                </div>

                <!-- AZIONI SU SUB-NODO: [+ Sub] [Modifica] [-> Root] [Elimina] -->
                <div class="flex items-center gap-1 flex-wrap justify-end shrink-0" @click.stop>
                  <button
                    type="button"
                    @click="openAddSubNodeForm(sub)"
                    class="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 hover:bg-emerald-500 hover:text-slate-950 font-bold cursor-pointer"
                    title="Aggiungi sub-nodo annidato"
                  >
                    + Sub
                  </button>
                  <button
                    type="button"
                    @click="openEditNodeModal(sub)"
                    class="px-2 py-0.5 rounded bg-sky-500/15 border border-sky-500/40 text-sky-300 hover:bg-sky-500 hover:text-slate-950 font-bold cursor-pointer"
                  >
                    Modifica
                  </button>
                  <button
                    type="button"
                    @click="promoteSubNodeToRoot(sub)"
                    class="px-2 py-0.5 rounded bg-purple-500/15 border border-purple-500/35 text-purple-300 hover:bg-purple-500 hover:text-white font-bold cursor-pointer"
                    title="Promuovi a livello Root"
                  >
                    -> Root
                  </button>
                  <button
                    type="button"
                    @click="deleteNode(sub)"
                    class="px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/35 text-rose-300 hover:bg-rose-500 hover:text-white font-bold cursor-pointer"
                  >
                    Elimina
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-if="hierarchicalTree.length === 0" class="p-8 text-center text-slate-400">
            Nessun nodo o sub-nodo corrisponde al filtro attivo.
          </div>
        </div>
      </section>

      <!-- COLONNA DESTRA: THREADS & MODERAZIONE -->
      <section class="lg:col-span-5 bg-dkp-card/95 border border-dkp-border rounded-2xl overflow-hidden card-glow flex flex-col">
        <div class="p-4 border-b border-dkp-border flex items-center justify-between">
          <span class="font-bold text-white">
            Discussioni / Threads ({{ filteredThreads.length }})
          </span>
          <span class="text-[11px] text-purple-300">Editor: DKPnodesRichEditor</span>
        </div>

        <div v-if="isLoadingThreads" class="p-8 text-center text-cyan-400">Caricamento discussioni...</div>

        <div v-else class="divide-y divide-dkp-border/60 max-h-[700px] overflow-y-auto">
          <div v-for="t in filteredThreads" :key="t.id" class="p-4 hover:bg-slate-900/50 space-y-2">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span v-if="t.isPinned || t.is_pinned" class="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[9px] font-extrabold">
                    PINNED
                  </span>
                  <span class="px-2 py-0.5 rounded bg-purple-500/15 border border-purple-500/35 text-purple-300 text-[10px] font-bold">
                    n/{{ t.nodeSlug || t.node_slug || t.nodeName || 'node' }}
                  </span>
                  <span v-if="t.vaultHash" class="px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-[9px] font-bold">
                    SHA-256
                  </span>
                </div>
                <h4 class="text-white font-sans font-bold text-sm m-0 mt-1.5">{{ t.title }}</h4>
              </div>

              <div class="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                <button
                  type="button"
                  @click="openEditThreadEditor(t)"
                  class="px-2.5 py-1 rounded-lg bg-sky-500/15 border border-sky-500/40 text-sky-300 hover:bg-sky-500 hover:text-slate-950 font-bold cursor-pointer"
                >
                  Modifica
                </button>
                <button
                  type="button"
                  @click="togglePinThread(t)"
                  class="px-2 py-1 rounded-lg bg-slate-800 text-amber-300 border-none cursor-pointer"
                >
                  Pin
                </button>
                <button
                  type="button"
                  @click="notarizeThread(t)"
                  class="px-2 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 cursor-pointer"
                >
                  Vault
                </button>
                <button
                  type="button"
                  @click="deleteThread(t)"
                  class="px-2 py-1 rounded-lg bg-rose-500/15 border border-rose-500/35 text-rose-300 cursor-pointer"
                >
                  Elimina
                </button>
              </div>
            </div>

            <p class="text-slate-400 font-sans text-xs line-clamp-2 m-0">
              {{ t.content }}
            </p>
          </div>

          <div v-if="filteredThreads.length === 0" class="p-10 text-center text-slate-400">
            Nessun thread trovato. Clicca su <strong>+ Nuovo Thread (Rich Editor)</strong> per crearne uno!
          </div>
        </div>
      </section>
    </div>

    <!-- MODALE MODIFICA NODO / SUB-NODO (PUT /api/admin/nodes/[id]) -->
    <Teleport to="body">
      <div
        v-if="editingNode"
        class="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4"
        @click.self="editingNode = null"
      >
        <div class="bg-dkp-card border border-cyan-500/40 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 font-mono text-xs">
          <div class="flex items-center justify-between border-b border-dkp-border pb-3">
            <div>
              <span class="text-[10px] font-black text-cyan-400 uppercase">MODIFICA NODO / SUB-NODO #{{ editingNode.id }}</span>
              <h3 class="text-base font-bold text-white m-0 mt-0.5">n/{{ editingNode.slug }}</h3>
            </div>
            <button type="button" @click="editingNode = null" class="text-slate-400 hover:text-white bg-transparent border-none cursor-pointer font-bold">X</button>
          </div>

          <form @submit.prevent="saveEditedNode" class="space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-slate-400 mb-1">Nome Nodo *</label>
                <input v-model="editingNode.name" required class="w-full bg-[#030712] border border-slate-700 text-white px-3 py-2 rounded-xl box-border" />
              </div>
              <div>
                <label class="block text-slate-400 mb-1">Slug URL *</label>
                <input v-model="editingNode.slug" required class="w-full bg-[#030712] border border-slate-700 text-emerald-300 px-3 py-2 rounded-xl box-border" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-slate-400 mb-1">Categoria</label>
                <input v-model="editingNode.category" class="w-full bg-[#030712] border border-slate-700 text-white px-3 py-2 rounded-xl box-border" />
              </div>
              <div>
                <label class="block text-slate-400 mb-1">Nodo Padre (Root o Sub-Nodo)</label>
                <select v-model="editingNode.parentId" class="w-full bg-[#030712] border border-slate-700 text-cyan-300 px-3 py-2 rounded-xl cursor-pointer">
                  <option :value="null">Livello Root (n/ principale)</option>
                  <option
                    v-for="cand in nodesList.filter(n => Number(n.id) !== Number(editingNode.id))"
                    :key="cand.id"
                    :value="Number(cand.id)"
                  >
                    Sub-Nodo di n/{{ cleanNodeLabel(cand.name) }}
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-slate-400 mb-1">Descrizione</label>
              <textarea v-model="editingNode.description" rows="2" class="w-full bg-[#030712] border border-slate-700 text-white px-3 py-2 rounded-xl resize-none box-border"></textarea>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-slate-400 mb-1">Icona</label>
                <input v-model="editingNode.icon" class="w-full bg-[#030712] border border-slate-700 text-white px-3 py-2 rounded-xl box-border" />
              </div>
              <div>
                <label class="block text-slate-400 mb-1">Colore Hex</label>
                <input v-model="editingNode.color" class="w-full bg-[#030712] border border-slate-700 text-white px-3 py-2 rounded-xl box-border" />
              </div>
            </div>

            <div class="flex justify-end gap-2 pt-2">
              <button type="button" @click="editingNode = null" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold border-none cursor-pointer">Annulla</button>
              <button type="submit" :disabled="isUpdatingNode" class="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold border-none cursor-pointer disabled:opacity-50">
                {{ isUpdatingNode ? 'Salvataggio...' : 'Salva Modifiche' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- MODALE UNISCI / CONSOLIDA NODO (POST /api/admin/nodes/merge) -->
    <Teleport to="body">
      <div
        v-if="mergeSourceNode"
        class="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4"
        @click.self="mergeSourceNode = null"
      >
        <div class="bg-dkp-card border border-amber-500/40 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 font-mono text-xs">
          <div class="flex items-center justify-between border-b border-dkp-border pb-3">
            <div>
              <span class="text-[10px] font-black text-amber-400 uppercase">UNISCI &amp; RIMUOVI NODO RIDONDANTE</span>
              <h3 class="text-base font-bold text-white m-0 mt-0.5">Sorgente: n/{{ cleanNodeLabel(mergeSourceNode.name) }}</h3>
            </div>
            <button type="button" @click="mergeSourceNode = null" class="text-slate-400 hover:text-white bg-transparent border-none cursor-pointer font-bold">X</button>
          </div>

          <p class="text-slate-300 leading-relaxed m-0">
            Tutti i thread e gli eventuali sub-nodi di <strong class="text-white">n/{{ cleanNodeLabel(mergeSourceNode.name) }}</strong> verranno trasferiti nel nodo destinazione selezionato e il nodo sorgente verrà eliminato.
          </p>

          <div>
            <label class="block text-slate-400 mb-1">Nodo Destinazione *</label>
            <select v-model="mergeTargetNodeId" class="w-full bg-[#030712] border border-slate-700 text-emerald-300 px-3 py-2.5 rounded-xl cursor-pointer">
              <option
                v-for="dst in nodesList.filter(n => Number(n.id) !== Number(mergeSourceNode.id))"
                :key="dst.id"
                :value="Number(dst.id)"
              >
                n/{{ cleanNodeLabel(dst.name) }} ({{ dst.category || 'General' }})
              </option>
            </select>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button type="button" @click="mergeSourceNode = null" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold border-none cursor-pointer">Annulla</button>
            <button
              type="button"
              :disabled="isMergingNode || !mergeTargetNodeId"
              @click="executeMergeNode"
              class="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold border-none cursor-pointer disabled:opacity-50"
            >
              {{ isMergingNode ? 'Consolidamento...' : 'Conferma Unione & Elimina' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <DKPnodesRichEditor
      :is-open="isThreadEditorOpen"
      :categories="categoriesList"
      :grouped-nodes="groupedNodesMap"
      :initial-category="editorInitialCategory"
      :initial-node-id="editorInitialNodeId"
      :is-admin="true"
      :edit-post="editingThread"
      @close="isThreadEditorOpen = false; editingThread = null"
      @published="isThreadEditorOpen = false; onThreadSaved()"
      @updated="isThreadEditorOpen = false; editingThread = null; onThreadSaved()"
    />
  </DkpAdminShell>
</template>