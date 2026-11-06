<!-- app/components/DkpNodesHomeWidget.vue -->
<script setup lang="ts">
const { data: newsRes } = await useFetch('/api/news', {
  query: { limit: 4, minScore: 50 }
})

const stories = computed(() => newsRes.value?.data || [])
</script>

<template>
  <section class="py-12 bg-[#020420] border-t border-b border-slate-800/80">
    <div class="max-w-6xl mx-auto px-4">
      <div class="flex items-center justify-between mb-8">
        <div>
          <div class="inline-flex items-center gap-2 text-emerald-400 font-mono text-xs uppercase tracking-widest mb-1">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            DKP Nodes Live Stream
          </div>
          <h2 class="text-2xl sm:text-3xl font-extrabold text-white">Hacker News <span class="text-emerald-400">AI Stream</span></h2>
        </div>
        <NuxtLink to="/news" class="text-xs font-mono font-bold text-emerald-400 hover:underline">
          Vedi tutto lo Stream ↗
        </NuxtLink>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <article v-for="item in stories" :key="item.id" class="bg-[#090d16] border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
          <div>
            <span class="text-[10px] font-mono font-bold text-sky-400 border border-sky-500/30 px-2 py-0.5 rounded bg-sky-500/10">
              🛡️ Score {{ item.tech_score }}
            </span>
            <h3 class="text-sm font-bold text-white mt-2 line-clamp-2 hover:text-emerald-400">
              <NuxtLink :to="`/news/${item.slug}`">{{ item.title }}</NuxtLink>
            </h3>
            <p class="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
              {{ item.summary_it }}
            </p>
          </div>
          <NuxtLink :to="`/news/${item.slug}`" class="mt-4 text-[11px] font-mono text-emerald-400 font-bold">
            Leggi scheda ↗
          </NuxtLink>
        </article>
      </div>
    </div>
  </section>
</template>