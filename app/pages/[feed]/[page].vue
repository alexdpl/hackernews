<!-- app/pages/[feed]/[page].vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DkpNodesHomeWidget from '~/components/DkpNodesHomeWidget.vue'
import DkpAdStrip from '~/components/DkpAdStrip.vue'

const route = useRoute()
const router = useRouter()

// Identifica dinamicamente feed e pagina corrente
const currentFeed = computed(() => (route.params.feed as string) || 'feed')
const currentPage = computed(() => Math.max(1, parseInt(route.params.page as string) || 1))
const itemsPerPage = 15

// Fetch della pagina corrente
const { data: responseData, pending, error } = await useFetch('/api/pulse/stories', {
  key: `news-${currentFeed.value}-page-${currentPage.value}`,
  query: { type: currentFeed.value, page: currentPage, limit: itemsPerPage },
  watch: [currentPage, currentFeed]
})

function getDomain(urlStr?: string, domainFallback?: string): string {
  if (domainFallback) return domainFallback
  if (!urlStr || urlStr.startsWith('/')) return 'devkernelpulse.org'
  try {
    return new URL(urlStr).hostname.replace('www.', '')
  } catch {
    return 'devkernelpulse.org'
  }
}

const feedList = computed(() => {
  const raw = responseData.value?.stories || responseData.value?.data || []
  return raw.map((item: any) => ({
    ...item,
    author: typeof item.author === 'object' ? item.author?.username || 'community' : (item.author || 'community'),
    url: item.url || `/item/${item.id}`,
    domain: getDomain(item.url, item.domain),
    points: item.points || 1,
    comments_count: item.comments_count || item.commentsCount || 0,
    xp_awarded: item.xp_awarded || 15
  }))
})

const pagination = computed(() => responseData.value?.pagination || {})
const totalPages = computed(() => pagination.value?.totalPages || 1)
const hasMore = computed(() => currentPage.value < totalPages.value)

function handleNextPage() {
  if (!hasMore.value || pending.value) return
  router.push(`/${currentFeed.value}/${currentPage.value + 1}`)
}

function handlePrevPage() {
  if (currentPage.value <= 1 || pending.value) return
  if (currentPage.value === 2) {
    router.push(`/${currentFeed.value}`)
  } else {
    router.push(`/${currentFeed.value}/${currentPage.value - 1}`)
  }
}

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
  title: `Feed ${currentFeed.value} - Pagina ${currentPage.value} - DevKernelPulse`,
  meta: [
    { name: 'description', content: `Pagina ${currentPage.value} delle ultime notizie tech verificate dal crawler.` }
  ]
})
</script>

<template>
  <div class="min-h-screen bg-[#020420] text-slate-100 px-4 py-12">
    <div class="max-w-5xl mx-auto flex flex-col gap-8">
      
      <!-- HEADER COMPATTO -->
      <div class="bg-[#090d16] border border-slate-800 rounded-2xl p-6 shadow-xl flex justify-between items-center flex-wrap gap-4">
        <div>
          <div class="inline-flex items-center gap-2 bg-[#020420] border border-emerald-500/30 px-3 py-1 rounded-full w-fit mb-2">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span class="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">
              ⚡ DKP TECH NEWS FEED • v2.5-GOLD
            </span>
          </div>
          <h1 class="text-2xl font-bold text-white">🌍 Tech News <span class="text-emerald-400 capitalize">{{ currentFeed }}</span></h1>
          <p class="text-xs text-slate-400 mt-1">Stai visualizzando la <strong>Pagina {{ currentPage }} di {{ totalPages }}</strong> del feed crawler.</p>
        </div>

        <NuxtLink :to="`/${currentFeed}`" class="text-xs font-mono font-bold text-sky-400 hover:underline">← Torna alla prima pagina</NuxtLink>
      </div>

      <div v-if="error" class="text-center py-12 bg-[#090d16] border border-slate-800 rounded-xl text-red-400 font-mono text-xs">
        Errore nel caricamento del feed.
      </div>

      <div v-else-if="pending" class="text-center py-12 text-emerald-400 font-mono text-xs animate-pulse">
        ⚡ Sincronizzazione Pagina {{ currentPage }} dal DB Neon...
      </div>

      <!-- LISTA FEED NOTIZIE -->
      <div v-else-if="feedList.length > 0" class="flex flex-col gap-4">
        <div class="flex flex-col gap-3">
          <article 
            v-for="(item, index) in feedList" 
            :key="item.id || index" 
            class="bg-[#090d16] border border-slate-800 hover:border-emerald-500/40 rounded-xl p-4 sm:p-5 flex flex-col gap-2 transition-all shadow-md group"
          >
            <div class="flex items-baseline gap-2 flex-wrap">
              <span class="text-xs font-mono font-bold text-emerald-400 shrink-0">
                {{ ((currentPage - 1) * itemsPerPage) + index + 1 }}.
              </span>
              <a :href="item.url" target="_blank" rel="noopener noreferrer" class="text-base font-bold text-white group-hover:text-sky-400 transition-colors">
                {{ item.title }}
              </a>
              <span v-if="item.domain" class="text-xs font-mono text-slate-500">
                ({{ item.domain }})
              </span>
            </div>

            <div class="flex items-center gap-3 font-mono text-[11px] text-slate-400 flex-wrap">
              <span class="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded text-[10px] font-bold">
                📡 {{ item.domain }}
              </span>
              <span>•</span>
              <span class="text-purple-400">👤 @{{ item.author }}</span>
              <span>•</span>
              <span class="text-amber-400 font-bold">▲ {{ item.points }} pts</span>
              <span>•</span>
              <span class="text-emerald-400 font-bold">⭐ +{{ item.xp_awarded }} XP</span>
              <span>•</span>
              <NuxtLink :to="`/item/${item.id}`" class="text-sky-400 hover:text-emerald-400 hover:underline font-bold transition-colors">
                💬 {{ item.comments_count }} commenti
              </NuxtLink>
            </div>
          </article>
        </div>

        <!-- NAVIGAZIONE PAGINAZIONE -->
        <div class="flex justify-center items-center gap-4 mt-6 pt-6 border-t border-slate-800 font-mono text-xs">
          <button @click="handlePrevPage" :disabled="currentPage <= 1 || pending" class="px-4 py-2 bg-[#090d16] border border-slate-800 text-slate-300 rounded-lg hover:border-emerald-500/40 disabled:opacity-40 transition-all">
            ← Precedente
          </button>
          <span class="text-slate-400">Pagina {{ currentPage }} / {{ totalPages }}</span>
          <button @click="handleNextPage" :disabled="!hasMore || pending" class="px-4 py-2 bg-[#090d16] border border-slate-800 text-slate-300 rounded-lg hover:border-emerald-500/40 disabled:opacity-40 transition-all">
            Successiva →
          </button>
        </div>
      </div>

      <div v-else class="text-center py-12 bg-[#090d16] border border-slate-800 rounded-2xl text-slate-400 font-mono text-xs flex flex-col gap-3 items-center">
        <p>📭 Nessun'altra notizia trovata in questa pagina.</p>
        <NuxtLink :to="`/${currentFeed}`" class="text-sky-400 underline font-bold">Torna alla prima pagina del feed</NuxtLink>
      </div>

      <!-- 🟢 SEZIONE VAULT -->
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

      <!-- 🟢 BANNER DKP ADS STRIP -->
      <DkpAdStrip categoryTag="DKP NEWS SPONSORED FEED" />
    </div>
  </div>
</template>