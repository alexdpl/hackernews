<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import DkpLayout from '~/components/DkpLayout.vue'
import DkpRelatedNodesWidget from '~/components/widgets/DkpRelatedNodesWidget.vue'
import DkpAdStrip from '~/components/DkpAdStrip.vue'

const route = useRoute()
const slug = computed(() => String(route.params.slug || 'general').toLowerCase())

const { data: nodesRes } = await useFetch<any>('/api/nodes', { key: 'dkp-nodes-catalog-n' })
const { data: postsRes, pending, refresh } = await useFetch<any>('/api/nodes/posts', {
  key: () => `dkp-node-n-posts-${slug.value}`,
  query: () => ({ nodeSlug: slug.value, limit: 50 })
})

const currentNode = computed(() => {
  const list = nodesRes.value?.data || []
  return list.find((n: any) => String(n.slug || '').toLowerCase() === slug.value) || {
    name: slug.value.replace(/-/g, ' ').toUpperCase(),
    slug: slug.value,
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
    icon=""
    :seo-title="seoTitle"
    :seo-description="seoDescription"
  >
    <div class="space-y-6">
      <div class="bg-dkp-card/95 border border-violet-500/35 rounded-2xl p-5 card-glow flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div class="font-mono text-xs text-violet-300 font-bold">NODO TEMATICO &bull; /nodes/n/{{ currentNode.slug }}</div>
          <h1 class="text-xl sm:text-2xl font-extrabold text-white m-0 mt-1">{{ currentNode.name }}</h1>
        </div>

        <div class="flex items-center gap-2">
          <input
            v-model="searchQ"
            type="text"
            placeholder="Filtra discussioni..."
            class="bg-dkp-bg border border-dkp-border text-white px-3.5 py-2 rounded-xl font-mono text-xs outline-none focus:border-violet-400"
          />
          <NuxtLink
            to="/nodes"
            class="px-3.5 py-2 rounded-xl bg-violet-500/20 border border-violet-500/40 text-violet-200 font-mono text-xs font-bold no-underline whitespace-nowrap"
          >
            Tutti i Nodi
          </NuxtLink>
        </div>
      </div>

      <div v-if="pending && filteredPosts.length === 0" class="bg-dkp-card border border-dkp-border rounded-2xl p-8 text-center font-mono text-xs text-violet-400">
        Caricamento thread del nodo n/{{ slug }}...
      </div>

      <div v-else-if="filteredPosts.length === 0" class="bg-dkp-card border border-dkp-border rounded-2xl p-8 text-center font-mono text-xs text-slate-300">
        Nessuna discussione attiva in n/{{ slug }}. Avvia un nuovo thread da <NuxtLink to="/nodes" class="text-cyan-400">DKP Talks Hub</NuxtLink>.
      </div>

      <div v-else class="space-y-3">
        <article
          v-for="p in filteredPosts"
          :key="p.id"
          class="bg-dkp-card/95 border border-dkp-border hover:border-violet-400/60 rounded-2xl p-5 card-glow transition-all"
        >
          <NuxtLink
            :to="p.sourceType === 'blog' && p.slug ? `/blog/${p.slug}` : `/nodes/thread/${String(p.id).replace(/^blog-/, '')}`"
            class="text-base font-bold text-white hover:text-cyan-300 no-underline block"
          >
            {{ p.title }} &rarr;
          </NuxtLink>
          <p v-if="p.content" class="text-slate-400 text-xs mt-1.5 mb-2 line-clamp-2">
            {{ p.content }}
          </p>
          <div class="flex flex-wrap items-center gap-3 font-mono text-[11px] text-slate-400">
            <span class="text-emerald-400 font-bold"> {{ p.karmaScore || p.karma_score || 1 }} karma</span>
            <span>by @{{ p.authorUsername || p.authorName || 'dkp_dev' }}</span>
            <span>{{ p.commentsCount || 0 }} risposte</span>
            <span v-if="p.vaultHash" class="px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/35 font-bold">
              SHA-256 VERIFIED
            </span>
          </div>
        </article>
      </div>

      <DkpRelatedNodesWidget :current-slug="slug" />
      <DkpAdStrip />
    </div>
  </DkpLayout>
</template>