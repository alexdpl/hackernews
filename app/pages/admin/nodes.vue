<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import DkpAdminShell from '~/components/admin/DkpAdminShell.vue'
import DKPnodesRichEditor from '~/components/DKPnodesRichEditor.vue'
import { cleanNodeLabel } from '~/composables/useDkpNodes'

definePageMeta({
  middleware: 'admin-only'
})

const nodesList = ref<any[]>([])
const threadsList = ref<any[]>([])
const isLoadingNodes = ref(true)
const isLoadingThreads = ref(true)
const feedbackMsg = ref('')

const searchNodeQuery = ref('')
const selectedNodeFilter = ref<number | null>(null)

// Form creazione nuovo Nodo / Sotto-Nodo
const showNodeForm = ref(false)
const newNode = ref({
  name: '',
  slug: '',
  category: 'Architecture & Systems',
  icon: '⚡',
  description: '',
  parentId: null as number | null
})

// Stato DKPnodesRichEditor (Creazione e Modifica Thread)
const isThreadEditorOpen = ref(false)
const editingThread = ref<any | null>(null)
const editorInitialCategory = ref('')
const editorInitialNodeId = ref<number | null>(null)

const categoriesList = computed(() => {
  const set = new Set<string>()
  nodesList.value.forEach(n => {
    set.add(String(n.category || 'General'))
  })
  return Array.from(set)
})

const groupedNodesMap = computed<Record<string, any[]>>(() => {
  const map: Record<string, any[]> = {}
  const byId = new Map<number, any>()
  nodesList.value.forEach(n => byId.set(Number(n.id), n))

  for (const n of nodesList.value) {
    const cat = String(n.category || 'General')
    if (!map[cat]) map[cat] = []
    const parentId = Number(n.parent_id ?? n.parentId ?? 0)
    const parent = parentId ? byId.get(parentId) : null
    map[cat].push({
      ...n,
      depth: parent ? 1 : 0,
      parentName: parent ? cleanNodeLabel(parent.name) : ''
    })
  }
  return map
})

const filteredNodes = computed(() => {
  const q = searchNodeQuery.value.toLowerCase().trim()
  if (!q) return nodesList.value
  return nodesList.value.filter(n =>
    String(n.name || '').toLowerCase().includes(q) ||
    String(n.slug || '').toLowerCase().includes(q) ||
    String(n.category || '').toLowerCase().includes(q)
  )
})

const filteredThreads = computed(() => {
  if (!selectedNodeFilter.value) return threadsList.value
  return threadsList.value.filter(t => Number(t.nodeId ?? t.node_id) === Number(selectedNodeFilter.value))
})

async function fetchNodes() {
  isLoadingNodes.value = true
  try {
    const res: any = await $fetch(`/api/admin/nodes?_t=${Date.now()}`)
    nodesList.value = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.nodes) ? res.nodes : [])
  } finally {
    isLoadingNodes.value = false
  }
}

async function fetchThreads() {
  isLoadingThreads.value = true
  try {
    const res: any = await $fetch(`/api/nodes/posts?limit=100&_t=${Date.now()}`).catch(() => null)
    threadsList.value = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.posts) ? res.posts : [])
  } finally {
    isLoadingThreads.value = false
  }
}

async function createNode() {
  if (!newNode.value.name.trim()) return
  const res: any = await $fetch('/api/admin/nodes', {
    method: 'POST',
    body: {
      action: 'create',
      ...newNode.value
    }
  })
  if (res?.success !== false) {
    feedbackMsg.value = `Nodo n/${newNode.value.name} creato con successo!`
    newNode.value.name = ''
    newNode.value.slug = ''
    newNode.value.description = ''
    showNodeForm.value = false
    await fetchNodes()
  }
}

async function toggleNodeStatus(node: any) {
  await $fetch('/api/admin/nodes', {
    method: 'POST',
    body: { action: 'toggle', id: node.id }
  })
  await fetchNodes()
}

async function deleteNode(node: any) {
  if (!confirm(`Eliminare il nodo n/${cleanNodeLabel(node.name)}?`)) return
  await $fetch('/api/admin/nodes', {
    method: 'POST',
    body: { action: 'delete', id: node.id }
  })
  await fetchNodes()
}

function openNewThreadEditor(node?: any) {
  editingThread.value = null
  if (node) {
    editorInitialCategory.value = String(node.category || categoriesList.value[0] || '')
    editorInitialNodeId.value = Number(node.id)
  } else {
    editorInitialCategory.value = categoriesList.value[0] || ''
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
  const currentPin = Boolean(thread.isPinned ?? thread.is_pinned)
  await $fetch(`/api/nodes/posts/${thread.id}`, {
    method: 'PATCH',
    body: { is_pinned: !currentPin }
  })
  feedbackMsg.value = !currentPin ? 'Thread fissato in cima (Pinned).' : 'Pin rimosso dal thread.'
  await fetchThreads()
}

async function deleteThread(thread: any) {
  if (!confirm(`Eliminare definitivamente il thread "${thread.title}"?`)) return
  await $fetch(`/api/nodes/posts/${thread.id}`, { method: 'DELETE' })
  feedbackMsg.value = 'Thread eliminato.'
  await fetchThreads()
}

async function onThreadSaved() {
  feedbackMsg.value = 'Thread salvato e sincronizzato con Proof-of-Code Vault!'
  await fetchThreads()
}

onMounted(async () => {
  await Promise.all([fetchNodes(), fetchThreads()])
})
</script>

<template>
  <DkpAdminShell
    title="Gestione Nodi & DKP Talks Rich Editor"
    subtitle="Amministrazione completa dell'albero n/ e sub-nodi n/n/, moderazione thread, Pin e pubblicazione con DKPnodesRichEditor + AI Copilot."
    badge="NODES & TALKS v2.6 • RICH EDITOR"
    seo-title="Gestione Nodi & Threads — DKP Admin v2.6"
  >
    <template #actions>
      <button
        type="button"
        @click="showNodeForm = !showNodeForm"
        class="px-3.5 py-2.5 rounded-xl bg-[#030712] border border-cyan-500/40 text-cyan-300 font-bold cursor-pointer"
      >
        + Nuovo Nodo n/
      </button>
      <button
        type="button"
        @click="openNewThreadEditor()"
        class="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold border-none cursor-pointer shadow-[0_0_16px_rgba(16,185,129,0.25)]"
      >
        + Nuovo Thread (Rich Editor)
      </button>
    </template>

    <div v-if="feedbackMsg" class="bg-emerald-500/15 border border-emerald-400 text-emerald-300 font-mono text-xs font-bold px-4 py-3 rounded-xl flex items-center justify-between">
      <span> {{ feedbackMsg }}</span>
      <button type="button" @click="feedbackMsg = ''" class="bg-transparent border-none text-emerald-300 cursor-pointer font-bold"></button>
    </div>

    <!-- FORM CREAZIONE NUOVO NODO / SUB-NODO -->
    <form v-if="showNodeForm" @submit.prevent="createNode" class="bg-dkp-card/95 border border-cyan-500/40 rounded-2xl p-5 card-glow font-mono text-xs space-y-3">
      <div class="font-bold text-cyan-300 text-sm">Crea Nuovo Nodo (n/) o Sub-Nodo (n/n/)</div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <input v-model="newNode.name" type="text" required placeholder="Nome Nodo (es. rust-async)" class="bg-[#030712] border border-slate-700 text-white px-3.5 py-2.5 rounded-xl outline-none box-border" />
        <input v-model="newNode.category" type="text" placeholder="Categoria (es. Systems & Rust)" class="bg-[#030712] border border-slate-700 text-white px-3.5 py-2.5 rounded-xl outline-none box-border" />
        <select v-model="newNode.parentId" class="bg-[#030712] border border-slate-700 text-cyan-300 px-3.5 py-2.5 rounded-xl cursor-pointer">
          <option :value="null">Nodo Radice (n/)</option>
          <option v-for="n in nodesList" :key="n.id" :value="Number(n.id)">Sub-Nodo di n/{{ cleanNodeLabel(n.name) }}</option>
        </select>
        <div class="flex gap-2">
          <input v-model="newNode.icon" type="text" placeholder="Icona" class="w-16 text-center bg-[#030712] border border-slate-700 text-white px-2 py-2.5 rounded-xl outline-none" />
          <button type="submit" class="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl border-none cursor-pointer">Crea Nodo</button>
        </div>
      </div>
    </form>

    <!-- LAYOUT A 2 COLONNE: ALBERO NODI (SX) + THREADS & EDITOR (DX) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 font-mono text-xs">
      <!-- COLONNA SINISTRA: NODI ATTIVI -->
      <section class="lg:col-span-5 bg-dkp-card/95 border border-dkp-border rounded-2xl overflow-hidden card-glow flex flex-col">
        <div class="p-4 border-b border-dkp-border space-y-2.5">
          <div class="flex items-center justify-between">
            <span class="font-bold text-white">Nodi DKP ({{ nodesList.length }})</span>
            <button
              v-if="selectedNodeFilter !== null"
              type="button"
              @click="selectedNodeFilter = null"
              class="text-[10px] text-cyan-400 bg-transparent border-none cursor-pointer underline"
            >
              Mostra tutti i thread
            </button>
          </div>
          <input
            v-model="searchNodeQuery"
            type="text"
            placeholder="Filtra nodi n/..."
            class="w-full bg-[#030712] border border-slate-700 text-white px-3 py-2 rounded-xl outline-none box-border"
          />
        </div>

        <div v-if="isLoadingNodes" class="p-8 text-center text-cyan-400">Caricamento nodi...</div>

        <div v-else class="divide-y divide-dkp-border/60 max-h-[620px] overflow-y-auto">
          <div
            v-for="node in filteredNodes"
            :key="node.id"
            @click="selectedNodeFilter = Number(node.id)"
            :class="[
              'p-3.5 flex items-center justify-between gap-2 cursor-pointer transition-colors',
              selectedNodeFilter === Number(node.id) ? 'bg-cyan-500/15 border-l-2 border-cyan-400' : 'hover:bg-slate-900/50'
            ]"
          >
            <div class="min-w-0">
              <div class="flex items-center gap-1.5">
                <span class="text-sm">{{ node.icon || '#' }}</span>
                <strong class="text-white truncate">n/{{ cleanNodeLabel(node.name) }}</strong>
              </div>
              <div class="text-[10px] text-slate-400 truncate">{{ node.category }}</div>
            </div>

            <div class="flex items-center gap-1.5 shrink-0" @click.stop>
              <button
                type="button"
                @click="openNewThreadEditor(node)"
                class="px-2 py-1 rounded bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 font-bold cursor-pointer"
                title="Pubblica Thread in questo Nodo con DKPnodesRichEditor"
              >
                + Post
              </button>
              <button
                type="button"
                @click="toggleNodeStatus(node)"
                class="px-2 py-1 rounded bg-slate-800 text-slate-300 border-none cursor-pointer"
              >
                {{ node.is_active === false ? 'OFF' : 'ON' }}
              </button>
              <button
                type="button"
                @click="deleteNode(node)"
                class="px-2 py-1 rounded bg-rose-500/15 text-rose-300 border-none cursor-pointer"
              >
                
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- COLONNA DESTRA: THREADS & MODERAZIONE -->
      <section class="lg:col-span-7 bg-dkp-card/95 border border-dkp-border rounded-2xl overflow-hidden card-glow flex flex-col">
        <div class="p-4 border-b border-dkp-border flex items-center justify-between">
          <span class="font-bold text-white">
            Discussioni / Threads ({{ filteredThreads.length }})
          </span>
          <span class="text-[11px] text-purple-300">Editor: DKPnodesRichEditor</span>
        </div>

        <div v-if="isLoadingThreads" class="p-8 text-center text-cyan-400">Caricamento discussioni...</div>

        <div v-else class="divide-y divide-dkp-border/60 max-h-[620px] overflow-y-auto">
          <div v-for="t in filteredThreads" :key="t.id" class="p-4 hover:bg-slate-900/50 space-y-2">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span v-if="t.isPinned || t.is_pinned" class="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[9px] font-extrabold">
                    📌 PINNED
                  </span>
                  <span class="px-2 py-0.5 rounded bg-purple-500/15 border border-purple-500/35 text-purple-300 text-[10px] font-bold">
                    n/{{ t.nodeSlug || t.node_slug || t.nodeName || 'node' }}
                  </span>
                </div>
                <h4 class="text-white font-sans font-bold text-sm m-0 mt-1.5">{{ t.title }}</h4>
              </div>

              <div class="flex items-center gap-1.5 shrink-0">
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
                  title="Pin / Unpin"
                >
                  📌
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

    <!-- IL NOSTRO COMPONENTE NATIVO DKPnodesRichEditor -->
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