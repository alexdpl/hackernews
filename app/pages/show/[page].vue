<!-- app/pages/show/[page].vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DkpAdStrip from '~/components/DkpAdStrip.vue'
import DkpNodesHomeWidget from '~/components/DkpNodesHomeWidget.vue'

const route = useRoute()
const router = useRouter()

const currentPage = computed(() => Math.max(1, parseInt(route.params.page as string) || 1))
const itemsPerPage = 15

// Fetch con chiave unica per la paginazione
const { data: responseData, pending, error } = await useFetch('/api/show', {
  key: `show-page-${currentPage.value}`,
  query: { page: currentPage, limit: itemsPerPage },
  watch: [currentPage]
})

function getDomain(urlStr: string, domainFallback?: string): string {
  if (domainFallback) return domainFallback
  if (!urlStr || urlStr === '#') return 'github.com'
  try {
    return new URL(urlStr).hostname.replace('www.', '')
  } catch {
    return 'github.com'
  }
}

// Normalizzazione progetti
const projectsList = computed(() => {
  const raw = responseData.value?.data || responseData.value?.stories || []
  return raw.map((project: any) => ({
    ...project,
    author: typeof project.author === 'object' ? project.author?.username : (project.author || 'github_user'),
    url: project.url || '#'
  }))
})

const pagination = computed(() => responseData.value?.pagination || {})
const totalPages = computed(() => pagination.value?.totalPages || 1)
const hasMore = computed(() => (currentPage.value < totalPages.value) || responseData.value?.pagination?.hasMore || false)

function handleNextPage() {
  if (!hasMore.value || pending.value) return
  router.push(`/show/${currentPage.value + 1}`)
}

function handlePrevPage() {
  if (currentPage.value <= 1 || pending.value) return
  if (currentPage.value === 2) {
    router.push('/show')
  } else {
    router.push(`/show/${currentPage.value - 1}`)
  }
}

const voteProject = (project: any) => {
  if (project.voted) {
    project.points = (project.points || 1) - 1
    project.voted = false
  } else {
    project.points = (project.points || 0) + 1
    project.voted = true
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

useSeoMeta({
  title: `Show DKP - Pagina ${currentPage.value} - DevKernelPulse`,
  description: `Scopri la pagina ${currentPage.value} della vetrina dei migliori progetti Open Source.`
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
              ⚡ DKP SHOWCASE • v2.5-GOLD
            </span>
          </div>
          <h1 class="text-2xl font-bold text-white">🚀 Progetti &amp; Repo <span class="text-emerald-400">Open Source</span></h1>
          <p class="text-xs text-slate-400 mt-1">Stai visualizzando la <strong>Pagina {{ currentPage }} di {{ totalPages }}</strong>.</p>
        </div>

        <NuxtLink to="/show" class="text-xs font-mono font-bold text-sky-400 hover:underline">← Torna alla prima pagina</NuxtLink>
      </div>

      <div v-if="error" class="text-center py-12 bg-[#090d16] border border-slate-800 rounded-xl text-red-400 font-mono text-xs">
        Errore nel caricamento dei progetti.
      </div>

      <div v-else-if="pending" class="text-center py-12 text-emerald-400 font-mono text-xs animate-pulse">
        ⚡ Sincronizzazione pagina {{ currentPage }} in corso...
      </div>

      <!-- LISTA PROGETTI SHOWCASE -->
      <div v-else-if="projectsList.length > 0" class="flex flex-col gap-4">
        <div class="flex flex-col gap-3">
          <article 
            v-for="(project, index) in projectsList" 
            :key="project.id || index" 
            class="bg-[#090d16] border border-slate-800 hover:border-emerald-500/40 rounded-xl p-4 sm:p-5 flex items-center gap-4 transition-all shadow-md group"
          >
            <button 
              @click="voteProject(project)" 
              :class="['flex flex-col items-center justify-center p-2.5 rounded-xl border font-mono text-xs cursor-pointer min-w-[46px] transition-all shrink-0', project.voted ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400' : 'bg-[#020420] border-slate-800 text-sky-400 hover:border-emerald-500/50 hover:text-emerald-400']"
            >
              <span class="text-[10px] leading-none">▲</span>
              <span class="font-extrabold mt-1 text-xs">{{ project.points || 1 }}</span>
            </button>

            <div class="flex flex-col gap-1.5 flex-1">
              <div class="flex items-baseline gap-2 flex-wrap">
                <span class="text-xs font-mono font-bold text-slate-500">{{ ((currentPage - 1) * itemsPerPage) + index + 1 }}.</span>
                <a :href="project.url" target="_blank" rel="noopener noreferrer" class="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                  {{ project.title }}
                </a>
                <span class="text-xs font-mono text-sky-400/80">
                  ({{ getDomain(project.url, project.domain) }}) ↗
                </span>
              </div>

              <div class="flex items-center gap-3 font-mono text-[11px] text-slate-400 flex-wrap">
                <span>👤 Owner: <strong class="text-emerald-400">@{{ project.author }}</strong></span>
                <span>•</span>
                <span class="text-slate-400">⏱️ {{ formatTime(project.createdAt || project.created_at) }}</span>
                <span>•</span>
                <span class="text-purple-400">Verified da <strong>DKP Crawler</strong></span>
              </div>
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
        <p>📭 Nessun'altro progetto trovato in questa pagina.</p>
        <NuxtLink to="/show" class="text-sky-400 underline font-bold">Torna alla prima pagina</NuxtLink>
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
      <DkpAdStrip categoryTag="DKP SHOWCASE SPONSORED FEED" />
    </div>
  </div>
</template>