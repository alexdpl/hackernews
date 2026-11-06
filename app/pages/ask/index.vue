<!-- app/pages/ask/index.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import DkpAdStrip from '~/components/DkpAdStrip.vue'
import DkpNodesHomeWidget from '~/components/DkpNodesHomeWidget.vue'

// 1. Fetch dall'endpoint dedicato /api/ask con paginazione a 15
const { data: responseData, pending } = await useFetch('/api/ask', {
  query: { page: 1, limit: 15 }
})

// Estrazione dati sicura con normalizzazione al volo di link e autore
const askList = computed(() => {
  const raw = responseData.value?.data || responseData.value?.stories || []
  return raw.map((item: any) => ({
    ...item,
    author: typeof item.author === 'object' ? item.author?.username || 'community_ask' : (item.author || item.user || 'community_ask'),
    url: item.url || `/item/${item.id}`
  }))
})

const pagination = computed(() => responseData.value?.pagination || {})
const hasMore = computed(() => (pagination.value?.currentPage < pagination.value?.totalPages) || responseData.value?.pagination?.hasMore || false)

// 2. Articoli Consigliati dal Vault
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

// Logica Voti
const voteAsk = (item: any) => {
  if (item.voted) {
    item.points = (item.points || 1) - 1
    item.voted = false
  } else {
    item.points = (item.points || 0) + 1
    item.voted = true
  }
}

// Helper formattazione data
function formatTime(dateStr: string | undefined): string {
  if (!dateStr) return 'di recente'
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    if (diffHours < 1) return 'poco fa'
    if (diffHours < 24) return `${diffHours}h fa`
    return `${Math.floor(diffHours / 24)}g fa`
  } catch {
    return 'di recente'
  }
}

useHead({
  title: 'Ask DKP Community - Q&A & Discussioni v2.5-GOLD',
  meta: [
    { name: 'description', content: 'Fai domande sull\'architettura software, chiedi code review e discuti con gli sviluppatori della community DKP.' }
  ]
})
</script>

<template>
  <div class="min-h-screen bg-[#020420] text-slate-100 px-4 py-12">
    <div class="max-w-5xl mx-auto flex flex-col gap-8">
      
      <!-- HEADER DELLA SEZIONE ASK -->
      <div class="bg-[#090d16] border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl relative overflow-hidden">
        <div class="flex flex-col gap-2 max-w-2xl">
          <div class="inline-flex items-center gap-2 bg-[#020420] border border-emerald-500/30 px-3 py-1 rounded-full w-fit">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span class="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">
              ⚡ COMMUNITY Q&A • v2.5-GOLD
            </span>
          </div>
          <h1 class="text-3xl font-extrabold text-white tracking-tight">
            💭 Ask <span class="text-emerald-400">DKP Community</span>
          </h1>
          <p class="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Fai domande sull'architettura software, chiedi code review o apri un dibattito tecnico con la community.
          </p>
        </div>

        <NuxtLink to="/submit?type=ask" class="px-5 py-2.5 bg-emerald-500 text-slate-950 font-extrabold text-xs rounded-xl hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] shrink-0 flex items-center gap-1.5">
          <span>💭</span> Fai una Domanda (+15 XP)
        </NuxtLink>
      </div>

      <!-- FEED DELLE DISCUSSIONI -->
      <div v-if="pending" class="text-center py-16 bg-[#090d16] border border-slate-800 rounded-2xl text-emerald-400 font-mono text-xs animate-pulse">
        ⚡ Caricamento discussioni dal Neon Kernel DB...
      </div>

      <div v-else-if="askList.length > 0" class="flex flex-col gap-4">
        <div class="flex flex-col gap-3">
          <article 
            v-for="(item, index) in askList" 
            :key="item.id || index" 
            class="bg-[#090d16] border border-slate-800 hover:border-emerald-500/40 rounded-xl p-4 sm:p-5 flex items-center gap-4 transition-all shadow-md group"
          >
            <!-- VOTING WIDGET -->
            <button 
              @click="voteAsk(item)" 
              :class="['flex flex-col items-center justify-center p-2.5 rounded-xl border font-mono text-xs cursor-pointer min-w-[46px] transition-all shrink-0', item.voted ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400' : 'bg-[#020420] border-slate-800 text-sky-400 hover:border-emerald-500/50 hover:text-emerald-400']"
              title="Vota questa domanda (+5 XP)"
            >
              <span class="text-[10px] leading-none">▲</span>
              <span class="font-extrabold mt-1 text-xs">{{ item.points || 1 }}</span>
            </button>

            <!-- CONTENUTO ASK -->
            <div class="flex flex-col gap-1.5 flex-1">
              <div class="flex items-baseline gap-2">
                <span class="text-xs font-mono font-bold text-slate-500">{{ index + 1 }}.</span>
                <a :href="item.url" target="_blank" rel="noopener noreferrer" class="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                  {{ item.title }}
                </a>
              </div>

              <div class="flex items-center gap-3 font-mono text-[11px] text-slate-400 flex-wrap">
                <span>👤 Chiesto da <strong class="text-purple-400">@{{ item.author }}</strong></span>
                <span>•</span>
                <span class="text-amber-400 font-bold">⭐ +{{ item.xp_awarded || 20 }} XP</span>
                <span>•</span>
                <span class="text-slate-400">⏱️ {{ formatTime(item.createdAt || item.created_at) }}</span>
                <span>•</span>
                <span class="text-sky-400">Verified da <strong>DKP Crawler</strong></span>
              </div>
            </div>
          </article>
        </div>
        
        <!-- BOTTONE PAGINAZIONE -->
        <div v-if="hasMore" class="mt-4 flex justify-center">
          <NuxtLink to="/ask/2" class="px-6 py-2.5 bg-[#090d16] border border-slate-800 text-emerald-400 font-mono font-bold text-xs rounded-xl hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all">
            Vedi altre discussioni ➔
          </NuxtLink>
        </div>
      </div>

      <!-- EMPTY STATE FALLBACK -->
      <div v-else class="text-center py-12 bg-[#090d16] border border-slate-800 rounded-2xl text-slate-400 font-mono text-xs flex flex-col gap-3 items-center">
        <p>📭 Nessuna domanda trovata in Ask DKP.</p>
        <div class="flex items-center gap-3 text-xs">
          <NuxtLink to="/admin/crawler" class="text-sky-400 underline font-bold">🤖 Sincronizza Ask dal Crawler Admin</NuxtLink>
          <span class="text-slate-600">•</span>
          <NuxtLink to="/submit?type=ask" class="text-emerald-400 underline font-bold">Sii il primo ad aprire una discussione!</NuxtLink>
        </div>
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

      <!-- 🟢 BANNER DKP ADS STRIP -->
      <DkpAdStrip categoryTag="DKP ASK SPONSORED FEED" />
    </div>
  </div>
</template>