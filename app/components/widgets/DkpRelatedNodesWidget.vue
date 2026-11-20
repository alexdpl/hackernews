<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ currentSlug?: string }>()

const { data: postsRes, pending, refresh } = await useFetch<any>('/api/nodes/posts', {
  key: `dkp-related-node-threads-${props.currentSlug || 'home'}`,
  query: { limit: 8 }
})

const threads = computed<any[]>(() => {
  const raw = postsRes.value
  const items = raw?.data || raw?.posts || (Array.isArray(raw) ? raw : [])
  return items
    .filter((t: any) => !props.currentSlug || String(t.nodeSlug || '').toLowerCase() !== String(props.currentSlug).toLowerCase())
    .slice(0, 5)
})

function buildThreadLink(t: any): string {
  const rawId = String(t.id || '')
  if (rawId.startsWith('blog-') && t.slug) return `/blog/${t.slug}`
  return `/nodes/thread/${rawId.replace(/^blog-/, '')}`
}
</script>

<template>
  <div class="bg-dkp-card/95 border border-violet-500/35 rounded-2xl p-6 card-glow">
    <div class="flex items-center justify-between mb-5 border-b border-dkp-border pb-4">
      <div class="flex items-center gap-2.5">
        <span class="status-dot bg-violet-400 text-violet-400"></span>
        <h3 class="text-base sm:text-lg font-bold text-violet-400 m-0 font-display">&#128172; Ultime Discussioni nei Nodi</h3>
      </div>
      <div class="flex items-center gap-2 font-mono">
        <button
          type="button"
          @click="() => refresh()"
          class="text-xs text-violet-400 hover:text-cyan-400 bg-dkp-bg border border-violet-500/35 hover:border-cyan-400/60 px-2.5 py-1 rounded-lg cursor-pointer transition-colors font-bold"
        >
          &#8635;
        </button>
        <NuxtLink to="/nodes" class="text-xs text-violet-400 hover:text-cyan-400 no-underline font-bold transition-colors">
          Nodi &rarr;
        </NuxtLink>
      </div>
    </div>

    <div v-if="pending && threads.length === 0" class="py-6 text-center font-mono text-xs text-violet-400 animate-pulse">
      &#9889; Caricamento discussioni dal database Pure SQL...
    </div>

    <div v-else-if="threads.length === 0" class="py-6 text-center font-mono text-xs text-slate-300">
      Nessuna discussione recente nei nodi.
    </div>

    <div v-else class="space-y-3">
      <article
        v-for="t in threads"
        :key="t.id"
        class="bg-gradient-to-r from-violet-500/[0.07] via-dkp-bg/95 to-dkp-bg border border-violet-500/25 hover:border-cyan-400/60 rounded-xl p-3.5 transition-all group"
      >
        <NuxtLink
          :to="buildThreadLink(t)"
          class="text-sm font-bold text-violet-400 group-hover:text-cyan-400 no-underline transition-colors block leading-snug"
        >
          {{ t.title }} &rarr;
        </NuxtLink>
        <div class="flex flex-wrap items-center gap-2.5 mt-1.5 font-mono text-[11px] text-slate-300">
          <NuxtLink
            :to="`/nodes/n/${t.nodeSlug || 'general'}`"
            class="px-2 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-500/30 font-bold no-underline"
          >
            n/{{ t.nodeSlug || 'general' }}
          </NuxtLink>
          <span>by @{{ t.authorName || t.authorUsername || 'dkp_dev' }}</span>
          <span v-if="t.vaultHash" class="text-emerald-400 font-bold">SHA-256</span>
        </div>
      </article>
    </div>
  </div>
</template>