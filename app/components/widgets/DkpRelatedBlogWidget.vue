<script setup lang="ts">
import { computed, onMounted } from 'vue'

const { data: blogRes, pending, refresh } = await useFetch<any>('/api/blog/posts', {
  query: { limit: 5 },
  default: () => ({ data: [] })
})

const articles = computed<any[]>(() => {
  const raw = blogRes.value
  const list = raw?.data || raw?.posts || raw?.articles || (Array.isArray(raw) ? raw : [])
  return list.slice(0, 5)
})

onMounted(() => {
  if (articles.value.length === 0) {
    void refresh()
  }
})
</script>

<template>
  <div class="bg-dkp-card/95 border border-amber-500/35 rounded-2xl p-6 card-glow">
    <div class="flex items-center justify-between mb-5 border-b border-dkp-border pb-4">
      <div class="flex items-center gap-2.5">
        <span class="status-dot bg-amber-400 text-amber-400"></span>
        <h3 class="text-base sm:text-lg font-bold text-amber-400 m-0 font-display">&#128221; Ultimi Articoli dal Blog</h3>
      </div>
      <div class="flex items-center gap-2 font-mono">
        <button
          type="button"
          @click="() => refresh()"
          class="text-xs text-amber-400 hover:text-cyan-400 bg-dkp-bg border border-amber-500/35 hover:border-cyan-400/60 px-2.5 py-1 rounded-lg cursor-pointer transition-colors font-bold"
        >
          &#8635;
        </button>
        <NuxtLink to="/blog" class="text-xs text-amber-400 hover:text-cyan-400 no-underline font-bold transition-colors">
          Tutti &rarr;
        </NuxtLink>
      </div>
    </div>

    <div v-if="pending && articles.length === 0" class="py-6 text-center font-mono text-xs text-amber-400 animate-pulse">
      &#9889; Caricamento articoli dal database Pure SQL...
    </div>

    <div v-else-if="articles.length === 0" class="py-6 text-center font-mono text-xs text-slate-300">
      Nessun articolo pubblicato al momento.
    </div>

    <div v-else class="space-y-3">
      <article
        v-for="art in articles"
        :key="art.id"
        class="bg-gradient-to-r from-amber-500/[0.06] via-dkp-bg/95 to-dkp-bg border border-amber-500/25 hover:border-cyan-400/60 rounded-xl p-3.5 transition-all group"
      >
        <NuxtLink
          :to="art.slug ? `/blog/${art.slug}` : '/blog'"
          class="text-sm font-bold text-amber-400 group-hover:text-cyan-400 no-underline transition-colors block leading-snug"
        >
          {{ art.title }} &rarr;
        </NuxtLink>
        <div class="flex flex-wrap items-center gap-2.5 mt-1.5 font-mono text-[11px] text-slate-300">
          <span class="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
            {{ art.category || 'EDITORIAL' }}
          </span>
          <span>by @{{ art.authorName || 'alexdpl' }}</span>
          <span class="text-slate-400">{{ art.createdAt ? new Date(art.createdAt).toLocaleDateString('it-IT') : 'Recente' }}</span>
        </div>
      </article>
    </div>
  </div>
</template>