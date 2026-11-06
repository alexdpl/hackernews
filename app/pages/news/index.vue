<!-- app/pages/news/index.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import DkpAdStrip from '~/components/DkpAdStrip.vue'

useDkpSeo({
  title: 'DKP Nodes — Hacker News AI Realtime Stream v2.5',
  description: 'Feed in tempo reale da Hacker News filtrato e tradotto da Trinity AI e validato dal punteggio di rilevanza Sentinel AI.'
})

// 🟢 1. Dichiara la variabile reattiva per evitare ReferenceError
const featuredArticles = ref<any[]>([])

onMounted(async () => {
  try {
    const res: any = await $fetch('/api/blog/posts')
    const raw = res?.success ? res.data : (Array.isArray(res) ? res : [])
    featuredArticles.value = raw.slice(0, 2)
  } catch (err) {
    console.error('Errore recupero articoli in evidenza:', err)
  }
})

const searchQuery = ref('')
const selectedCategory = ref('')
const minTechScore = ref(0)
const currentPage = ref(1)

const { data: response, pending } = await useFetch('/api/news', {
  query: {
    page: currentPage,
    limit: 12,
    q: searchQuery,
    minScore: minTechScore,
    category: selectedCategory
  },
  watch: [currentPage, searchQuery, minTechScore, selectedCategory]
})

const stories = computed(() => response.value?.data || [])
const meta = computed(() => response.value?.meta || { totalPages: 1, total: 0 })

function getScoreBadgeColor(score: number) {
  if (score >= 80) return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
  if (score >= 50) return 'border-sky-500/40 bg-sky-500/10 text-sky-400'
  return 'border-amber-500/40 bg-amber-500/10 text-amber-400'
}

function parseTags(tags: any): string[] {
  if (Array.isArray(tags)) return tags
  if (typeof tags === 'string') {
    return tags.replace(/[{}]/g, '').split(',').map(t => t.trim().replace(/^"/, '').replace(/"$/, '')).filter(Boolean)
  }
  return []
}
</script>

<template>
  <div class="min-h-screen bg-[#020420] text-slate-100 px-4 py-12">
    <div class="max-w-6xl mx-auto flex flex-col gap-8">
      
      <!-- HERO HEADER -->
      <header class="text-center max-w-3xl mx-auto flex flex-col items-center gap-3">
        <div class="inline-flex items-center gap-2 bg-[#090d16] border border-emerald-500/30 px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.15)]">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span class="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
            DKP Nodes · Realtime HN Crawler Active
          </span>
        </div>

        <h1 class="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
          Hacker News <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-400">AI Stream</span>
        </h1>
        <p class="text-slate-400 text-sm sm:text-base leading-relaxed">
          Notizie tecnologiche in tempo reale arricchite con riassunti in italiano di Trinity AI e filtrate da Sentinel AI Score.
        </p>
      </header>

      <!-- BARRA DI RICERCA & FILTRI -->
      <div class="bg-[#090d16] border border-slate-800 rounded-xl p-4 sm:p-6 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xl">
        
        <!-- Search Input -->
        <div class="relative w-full md:w-1/2">
          <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Cerca per tecnologia o parola chiave (es. Rust, Docker, AI)..." 
            class="w-full bg-[#020420] border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
            @input="currentPage = 1"
          />
        </div>

        <!-- Filter Controls -->
        <div class="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          
          <!-- Filter Category -->
          <button 
            @click="selectedCategory = ''; currentPage = 1"
            :class="['px-3 py-1.5 rounded-lg text-xs font-bold transition-all border', !selectedCategory ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-[#020420] text-slate-400 border-slate-800 hover:text-white']"
          >
            🔥 Tutti
          </button>
          <button 
            @click="selectedCategory = 'Show HN'; currentPage = 1"
            :class="['px-3 py-1.5 rounded-lg text-xs font-bold transition-all border', selectedCategory === 'Show HN' ? 'bg-sky-500/20 text-sky-400 border-sky-500/40' : 'bg-[#020420] text-slate-400 border-slate-800 hover:text-white']"
          >
            🚀 Show HN
          </button>

          <!-- Min Tech Score -->
          <div class="flex items-center gap-2 bg-[#020420] border border-slate-800 px-3 py-1.5 rounded-lg">
            <span class="text-xs font-mono text-slate-400">Score &ge; {{ minTechScore }}</span>
            <input 
              v-model.number="minTechScore" 
              type="range" 
              min="0" 
              max="90" 
              step="10" 
              class="w-20 accent-emerald-400 cursor-pointer"
              @change="currentPage = 1"
            />
          </div>
        </div>
      </div>

      <!-- FEED GRID -->
      <div v-if="pending" class="text-center py-20 text-emerald-400 font-mono animate-pulse">
        ⚡ Ingestione notizie dal Vault DKP Nodes in corso...
      </div>

      <div v-else-if="stories.length === 0" class="text-center py-16 bg-[#090d16] border border-slate-800 rounded-xl">
        <div class="text-4xl mb-3">📡</div>
        <h3 class="text-lg font-bold text-white">Nessuna notizia trovata</h3>
        <p class="text-slate-400 text-xs mt-1">Prova a resettare i filtri di ricerca o attendere la prossima cron job.</p>
        <button @click="searchQuery = ''; selectedCategory = ''; minTechScore = 0" class="mt-4 px-4 py-2 bg-emerald-500 text-slate-950 font-bold text-xs rounded-lg hover:bg-emerald-400 transition-all">
          Ripristina Filtri
        </button>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <article 
          v-for="item in stories" 
          :key="item.id"
          class="bg-[#090d16] border border-slate-800/80 hover:border-emerald-500/40 rounded-xl p-5 flex flex-col justify-between transition-all hover:-translate-y-1 shadow-lg group"
        >
          <div>
            <!-- Header Badges -->
            <div class="flex items-center justify-between mb-3">
              <span :class="['px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase border', getScoreBadgeColor(item.tech_score)]">
                🛡️ Sentinel Score: {{ item.tech_score }}
              </span>
              <span class="text-xs font-mono text-slate-400">
                👍 {{ item.hn_points || 0 }} pts
              </span>
            </div>

            <!-- Title -->
            <h2 class="text-base font-bold text-white group-hover:text-emerald-400 transition-colors leading-snug mb-2">
              <NuxtLink :to="`/news/${item.slug}`">
                {{ item.title }}
              </NuxtLink>
            </h2>

            <!-- AI Summary Preview -->
            <p class="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-4">
              {{ item.summary_it || 'In attesa di sintesi Trinity AI...' }}
            </p>
          </div>

          <!-- Footer Metadata -->
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

      <!-- PAGINAZIONE -->
      <div v-if="meta.totalPages > 1" class="flex justify-center items-center gap-3 pt-6 border-t border-slate-800">
        <button 
          :disabled="currentPage === 1"
          @click="currentPage--"
          class="px-4 py-2 bg-[#090d16] border border-slate-800 text-slate-300 rounded-lg text-xs font-bold disabled:opacity-40 hover:border-emerald-500 hover:text-emerald-400 transition-all"
        >
          ← Precedente
        </button>
        <span class="text-xs font-mono text-slate-400">Pagina {{ currentPage }} di {{ meta.totalPages }}</span>
        <button 
          :disabled="currentPage === meta.totalPages"
          @click="currentPage++"
          class="px-4 py-2 bg-[#090d16] border border-slate-800 text-slate-300 rounded-lg text-xs font-bold disabled:opacity-40 hover:border-emerald-500 hover:text-emerald-400 transition-all"
        >
          Successiva →
        </button>
      </div>

      <!-- 🟢 2. SEZIONE VAULT (Consigliati) STYLING TAILWIND INTEGRATO -->
      <div v-if="featuredArticles.length > 0" class="pt-8 mt-4 border-t border-slate-800">
        <h3 class="text-base font-bold text-white mb-4 flex items-center gap-2">
          <span>🔗</span> Approfondimenti dal Vault
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NuxtLink 
            v-for="art in featuredArticles" 
            :key="art.id" 
            :to="`/blog/${art.slug || art.id}`"
            class="bg-[#090d16] border border-slate-800 hover:border-emerald-500/50 rounded-xl p-5 flex flex-col justify-between transition-all hover:-translate-y-0.5 shadow-md group"
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

      <!-- BANNER AD SPONSORED STREAM -->
      <DkpAdStrip categoryTag="DKP NODES AI SPONSORED STREAM" />

    </div>
  </div>
</template>