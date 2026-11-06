<!-- app/pages/index.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import DkpAdStrip from '~/components/DkpAdStrip.vue'

useDkpSeo({
  title: 'DevKernelPulse — The Developer Ecosystem & AI Tech Stream',
  description: 'Infrastruttura per sviluppatori, strumenti di sicurezza notarizzati e newsroom AI in tempo reale da Hacker News.'
})

// 1. Recupera i 6 articoli migliori dal motore DKP Nodes
const { data: newsRes, pending: newsPending } = await useFetch('/api/news', {
  query: { limit: 6, minScore: 40 }
})

const feedStories = computed(() => newsRes.value?.data || [])

// 2. Recupero dinamico articoli in evidenza dal Vault
const featuredArticles = ref<any[]>([])

onMounted(async () => {
  try {
    const res: any = await $fetch('/api/blog/posts')
    const raw = res?.success ? res.data : (Array.isArray(res) ? res : [])
    featuredArticles.value = raw.slice(0, 2)
  } catch (err) {
    console.error('Errore recupero articoli Vault:', err)
  }
})

function parseTags(tags: any): string[] {
  if (Array.isArray(tags)) return tags
  if (typeof tags === 'string') {
    return tags.replace(/[{}]/g, '').split(',').map(t => t.trim().replace(/^"/, '').replace(/"$/, '')).filter(Boolean)
  }
  return []
}
</script>

<template>
  <div class="min-h-screen bg-[#020420] text-slate-100">
    
    <!-- HERO SECTION PRINCIPALE -->
    <section class="relative py-16 sm:py-24 px-4 text-center border-b border-slate-800/80 overflow-hidden">
      <div class="max-w-4xl mx-auto flex flex-col items-center gap-6 relative z-10">
        <div class="inline-flex items-center gap-2 bg-[#090d16] border border-emerald-500/30 px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.15)]">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span class="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
            DevKernelPulse v2.5 Ecosystem
          </span>
        </div>

        <h1 class="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
          La Piattaforma per <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-400">Sviluppatori &amp; Sentinel AI</span>
        </h1>

        <p class="text-slate-400 text-base sm:text-lg max-w-2xl leading-relaxed">
          Notarizzazione del codice, strumenti di sicurezza e aggregatore Hacker News arricchito in tempo reale da Trinity AI.
        </p>

        <div class="flex flex-wrap gap-4 justify-center">
          <NuxtLink to="/news" class="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            🚀 Esplora DKP AI Stream
          </NuxtLink>
          <NuxtLink to="/tools" class="px-6 py-3 bg-[#090d16] border border-slate-700 hover:border-slate-500 text-white font-bold text-sm rounded-xl transition-all">
            🛠️ Developer Tools
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- 🟢 SEZIONE DKP NODES: LIVE HACKER NEWS STREAM (FEED INTEGRATO IN HOME) -->
    <section class="py-16 px-4 max-w-6xl mx-auto flex flex-col gap-12">
      
      <div>
        <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 border-b border-slate-800 pb-4">
          <div>
            <div class="inline-flex items-center gap-2 text-emerald-400 font-mono text-xs uppercase tracking-widest mb-1">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              DKP Nodes Realtime Stream
            </div>
            <h2 class="text-3xl font-extrabold text-white">
              Hacker News <span class="text-sky-400">AI Feed</span>
            </h2>
          </div>

          <NuxtLink to="/news" class="text-xs font-mono font-bold text-emerald-400 hover:underline flex items-center gap-1">
            <span>Vedi tutto l'AI Stream</span>
            <span>→</span>
          </NuxtLink>
        </div>

        <!-- State: Loading -->
        <div v-if="newsPending" class="text-center py-12 text-emerald-400 font-mono animate-pulse">
          ⚡ Caricamento flusso in tempo reale...
        </div>

        <!-- State: Grid Articoli -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <article 
            v-for="item in feedStories" 
            :key="item.id"
            class="bg-[#090d16] border border-slate-800/80 hover:border-emerald-500/40 rounded-xl p-5 flex flex-col justify-between transition-all hover:-translate-y-1 shadow-lg group"
          >
            <div>
              <div class="flex items-center justify-between mb-3">
                <span class="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase border border-emerald-500/40 bg-emerald-500/10 text-emerald-400">
                  🛡️ Score: {{ item.tech_score }}
                </span>
                <span class="text-xs font-mono text-slate-400">
                  👍 {{ item.hn_points || 0 }} pts
                </span>
              </div>

              <h3 class="text-base font-bold text-white group-hover:text-emerald-400 transition-colors leading-snug mb-2">
                <NuxtLink :to="`/news/${item.slug}`">
                  {{ item.title }}
                </NuxtLink>
              </h3>

              <p class="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-4">
                {{ item.summary_it || 'In attesa di sintesi Trinity AI...' }}
              </p>
            </div>

            <div class="pt-3 border-t border-slate-800/60 flex flex-col gap-3">
              <div class="flex flex-wrap gap-1.5">
                <span v-for="tag in parseTags(item.tags)" :key="tag" class="text-[10px] font-mono bg-[#020420] text-sky-400 border border-slate-800 px-2 py-0.5 rounded">
                  #{{ tag }}
                </span>
              </div>

              <div class="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>by {{ item.hn_by || 'hn' }}</span>
                <NuxtLink :to="`/news/${item.slug}`" class="text-emerald-400 font-bold hover:underline">
                  Leggi scheda ↗
                </NuxtLink>
              </div>
            </div>
          </article>
        </div>
      </div>

      <!-- 🟢 SEZIONE VAULT (Consigliati in Home) -->
      <div v-if="featuredArticles.length > 0" class="pt-8 border-t border-slate-800">
        <h3 class="text-base font-bold text-white mb-4 flex items-center gap-2">
          <span>🔗</span> Approfondimenti dal Vault
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NuxtLink 
            v-for="art in featuredArticles" 
            :key="art.id" 
            :to="`/blog/${art.slug || art.id}`"
            class="bg-[#090d16] border border-slate-800 hover:border-emerald-500/50 rounded-xl p-5 flex flex-col justify-between transition-all hover:-translate-y-0.5 shadow-md group text-left"
          >
            <div>
              <span class="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                {{ art.categoryName || art.category || 'Tech' }}
              </span>
              <h4 class="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors mt-1 leading-snug">
                {{ art.title }}
              </h4>
            </div>
            <span class="text-xs font-mono font-bold text-sky-400 group-hover:underline mt-4">
              Leggi articolo ➔
            </span>
          </NuxtLink>
        </div>
      </div>

      <!-- BANNER AD SPONSORED ECOSYSTEM -->
      <DkpAdStrip categoryTag="DKP ECOSYSTEM HOME SPONSORED" />

    </section>

  </div>
</template>