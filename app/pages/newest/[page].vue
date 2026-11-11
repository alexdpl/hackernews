<!-- app/pages/newest/[page].vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DkpAdStrip from '~/components/DkpAdStrip.vue'
import DkpNodesHomeWidget from '~/components/DkpNodesHomeWidget.vue'

const route = useRoute()
const router = useRouter()

const currentPage = computed(() => Math.max(1, parseInt(route.params.page as string) || 1))
const itemsPerPage = 15

// 1. Fetch agganciato al BLOG interno
const { data: responseData, error, pending } = await useFetch('/api/blog/posts', {
  key: `newest-blog-page-${currentPage.value}`,
  query: { page: currentPage, limit: itemsPerPage },
  watch: [currentPage]
})

function parseAuthor(authorData: any): string {
  if (!authorData) return 'community'
  if (typeof authorData === 'object') return authorData.username || 'community'
  if (typeof authorData === 'string' && authorData.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(authorData)
      return parsed.username || 'community'
    } catch {
      return authorData
    }
  }
  return authorData
}

// 2. Normalizzazione Dati
const postsList = computed(() => {
  const raw = responseData.value?.data || responseData.value || []
  return raw.map((post: any) => ({
    ...post,
    authorName: parseAuthor(post.author),
    points: post.points || 0,
    commentsCount: post.commentsCount || post.comments_count || 0,
    slug: post.slug || post.id
  }))
})

const pagination = computed(() => responseData.value?.pagination || {})
const totalPages = computed(() => pagination.value?.totalPages || 1)
const hasMore = computed(() => (pagination.value?.currentPage < pagination.value?.totalPages) || (postsList.value.length === itemsPerPage))

function nextPage() {
  if (!hasMore.value || pending.value) return
  router.push('/newest/' + (currentPage.value + 1))
}

function prevPage() {
  if (currentPage.value <= 1 || pending.value) return
  if (currentPage.value === 2) {
    router.push('/newest')
  } else {
    router.push('/newest/' + (currentPage.value - 1))
  }
}

// 4 Articoli consigliati dal Vault
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
    { id: 1, title: 'Guida all\'Architettura Nuxt 4 & Rolldown', category: 'Cloud Native & DevOps', categoryName: 'DevOps', slug: 'nuxt-4-rolldown', summary: 'Analisi approfondita del nuovo motore di bundling.' },
    { id: 2, title: 'Integrazione Ollama e LLM Locali in Vue 3', category: 'AI & Machine Learning', categoryName: 'AI / LLM', slug: 'ollama-vue3', summary: 'Eseguire modelli AI in locale lato client.' },
    { id: 3, title: 'Notarizzazione Codice & Hashing SHA-256', category: 'Cybersecurity & Vault', categoryName: 'Security', slug: 'vault-sha256', summary: 'Garantire l\'integrità dei moduli software.' },
    { id: 4, title: 'Telemetria SSE Live & Worker Nitro v2.6', category: 'Backend Architecture', categoryName: 'Backend', slug: 'sse-nitro-v26', summary: 'Streaming in tempo reale per infrastrutture moderne.' }
  ]
}

useHead({
  title: `Blog Vault — Pagina ${currentPage.value} — DevKernelPulse v2.6-PURE-SQL`,
  meta: [
    { name: 'description', content: `Pagina ${currentPage.value} degli articoli e approfondimenti editoriali del team DevKernelPulse.` }
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
              ⚡ DKP BLOG VAULT • v2.6-PURE-SQL
            </span>
          </div>
          <h1 class="text-2xl font-bold text-white font-sans">📚 DKP Blog <span class="text-emerald-400">Vault</span></h1>
          <p class="text-xs text-slate-400 mt-1 font-sans">Stai visualizzando la <strong>Pagina {{ currentPage }} di {{ totalPages }}</strong> degli articoli editoriali.</p>
        </div>

        <NuxtLink to="/newest" class="text-xs font-mono font-bold text-sky-400 hover:underline">← Torna alla prima pagina</NuxtLink>
      </div>

      <div v-if="error" class="text-center py-12 bg-[#090d16] border border-slate-800 rounded-xl text-red-400 font-mono text-xs">
        Errore nel caricamento degli articoli dal database.
      </div>

      <div v-if="pending" class="text-center py-12 text-emerald-400 font-mono text-xs animate-pulse">
        ⚡ Sincronizzazione pagina {{ currentPage }} in corso...
      </div>

      <!-- LISTA ARTICOLI BLOG -->
      <div v-else-if="postsList.length > 0" class="flex flex-col gap-4">
        <div class="flex flex-col gap-3">
          <article v-for="(post, index) in postsList" :key="post.id || index" class="bg-[#090d16] border border-slate-800 hover:border-emerald-500/40 rounded-xl p-4 sm:p-5 flex gap-4 items-start transition-all shadow-md group">
            <span class="text-xs font-mono font-bold text-sky-400 shrink-0 min-w-[24px] text-right pt-0.5">
              {{ ((currentPage - 1) * itemsPerPage) + index + 1 }}.
            </span>

            <div class="flex flex-col gap-1.5 flex-1">
              <div class="flex items-baseline gap-2 flex-wrap">
                <NuxtLink :to="`/blog/${post.slug}`" class="text-base font-bold text-white group-hover:text-emerald-400 transition-colors font-sans leading-snug">
                  {{ post.title }}
                </NuxtLink>
                <span class="text-xs font-mono text-slate-500">(devkernelpulse.org)</span>
              </div>

              <div class="flex items-center gap-3 font-mono text-[11px] text-slate-400 flex-wrap">
                <span class="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded text-[10px] font-bold">
                  📝 {{ post.categoryName || post.category || 'Editoriale' }}
                </span>
                <span>•</span>
                <span class="text-amber-400 font-bold">▲ {{ post.points }} punti</span>
                <span>•</span>
                <span>da <strong class="text-purple-400">@{{ post.authorName }}</strong></span>
                <span>•</span>
                <span>⏱️ {{ new Date(post.createdAt || post.created_at || Date.now()).toLocaleDateString('it-IT') }}</span>
                <span>•</span>
                <NuxtLink :to="`/blog/${post.slug}#comments`" class="text-sky-400 hover:text-emerald-400 hover:underline font-bold transition-colors">
                  💬 {{ post.commentsCount }} commenti
                </NuxtLink>
              </div>
            </div>
          </article>
        </div>

        <!-- BARRA PAGINAZIONE -->
        <div class="flex justify-center items-center gap-4 mt-6 pt-6 border-t border-slate-800 font-mono text-xs">
          <button @click="prevPage" :disabled="currentPage <= 1 || pending" class="px-4 py-2 bg-[#090d16] border border-slate-800 text-slate-300 rounded-lg hover:border-emerald-500/40 disabled:opacity-40 transition-all cursor-pointer">
            ← Precedente
          </button>
          <span class="text-slate-400">Pagina {{ currentPage }} / {{ totalPages }}</span>
          <button @click="nextPage" :disabled="!hasMore || pending" class="px-4 py-2 bg-[#090d16] border border-slate-800 text-slate-300 rounded-lg hover:border-emerald-500/40 disabled:opacity-40 transition-all cursor-pointer">
            Successiva →
          </button>
        </div>
      </div>

      <div v-else class="text-center py-12 bg-[#090d16] border border-slate-800 rounded-2xl text-slate-400 font-mono text-xs flex flex-col gap-3 items-center">
        <p>📭 Nessun articolo presente in questa pagina.</p>
        <NuxtLink to="/newest" class="text-sky-400 underline font-bold">Torna alla prima pagina del Vault</NuxtLink>
      </div>

      <!-- SEZIONE CONSIGLIATI DAL VAULT (4 SCHEDE GRID) -->
      <div v-if="featuredArticles.length > 0" class="pt-8 border-t border-slate-800 flex flex-col gap-4">
        <div class="flex justify-between items-center">
          <h3 class="text-base font-bold text-white flex items-center gap-2 font-mono">
            <span>🔗</span> Consigliati dal Vault DKP
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
            class="bg-[#090d16] border border-slate-800 hover:border-emerald-500/50 rounded-xl p-5 flex flex-col justify-between transition-all hover:-translate-y-1 shadow-md group text-left min-h-[180px]"
          >
            <div>
              <span class="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                {{ art.categoryName || art.category || 'Tech' }}
              </span>
              <h4 class="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-400 transition-colors leading-snug font-sans">
                {{ art.title }}
              </h4>
              <p class="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed font-sans">
                {{ art.excerpt || art.summary || 'Approfondimento tecnico verificato.' }}
              </p>
            </div>
            <span class="text-[11px] font-mono font-bold text-sky-400 group-hover:underline mt-4">
              Leggi articolo ➔
            </span>
          </NuxtLink>
        </div>

        <DkpNodesHomeWidget />
      </div>

      <DkpAdStrip categoryTag="DKP BLOG SPONSORED" />
    </div>
  </div>
</template>