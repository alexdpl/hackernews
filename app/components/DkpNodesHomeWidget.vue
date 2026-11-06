<!-- app/components/DkpNodesHomeWidget.vue -->
<script setup lang="ts">
import { computed } from 'vue'

const { data: newsRes } = await useFetch('/api/news', {
  query: { limit: 4, minScore: 40 }
})

const stories = computed(() => newsRes.value?.data || [])

function getScoreBadgeColor(score: number) {
  if (score >= 80) return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
  if (score >= 50) return 'border-sky-500/40 bg-sky-500/10 text-sky-400'
  return 'border-amber-500/40 bg-amber-500/10 text-amber-400'
}
</script>

<template>
  <section class="bg-[#090d16] border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden my-6">
    <!-- Glow accent di sfondo in alto a destra -->
    <div class="absolute top-0 right-0 w-80 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

    <!-- HEADER WIDGET -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800/80 relative z-10">
      <div>
        <div class="inline-flex items-center gap-2 text-emerald-400 font-mono text-xs uppercase tracking-widest mb-1">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          DKP Nodes Live Stream
        </div>
        <h2 class="text-xl sm:text-2xl font-extrabold text-white">
          Hacker News <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-400">AI Stream</span>
        </h2>
      </div>

      <NuxtLink to="/news" class="text-xs font-mono font-bold text-emerald-400 hover:underline flex items-center gap-1">
        <span>Vedi tutto lo Stream</span>
        <span>↗</span>
      </NuxtLink>
    </div>

    <!-- GRID SCHEDE NOTIZIE -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
      <article 
        v-for="item in stories" 
        :key="item.id" 
        class="bg-[#020420] border border-slate-800/80 hover:border-emerald-500/40 rounded-xl p-4 flex flex-col justify-between transition-all hover:-translate-y-1 shadow-lg group"
      >
        <div>
          <div class="flex items-center justify-between mb-2.5">
            <span :class="['px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border', getScoreBadgeColor(item.tech_score)]">
              🛡️ Score: {{ item.tech_score }}
            </span>
            <span class="text-[10px] font-mono text-slate-400">
              👍 {{ item.hn_points || 0 }} pts
            </span>
          </div>

          <h3 class="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug mb-2">
            <NuxtLink :to="`/news/${item.slug}`">
              {{ item.title }}
            </NuxtLink>
          </h3>

          <p class="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-3">
            {{ item.summary_it || 'In attesa di sintesi Trinity AI...' }}
          </p>
        </div>

        <NuxtLink :to="`/news/${item.slug}`" class="text-[11px] font-mono text-emerald-400 font-bold hover:underline flex items-center gap-1 pt-2 border-t border-slate-800/60">
          <span>Leggi scheda</span>
          <span>↗</span>
        </NuxtLink>
      </article>
    </div>
  </section>
</template>