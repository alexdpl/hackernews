<!-- app/pages/[feed]/index.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import DkpNodesHomeWidget from '~/components/DkpNodesHomeWidget.vue'
import DkpAdStrip from '~/components/DkpAdStrip.vue'

const route = useRoute()
const currentFeed = computed(() => (route.params.feed as string) || 'feed')

// Mappatura intelligente del tipo di feed per la query backend
const queryType = computed(() => {
  const f = currentFeed.value.toLowerCase()
  return f === 'feed' ? 'news' : f
})

// Fetch dal feed crawler del Neon DB (15 notizie per pagina)
const { data: responseData, pending } = await useFetch('/api/pulse/stories', {
  query: { type: queryType, page: 1, limit: 15 },
  watch: [queryType]
})

// Helper sicuro per l'estrazione del dominio
function getDomain(urlStr?: string, domainFallback?: string): string {
  if (domainFallback) return domainFallback
  if (!urlStr || urlStr.startsWith('/')) return 'devkernelpulse.org'
  try {
    return new URL(urlStr).hostname.replace('www.', '')
  } catch {
    return 'devkernelpulse.org'
  }
}

// Logica di condivisione rapida
const copySuccess = ref<string | null>(null)
function shareStory(title: string, url?: string, id?: any) {
  const targetUrl = url && url.startsWith('http') ? url : (typeof window !== 'undefined' ? `${window.location.origin}/news/${id}` : '')
  if (navigator.clipboard && targetUrl) {
    navigator.clipboard.writeText(targetUrl)
    copySuccess.value = String(id)
    setTimeout(() => { copySuccess.value = null }, 2000)
  }
}

// Normalizzazione con Safeguards rigidi e Sentinel Score
const feedList = computed(() => {
  const raw = responseData.value?.stories || responseData.value?.data || (Array.isArray(responseData.value) ? responseData.value : [])
  return raw.map((item: any) => {
    const safeSlug = item.slug || item.hn_id || item.id || `news-${Math.random().toString(36).substring(2, 7)}`
    const points = item.points || item.hn_points || 1
    const computedScore = item.tech_score || Math.min(95, Math.max(40, points * 2 + 50))
    
    return {
      ...item,
      slug: safeSlug,
      author: typeof item.author === 'object' ? item.author?.username || 'community' : (item.author || item.hn_by || 'community'),
      url: item.url || item.original_url || `/news/${safeSlug}`,
      domain: getDomain(item.url || item.original_url, item.domain),
      points,
      tech_score: computedScore,
      comments_count: item.comments_count || item.commentsCount || 0,
      xp_awarded: item.xp_awarded || 15
    }
  })
})

const pagination = computed(() => responseData.value?.pagination || {})
const hasMore = computed(() => (pagination.value?.currentPage < pagination.value?.totalPages) || (pagination.value?.totalItems > 15) || responseData.value?.pagination?.hasMore || feedList.value.length >= 15)

// Articoli consigliati dal Vault
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

useHead({
  title: `DKP Crawler Feed (${currentFeed.value.toUpperCase()}) - v2.5-GOLD`,
  meta: [
    { name: 'description', content: 'Ultime notizie e articoli dal web raccolti in tempo reale in ordine cronologico da Sentinel AI Crawler.' }
  ]
})
</script>

<template>
  <div class="min-h-screen bg-[#020420] text-slate-100 px-4 py-12">
    <div class="max-w-5xl mx-auto flex flex-col gap-8">
      
      <!-- HEADER FEED -->
      <div class="bg-[#090d16] border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl relative overflow-hidden">
        <div class="flex flex-col gap-2 max-w-2xl relative z-10">
          <div class="inline-flex items-center gap-2 bg-[#020420] border border-emerald-500/30 px-3 py-1 rounded-full w-fit">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span class="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">
              ⚡ DKP CRAWLER STREAM • v2.5-GOLD
            </span>
          </div>
          <h1 class="text-3xl font-extrabold text-white tracking-tight">
            🌍 Tech Stream <span class="text-emerald-400 capitalize">{{ currentFeed }}</span>
          </h1>
          <p class="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Flusso continuo di risorse e notizie tecnologiche indicizzate ed elaborate in tempo reale dal Sentinel Crawler Engine.
          </p>
        </div>

        <NuxtLink to="/submit" class="px-5 py-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/40 font-bold text-xs rounded-xl hover:bg-emerald-500 hover:text-slate-950 transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)] shrink-0 flex items-center gap-1.5 relative z-10">
          <span>⚡</span> Invia Post (+15 XP)
        </NuxtLink>
      </div>

      <!-- FEED DELLE NOTIZIE -->
      <div v-if="pending" class="text-center py-16 bg-[#090d16] border border-slate-800 rounded-2xl text-emerald-400 font-mono text-xs animate-pulse">
        ⚡ Ingestione flussi dal DB Neon in corso...
      </div>

      <div v-else-if="feedList.length > 0" class="flex flex-col gap-4">
        <div class="flex flex-col gap-3">
          <article 
            v-for="(item, index) in feedList" 
            :key="item.id || item.slug || index" 
            class="bg-[#090d16] border border-slate-800 hover:border-emerald-500/40 rounded-xl p-4 sm:p-5 flex flex-col gap-3 transition-all shadow-md group"
          >
            <!-- Riga Titolo e Fonte -->
            <div class="flex items-baseline gap-2 flex-wrap">
              <span class="text-xs font-mono font-bold text-emerald-400 shrink-0">{{ index + 1 }}.</span>
              
              <a :href="item.url" target="_blank" rel="noopener noreferrer" class="text-base font-bold text-white group-hover:text-emerald-400 transition-colors leading-snug">
                {{ item.title }}
              </a>

              <span v-if="item.domain" class="text-xs font-mono text-slate-500">
                ({{ item.domain }})
              </span>
            </div>

            <!-- Badges e Metadati Metrici -->
            <div class="flex items-center gap-3 font-mono text-[11px] text-slate-400 flex-wrap">
              <span class="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-bold">
                🛡️ Score: {{ item.tech_score }}
              </span>
              <span>•</span>
              <span class="text-purple-400">👤 @{{ item.author }}</span>
              <span>•</span>
              <span class="text-amber-400 font-bold">▲ {{ item.points }} pts</span>
              <span>•</span>
              <span class="text-emerald-400 font-bold">⭐ +{{ item.xp_awarded }} XP</span>
              <span>•</span>
              
              <!-- SCHEDA NOTIZIA TRINITY AI -->
              <NuxtLink :to="`/news/${item.slug || item.id}`" class="text-emerald-400 hover:underline font-bold transition-colors">
                Leggi scheda ↗
              </NuxtLink>
              <span>•</span>

              <!-- COMMENTI ITEM -->
              <NuxtLink :to="`/item/${item.id || item.slug}`" class="text-sky-400 hover:text-emerald-400 hover:underline font-bold transition-colors">
                💬 {{ item.comments_count }} commenti
              </NuxtLink>

              <span>•</span>
              
              <!-- PULSANTE CONDIVISIONE RAPIDA -->
              <button 
                @click="shareStory(item.title, item.url, item.id || item.slug)" 
                class="text-slate-400 hover:text-emerald-400 font-bold transition-colors cursor-pointer"
              >
                🔗 {{ copySuccess === String(item.id || item.slug) ? 'Copiato!' : 'Condividi' }}
              </button>
            </div>
          </article>
        </div>
        
        <!-- BOTTONE PAGINAZIONE -->
        <div v-if="hasMore" class="mt-4 flex justify-center">
          <NuxtLink :to="`/${currentFeed}/2`" class="px-6 py-2.5 bg-[#090d16] border border-slate-800 text-emerald-400 font-mono font-bold text-xs rounded-xl hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all">
            Vedi altre notizie ➔
          </NuxtLink>
        </div>
      </div>

      <!-- EMPTY STATE FALLBACK -->
      <div v-else class="text-center py-12 bg-[#090d16] border border-slate-800 rounded-2xl text-slate-400 font-mono text-xs">
        📭 Nessuna notizia presente in questo stream al momento.
      </div>

      <!-- 🟢 SEZIONE VAULT (Consigliati) -->
      <div v-if="featuredArticles.length > 0" class="pt-8 border-t border-slate-800 flex flex-col gap-4">
        <h3 class="text-base font-bold text-white flex items-center gap-2 font-mono">
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

        <DkpNodesHomeWidget />
      </div>

      <!-- BANNER DKP ADS STRIP -->
      <DkpAdStrip categoryTag="DKP NEWS SPONSORED FEED" />
    </div>
  </div>
</template>