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

const selectedNodeFilter = ref<number | null>(null)
const treeFilter = ref<'ALL' | 'ROOT' | 'SUB'>('ALL')
const searchNodeQuery = ref('')

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
  category: 'General',
  parentId: null as number | null,
  icon: '#',
  color: '#38bdf8',
  isPrivate: false
})

// Modale Modifica Nodo / Sub-Nodo (PUT /api/admin/nodes/[id])
const editingNode = ref<any | null>(null)
const isUpdatingNode = ref(false)

function openEditNodeModal(node: any) {
  editingNode.value = {
    id: Number(node.id),
    name: cleanNodeLabel(node.name),
    slug: String(node.slug || slugifyNode(node.name)),
    description: String(node.description || ''),
    category: String(node.category || 'General'),
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
    const cat = String(n.category || 'General').trim()
    if (cat) set.add(cat)
  }
  return set.size > 0 ? Array.from(set) : ['General']
})

const groupedNodesMap = computed<Record<string, any[]>>(() => {
  const map: Record<string, any[]> = {}
  for (const n of nodesList.value) {
    const cat = String(n.category || 'General').trim() || 'General'
    if (!map[cat]) map[cat] = []
    map[cat].push(n)
  }
  return map
})

const filteredNodes = computed(() => {
  const q = searchNodeQuery.value.toLowerCase().trim()
  return nodesList.value.filter((n) => {
    if (treeFilter.value === 'ROOT' && n.parentId) return false
    if (treeFilter.value === 'SUB' && !n.parentId) return false
    if (!q) return true
    return (
      cleanNodeLabel(n.name).toLowerCase().includes(q) ||
      String(n.slug || '').toLowerCase().includes(q) ||
      String(n.category || '').toLowerCase().includes(q) ||
      String(n.parentName || '').toLowerCase().includes(q)
    )
  })
})

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
  } catch (err: any) {
    notify(err?.data?.statusMessage || 'Errore caricamento nodi.', 'error')
  } finally {
    isLoadingNodes.value = false
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
        category: newNode.value.category.trim() || 'General',
        parentId: newNode.value.parentId,
        icon: newNode.value.icon.trim() || '#',
        color: newNode.value.color || '#38bdf8',
        isPrivate: Boolean(newNode.value.isPrivate)
      }
    })
    if (res?.success !== false) {
      notify(`Nodo n/${computedSlug} creato con successo!`, 'success')
      newNode.value = {
        name: '',
        slug: '',
        description: '',
        category: 'General',
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
  const kind = node.parentId ? 'il sub-nodo' : 'il nodo'
  if (!confirm(`Eliminare definitivamente ${kind} n/${label}? (Eventuali sub-nodi figli verranno promossi a Root)`)) return

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
    title="Gestione Nodi, Sub-Nodi & DKP Talks"
    subtitle="Crea, modifica, sposta, unisci o elimina nodi n/ e sub-nodi n/n/, e modera le discussioni con DKPnodesRichEditor."
    badge="NODES & SUB-NODES v2.6 &bull; PURE SQL"
    seo-title="Gestione Nodi & Sub-Nodi - DKP Admin v2.6"
  >
    <template #actions>
      <button
        type="button"
        @click="fetchNodes(); fetchThreads()"
        class="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold cursor-pointer"
      >
        Aggiorna
      </button>
      <button
        type="button"
        @click="showNodeForm = !showNodeForm"
        class="px-3.5 py-2.5 rounded-xl bg-[#030712] border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 font-bold cursor-pointer"
      >
        + Nuovo Nodo / Sub-Nodo
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
        <span class="font-bold text-cyan-300 text-sm">Crea Nuovo Nodo Root (n/) o Sub-Nodo (figlio)</span>
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
          placeholder="Categoria (es. Systems & Rust)"
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

    <!-- LAYOUT A 2 COLONNE: ALBERO NODI & SUB-NODI (SX) + THREADS (DX) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 font-mono text-xs">
      <!-- COLONNA SINISTRA: NODI & SUB-NODI -->
      <section class="lg:col-span-6 bg-dkp-card/95 border border-dkp-border rounded-2xl overflow-hidden card-glow flex flex-col">
        <div class="p-4 border-b border-dkp-border space-y-2.5">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="font-bold text-white">
              Albero Nodi ({{ nodesList.length }}: {{ rootNodesCount }} Root, {{ subNodesCount }} Sub-Nodi)
            </span>
            <button
              v-if="selectedNodeFilter !== null"
              type="button"
              @click="selectedNodeFilter = null"
              class="text-[10px] text-cyan-400 bg-transparent border-none cursor-pointer underline"
            >
              Mostra tutti i thread
            </button>
          </div>

          <div class="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              @click="treeFilter = 'ALL'"
              :class="['px-2.5 py-1 rounded-lg border font-bold cursor-pointer text-[10px]', treeFilter === 'ALL' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'bg-[#030712] border-slate-800 text-slate-400']"
            >
              Tutti ({{ nodesList.length }})
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
              Solo Sub-Nodi ({{ subNodesCount }})
            </button>
          </div>

          <input
            v-model="searchNodeQuery"
            type="text"
            placeholder="Filtra per nome, slug, categoria o nodo padre..."
            class="w-full bg-[#030712] border border-slate-700 text-white px-3 py-2 rounded-xl outline-none box-border"
          />
        </div>

        <div v-if="isLoadingNodes" class="p-8 text-center text-cyan-400">Caricamento nodi e sub-nodi...</div>

        <div v-else class="divide-y divide-dkp-border/60 max-h-[660px] overflow-y-auto">
          <div
            v-for="node in filteredNodes"
            :key="node.id"
            @click="selectedNodeFilter = Number(node.id)"
            :class="[
              'p-3.5 flex flex-col gap-2 cursor-pointer transition-colors',
              selectedNodeFilter === Number(node.id) ? 'bg-cyan-500/15 border-l-2 border-cyan-400' : 'hover:bg-slate-900/50',
              node.parentId ? 'pl-6 bg-[#040814]/60' : ''
            ]"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span v-if="node.parentId" class="text-purple-400 font-bold">&#8627;</span>
                  <span class="text-sm">{{ node.icon || '#' }}</span>
                  <strong class="text-white truncate">n/{{ cleanNodeLabel(node.name) }}</strong>
                  <span
                    v-if="node.parentId"
                    class="px-1.5 py-0.5 rounded bg-purple-500/15 border border-purple-500/35 text-purple-300 text-[9px] font-bold"
                  >
                    SUB di n/{{ cleanNodeLabel(node.parentName || ('#' + node.parentId)) }}
                  </span>
                  <span
                    v-else
                    class="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold"
                  >
                    ROOT
                  </span>
                </div>
                <div class="text-[10px] text-slate-400 mt-0.5">
                  slug: <span class="text-slate-300">{{ node.slug }}</span> &bull; {{ node.category || 'General' }} &bull; {{ node.postsCount || 0 }} thread
                </div>
              </div>

              <div class="flex items-center gap-1 flex-wrap justify-end shrink-0" @click.stop>
                <button
                  type="button"
                  @click="openEditNodeModal(node)"
                  class="px-2 py-1 rounded bg-sky-500/15 border border-sky-500/40 text-sky-300 hover:bg-sky-500 hover:text-slate-950 font-bold cursor-pointer"
                  title="Modifica nome, slug, categoria o sposta sub-nodo"
                >
                  Modifica
                </button>
                <button
                  v-if="node.parentId"
                  type="button"
                  @click="promoteSubNodeToRoot(node)"
                  class="px-2 py-1 rounded bg-purple-500/15 border border-purple-500/35 text-purple-300 hover:bg-purple-500 hover:text-white font-bold cursor-pointer"
                  title="Promuovi questo sub-nodo a livello Root (n/)"
                >
                  -> Root
                </button>
                <button
                  type="button"
                  @click="openMergeNodeModal(node)"
                  class="px-2 py-1 rounded bg-amber-500/15 border border-amber-500/35 text-amber-300 hover:bg-amber-500 hover:text-slate-950 font-bold cursor-pointer"
                  title="Unisci thread e sub-nodi dentro un altro nodo ed elimina questo"
                >
                  Unisci
                </button>
                <button
                  type="button"
                  @click="openNewThreadEditor(node)"
                  class="px-2 py-1 rounded bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 font-bold cursor-pointer"
                  title="Pubblica Thread in questo Nodo"
                >
                  + Post
                </button>
                <button
                  type="button"
                  @click="deleteNode(node)"
                  class="px-2 py-1 rounded bg-rose-500/15 border border-rose-500/35 text-rose-300 hover:bg-rose-500 hover:text-white font-bold cursor-pointer"
                  title="Elimina nodo o sub-nodo"
                >
                  Elimina
                </button>
              </div>
            </div>
          </div>

          <div v-if="filteredNodes.length === 0" class="p-8 text-center text-slate-400">
            Nessun nodo o sub-nodo corrisponde al filtro attivo.
          </div>
        </div>
      </section>

      <!-- COLONNA DESTRA: THREADS & MODERAZIONE -->
      <section class="lg:col-span-6 bg-dkp-card/95 border border-dkp-border rounded-2xl overflow-hidden card-glow flex flex-col">
        <div class="p-4 border-b border-dkp-border flex items-center justify-between">
          <span class="font-bold text-white">
            Discussioni / Threads ({{ filteredThreads.length }})
          </span>
          <span class="text-[11px] text-purple-300">Editor: DKPnodesRichEditor</span>
        </div>

        <div v-if="isLoadingThreads" class="p-8 text-center text-cyan-400">Caricamento discussioni...</div>

        <div v-else class="divide-y divide-dkp-border/60 max-h-[660px] overflow-y-auto">
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
            Tutti i thread e gli eventuali sub-nodi di <strong class="text-white">n/{{ cleanNodeLabel(mergeSourceNode.name) }}</strong> verranno trasferiti nel nodo destinazione selezionato e il nodo sorgente verra eliminato.
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