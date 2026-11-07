<!-- app/pages/show/index.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import DkpAdStrip from '~/components/DkpAdStrip.vue'
import DkpNodesHomeWidget from '~/components/DkpNodesHomeWidget.vue'

// 1. Fetch dall'endpoint unificato DB Neon per type 'show'
const { data: responseData, pending } = await useFetch('/api/pulse/stories', {
  query: { type: 'show', page: 1, limit: 15 }
})

// Helper per condividere rapidamente (Copia negli appunti)
const copySuccess = ref<string | null>(null)
function shareStory(title: string, url?: string, id?: any) {
  const targetUrl = url && url.startsWith('http') ? url : (typeof window !== 'undefined' ? `${window.location.origin}/show/${id}` : '')
  if (navigator.clipboard && targetUrl) {
    navigator.clipboard.writeText(targetUrl)
    copySuccess.value = String(id)
    setTimeout(() => { copySuccess.value = null }, 2000)
  }
}

// Helper sicuro per l'estrazione del dominio
function getDomain(urlStr: string, domainFallback?: string): string {
  if (domainFallback) return domainFallback
  if (!urlStr || urlStr === '#') return 'github.com'
  try {
    return new URL(urlStr).hostname.replace('www.', '')
  } catch {
    return 'github.com'
  }
}

// Estrazione sicura con normalizzazione al volo
const projectsList = computed(() => {
  const raw = responseData.value?.stories || responseData.value?.data || (Array.isArray(responseData.value) ? responseData.value : [])
  return raw.map((project: any) => {
    const safeSlug = project.slug || project.hn_id || project.id || `show-${Math.random().toString(36).substring(2, 7)}`
    const points = project.points || project.hn_points || 1
    const computedScore = project.tech_score || Math.min(99, Math.max(55, points * 2 + 50))

    return {
      ...project,
      slug: safeSlug,
      author: typeof project.author === 'object' ? project.author?.username : (project.author || project.hn_by || 'github_user'),
      url: project.url || project.original_url || `/show/${safeSlug}`,
      domain: getDomain(project.url || project.original_url, project.domain),
      points,
      tech_score: computedScore,
      xp_awarded: project.xp_awarded || 30,
      comments_count: project.comments_count || project.commentsCount || 0
    }
  })
})

const pagination = computed(() => responseData.value?.pagination || {})
const hasMore = computed(() => (pagination.value?.currentPage < pagination.value?.totalPages) || responseData.value?.pagination?.hasMore || projectsList.value.length >= 15)

// Gestione dei voti nel frontend
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

// 2. Recupero articoli in evidenza per il Vault
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
  title: 'Show DKP - Progetti & GitHub Trending v2.5-GOLD',
  description: 'Vetrina dei migliori progetti Open Source e repository GitHub sincronizzati da DKP Crawler.'
})
</script>

<template>
  <div class="min-h-screen bg-[#020420] text-slate-100 px-4 py-12">
    <div class="max-w-5xl mx-auto flex flex-col gap-8">
      
      <!-- HEADER SHOWCASE UNIFICATO -->
      <div class="bg-[#090d16] border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl relative overflow-hidden">
        <div class="flex flex-col gap-2 max-w-2xl relative z-10">
          <div class="inline-flex items-center gap-2 bg-[#020420] border border-emerald-500/30 px-3 py-1 rounded-full w-fit">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span class="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">
              ⚡ DKP SHOWCASE • v2.5-GOLD
            </span>
          </div>
          <h1 class="text-3xl font-extrabold text-white tracking-tight">
            🚀 Progetti &amp; Repo <span class="text-emerald-400">Open Source</span>
          </h1>
          <p class="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Le migliori repository GitHub di tendenza e i progetti creati dalla community, sincronizzati dal DKP Crawler. Vota i progetti e accumula XP!
          </p>
        </div>

        <NuxtLink to="/submit?type=show" class="px-5 py-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/40 font-bold text-xs rounded-xl hover:bg-emerald-500 hover:text-slate-950 transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)] shrink-0 flex items-center gap-1.5 relative z-10">
          <span>🚀</span> Invia Progetto (+30 XP)
        </NuxtLink>
      </div>

      <!-- FEED SHOWCASE -->
      <div v-if="pending" class="text-center py-16 bg-[#090d16] border border-slate-800 rounded-2xl text-emerald-400 font-mono text-xs animate-pulse">
        ⚡ Caricamento showcase dal Neon Kernel DB...
      </div>

      <div v-else-if="projectsList.length > 0" class="flex flex-col gap-4">
        <div class="flex flex-col gap-3">
          <article 
            v-for="(project, index) in projectsList" 
            :key="project.id || project.slug || index" 
            class="bg-[#090d16] border border-slate-800 hover:border-emerald-500/40 rounded-xl p-4 sm:p-5 flex items-center gap-4 transition-all shadow-md group"
          >
            <!-- VOTING WIDGET -->
            <button 
              @click="voteProject(project)" 
              :class="['flex flex-col items-center justify-center p-2.5 rounded-xl border font-mono text-xs cursor-pointer min-w-[46px] transition-all shrink-0', project.voted ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400' : 'bg-[#020420] border-slate-800 text-sky-400 hover:border-emerald-500/50 hover:text-emerald-400']"
              title="Vota questo progetto (+5 XP)"
            >
              <span class="text-[10px] leading-none">▲</span>
              <span class="font-extrabold mt-1 text-xs">{{ project.points || 1 }}</span>
            </button>

            <!-- CONTENUTO SHOW -->
            <div class="flex flex-col gap-2 flex-1">
              <div class="flex items-baseline gap-2 flex-wrap">
                <span class="text-xs font-mono font-bold text-slate-500">{{ index + 1 }}.</span>
                <a :href="project.url" target="_blank" rel="noopener noreferrer" class="text-base font-bold text-white group-hover:text-emerald-400 transition-colors leading-snug">
                  {{ project.title }}
                </a>
                <span class="text-xs font-mono text-sky-400/80">
                  ({{ project.domain }}) ↗
                </span>
              </div>

              <div class="flex items-center gap-3 font-mono text-[11px] text-slate-400 flex-wrap">
                <span class="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-bold">
                  🛡️ Score: {{ project.tech_score }}
                </span>
                <span>•</span>
                <span>👤 Owner: <strong class="text-emerald-400">@{{ project.author }}</strong></span>
                <span>•</span>
                <span class="text-amber-400 font-bold">⭐ +{{ project.xp_awarded }} XP</span>
                <span>•</span>
                <span class="text-slate-400">⏱️ {{ formatTime(project.createdAt || project.created_at) }}</span>
                
                <template v-if="project.comments_count > 0">
                  <span>•</span>
                  <NuxtLink :to="`/item/${project.id || project.slug}`" class="text-sky-400 hover:text-emerald-400 hover:underline font-bold transition-colors">
                    💬 {{ project.comments_count }} commenti
                  </NuxtLink>
                </template>
                
                <span>•</span>
                <button 
                  @click="shareStory(project.title, project.url, project.id || project.slug)" 
                  class="text-slate-400 hover:text-emerald-400 font-bold transition-colors cursor-pointer"
                >
                  🔗 {{ copySuccess === String(project.id || project.slug) ? 'Copiato!' : 'Condividi' }}
                </button>
              </div>
            </div>
          </article>
        </div>

        <!-- BOTTONE PAGINAZIONE -->
        <div v-if="hasMore" class="mt-4 flex justify-center">
          <NuxtLink to="/show/2" class="px-6 py-2.5 bg-[#090d16] border border-slate-800 text-emerald-400 font-mono font-bold text-xs rounded-xl hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all">
            Vedi altri progetti ➔
          </NuxtLink>
        </div>
      </div>

      <!-- EMPTY STATE FALLBACK -->
      <div v-else class="text-center py-12 bg-[#090d16] border border-slate-800 rounded-2xl text-slate-400 font-mono text-xs flex flex-col gap-3 items-center">
        <p>📭 Nessun progetto presente nella vetrina Showcase.</p>
        <div class="flex items-center gap-3 text-xs flex-wrap justify-center">
          <NuxtLink to="/admin/crawler" class="text-sky-400 underline font-bold">🤖 Avvia Crawler GitHub Trending</NuxtLink>
          <span class="text-slate-600">•</span>
          <NuxtLink to="/submit?type=show" class="text-emerald-400 underline font-bold">Invia il tuo primo progetto!</NuxtLink>
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
              <p class="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                {{ art.excerpt || art.summary || 'Approfondimento tecnico verificato.' }}
              </p>
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