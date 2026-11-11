<!-- app/pages/jobs/[page].vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DkpAdStrip from '~/components/DkpAdStrip.vue'
import DkpNodesHomeWidget from '~/components/DkpNodesHomeWidget.vue'

const route = useRoute()
const router = useRouter()
const currentPage = computed(() => Math.max(1, parseInt(route.params.page as string) || 1))
const itemsPerPage = 15

// Fetch universale dal DB Neon con key reattiva
const { data: responseData, pending, error } = await useFetch('/api/pulse/stories', {
  key: `jobs-page-${currentPage.value}`,
  query: { type: 'job', page: currentPage, limit: itemsPerPage },
  watch: [currentPage]
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
const totalPages = computed(() => pagination.value?.totalPages || 1)
const hasMore = computed(() => (currentPage.value < totalPages.value) || responseData.value?.pagination?.hasMore || jobList.value.length >= itemsPerPage)

function handleNextPage() {
  if (!hasMore.value || pending.value) return
  router.push(`/jobs/${currentPage.value + 1}`)
}

function handlePrevPage() {
  if (currentPage.value <= 1 || pending.value) return
  if (currentPage.value === 2) {
    router.push('/jobs')
  } else {
    router.push(`/jobs/${currentPage.value - 1}`)
  }
}

// 4 Articoli Consigliati dal Vault
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
  title: `Offerte di Lavoro Tech — Pagina ${currentPage.value} — DevKernelPulse v2.6-PURE-SQL`,
  meta: [
    { name: 'description', content: `Pagina ${currentPage.value} delle offerte di lavoro tech verificate su DKP.` }
  ]
})
</script>

<template>
  <div class="min-h-screen bg-[#020420] text-slate-100 px-4 py-12">
    <div class="max-w-5xl mx-auto flex flex-col gap-8">
      
      <!-- HEADER COMPATTO PER PAGINE SUCCESSIVE -->
      <div class="bg-[#090d16] border border-slate-800 rounded-2xl p-6 shadow-xl flex justify-between items-center flex-wrap gap-4">
        <div>
          <div class="inline-flex items-center gap-2 bg-[#020420] border border-emerald-500/30 px-3 py-1 rounded-full w-fit mb-2">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span class="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">
              ⚡ DKP PROOF OF CODE JOBS • v2.6-PURE-SQL
            </span>
          </div>
          <h1 class="text-2xl font-bold text-white font-sans">💼 Offerte di Lavoro <span class="text-emerald-400">Tech</span></h1>
          <p class="text-xs text-slate-400 mt-1 font-sans">Stai visualizzando la <strong>Pagina {{ currentPage }} di {{ totalPages }}</strong>.</p>
        </div>
        <NuxtLink to="/jobs" class="text-xs font-mono font-bold text-sky-400 hover:underline">← Torna alla prima pagina</NuxtLink>
      </div>

      <div v-if="error" class="text-center py-12 bg-[#090d16] border border-slate-800 rounded-xl text-red-400 font-mono text-xs">
        Errore nel caricamento delle offerte.
      </div>

      <div v-else-if="pending" class="text-center py-12 text-emerald-400 font-mono text-xs animate-pulse">
        ⚡ Sincronizzazione offerte di lavoro (Pagina {{ currentPage }})...
      </div>

      <!-- FEED DEI JOB PAGINATI -->
      <div v-else-if="jobList.length > 0" class="flex flex-col gap-4">
        <div class="flex flex-col gap-3">
          <article 
            v-for="(job, index) in jobList" 
            :key="job.id || job.slug || index" 
            class="bg-[#090d16] border border-slate-800 hover:border-emerald-500/40 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all shadow-md group"
          >
            <div class="flex flex-col gap-2 flex-1">
              <div class="flex items-baseline gap-2 flex-wrap">
                <span class="text-xs font-mono font-bold text-slate-500 shrink-0">
                  {{ ((currentPage - 1) * itemsPerPage) + index + 1 }}.
                </span>
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

        <!-- NAVIGAZIONE PAGINAZIONE -->
        <div class="flex justify-center items-center gap-4 mt-6 pt-6 border-t border-slate-800 font-mono text-xs">
          <button @click="handlePrevPage" :disabled="currentPage <= 1 || pending" class="px-4 py-2 bg-[#090d16] border border-slate-800 text-slate-300 rounded-lg hover:border-emerald-500/40 disabled:opacity-40 transition-all cursor-pointer">
            ← Precedente
          </button>
          <span class="text-slate-400">Pagina {{ currentPage }} / {{ totalPages }}</span>
          <button @click="handleNextPage" :disabled="!hasMore || pending" class="px-4 py-2 bg-[#090d16] border border-slate-800 text-slate-300 rounded-lg hover:border-emerald-500/40 disabled:opacity-40 transition-all cursor-pointer">
            Successiva →
          </button>
        </div>
      </div>

      <div v-else class="text-center py-12 bg-[#090d16] border border-slate-800 rounded-xl text-slate-400 font-mono text-xs flex flex-col gap-3 items-center">
        <p>📭 Nessun'altra offerta trovata in questa pagina.</p>
        <NuxtLink to="/jobs" class="text-sky-400 underline font-bold">Torna alla prima pagina</NuxtLink>
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