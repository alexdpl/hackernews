<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import DkpNodesNavBar from '~/components/nodes/DkpNodesNavBar.vue'
import DkpThreadCard from '~/components/nodes/DkpThreadCard.vue'
import DkpAdsWidget from '~/components/ads/DkpAdsWidget.vue'
import DkpRelatedNodesWidget from '~/components/widgets/DkpRelatedNodesWidget.vue'
import DkpRelatedBlogWidget from '~/components/widgets/DkpRelatedBlogWidget.vue'
import DKPnodesRichEditor from '~/components/DKPnodesRichEditor.vue'
import { buildCategoryNodeTree } from '~/composables/useDkpNodes'

const route = useRoute()
const slug = computed(() => String(route.params.slug || 'general').toLowerCase())
const isVaultNode = computed(() => slug.value === 'blockchain-vault')

const nodesList = ref<any[]>([])
const posts = ref<any[]>([])
const isLoading = ref(true)
const contentFilter = ref<'all' | 'thread' | 'blog' | 'open' | 'closed'>('all')
const isEditorOpen = ref(false)
const { currentUser } = useAuthCore()

const isAdmin = computed(() => String(currentUser.value?.role || '').toUpperCase() === 'ADMIN')
const nodeTree = computed(() => buildCategoryNodeTree(nodesList.value))

const filteredPosts = computed(() => {
  return posts.value.filter((p) => {
    if (contentFilter.value === 'thread') return p.sourceType !== 'blog'
    if (contentFilter.value === 'blog') return p.sourceType === 'blog'
    if (contentFilter.value === 'open') return !p.isLocked
    if (contentFilter.value === 'closed') return Boolean(p.isLocked)
    return true
  })
})

async function loadNodeData() {
  isLoading.value = true
  try {
    const [nRes, pRes]: any = await Promise.all([
      $fetch('/api/nodes').catch(() => null),
      $fetch('/api/nodes/posts', {
        query: { nodeSlug: slug.value, limit: 50, _t: Date.now() }
      }).catch(() => null)
    ])
    if (nRes?.data) nodesList.value = nRes.data
    posts.value = pRes?.data || []
  } finally {
    isLoading.value = false
  }
}

async function handleToggleLock(thread: any) {
  if (thread.sourceType === 'blog') return
  const nextLocked = !thread.isLocked
  const res: any = await $fetch(`/api/nodes/posts/${thread.id}/close`, {
    method: 'PATCH',
    body: { isLocked: nextLocked }
  }).catch(() => null)
  if (res?.success) thread.isLocked = nextLocked
}

watch(slug, loadNodeData)
onMounted(loadNodeData)
</script>

<template>
  <DkpLayout
    :title="isVaultNode ? 'n/blockchain-vault' : `n/${slug}`"
    :subtitle="isVaultNode ? 'Registro Unificato SHA-256: Blog Notarizzati & Thread Verificati' : 'Discussioni tecniche e snippet verificati del nodo'"
    :icon="isVaultNode ? '⛓️' : '💬'"
    :seo-title="`n/${slug} — DevKernelPulse Nodes`"
    :seo-description="`Esplora i thread e i contenuti notarizzati SHA-256 nel nodo n/${slug} su DevKernelPulse.`"
  >
    <template #header-actions>
      <button
        type="button"
        @click="loadNodeData"
        class="px-3.5 py-2 rounded-xl bg-[#020420] border border-slate-700 hover:border-emerald-400 text-emerald-400 font-bold cursor-pointer"
      >
        🔄 Aggiorna
      </button>
    </template>

    <template #sidebar-extra>
      <DkpAdsWidget />
      <DkpRelatedNodesWidget :current-slug="slug" />
      <DkpRelatedBlogWidget />
    </template>

    <!-- Navbar Orizzontale Nodi & Sub-nodi con Menu a Tendina -->
    <DkpNodesNavBar :nodes="nodesList" @create-thread="isEditorOpen = true" />

    <!-- Barra Filtri Rapidi -->
    <div class="bg-[#090d16] border border-slate-800/90 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
      <div class="flex flex-wrap gap-1.5">
        <button
          type="button"
          @click="contentFilter = 'all'"
          :class="['px-3 py-1.5 rounded-lg font-bold cursor-pointer border', contentFilter === 'all' ? 'bg-emerald-500 text-[#020420] border-emerald-500' : 'bg-[#020420] text-slate-300 border-slate-800']"
        >
          Tutti ({{ posts.length }})
        </button>
        <button
          v-if="isVaultNode"
          type="button"
          @click="contentFilter = 'blog'"
          :class="['px-3 py-1.5 rounded-lg font-bold cursor-pointer border', contentFilter === 'blog' ? 'bg-purple-500 text-white border-purple-500' : 'bg-[#020420] text-purple-300 border-slate-800']"
        >
          📝 Blog Notarizzati
        </button>
        <button
          type="button"
          @click="contentFilter = 'thread'"
          :class="['px-3 py-1.5 rounded-lg font-bold cursor-pointer border', contentFilter === 'thread' ? 'bg-emerald-500 text-[#020420] border-emerald-500' : 'bg-[#020420] text-slate-300 border-slate-800']"
        >
          💬 Thread Forum
        </button>
        <button
          type="button"
          @click="contentFilter = 'open'"
          :class="['px-3 py-1.5 rounded-lg font-bold cursor-pointer border', contentFilter === 'open' ? 'bg-emerald-500 text-[#020420] border-emerald-500' : 'bg-[#020420] text-slate-300 border-slate-800']"
        >
          🔓 Aperti
        </button>
        <button
          type="button"
          @click="contentFilter = 'closed'"
          :class="['px-3 py-1.5 rounded-lg font-bold cursor-pointer border', contentFilter === 'closed' ? 'bg-red-500 text-white border-red-500' : 'bg-[#020420] text-slate-300 border-slate-800']"
        >
          🔒 Chiusi
        </button>
      </div>
    </div>

    <!-- Lista Card dei Thread -->
    <div v-if="isLoading" class="bg-[#090d16] border border-slate-800 rounded-2xl p-10 text-center font-mono text-xs text-emerald-400 animate-pulse">
      ⚡ Sincronizzazione nodo n/{{ slug }}...
    </div>

    <div v-else-if="filteredPosts.length === 0" class="bg-[#090d16] border border-slate-800 rounded-2xl p-10 text-center font-mono text-xs text-slate-400">
      Nessun contenuto corrispondente al filtro selezionato.
    </div>

    <div v-else class="space-y-3.5">
      <DkpThreadCard
        v-for="item in filteredPosts"
        :key="item.id"
        :thread="item"
        :can-moderate="Boolean(currentUser)"
        @toggle-lock="handleToggleLock"
      />
    </div>

    <DKPnodesRichEditor
      :is-open="isEditorOpen"
      :categories="nodeTree.categories"
      :grouped-nodes="nodeTree.groupedNodes"
      :is-admin="isAdmin"
      @close="isEditorOpen = false"
      @created="async () => { isEditorOpen = false; await loadNodeData() }"
      @updated="async () => { isEditorOpen = false; await loadNodeData() }"
    />
  </DkpLayout>
</template>