<!-- app/pages/blog/index.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBlog } from '~/composables/useBlog'
import DkpAdStrip from '~/components/DkpAdStrip.vue'
import DkpNodesHomeWidget from '~/components/DkpNodesHomeWidget.vue'

useHead({
  title: 'DKP Editorial Hub & Technical Blog v2.6-PURE-SQL — DevKernelPulse',
  meta: [
    { name: 'description', content: 'Aggiornamenti di sistema, rilasci del kernel v2.6-PURE-SQL, architetture cloud e approfondimenti tecnologici notarizzati dalla community di DevKernelPulse.' }
  ]
})

// --- 1. CARICAMENTO DATI IMMEDIATO (SSR + CLIENT REFRESH) ---
const { posts, fetchPosts, getAuthorRank, isLoading } = useBlog()
const isRefreshing = ref(false)

// Caricamento iniziale SSR per eliminare ritardi di rendering
await useAsyncData('dkp-blog-posts-v26', async () => {
  await fetchPosts()
  return posts.value
})

const { data: catResponse, pending: loadingCats } = await useFetch('/api/blog/categories', {
  key: 'dkp-blog-categories-v26'
})

const categories = computed(() => {
  const raw = (catResponse.value as any)?.data || []
  return Array.isArray(raw) ? raw : []
})

// Forza il refresh dal DB Neon Pure SQL per vedere subito i nuovi articoli
async function refreshFeedNow() {
  isRefreshing.value = true
  try {
    await fetchPosts()
  } finally {
    setTimeout(() => { isRefreshing.value = false }, 350)
  }
}

onMounted(async () => {
  // Sincronizzazione silenziosa al mount per catturare articoli appena pubblicati
  await fetchPosts()
})

// --- 2. STATI DI FILTRAGGIO, RICERCA & PAGINAZIONE ---
const selectedCategory = ref<string | null>(null)
const selectedSubcategory = ref<string | null>(null)
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = 9

function parseTags(tagsRaw: any): string[] {
  if (Array.isArray(tagsRaw)) {
    const expanded: string[] = []
    for (const item of tagsRaw) {
      if (typeof item === 'string' && (item.includes(',') || item.includes(';'))) {
        expanded.push(...item.split(/[,;]+/).map(t => t.trim().replace(/^#/, '')).filter(Boolean))
      } else if (item) {
        expanded.push(String(item).trim().replace(/^#/, ''))
      }
    }
    return expanded
  }
  if (typeof tagsRaw === 'string') {
    return tagsRaw.split(/[,;]+/).map(t => t.trim().replace(/^#/, '')).filter(Boolean)
  }
  return []
}

function getCategoryName(category: any): string {
  if (!category) return 'Generale'
  if (typeof category === 'object') return category.name || 'Generale'
  return String(category)
}

function getSubcategoryName(subCategory: any): string {
  if (!subCategory) return ''
  if (typeof subCategory === 'object') return subCategory.name || ''
  return String(subCategory)
}

function getCategoryIcon(category: any): string {
  if (typeof category === 'object' && category?.icon) return category.icon
  return '🏷️'
}

function getCategoryStyle(category: any) {
  if (typeof category === 'object' && category?.color) {
    return {
      backgroundColor: `${category.color}20`,
      color: category.color,
      borderColor: `${category.color}40`
    }
  }
  return {}
}

const activeSubcategories = computed(() => {
  if (!selectedCategory.value) return []
  const cat = categories.value.find((c: any) => getCategoryName(c).toLowerCase() === selectedCategory.value?.toLowerCase())
  return cat?.subcategories || []
})

function selectCategory(catName: string | null) {
  selectedCategory.value = catName
  selectedSubcategory.value = null
  currentPage.value = 1
}

function calculateReadTime(post: any): number {
  const text = post.content || post.description || post.summary || ''
  if (!text) return 1
  const plainText = text.replace(/<\/?[^>]+(>|$)/g, '').replace(/[#*`_\[\]()]/g, '')
  const words = plainText.trim().split(/\s+/).length
  return Math.max(1, Math.ceil(words / 200))
}

// --- 3. ORDINAMENTO (PIÙ RECENTI IN CIMA) & FILTRO ARTICOLI ---
const sortedAndFilteredPosts = computed(() => {
  const list = Array.isArray(posts.value) ? [...posts.value] : []

  // Garantisce che i nuovi articoli siano sempre in testa
  list.sort((a: any, b: any) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
    if (dateB !== dateA) return dateB - dateA
    return Number(b.id || 0) - Number(a.id || 0)
  })

  return list.filter((p: any) => {
    const catName = getCategoryName(p.categoryObject || p.category || p.categoryName)
    const subName = getSubcategoryName(p.subcategoryObject || p.subCategory || p.subcategoryName)

    const matchesCat = !selectedCategory.value || catName.toLowerCase() === selectedCategory.value.toLowerCase()
    const matchesSub = !selectedSubcategory.value || subName.toLowerCase() === selectedSubcategory.value.toLowerCase()

    const q = searchQuery.value.trim().toLowerCase()
    const matchesSearch = !q ||
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.excerpt && p.excerpt.toLowerCase().includes(q)) ||
      (p.summary && p.summary.toLowerCase().includes(q)) ||
      (Array.isArray(p.tags) && p.tags.some((t: string) => t.toLowerCase().includes(q)))

    return matchesCat && matchesSub && matchesSearch
  })
})

// Articolo in evidenza (il più recente in assoluto quando non ci sono filtri attivi)
const featuredPost = computed(() => {
  if (currentPage.value === 1 && !selectedCategory.value && !selectedSubcategory.value && !searchQuery.value.trim() && sortedAndFilteredPosts.value.length > 0) {
    return sortedAndFilteredPosts.value[0]
  }
  return null
})

// Griglia articoli (esclude l'articolo in evidenza nella prima pagina per evitare duplicati)
const gridSourcePosts = computed(() => {
  if (featuredPost.value) {
    return sortedAndFilteredPosts.value.slice(1)
  }
  return sortedAndFilteredPosts.value
})

// --- 4. PAGINAZIONE CALCOLATA ---
const totalPages = computed(() => Math.max(1, Math.ceil(gridSourcePosts.value.length / itemsPerPage)))

const paginatedPosts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return gridSourcePosts.value.slice(start, end)
})

function changePage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 320, behavior: 'smooth' })
    }
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#020420] text-slate-50 px-4 sm:px-6 py-10 sm:py-14 font-sans">
    <div class="max-w-6xl mx-auto flex flex-col gap-8">
      
      <!-- HERO SECTION EDITORIAL HUB v2.6-PURE-SQL -->
      <header class="bg-[#090d16] border border-slate-800 rounded-3xl p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden">
        <!-- Glow Ambientale -->
        <div class="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-36 bg-emerald-500/10 blur-[110px] rounded-full pointer-events-none"></div>

        <!-- Badge Sentinella -->
        <div class="flex justify-center mb-5 relative z-10">
          <div class="inline-flex items-center gap-2 bg-[#020420] border border-emerald-500/30 px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span class="text-[11px] font-mono font-extrabold text-emerald-400 uppercase tracking-widest">
              ✍️ DKP EDITORIAL HUB v2.6-PURE-SQL
            </span>
          </div>
        </div>

        <h1 class="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4 relative z-10">
          DKP Native <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-400">Blog &amp; Vault</span>
        </h1>

        <p class="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed mb-7 relative z-10">
          Approfondimenti di sistema, architetture cloud, rilasci del kernel e guide notarizzate su Neon PostgreSQL dalla community.
        </p>

        <!-- BARRA 4 PILASTRI DELL'ECOSISTEMA (ALLINEATA ALLA HOME) -->
        <nav aria-label="Navigazione Ecosistema DKP" class="flex flex-wrap gap-3 justify-center mb-8 relative z-10 font-mono">
          <NuxtLink
            to="/news"
            class="px-4 sm:px-5 py-2.5 bg-[#020420] border border-slate-700 hover:border-emerald-400 text-emerald-400 font-extrabold text-xs rounded-xl transition-all shadow-lg"
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
            class="px-4 sm:px-5 py-2.5 bg-emerald-500 text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.35)]"
          >
            ✍️ DKP Editorial Hub
          </NuxtLink>
        </nav>

        <!-- CTA SCRITTURA & SYNC ISTANTANEO -->
        <div class="flex flex-wrap justify-center items-center gap-3 relative z-10 font-mono">
          <NuxtLink
            to="/user/dashboard?tab=content"
            class="px-5 py-2.5 bg-emerald-500/15 hover:bg-emerald-400 text-emerald-300 hover:text-slate-950 border border-emerald-500/40 font-extrabold text-xs rounded-xl transition-all shadow-md"
          >
            ✍️ Pubblica Articolo (+150 XP)
          </NuxtLink>

          <button
            type="button"
            @click="refreshFeedNow"
            :disabled="isRefreshing || isLoading"
            class="px-4 py-2.5 bg-[#020420] hover:bg-slate-900 text-slate-300 hover:text-sky-400 border border-slate-800 hover:border-sky-500/40 font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
            title="Sincronizza subito gli ultimi articoli dal database"
          >
            <span :class="{ 'inline-block animate-spin': isRefreshing }">🔄</span>
            {{ isRefreshing ? ' Sincronizzazione...' : ' Aggiorna Feed' }}
          </button>
        </div>
      </header>

      <!-- BARRA DI RICERCA LIVE & CONTATORE ARTICOLI -->
      <div class="flex flex-col sm:flex-row items-center gap-3 max-w-3xl mx-auto w-full">
        <div class="relative flex-1 w-full flex items-center bg-[#090d16] border border-slate-800 focus-within:border-emerald-400 rounded-xl px-4 py-3 shadow-inner transition-colors">
          <span class="text-base mr-2.5">🔍</span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cerca articoli, release notes o tag (es. #PureSQL, #Nuxt4, #Security)..."
            class="w-full bg-transparent border-none text-white text-sm outline-none placeholder-slate-500"
            @input="currentPage = 1"
          />
          <button
            v-if="searchQuery"
            @click="searchQuery = ''; currentPage = 1"
            class="text-rose-400 hover:text-rose-300 font-black text-lg px-1 cursor-pointer"
            type="button"
          >
            ×
          </button>
        </div>
        <div class="text-xs font-mono text-slate-400 bg-[#090d16] border border-slate-800 px-4 py-3.5 rounded-xl shrink-0">
          📚 <strong class="text-emerald-400">{{ sortedAndFilteredPosts.length }}</strong> articoli
        </div>
      </div>

      <!-- BANNER DKP ADS STRIP -->
      <DkpAdStrip />

      <!-- BARRA CATEGORIE DINAMICHE -->
      <nav class="flex justify-center gap-2 flex-wrap">
        <button
          @click="selectCategory(null)"
          :class="[
            'px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer inline-flex items-center gap-1.5',
            selectedCategory === null
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
              : 'bg-[#090d16] border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
          ]"
          type="button"
        >
          🔥 Tutti
        </button>

        <div v-if="loadingCats" class="text-xs text-slate-500 font-mono self-center px-2">⏳ Caricamento categorie...</div>

        <button
          v-for="cat in categories"
          :key="cat.id"
          @click="selectCategory(cat.name)"
          :style="selectedCategory === cat.name ? getCategoryStyle(cat) : {}"
          :class="[
            'px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer inline-flex items-center gap-1.5',
            selectedCategory === cat.name
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500'
              : 'bg-[#090d16] border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
          ]"
          type="button"
        >
          <span>{{ getCategoryIcon(cat) }}</span>
          <span>{{ getCategoryName(cat) }}</span>
        </button>
      </nav>

      <!-- BARRA SOTTOCATEGORIE DINAMICHE -->
      <Transition name="fade-sub">
        <div v-if="activeSubcategories.length > 0" class="flex flex-wrap items-center justify-center gap-2 bg-[#090d16] border border-slate-800 px-4 py-2.5 rounded-xl max-w-4xl mx-auto">
          <span class="text-[11px] font-mono font-extrabold text-slate-500 uppercase mr-1">Sottocategorie:</span>
          <button
            @click="selectedSubcategory = null; currentPage = 1"
            :class="['px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer', selectedSubcategory === null ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30' : 'text-slate-400 hover:text-emerald-400']"
            type="button"
          >
            Tutte
          </button>
          <button
            v-for="sub in activeSubcategories"
            :key="sub.id || sub.name"
            @click="selectedSubcategory = sub.name; currentPage = 1"
            :class="['px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer', selectedSubcategory === sub.name ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30' : 'text-slate-400 hover:text-emerald-400']"
            type="button"
          >
            {{ sub.name }}
          </button>
        </div>
      </Transition>

      <!-- SPINNER & EMPTY STATE -->
      <div v-if="isLoading && posts.length === 0" class="text-center py-16 bg-[#090d16] border border-slate-800 rounded-2xl text-emerald-400 font-mono text-xs animate-pulse">
        ⏳ Estrazione articoli dal Vault Neon DB v2.6 in corso...
      </div>

      <div v-else-if="sortedAndFilteredPosts.length === 0" class="text-center py-16 bg-[#090d16] border border-slate-800 rounded-2xl flex flex-col items-center gap-3">
        <span class="text-4xl">📂</span>
        <h3 class="text-lg font-bold text-white">Nessun articolo trovato</h3>
        <p class="text-xs text-slate-400 max-w-md">Nessun contenuto corrisponde ai filtri attuali. Prova a sincronizzare il feed o ripristina la ricerca.</p>
        <div class="flex gap-3 mt-2 font-mono">
          <button @click="selectCategory(null); searchQuery = ''; currentPage = 1" class="px-4 py-2 bg-emerald-500 text-slate-950 font-extrabold text-xs rounded-lg cursor-pointer hover:bg-emerald-400" type="button">
            Ripristina Filtri
          </button>
          <button @click="refreshFeedNow" class="px-4 py-2 bg-[#020420] border border-slate-700 text-sky-400 font-bold text-xs rounded-lg cursor-pointer hover:border-sky-400" type="button">
            🔄 Ricarica DB
          </button>
        </div>
      </div>

      <template v-else>
        <!-- ARTICOLO IN EVIDENZA (ULTIMO RILASCIO / LATEST RELEASE) -->
        <article
          v-if="featuredPost"
          class="bg-gradient-to-br from-[#090d16] via-[#0b1221] to-[#020420] border border-emerald-500/40 rounded-2xl p-6 sm:p-8 shadow-[0_15px_40px_rgba(16,185,129,0.08)] flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center relative overflow-hidden group"
        >
          <div class="flex-1 flex flex-col gap-3">
            <div class="flex flex-wrap items-center gap-2 font-mono">
              <span class="bg-emerald-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded uppercase tracking-wider">
                ✨ ULTIMO ARTICOLO
              </span>
              <span class="bg-sky-500/10 text-sky-400 border border-sky-500/30 text-[11px] font-bold px-2.5 py-0.5 rounded">
                {{ getCategoryName(featuredPost.categoryObject || featuredPost.category) }}
              </span>
              <span v-if="featuredPost.isVerified" class="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                🛡️ Verified
              </span>
              <span class="text-xs text-slate-400">
                • ⏱️ {{ calculateReadTime(featuredPost) }} min • 📅 {{ featuredPost.createdAt ? new Date(featuredPost.createdAt).toLocaleDateString('it-IT') : 'Oggi' }}
              </span>
            </div>

            <h2 class="text-2xl sm:text-3xl font-black text-white leading-tight group-hover:text-emerald-400 transition-colors">
              <NuxtLink :to="`/blog/${featuredPost.slug || featuredPost.id}`">
                {{ featuredPost.title }}
              </NuxtLink>
            </h2>

            <p class="text-slate-300 text-sm leading-relaxed line-clamp-2 max-w-3xl">
              {{ featuredPost.excerpt || featuredPost.summary || 'Approfondimento tecnico pubblicato nell\'ecosistema DevKernelPulse.' }}
            </p>

            <div v-if="featuredPost.tags && parseTags(featuredPost.tags).length > 0" class="flex flex-wrap gap-1.5 mt-1">
              <span v-for="tag in parseTags(featuredPost.tags)" :key="tag" class="bg-[#020420] text-sky-400 border border-slate-800 text-[11px] px-2 py-0.5 rounded font-mono">
                #{{ tag }}
              </span>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between w-full lg:w-auto gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-800 shrink-0">
            <div class="flex items-center gap-2.5">
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs border"
                :style="{ background: `linear-gradient(135deg, ${getAuthorRank(featuredPost.authorXp).color}, #0f172a)`, borderColor: getAuthorRank(featuredPost.authorXp).color }"
              >
                {{ (featuredPost.authorName || 'D')[0].toUpperCase() }}
              </div>
              <div class="text-left">
                <div class="text-xs font-bold text-white">{{ featuredPost.authorName || 'DevKernelPulse' }}</div>
                <div class="text-[10px] font-mono" :style="{ color: getAuthorRank(featuredPost.authorXp).color }">
                  {{ getAuthorRank(featuredPost.authorXp).badge }} {{ getAuthorRank(featuredPost.authorXp).title }}
                </div>
              </div>
            </div>

            <NuxtLink
              :to="`/blog/${featuredPost.slug || featuredPost.id}`"
              class="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-extrabold text-xs rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.25)] whitespace-nowrap"
            >
              Leggi ora ➔
            </NuxtLink>
          </div>
        </article>

        <!-- GRIGLIA ARTICOLI v2.6-PURE-SQL -->
        <div v-if="paginatedPosts.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <article
            v-for="post in paginatedPosts"
            :key="post.id"
            class="bg-[#090d16] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-xl group hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-[0_12px_30px_rgba(16,185,129,0.12)] transition-all"
          >
            <div>
              <!-- Header Card -->
              <div class="mb-4 flex flex-col gap-2.5 border-b border-slate-800/70 pb-3">
                <div class="flex w-full">
                  <span
                    class="text-emerald-400 font-extrabold bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-md text-[11px] truncate max-w-full"
                    :title="getCategoryName(post.categoryObject || post.category)"
                  >
                    {{ getCategoryName(post.categoryObject || post.category) }}
                  </span>
                </div>
                <div class="flex items-center justify-between w-full">
                  <span
                    v-if="post.isVerified"
                    class="text-[10px] text-emerald-400 font-bold border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1"
                    title="Verificato dal Vault DKP"
                  >
                    🛡️ Verified
                  </span>
                  <div v-else></div>
                  <span class="font-mono text-[11px] text-slate-400">
                    ⏱️ {{ calculateReadTime(post) }} min
                  </span>
                </div>
              </div>

              <!-- Titolo Articolo -->
              <h2 class="text-lg font-extrabold text-white leading-snug mb-2.5">
                <NuxtLink :to="`/blog/${post.slug || post.id}`" class="group-hover:text-emerald-400 transition-colors">
                  {{ post.title }}
                </NuxtLink>
              </h2>

              <!-- Estratto -->
              <p class="text-slate-400 text-xs sm:text-sm leading-relaxed mb-4 line-clamp-3">
                {{ post.excerpt || post.summary || 'Nessuna anteprima disponibile.' }}
              </p>

              <!-- TAGS ROW -->
              <div v-if="post.tags && parseTags(post.tags).length > 0" class="flex flex-wrap gap-1.5 mb-5">
                <span v-for="tag in parseTags(post.tags)" :key="tag" class="bg-[#020420] text-sky-400 border border-slate-800 text-[11px] px-2 py-0.5 rounded font-mono">
                  #{{ tag }}
                </span>
              </div>
            </div>

            <!-- Footer Unificato Gamificato -->
            <div class="flex flex-col items-start border-t border-slate-800 pt-4 mt-auto">
              <div class="flex items-center gap-2.5 mb-3 w-full border-b border-slate-800/60 pb-2.5">
                <div
                  class="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs border shrink-0"
                  :style="{ background: `linear-gradient(135deg, ${getAuthorRank(post.authorXp).color}, #0f172a)`, borderColor: getAuthorRank(post.authorXp).color }"
                >
                  {{ (post.authorName || 'D')[0].toUpperCase() }}
                </div>
                <div class="flex flex-col overflow-hidden">
                  <span class="text-xs font-bold text-slate-200 leading-tight truncate">{{ post.authorName || 'DevKernelPulse' }}</span>
                  <span class="text-[10px] leading-tight font-mono truncate" :style="{ color: getAuthorRank(post.authorXp).color }">
                    {{ getAuthorRank(post.authorXp).badge }} {{ getAuthorRank(post.authorXp).title }}
                  </span>
                </div>
              </div>

              <div class="w-full flex justify-between items-center text-xs mb-3">
                <span class="text-slate-500 font-mono text-[11px]">📅 {{ post.createdAt ? new Date(post.createdAt).toLocaleDateString('it-IT') : (post.date || 'Recente') }}</span>
                <div class="flex gap-3 font-mono text-[11px]">
                  <span title="Visualizzazioni" class="text-slate-400">👁️ {{ post.views || 0 }}</span>
                  <span title="Karma Likes" class="text-rose-400">❤️ {{ post.likes || 0 }}</span>
                </div>
              </div>

              <NuxtLink :to="`/blog/${post.slug || post.id}`" class="w-full text-center bg-emerald-500/10 hover:bg-emerald-400 text-emerald-400 hover:text-slate-950 border border-emerald-500/30 py-2 rounded-lg font-mono font-extrabold text-xs transition-all">
                Leggi articolo ↗
              </NuxtLink>
            </div>
          </article>
        </div>
      </template>

      <!-- WIDGET INTEGRATO NELLA NEWSROOM -->
      <div class="mt-4 border-t border-slate-800 pt-8">
        <DkpNodesHomeWidget />
      </div>

      <!-- BANNER DKP ADS STRIP -->
      <DkpAdStrip />

      <!-- CONTROLLI PAGINAZIONE NUMERATA -->
      <div v-if="totalPages > 1" class="flex justify-center items-center gap-3 mt-4 pt-6 border-t border-slate-800 font-mono">
        <button
          @click="changePage(currentPage - 1)"
          :disabled="currentPage === 1"
          class="bg-[#090d16] border border-slate-800 text-slate-300 hover:border-emerald-400 hover:text-emerald-400 px-4 py-2 rounded-lg font-bold text-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          type="button"
        >
          ← Indietro
        </button>

        <div class="flex gap-1.5">
          <button
            v-for="page in totalPages"
            :key="page"
            @click="changePage(page)"
            :class="[
              'w-9 h-9 rounded-lg font-bold text-xs flex items-center justify-center border cursor-pointer transition-all',
              currentPage === page
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                : 'bg-[#090d16] border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            ]"
            type="button"
          >
            {{ page }}
          </button>
        </div>

        <button
          @click="changePage(currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="bg-[#090d16] border border-slate-800 text-slate-300 hover:border-emerald-400 hover:text-emerald-400 px-4 py-2 rounded-lg font-bold text-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          type="button"
        >
          Avanti →
        </button>
      </div>

      <!-- BADGE FOOTER PULSE NEXUS -->
      <div class="flex justify-center mt-4">
        <div class="inline-flex items-center gap-2 bg-[#090d16] border border-emerald-500/40 px-4 py-1.5 rounded-full text-xs font-mono font-extrabold text-white shadow-lg">
          <span class="w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_8px_#00dc82]"></span>
          ⚡ Pulse Nexus
          <span class="bg-emerald-500 text-slate-950 px-1.5 py-0.5 rounded text-[10px] font-black">v2.6-PURE-SQL</span>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.fade-sub-enter-active, .fade-sub-leave-active { transition: all 0.25s ease; }
.fade-sub-enter-from, .fade-sub-leave-to { opacity: 0; transform: translateY(-6px); }
</style>