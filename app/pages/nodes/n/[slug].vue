<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import DkpLayout from '~/components/DkpLayout.vue'
import DkpThreadCard from '~/components/nodes/DkpThreadCard.vue'
import DkpVaultLedgerView from '~/components/vault/DkpVaultLedgerView.vue'
import DkpNodesNavBar from '~/components/nodes/DkpNodesNavBar.vue'
import DkpRelatedNodesWidget from '~/components/widgets/DkpRelatedNodesWidget.vue'
import DkpAdStrip from '~/components/DkpAdStrip.vue'
import { cleanNodeLabel } from '~/composables/useDkpNodes'

const route = useRoute()
const slug = computed(() => String(route.params.slug || 'general').toLowerCase().replace(/^(n\/)+/i, ''))
const { currentUser } = useAuthCore()

const { data: nodesRes } = await useFetch<any>('/api/nodes', { key: 'dkp-nodes-catalog-n' })
const { data: postsRes, pending, refresh } = await useFetch<any>('/api/nodes/posts', {
  key: () => `dkp-node-n-posts-${slug.value}`,
  query: () => ({ nodeSlug: slug.value, limit: 50 })
})

const allNodes = computed<any[]>(() => nodesRes.value?.data || [])

const currentNode = computed(() => {
  const found = allNodes.value.find((n: any) => String(n.slug || '').toLowerCase() === slug.value)
  if (found) {
    return {
      ...found,
      name: cleanNodeLabel(found.name || found.slug),
      category: found.parentName || found.category || 'DKP Ecosystem & Core'
    }
  }
  return {
    name: slug.value.replace(/-/g, ' ').toUpperCase(),
    slug: slug.value,
    category: 'DKP Ecosystem & Core',
    description: 'Nodo tematico tecnico e discussioni notarizzate su DevKernelPulse.'
  }
})

const posts = computed<any[]>(() => postsRes.value?.data || postsRes.value?.posts || [])
const searchQ = ref('')

const filteredPosts = computed(() => {
  const q = searchQ.value.toLowerCase().trim()
  if (!q) return posts.value
  return posts.value.filter(
    (p: any) =>
      String(p.title || '').toLowerCase().includes(q) ||
      String(p.content || '').toLowerCase().includes(q)
  )
})

async function handleToggleLock(thread: any) {
  const nextLocked = !thread.isLocked
  const res: any = await $fetch(`/api/nodes/posts/${thread.id}/close`, {
    method: 'PATCH',
    body: { isLocked: nextLocked }
  }).catch(() => null)
  if (res?.success) thread.isLocked = nextLocked
}

const seoTitle = computed(() => `n/${currentNode.value.slug} \u2014 ${currentNode.value.name} | DKP Talks Hub`)
const seoDescription = computed(() => currentNode.value.description || 'Discussioni tecniche e thread verificati con SHA-256 Vault.')

useDkpSeo({
  title: seoTitle,
  description: seoDescription,
  type: 'collection',
  canonicalPath: computed(() => `/nodes/n/${slug.value}`)
})

watch(slug, () => refresh())
</script>

<template>
  <DkpLayout
    :title="`n/${currentNode.slug}`"
    :subtitle="currentNode.description"
    :seo-title="seoTitle"
    :seo-description="seoDescription"
    :show-sidebar-ads="true"
  >
    <div class="space-y-5">
      <!-- BREADCRUMB GERARCHICA MACRO-NODO -> SUB-NODO -->
      <nav aria-label="Breadcrumb" class="bg-dkp-card/90 border border-dkp-border rounded-xl px-4 py-2.5 font-mono text-xs text-slate-400">
        <ol class="flex items-center gap-2 m-0 p-0 list-none flex-wrap">
          <li>
            <NuxtLink to="/" class="text-slate-400 hover:text-emerald-400 no-underline">Home</NuxtLink>
          </li>
          <li class="text-slate-600">/</li>
          <li>
            <NuxtLink to="/nodes" class="text-slate-300 hover:text-violet-300 no-underline">DKP Talks Hub</NuxtLink>
          </li>
          <li class="text-slate-600">/</li>
          <li>
            <NuxtLink
              :to="{ path: '/nodes', query: { group: currentNode.category } }"
              class="text-violet-300 hover:text-cyan-300 font-bold no-underline"
            >
              {{ /dkp\s*ecosystem/i.test(String(currentNode.category || '')) ? 'DKP Talks' : currentNode.category }}
            </NuxtLink>
          </li>
          <li class="text-slate-600">/</li>
          <li aria-current="page" class="text-emerald-400 font-bold">
            n/{{ currentNode.slug }}
          </li>
        </ol>
      </nav>

      <!-- NAVBAR RAPIDA 10 MACRO-NODI -->
      <DkpNodesNavBar :nodes="allNodes" @create-thread="navigateTo('/user/dashboard?tab=content&subtab=nodes&new=1')" />

      <!-- BLOCKCHAIN VAULT LEDGER UNIFICATO (3 SEZIONI FILTRABILI) -->
      <DkpVaultLedgerView v-if="slug === 'blockchain-vault'" />

      <!-- HEADER DEL NODO -->
      <div class="bg-dkp-card/95 border border-violet-500/35 rounded-2xl p-5 card-glow flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div class="font-mono text-xs text-violet-300 font-bold">
            {{ /dkp\s*ecosystem/i.test(String(currentNode.category || '')) ? 'DKP Talks' : currentNode.category }} &bull; /nodes/n/{{ currentNode.slug }}
          </div>
          <h1 class="text-xl sm:text-2xl font-extrabold text-white m-0 mt-1">{{ currentNode.name }}</h1>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <input
            v-model="searchQ"
            type="text"
            placeholder="Filtra discussioni..."
            class="bg-dkp-bg border border-dkp-border text-white px-3.5 py-2 rounded-xl font-mono text-xs outline-none focus:border-violet-400"
          />
          <NuxtLink
            to="/user/dashboard?tab=content&subtab=nodes&new=1"
            class="px-3.5 py-2 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-mono text-xs font-extrabold no-underline whitespace-nowrap"
          >
            + Nuovo Thread
          </NuxtLink>
        </div>
      </div>

      <div v-if="pending && filteredPosts.length === 0" class="bg-dkp-card border border-dkp-border rounded-2xl p-8 text-center font-mono text-xs text-violet-400 animate-pulse">
        Caricamento thread del nodo n/{{ slug }}...
      </div>

      <div v-else-if="filteredPosts.length === 0" class="bg-dkp-card border border-dkp-border rounded-2xl p-8 text-center font-mono text-xs text-slate-300">
        Nessuna discussione attiva in n/{{ slug }}. Avvia un nuovo thread da <NuxtLink to="/user/dashboard?tab=content&subtab=nodes&new=1" class="text-cyan-400">Dashboard &rarr; Nodi</NuxtLink>.
      </div>

      <div v-else class="space-y-3.5">
        <DkpThreadCard
          v-for="thread in filteredPosts"
          :key="thread.id"
          :thread="thread"
          :can-moderate="Boolean(currentUser)"
          @toggle-lock="handleToggleLock"
        />
      </div>

      <DkpRelatedNodesWidget :current-slug="slug" />
      <DkpAdStrip />
    </div>
  </DkpLayout>
</template>