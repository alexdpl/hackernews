<script setup lang="ts">
import { computed } from 'vue'

const { data: newsRes, pending, refresh } = await useFetch<any>('/api/news', {
  key: 'dkp-home-live-crawler-news',
  query: { type: 'top', page: 1, limit: 8 }
})

const newsItems = computed<any[]>(() => {
  const raw = newsRes.value
  const items = raw?.data || raw?.items || (Array.isArray(raw) ? raw : [])
  return items.slice(0, 8)
})

function buildNewsInternalUrl(item: any): string {
  if (item?.slug) return `/news/${item.slug}`
  return `/item/${item.id}`
}
</script>

<template>
  <div class="bg-dkp-card/95 border border-emerald-500/30 rounded-2xl p-6 card-glow">
    <div class="flex items-center justify-between mb-5 border-b border-dkp-border pb-4">
      <div class="flex items-center gap-2.5">
        <span class="status-dot bg-emerald-400 text-emerald-400"></span>
        <h3 class="text-lg font-bold text-emerald-400 m-0 font-display">&#129302; Crawler AI &mdash; Live Tech Feed</h3>
      </div>
      <button
        type="button"
        @click="() => refresh()"
        class="text-xs font-mono text-emerald-400 hover:text-cyan-400 bg-dkp-bg border border-emerald-500/35 hover:border-cyan-400/60 px-3 py-1.5 rounded-lg cursor-pointer transition-colors font-bold"
      >
        &#8635; Aggiorna Feed
      </button>
    </div>

    <div v-if="pending && newsItems.length === 0" class="py-8 text-center font-mono text-xs text-emerald-400 animate-pulse">
      &#9889; Sincronizzazione stream Pure SQL in corso...
    </div>

    <div v-else-if="newsItems.length === 0" class="py-8 text-center font-mono text-xs text-slate-300">
      Nessuna news recente in coda. Avvia il Crawler dal Control Panel.
    </div>

    <div v-else class="space-y-3">
      <article
        v-for="item in newsItems"
        :key="item.id"
        class="bg-gradient-to-r from-emerald-500/[0.05] via-dkp-bg/90 to-dkp-bg border border-emerald-500/25 hover:border-cyan-400/60 rounded-xl p-4 transition-all flex items-start justify-between gap-3 group"
      >
        <div>
          <a
            v-if="item.url"
            :href="item.url"
            target="_blank"
            rel="noopener noreferrer"
            class="text-sm sm:text-base font-bold text-emerald-400 group-hover:text-cyan-400 no-underline transition-colors block leading-snug"
          >
            {{ item.title }} &nearr;
          </a>
          <NuxtLink
            v-else
            :to="buildNewsInternalUrl(item)"
            class="text-sm sm:text-base font-bold text-emerald-400 group-hover:text-cyan-400 no-underline transition-colors block leading-snug"
          >
            {{ item.title }} &rarr;
          </NuxtLink>

          <div class="flex flex-wrap items-center gap-3 mt-1.5 font-mono text-[11px] text-slate-300">
            <span class="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
              TRINITY-AI
            </span>
            <span class="text-emerald-300 font-bold">&#9650; {{ item.points || item.score || 1 }} pts</span>
            <span>by {{ item.author || 'crawler_bot' }}</span>
            <NuxtLink
              :to="buildNewsInternalUrl(item)"
              class="text-emerald-400 hover:text-cyan-400 no-underline font-bold transition-colors"
            >
              &#128172; Scheda SEO &amp; Discussione &rarr;
            </NuxtLink>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>