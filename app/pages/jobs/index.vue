<!-- app/pages/jobs/index.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import DkpAdStrip from '~/components/DkpAdStrip.vue'
import DkpNodesHomeWidget from '~/components/DkpNodesHomeWidget.vue'

// 1. Fetch universale dal DB Neon per la tipologia 'job'
const { data: responseData, pending } = await useFetch('/api/pulse/stories', {
  query: { type: 'job', page: 1, limit: 15 }
})

// Logica di condivisione rapida
const copySuccess = ref<string | null>(null)
function shareStory(title: string, url?: string, id?: any) {
  const targetUrl = url && url.startsWith('http') ? url : (typeof window !== 'undefined' ? `${window.location.origin}/jobs/${id}` : '')
  if (navigator.clipboard && targetUrl) {
    navigator.clipboard.writeText(targetUrl)
    copySuccess.value = String(id)
    setTimeout(() => { copySuccess.value = null }, 2000)
  }
}

// Estrazione dati sicura con normalizzazione al volo
const jobList = computed(() => {
  const raw = responseData.value?.stories || responseData.value?.data || (Array.isArray(responseData.value) ? responseData.value : [])
  return raw.map((job: any) => {
    const safeSlug = job.slug || job.hn_id || job.id || `job-${Math.random().toString(36).substring(2, 7)}`
    const points = job.points || job.hn_points || 1
    const computedScore = job.tech_score || Math.min(99, Math.max(60, points * 2 + 50))

    return {
      ...job,
      slug: safeSlug,
      company: typeof job.company === 'object' ? job.company?.username : (job.company || job.author || job.by || 'Remote Partner'),
      url: job.url || job.original_url || `/jobs/${safeSlug}`,
      domain: job.domain || 'remoteok.com',
      tech_score: computedScore,
      xp_awarded: job.xp_awarded || 25,
      comments_count: job.comments_count || job.commentsCount || 0
    }
  })
})

const pagination = computed(() => responseData.value?.pagination || {})
const hasMore = computed(() => (pagination.value?.currentPage < pagination.value?.totalPages) || responseData.value?.pagination?.hasMore || jobList.value.length >= 15)

// 2. Articoli Consigliati dal Vault (4 schede)
const featuredArticles = ref<any[]>([])

onMounted(async () => {
  try {
    const res: any = await $fetch('/api/blog/posts').catch(() => null)
    const raw = res?.success ? res.data : (Array.isArray(res) ? res : [])
    if (raw && raw.length > 0) {
      featuredArticles.value = raw.slice(0, 4)
    } else {
      populateFallbackArticles()
    }
  } catch (err) {
    console.error('Errore recupero articoli in evidenza:', err)
    populateFallbackArticles()
  }
})

function populateFallbackArticles() {
  featuredArticles.value = [
    { id: 1, title: 'Guida all\'Architettura Nuxt 4 & Rolldown', category: 'Cloud Native & DevOps', categoryName: 'DevOps', slug: 'nuxt-4-rolldown' },
    { id: 2, title: 'Integrazione Ollama e LLM Locali in Vue 3', category: 'AI & Machine Learning', categoryName: 'AI / LLM', slug: 'ollama-vue3' },
    { id: 3, title: 'Notarizzazione Codice & Hashing SHA-256', category: 'Cybersecurity & Vault', categoryName: 'Security', slug: 'vault-sha256' },
    { id: 4, title: 'Telemetria SSE Live & Worker Nitro v2.6', category: 'Backend Architecture', categoryName: 'Backend', slug: 'sse-nitro-v26' }
  ]
}

// Gestione Candidatura via Proof of Code Vault
const applyWithVault = (job: any) => {
  if (typeof window !== 'undefined') {
    console.log(`[PROOF OF CODE] Candidatura registrata per "${job.title}" (+25 XP)`)
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
  title: 'Opportunità Tech Meritocratiche — DKP Jobs v2.6-PURE-SQL',
  meta: [
    { name: 'description', content: 'Offerte di lavoro tech verificate dal DKP Crawler e basate su Proof of Code e repository reali.' }
  ]
})
</script>

<template>
  <div class="min-h-screen bg-[#020420] text-slate-100 px-4 py-12">
    <div class="max-w-5xl mx-auto flex flex-col gap-8">
      
      <!-- HEADER DELLA SEZIONE JOBS HUB -->
      <div class="bg-[#090d16] border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl relative overflow-hidden">
        <div class="flex flex-col gap-2 max-w-2xl relative z-10">
          <div class="inline-flex items-center gap-2 bg-[#020420] border border-emerald-500/30 px-3 py-1 rounded-full w-fit">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span class="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">
              ⚡ DKP PROOF OF CODE JOBS • v2.6-PURE-SQL
            </span>
          </div>
          <h1 class="text-3xl font-extrabold text-white tracking-tight font-sans">
            💼 Opportunità Tech <span class="text-emerald-400">Meritocratiche</span>
          </h1>
          <p class="text-xs sm:text-sm text-slate-400 leading-relaxed font-sans">
            Offerte di lavoro verificate e acquisite in tempo reale dal DKP Crawler da provider globali. Candidati sfruttando il tuo profilo Proof of Code e accumula XP.
          </p>
        </div>

        <NuxtLink to="/submit?type=job" class="px-5 py-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/40 font-bold text-xs rounded-xl hover:bg-emerald-500 hover:text-slate-950 transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)] shrink-0 relative z-10 font-mono">
          💼 Pubblica Offerta (+25 XP)
        </NuxtLink>
      </div>

      <!-- FEED DEI JOB -->
      <div v-if="pending" class="text-center py-16 bg-[#090d16] border border-slate-800 rounded-2xl text-emerald-400 font-mono text-xs animate-pulse">
        ⚡ Caricamento offerte dal Neon Kernel DB...
      </div>

      <div v-else-if="jobList.length > 0" class="flex flex-col gap-4">
        <div class="flex flex-col gap-3">
          <article 
            v-for="(job, index) in jobList" 
            :key="job.id || job.slug || index" 
            class="bg-[#090d16] border border-slate-800 hover:border-emerald-500/40 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all shadow-md group"
          >
            <div class="flex flex-col gap-2 flex-1">
              <div class="flex items-baseline gap-2 flex-wrap">
                <span class="text-xs font-mono font-bold text-slate-500 shrink-0">{{ index + 1 }}.</span>
                <a :href="job.url" target="_blank" rel="noopener noreferrer" class="text-base font-bold text-white group-hover:text-emerald-400 transition-colors leading-snug font-sans">
                  {{ job.title }}
                </a>
              </div>
              
              <div class="flex items-center gap-3 font-mono text-[11px] text-slate-400 flex-wrap">
                <span class="px-2 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/30 rounded text-[10px] font-bold">
                  🛡️ Trust: {{ job.tech_score }}
                </span>
                <span>•</span>
                <span class="text-purple-400 font-semibold">🏢 {{ job.company }}</span>
                <span>•</span>
                <span class="text-slate-400">🌐 {{ job.domain }}</span>
                <span>•</span>
                <span class="text-amber-400 font-bold">⭐ +{{ job.xp_awarded }} XP</span>
                <span>•</span>
                <span class="text-slate-500">⏱️ {{ formatTime(job.createdAt || job.created_at) }}</span>
                
                <template v-if="job.comments_count > 0">
                  <span>•</span>
                  <NuxtLink :to="`/item/${job.id || job.slug}`" class="text-sky-400 hover:text-emerald-400 hover:underline font-bold transition-colors">
                    💬 {{ job.comments_count }} commenti
                  </NuxtLink>
                </template>

                <span>•</span>
                <button 
                  @click="shareStory(job.title, job.url, job.id || job.slug)" 
                  class="text-slate-400 hover:text-emerald-400 font-bold transition-colors cursor-pointer"
                >
                  🔗 {{ copySuccess === String(job.id || job.slug) ? 'Copiato!' : 'Condividi' }}
                </button>
              </div>
            </div>

            <a 
              :href="job.url" 
              target="_blank" 
              rel="noopener noreferrer" 
              @click="applyWithVault(job)" 
              class="px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-mono font-bold hover:bg-emerald-400 hover:text-slate-950 transition-all shrink-0 mt-2 md:mt-0"
            >
              Candidati con Proof of Code ⚡
            </a>
          </article>
        </div>
        
        <!-- Bottone Paginazione -->
        <div v-if="hasMore" class="mt-4 flex justify-center">
          <NuxtLink to="/jobs/2" class="px-6 py-2.5 bg-[#090d16] border border-slate-800 text-emerald-400 font-mono font-bold text-xs rounded-xl hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all">
            Vedi altre offerte ➔
          </NuxtLink>
        </div>
      </div>

      <!-- EMPTY STATE FALLBACK -->
      <div v-else class="text-center py-12 bg-[#090d16] border border-slate-800 rounded-2xl text-slate-400 font-mono text-xs flex flex-col gap-3 items-center">
        <p>📭 Nessun annuncio di lavoro presente nel database Neon.</p>
        <div class="flex items-center gap-3 text-xs flex-wrap justify-center">
          <NuxtLink to="/admin/crawler" class="text-sky-400 underline font-bold">🤖 Sincronizza Jobs dal Crawler Admin</NuxtLink>
          <span class="text-slate-600">•</span>
          <NuxtLink to="/submit?type=job" class="text-emerald-400 underline font-bold">Pubblica la prima offerta!</NuxtLink>
        </div>
      </div>

      <!-- SEZIONE VAULT (4 SCHEDE GRID) -->
      <div v-if="featuredArticles.length > 0" class="pt-8 border-t border-slate-800 flex flex-col gap-4">
        <div class="flex justify-between items-center">
          <h3 class="text-base font-bold text-white flex items-center gap-2 font-mono">
            <span>🔗</span> Approfondimenti dal Vault
          </h3>
          <NuxtLink to="/blog" class="text-xs font-mono font-bold text-emerald-400 hover:underline">
            Vedi tutti gli articoli ➔
          </NuxtLink>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <NuxtLink 
            v-for="art in featuredArticles" 
            :key="art.id" 
            :to="`/blog/${art.slug || art.id}`"
            class="bg-[#090d16] border border-slate-800 hover:border-emerald-500/50 rounded-xl p-5 flex flex-col justify-between transition-all hover:-translate-y-1 shadow-md group text-left min-h-[160px]"
          >
            <div>
              <span class="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                {{ art.categoryName || art.category || 'Tech' }}
              </span>
              <h4 class="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-400 transition-colors leading-snug font-sans">
                {{ art.title }}
              </h4>
            </div>
            <span class="text-[11px] font-mono font-bold text-sky-400 group-hover:underline mt-4">
              Leggi articolo ➔
            </span>
          </NuxtLink>
        </div>
        
        <DkpNodesHomeWidget />
      </div>    

      <!-- BANNER DKP ADS STRIP -->
      <DkpAdStrip categoryTag="DKP JOBS SPONSORED FEED" />
    </div>
  </div>
</template>