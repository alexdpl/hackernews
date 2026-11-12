<!-- app/pages/news/index.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import DkpAdStrip from '~/components/DkpAdStrip.vue'
import DkpNodesHomeWidget from '~/components/DkpNodesHomeWidget.vue'

useHead({
  title: 'DKP Tech Feed — Hacker News AI Realtime Stream v2.6-PURE-SQL — DevKernelPulse',
  meta: [
    { name: 'description', content: 'Feed in tempo reale da Hacker News filtrato e tradotto da Trinity AI e validato dal punteggio di rilevanza Sentinel AI su architetture Pure SQL.' }
  ]
})

// Caricamento SSR-ready degli articoli del Vault correlati
const { data: vaultRes } = await useFetch('/api/blog/posts', {
  key: 'dkp-news-vault-featured-v26',
  lazy: true
})

const featuredArticles = computed(() => {
  const res: any = vaultRes.value
  const raw = res?.success ? res.data : (Array.isArray(res) ? res : [])
  return raw.slice(0, 2)
})

const copiedId = ref<string | number | null>(null)
function shareStory(id: string | number, slug?: string, url?: string) {
  const shareUrl = typeof window !== 'undefined'
    ? (slug ? `${window.location.origin}/news/${slug}` : (url || window.location.href))
    : ''
  if (typeof navigator !== 'undefined' && navigator.clipboard && shareUrl) {
    navigator.clipboard.writeText(shareUrl)
    copiedId.value = id
    setTimeout(() => { copiedId.value = null }, 2000)
  }
}

const searchQuery = ref('')
const selectedCategory = ref('')
const minTechScore = ref(0)
const currentPage = ref(1)
const isRefreshing = ref(false)

const { data: response, pending, refresh } = await useFetch('/api/news', {
  key: 'dkp-news-stream-v26',
  query: computed(() => ({
    page: currentPage.value,
    limit: 12,
    q: searchQuery.value,
    minScore: minTechScore.value,
    category: selectedCategory.value
  })),
  watch: [currentPage, searchQuery, minTechScore, selectedCategory]
})

const stories = computed(() => (response.value as any)?.data || [])
const meta = computed(() => (response.value as any)?.meta || { totalPages: 1, total: 0 })

async function refreshStream() {
  isRefreshing.value = true
  try {
    await refresh()
  } finally {
    setTimeout(() => { isRefreshing.value = false }, 350)
  }
}

function getTypeBadgeColor(type: string) {
  if (type === 'show') return 'border-purple-500/40 bg-purple-500/15 text-purple-400'
  if (type === 'ask') return 'border-sky-500/40 bg-sky-500/15 text-sky-400'
  return 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
}

function parseTags(tags: any): string[] {
  if (Array.isArray(tags)) return tags
  if (typeof tags === 'string') {
    return tags.replace(/[{}]/g, '').split(',').map(t => t.trim().replace(/^"/, '').replace(/"$/, '')).filter(Boolean)
  }
  return ['Tech', 'HackerNews']
}
</script>

<template>
  <div class="min-h-screen bg-[#020420] text-slate-100 px-4 sm:px-6 py-10 sm:py-14 font-sans">
    <div class="max-w-6xl mx-auto flex flex-col gap-8">
      
      <!-- HERO HEADER v2.6-PURE-SQL -->
      <header class="bg-[#090d16] border border-slate-800 rounded-3xl p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden">
        <div class="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-36 bg-emerald-500/10 blur-[110px] rounded-full pointer-events-none"></div>

        <!-- Badge Stato Crawler -->
        <div class="flex justify-center mb-5 relative z-10">
          <div class="inline-flex items-center gap-2 bg-[#020420] border border-emerald-500/30 px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span class="text-[11px] font-mono font-extrabold text-emerald-400 uppercase tracking-widest">
              🌍 DKP TECH FEED · REALTIME HN CRAWLER v2.6-PURE-SQL
            </span>
          </div>
        </div>

        <h1 class="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4 relative z-10">
          Hacker News <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-400">AI Stream</span>
        </h1>

        <p class="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed mb-7 relative z-10">
          Notizie tecnologiche in tempo reale arricchite con riassunti in italiano di Trinity AI, validate da Sentinel Score e archiviate su Neon PostgreSQL.
        </p>

        <!-- BARRA 4 PILASTRI DELL'ECOSISTEMA -->
        <nav aria-label="Navigazione Ecosistema DKP" class="flex flex-wrap gap-3 justify-center mb-8 relative z-10 font-mono">
          <NuxtLink
            to="/news"
            class="px-4 sm:px-5 py-2.5 bg-emerald-500 text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.35)]"
          >
            🌍 DKP Tech Feed
          </NuxtLink>

          <NuxtLink
            to="/nodes"
            class="px-4 sm:px-5 py-2.5 bg-[#020420] border border-slate-700 hover:border-purple-400 text-purple-400 font-extrabold text-xs rounded-xl transition-all shadow-lg"
          >
            💬 DKP Talks Hub
          </NuxtLink>

          <NuxtLink
            to="/tools"
            class="px-4 sm:px-5 py-2.5 bg-[#020420] border border-slate-700 hover:border-sky-400 text-sky-400 font-extrabold text-xs rounded-xl transition-all shadow-lg"
          >
            🛠️ Developer Tools
          </NuxtLink>

          <NuxtLink
            to="/blog"
            class="px-4 sm:px-5 py-2.5 bg-[#020420] border border-slate-700 hover:border-emerald-400 text-emerald-300 font-extrabold text-xs rounded-xl transition-all shadow-lg"
          >
            ✍️ DKP Editorial Hub
          </NuxtLink>
        </nav>

        <!-- CTA RAPIDE STREAM -->
        <div class="flex flex-wrap justify-center items-center gap-3 relative z-10 font-mono">
          <button
            type="button"
            @click="refreshStream"
            :disabled="isRefreshing || pending"
            class="px-4 py-2.5 bg-[#020420] hover:bg-slate-900 text-slate-300 hover:text-emerald-400 border border-slate-800 hover:border-emerald-500/40 font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            <span :class="{ 'inline-block animate-spin': isRefreshing }">🔄</span>
            {{ isRefreshing ? ' Sincronizzazione Stream...' : ' Aggiorna Stream Live' }}
          </button>

          <span class="text-xs text-slate-400 bg-[#020420] border border-slate-800 px-3.5 py-2.5 rounded-xl">
            📡 <strong class="text-emerald-400">{{ meta.total || stories.length }}</strong> nodi indicizzati
          </span>
        </div>
      </header>

      <!-- BARRA DI RICERCA & FILTRI -->
      <div class="bg-[#090d16] border border-slate-800 rounded-2xl p-4 sm:p-6 flex flex-col lg:flex-row gap-4 items-center justify-between shadow-xl">
        
        <!-- Search Input -->
        <div class="relative w-full lg:w-1/2 flex items-center bg-[#020420] border border-slate-800 focus-within:border-emerald-500 rounded-xl px-3.5 py-2.5 transition-colors">
          <span class="text-slate-500 mr-2.5">🔍</span>
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Cerca per tecnologia o parola chiave (es. Rust, Docker, AI, SQL)..." 
            class="w-full bg-transparent text-sm text-white focus:outline-none placeholder-slate-500"
            @input="currentPage = 1"
          />
          <button
            v-if="searchQuery"
            type="button"
            @click="searchQuery = ''; currentPage = 1"
            class="text-rose-400 hover:text-rose-300 font-black text-base px-1 cursor-pointer"
          >
            ×
          </button>
        </div>

        <!-- Filter Controls -->
        <div class="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-start lg:justify-end font-mono">
          <button 
            type="button"
            @click="selectedCategory = ''; currentPage = 1"
            :class="['px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer', !selectedCategory ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.15)]' : 'bg-[#020420] text-slate-400 border-slate-800 hover:text-white']"
          >
            🔥 Tutti
          </button>
          <button 
            type="button"
            @click="selectedCategory = 'show'; currentPage = 1"
            :class="['px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer', selectedCategory === 'show' ? 'bg-purple-500/20 text-purple-400 border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.15)]' : 'bg-[#020420] text-slate-400 border-slate-800 hover:text-white']"
          >
            🚀 Show HN
          </button>
          <button 
            type="button"
            @click="selectedCategory = 'ask'; currentPage = 1"
            :class="['px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer', selectedCategory === 'ask' ? 'bg-sky-500/20 text-sky-400 border-sky-500/40 shadow-[0_0_12px_rgba(56,189,248,0.15)]' : 'bg-[#020420] text-slate-400 border-slate-800 hover:text-white']"
          >
            💡 Ask HN
          </button>

          <!-- Min Tech Score -->
          <div class="flex items-center gap-2 bg-[#020420] border border-slate-800 px-3.5 py-2 rounded-xl">
            <span class="text-xs text-slate-400">Score &ge; <strong class="text-emerald-400">{{ minTechScore }}</strong></span>
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

      <!-- BANNER AD TOP -->
      <DkpAdStrip categoryTag="DKP TECH FEED SPONSORED" />

      <!-- FEED GRID -->
      <div v-if="pending" class="text-center py-20 bg-[#090d16] border border-slate-800 rounded-2xl text-emerald-400 font-mono text-xs animate-pulse">
        ⚡ Ingestione notizie dal Vault DKP Nodes v2.6 in corso...
      </div>

      <div v-else-if="stories.length === 0" class="text-center py-16 bg-[#090d16] border border-slate-800 rounded-2xl flex flex-col items-center gap-3">
        <div class="text-4xl">📡</div>
        <h3 class="text-lg font-bold text-white">Nessuna notizia trovata</h3>
        <p class="text-slate-400 text-xs max-w-md">Prova a resettare i filtri di ricerca o sincronizza nuovamente lo stream live.</p>
        <div class="flex gap-3 mt-2 font-mono">
          <button type="button" @click="searchQuery = ''; selectedCategory = ''; minTechScore = 0; currentPage = 1" class="px-4 py-2 bg-emerald-500 text-slate-950 font-extrabold text-xs rounded-xl hover:bg-emerald-400 transition-all cursor-pointer">
            Ripristina Filtri
          </button>
          <button type="button" @click="refreshStream" class="px-4 py-2 bg-[#020420] border border-slate-700 text-sky-400 font-bold text-xs rounded-xl hover:border-sky-400 transition-all cursor-pointer">
            🔄 Aggiorna
          </button>
        </div>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <article 
          v-for="item in stories" 
          :key="item.id"
          class="bg-[#090d16] border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-6 flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(16,185,129,0.1)] shadow-lg group"
        >
          <div>
            <!-- Header Badges -->
            <div class="flex items-center justify-between mb-3.5 pb-3 border-b border-slate-800/70">
              <span :class="['px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border font-mono', getTypeBadgeColor(item.type)]">
                {{ item.type === 'show' ? 'SHOW HN' : item.type === 'ask' ? 'ASK HN' : 'NEWS' }}
              </span>
              <div class="flex items-center gap-2 font-mono text-xs">
                <span v-if="item.techScore" class="text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                  AI {{ item.techScore }}%
                </span>
                <span class="text-emerald-400 font-bold">
                  🔥 {{ item.points || 0 }} pts
                </span>
              </div>
            </div>

            <!-- Title -->
            <h2 class="text-base font-extrabold text-white group-hover:text-emerald-400 transition-colors leading-snug mb-2.5">
              <NuxtLink :to="`/news/${item.slug || item.id}`">
                {{ item.title }}
              </NuxtLink>
            </h2>

            <!-- AI Summary Preview -->
            <p class="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-4">
              {{ item.summary_it || item.summary || 'Notizia analizzata ed elaborata dai flussi in tempo reale di Trinity AI.' }}
            </p>
          </div>

          <!-- Footer Metadata -->
          <div class="pt-3.5 border-t border-slate-800/70 flex flex-col gap-3 mt-auto">
            <div class="flex flex-wrap gap-1.5">
              <span v-for="tag in parseTags(item.tags)" :key="tag" class="text-[10px] font-mono bg-[#020420] text-sky-400 border border-slate-800 px-2 py-0.5 rounded">
                #{{ tag }}
              </span>
            </div>

            <div class="flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span class="truncate pr-2">by @{{ item.author || 'hackernews' }}</span>
              <div class="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  @click.prevent="shareStory(item.id, item.slug, item.url)"
                  class="text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                  title="Copia link scheda"
                >
                  🔗 {{ copiedId === item.id ? 'Copiato!' : 'Condividi' }}
                </button>
                <NuxtLink :to="`/news/${item.slug || item.id}`" class="text-emerald-400 font-bold hover:underline">
                  Leggi scheda ↗
                </NuxtLink>
              </div>
            </div>
          </div>
        </article>
      </div>

      <!-- PAGINAZIONE -->
      <div v-if="meta.totalPages > 1" class="flex justify-center items-center gap-3 pt-6 border-t border-slate-800 font-mono">
        <button 
          type="button"
          :disabled="currentPage === 1"
          @click="currentPage--"
          class="px-4 py-2 bg-[#090d16] border border-slate-800 text-slate-300 rounded-xl text-xs font-bold disabled:opacity-40 hover:border-emerald-500 hover:text-emerald-400 transition-all cursor-pointer"
        >
          ← Precedente
        </button>
        <span class="text-xs text-slate-400">Pagina <strong class="text-white">{{ currentPage }}</strong> di {{ meta.totalPages }}</span>
        <button 
          type="button"
          :disabled="currentPage === meta.totalPages"
          @click="currentPage++"
          class="px-4 py-2 bg-[#090d16] border border-slate-800 text-slate-300 rounded-xl text-xs font-bold disabled:opacity-40 hover:border-emerald-500 hover:text-emerald-400 transition-all cursor-pointer"
        >
          Successiva →
        </button>
      </div>

      <!-- SEZIONE VAULT -->
      <div v-if="featuredArticles.length > 0" class="pt-8 mt-2 border-t border-slate-800">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-base font-bold text-white flex items-center gap-2 font-mono">
            <span>🔗</span> Approfondimenti dal Vault Editorial Hub
          </h3>
          <NuxtLink to="/blog" class="text-xs font-mono text-emerald-400 hover:underline font-bold">
            Vedi tutti ➔
          </NuxtLink>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NuxtLink 
            v-for="art in featuredArticles" 
            :key="art.id" 
            :to="`/blog/${art.slug || art.id}`"
            class="bg-[#090d16] border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 flex flex-col justify-between transition-all hover:-translate-y-0.5 shadow-md group"
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

      <!-- WIDGET NODI COMMUNITY -->
      <div class="pt-4 border-t border-slate-800">
        <DkpNodesHomeWidget />
      </div>

      <!-- BANNER AD SPONSORED STREAM -->
      <DkpAdStrip categoryTag="DKP NODES AI SPONSORED STREAM" />

      <!-- FOOTER BADGE -->
      <div class="flex justify-center mt-2">
        <div class="inline-flex items-center gap-2 bg-[#090d16] border border-emerald-500/40 px-4 py-1.5 rounded-full text-xs font-mono font-extrabold text-white shadow-lg">
          <span class="w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_8px_#00dc82]"></span>
          ⚡ Pulse Nexus
          <span class="bg-emerald-500 text-slate-950 px-1.5 py-0.5 rounded text-[10px] font-black">v2.6-PURE-SQL</span>
        </div>
      </div>

    </div>
  </div>
</template>