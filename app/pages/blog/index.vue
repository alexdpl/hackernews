<!-- app/pages/blog/index.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBlog } from '~/composables/useBlog'
import DkpAdStrip from '~/components/DkpAdStrip.vue'
import DkpAdsWidget from '~/components/DkpAdsWidget.vue'
import DkpNodesHomeWidget from '~/components/DkpNodesHomeWidget.vue'
import DKPRelatedThreads from '~/components/nodes/DKPRelatedThreads.vue'

interface EcosystemPillar {
  to: string
  icon: string
  tag: string
  title: string
  subtitle: string
  accentClass: string
  active?: boolean
}

useDkpSeo({
  title: 'DKP Editorial Hub & Technical Blog v2.6-PURE-SQL — DevKernelPulse',
  description: 'Aggiornamenti di sistema, rilasci del kernel v2.6-PURE-SQL, architetture cloud e approfondimenti tecnologici notarizzati dalla community di DevKernelPulse.',
  type: 'collection',
  canonicalPath: '/blog'
})

const ecosystemPillars: EcosystemPillar[] = [
  {
    to: '/news',
    icon: '🌍',
    tag: 'LIVE STREAM',
    title: 'DKP Tech Feed',
    subtitle: 'Segnali tech e newsroom filtrati in tempo reale da Trinity AI',
    accentClass: 'pillar-emerald'
  },
  {
    to: '/nodes',
    icon: '💬',
    tag: 'COMMUNITY',
    title: 'DKP Talks Hub',
    subtitle: 'Nodi tematici, architetture, bounty e discussioni tecniche',
    accentClass: 'pillar-purple'
  },
  {
    to: '/tools',
    icon: '🛠️',
    tag: 'SECURITY & DEV',
    title: 'Developer Tools',
    subtitle: 'Utility crittografiche, audit SAST e diagnostica per ingegneri',
    accentClass: 'pillar-cyan'
  },
  {
    to: '/blog',
    icon: '✍️',
    tag: 'VAULT VERIFIED',
    title: 'DKP Editorial Hub',
    subtitle: 'Deep-dive tecnici con certificazione SHA-256 immutabile',
    accentClass: 'pillar-amber',
    active: true
  }
]

// --- 1. CARICAMENTO DATI IMMEDIATO (SSR + CLIENT REFRESH) ---
const { posts, fetchPosts, getAuthorRank, isLoading } = useBlog()
const isRefreshing = ref(false)

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

async function refreshFeedNow() {
  isRefreshing.value = true
  try {
    await fetchPosts()
  } finally {
    setTimeout(() => { isRefreshing.value = false }, 350)
  }
}

onMounted(async () => {
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

const featuredPost = computed(() => {
  if (currentPage.value === 1 && !selectedCategory.value && !selectedSubcategory.value && !searchQuery.value.trim() && sortedAndFilteredPosts.value.length > 0) {
    return sortedAndFilteredPosts.value[0]
  }
  return null
})

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
  <main class="min-h-screen bg-[var(--bg-kernel)] text-[var(--text-main)] font-sans px-4 sm:px-6 py-10 sm:py-14 relative overflow-hidden transition-colors duration-500">
    <!-- BACKGROUND GLOW & TECHNICAL GRID (ALLINEATO ALLA HOME) -->
    <div class="hero-grid-bg pointer-events-none" aria-hidden="true"></div>
    <div
      class="absolute -top-44 left-1/2 -translate-x-1/2 w-[860px] h-[340px] bg-[var(--accent-emerald)]/10 blur-[130px] rounded-full pointer-events-none"
      aria-hidden="true"
    ></div>

    <div class="max-w-6xl mx-auto flex flex-col gap-10 relative z-10">
      <!-- 1. HERO HEADER ALLINEATO ALLA HOME -->
      <header class="relative pt-2 sm:pt-6 text-center flex flex-col items-center gap-6">
        <div class="inline-flex items-center gap-2.5 bg-[var(--bg-surface)]/90 backdrop-blur-md border border-[var(--accent-emerald)]/35 px-4 py-1.5 rounded-full shadow-[0_0_24px_rgba(16,185,129,0.14)]">
          <span class="relative flex h-2.5 w-2.5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-emerald)] opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--accent-emerald)]"></span>
          </span>
          <span class="text-[11px] font-mono font-black text-[var(--accent-emerald)] uppercase tracking-widest">
            ✍️ DKP Editorial Hub • SHA-256 Vault v2.6-PURE-SQL
          </span>
        </div>

        <h1 class="text-4xl sm:text-6xl font-black text-[var(--text-main)] tracking-tight leading-[1.1] max-w-4xl mx-auto">
          DKP Native
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-emerald)] via-[var(--accent-cyan)] to-amber-400">
            Blog &amp; Vault
          </span>
        </h1>

        <p class="text-[var(--text-muted)] text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Approfondimenti di sistema, architetture cloud, rilasci del kernel e guide notarizzate su Neon PostgreSQL dalla community.
        </p>

        <!-- BENTO GRID 4 PILASTRI DELL'ECOSISTEMA -->
        <nav aria-label="Moduli principali DevKernelPulse" class="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-2 text-left">
          <NuxtLink
            v-for="pillar in ecosystemPillars"
            :key="pillar.to"
            :to="pillar.to"
            :class="[
              'pillar-card group',
              pillar.accentClass,
              pillar.active ? 'border-amber-500/60 shadow-[0_0_25px_rgba(245,158,11,0.15)]' : ''
            ]"
          >
            <div class="flex items-center justify-between gap-2 mb-2">
              <span class="text-xl" aria-hidden="true">{{ pillar.icon }}</span>
              <span class="pillar-tag font-mono text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                {{ pillar.tag }}
              </span>
            </div>
            <h2 class="text-sm font-extrabold text-[var(--text-main)] group-hover:text-[var(--accent-emerald)] transition-colors flex items-center justify-between">
              <span>{{ pillar.title }}</span>
              <span class="text-xs opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">➔</span>
            </h2>
            <p class="text-xs text-[var(--text-muted)] leading-relaxed mt-1">
              {{ pillar.subtitle }}
            </p>
          </NuxtLink>
        </nav>

        <!-- CTA SCRITTURA & SYNC ISTANTANEO -->
        <div class="flex flex-wrap justify-center items-center gap-3 font-mono mt-1">
          <NuxtLink
            to="/user/dashboard?tab=content"
            class="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.25)]"
          >
            ✍️ Pubblica Articolo (+150 XP)
          </NuxtLink>

          <button
            type="button"
            @click="refreshFeedNow"
            :disabled="isRefreshing || isLoading"
            class="px-4 py-2.5 bg-[var(--bg-surface)] hover:border-[var(--accent-cyan)] text-[var(--text-main)] hover:text-[var(--accent-cyan)] border border-[var(--border-color)] font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-md"
            title="Sincronizza subito gli ultimi articoli dal database"
          >
            <span :class="{ 'inline-block animate-spin': isRefreshing }">🔄</span>
            {{ isRefreshing ? ' Sincronizzazione...' : ' Aggiorna Feed' }}
          </button>
        </div>
      </header>

      <!-- 2. BARRA DI RICERCA LIVE & CONTATORE ARTICOLI -->
      <div class="flex flex-col sm:flex-row items-center gap-3 max-w-3xl mx-auto w-full">
        <div class="relative flex-1 w-full flex items-center bg-[var(--bg-surface)] border border-[var(--border-color)] focus-within:border-[var(--accent-emerald)] rounded-xl px-4 py-3 shadow-xl transition-colors">
          <span class="text-base mr-2.5">🔍</span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cerca articoli, release notes o tag (es. #PureSQL, #Nuxt4, #Security)..."
            class="w-full bg-transparent border-none text-[var(--text-main)] text-sm outline-none placeholder-slate-500"
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
        <div class="text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-surface)] border border-[var(--border-color)] px-4 py-3.5 rounded-xl shrink-0 shadow-xl">
          📚 <strong class="text-[var(--accent-emerald)]">{{ sortedAndFilteredPosts.length }}</strong> articoli
        </div>
      </div>

      <!-- 3. BANNER DKP ADS WIDGET -->
      <DkpAdsWidget placement="blogSidebar" />

      <!-- 4. BARRA CATEGORIE DINAMICHE -->
      <nav aria-label="Categorie Blog" class="flex justify-center gap-2 flex-wrap">
        <button
          @click="selectCategory(null)"
          :class="[
            'px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer inline-flex items-center gap-1.5',
            selectedCategory === null
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
              : 'bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-slate-600'
          ]"
          type="button"
        >
          🔥 Tutti
        </button>

        <div v-if="loadingCats" class="text-xs text-[var(--text-muted)] font-mono self-center px-2">⏳ Caricamento categorie...</div>

        <button
          v-for="cat in categories"
          :key="cat.id"
          @click="selectCategory(cat.name)"
          :style="selectedCategory === cat.name ? getCategoryStyle(cat) : {}"
          :class="[
            'px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer inline-flex items-center gap-1.5',
            selectedCategory === cat.name
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500'
              : 'bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-slate-600'
          ]"
          type="button"
        >
          <span>{{ getCategoryIcon(cat) }}</span>
          <span>{{ getCategoryName(cat) }}</span>
        </button>
      </nav>

      <!-- BARRA SOTTOCATEGORIE DINAMICHE -->
      <Transition name="fade-sub">
        <div v-if="activeSubcategories.length > 0" class="flex flex-wrap items-center justify-center gap-2 bg-[var(--bg-surface)] border border-[var(--border-color)] px-4 py-2.5 rounded-xl max-w-4xl mx-auto">
          <span class="text-[11px] font-mono font-extrabold text-[var(--text-muted)] uppercase mr-1">Sottocategorie:</span>
          <button
            @click="selectedSubcategory = null; currentPage = 1"
            :class="['px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer', selectedSubcategory === null ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30' : 'text-[var(--text-muted)] hover:text-[var(--accent-emerald)]']"
            type="button"
          >
            Tutte
          </button>
          <button
            v-for="sub in activeSubcategories"
            :key="sub.id || sub.name"
            @click="selectedSubcategory = sub.name; currentPage = 1"
            :class="['px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer', selectedSubcategory === sub.name ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30' : 'text-[var(--text-muted)] hover:text-[var(--accent-emerald)]']"
            type="button"
          >
            {{ sub.name }}
          </button>
        </div>
      </Transition>

      <!-- 5. SPINNER & EMPTY STATE -->
      <div v-if="isLoading && posts.length === 0" class="text-center py-16 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl text-[var(--accent-emerald)] font-mono text-xs animate-pulse">
        ⏳ Estrazione articoli dal Vault Neon DB v2.6 in corso...
      </div>

      <div v-else-if="sortedAndFilteredPosts.length === 0" class="text-center py-16 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl flex flex-col items-center gap-3">
        <span class="text-4xl">📂</span>
        <h3 class="text-lg font-bold text-[var(--text-main)]">Nessun articolo trovato</h3>
        <p class="text-xs text-[var(--text-muted)] max-w-md">Nessun contenuto corrisponde ai filtri attuali. Prova a sincronizzare il feed o ripristina la ricerca.</p>
        <div class="flex gap-3 mt-2 font-mono">
          <button @click="selectCategory(null); searchQuery = ''; currentPage = 1" class="px-4 py-2 bg-emerald-500 text-slate-950 font-extrabold text-xs rounded-lg cursor-pointer hover:bg-emerald-400" type="button">
            Ripristina Filtri
          </button>
          <button @click="refreshFeedNow" class="px-4 py-2 bg-[var(--bg-kernel)] border border-[var(--border-color)] text-[var(--accent-cyan)] font-bold text-xs rounded-lg cursor-pointer hover:border-sky-400" type="button">
            🔄 Ricarica DB
          </button>
        </div>
      </div>

      <template v-else>
        <!-- ARTICOLO IN EVIDENZA (ULTIMO RILASCIO) -->
        <article
          v-if="featuredPost"
          class="bg-[var(--bg-surface)] border border-[var(--accent-emerald)]/40 rounded-3xl p-6 sm:p-8 shadow-[0_15px_40px_rgba(16,185,129,0.08)] flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center relative overflow-hidden group"
        >
          <div class="flex-1 flex flex-col gap-3">
            <div class="flex flex-wrap items-center gap-2 font-mono">
              <span class="bg-emerald-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded uppercase tracking-wider">
                ✨ ULTIMO ARTICOLO
              </span>
              <span class="bg-sky-500/10 text-[var(--accent-cyan)] border border-sky-500/30 text-[11px] font-bold px-2.5 py-0.5 rounded">
                {{ getCategoryName(featuredPost.categoryObject || featuredPost.category) }}
              </span>
              <span v-if="featuredPost.isVerified" class="text-[11px] text-[var(--accent-emerald)] font-bold bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                🛡️ Verified
              </span>
              <span class="text-xs text-[var(--text-muted)]">
                ⏱️ {{ calculateReadTime(featuredPost) }} min • 📅 {{ featuredPost.createdAt ? new Date(featuredPost.createdAt).toLocaleDateString('it-IT') : 'Oggi' }}
              </span>
            </div>

            <h2 class="text-2xl sm:text-3xl font-black text-[var(--text-main)] leading-tight group-hover:text-[var(--accent-emerald)] transition-colors">
              <NuxtLink :to="`/blog/${featuredPost.slug || featuredPost.id}`">
                {{ featuredPost.title }}
              </NuxtLink>
            </h2>

            <p class="text-[var(--text-muted)] text-sm leading-relaxed line-clamp-2 max-w-3xl">
              {{ featuredPost.excerpt || featuredPost.summary || 'Approfondimento tecnico pubblicato nell\'ecosistema DevKernelPulse.' }}
            </p>

            <div v-if="featuredPost.tags && parseTags(featuredPost.tags).length > 0" class="flex flex-wrap gap-1.5 mt-1">
              <span v-for="tag in parseTags(featuredPost.tags)" :key="tag" class="bg-[var(--bg-kernel)] text-[var(--accent-cyan)] border border-[var(--border-color)] text-[11px] px-2 py-0.5 rounded font-mono">
                #{{ tag }}
              </span>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between w-full lg:w-auto gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-[var(--border-color)] shrink-0">
            <div class="flex items-center gap-2.5">
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs border"
                :style="{ background: `linear-gradient(135deg, ${getAuthorRank(featuredPost.authorXp).color}, #0f172a)`, borderColor: getAuthorRank(featuredPost.authorXp).color }"
              >
                {{ (featuredPost.authorName || 'D')[0].toUpperCase() }}
              </div>
              <div class="text-left">
                <div class="text-xs font-bold text-[var(--text-main)]">{{ featuredPost.authorName || 'DevKernelPulse' }}</div>
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
        <section v-if="paginatedPosts.length > 0" aria-label="Articoli Editorial Hub" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <article
            v-for="post in paginatedPosts"
            :key="post.id"
            class="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-6 flex flex-col justify-between shadow-xl group hover:-translate-y-1 hover:border-[var(--accent-emerald)]/50 hover:shadow-[0_12px_30px_rgba(16,185,129,0.12)] transition-all"
          >
            <div>
              <div class="mb-4 flex flex-col gap-2.5 border-b border-[var(--border-color)] pb-3">
                <div class="flex w-full">
                  <span
                    class="text-[var(--accent-emerald)] font-extrabold bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-md text-[11px] truncate max-w-full"
                    :title="getCategoryName(post.categoryObject || post.category)"
                  >
                    {{ getCategoryName(post.categoryObject || post.category) }}
                  </span>
                </div>
                <div class="flex items-center justify-between w-full">
                  <span
                    v-if="post.isVerified"
                    class="text-[10px] text-[var(--accent-emerald)] font-bold border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1"
                    title="Verificato dal Vault DKP"
                  >
                    🛡️ Verified
                  </span>
                  <div v-else></div>
                  <span class="font-mono text-[11px] text-[var(--text-muted)]">
                    ⏱️ {{ calculateReadTime(post) }} min
                  </span>
                </div>
              </div>

              <h2 class="text-lg font-extrabold text-[var(--text-main)] leading-snug mb-2.5">
                <NuxtLink :to="`/blog/${post.slug || post.id}`" class="group-hover:text-[var(--accent-emerald)] transition-colors">
                  {{ post.title }}
                </NuxtLink>
              </h2>

              <p class="text-[var(--text-muted)] text-xs sm:text-sm leading-relaxed mb-4 line-clamp-3">
                {{ post.excerpt || post.summary || 'Nessuna anteprima disponibile.' }}
              </p>

              <div v-if="post.tags && parseTags(post.tags).length > 0" class="flex flex-wrap gap-1.5 mb-5">
                <span v-for="tag in parseTags(post.tags)" :key="tag" class="bg-[var(--bg-kernel)] text-[var(--accent-cyan)] border border-[var(--border-color)] text-[11px] px-2 py-0.5 rounded font-mono">
                  #{{ tag }}
                </span>
              </div>
            </div>

            <div class="flex flex-col items-start border-t border-[var(--border-color)] pt-4 mt-auto">
              <div class="flex items-center gap-2.5 mb-3 w-full border-b border-[var(--border-color)] pb-2.5">
                <div
                  class="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs border shrink-0"
                  :style="{ background: `linear-gradient(135deg, ${getAuthorRank(post.authorXp).color}, #0f172a)`, borderColor: getAuthorRank(post.authorXp).color }"
                >
                  {{ (post.authorName || 'D')[0].toUpperCase() }}
                </div>
                <div class="flex flex-col overflow-hidden">
                  <span class="text-xs font-bold text-[var(--text-main)] leading-tight truncate">{{ post.authorName || 'DevKernelPulse' }}</span>
                  <span class="text-[10px] leading-tight font-mono truncate" :style="{ color: getAuthorRank(post.authorXp).color }">
                    {{ getAuthorRank(post.authorXp).badge }} {{ getAuthorRank(post.authorXp).title }}
                  </span>
                </div>
              </div>

              <div class="w-full flex justify-between items-center text-xs mb-3">
                <span class="text-[var(--text-muted)] font-mono text-[11px]">📅 {{ post.createdAt ? new Date(post.createdAt).toLocaleDateString('it-IT') : (post.date || 'Recente') }}</span>
                <div class="flex gap-3 font-mono text-[11px]">
                  <span title="Visualizzazioni" class="text-[var(--text-muted)]">👁️ {{ post.views || 0 }}</span>
                  <span title="Karma Likes" class="text-rose-400">❤️ {{ post.likes || 0 }}</span>
                </div>
              </div>

              <NuxtLink :to="`/blog/${post.slug || post.id}`" class="w-full text-center bg-emerald-500/10 hover:bg-emerald-400 text-[var(--accent-emerald)] hover:text-slate-950 border border-emerald-500/30 py-2 rounded-lg font-mono font-extrabold text-xs transition-all">
                Leggi articolo ↗
              </NuxtLink>
            </div>
          </article>
        </section>
      </template>

      <!-- 6. CONTROLLI PAGINAZIONE NUMERATA -->
      <div v-if="totalPages > 1" class="flex justify-center items-center gap-3 pt-6 border-t border-[var(--border-color)] font-mono">
        <button
          @click="changePage(currentPage - 1)"
          :disabled="currentPage === 1"
          class="bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] hover:border-[var(--accent-emerald)] hover:text-[var(--accent-emerald)] px-4 py-2 rounded-xl font-bold text-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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
              'w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center border cursor-pointer transition-all',
              currentPage === page
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                : 'bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-slate-600'
            ]"
            type="button"
          >
            {{ page }}
          </button>
        </div>

        <button
          @click="changePage(currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] hover:border-[var(--accent-emerald)] hover:text-[var(--accent-emerald)] px-4 py-2 rounded-xl font-bold text-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          type="button"
        >
          Avanti →
        </button>
      </div>

      <!-- 7. FEED DEL FORUM: DISCUSSIONI CORRELATE NEI NODI -->
      <section aria-label="Discussioni attive nei DKP Nodes" class="pt-6 border-t border-[var(--border-color)]">
        <DKPRelatedThreads />
      </section>

      <!-- 8. WIDGET STREAM NODI & FORUM COMMUNITY -->
      <section aria-label="DKP Nodes Live Stream" class="pt-4 border-t border-[var(--border-color)]">
        <DkpNodesHomeWidget />
      </section>

      <!-- 9. BANNER DKP ADS STRIP -->
      <aside aria-label="Risorse e letture tecniche">
        <DkpAdStrip categoryTag="DKP DEV LIBRARY • LETTURE TECNICHE" />
      </aside>
    </div>
  </main>
</template>

<style scoped>
.hero-grid-bg {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(to right, rgba(148, 163, 184, 0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(148, 163, 184, 0.05) 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: radial-gradient(ellipse 80% 55% at 50% 10%, #000 40%, transparent 100%);
}

.pillar-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  padding: 1.1rem 1.15rem;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.pillar-card:hover {
  transform: translateY(-3px);
}

.pillar-emerald:hover {
  border-color: rgba(16, 185, 129, 0.55);
  box-shadow: 0 12px 28px -10px rgba(16, 185, 129, 0.25);
}
.pillar-emerald .pillar-tag {
  background: rgba(16, 185, 129, 0.12);
  color: #10b981;
}

.pillar-purple:hover {
  border-color: rgba(168, 85, 247, 0.55);
  box-shadow: 0 12px 28px -10px rgba(168, 85, 247, 0.25);
}
.pillar-purple .pillar-tag {
  background: rgba(168, 85, 247, 0.12);
  color: #c084fc;
}

.pillar-cyan:hover {
  border-color: rgba(56, 189, 248, 0.55);
  box-shadow: 0 12px 28px -10px rgba(56, 189, 248, 0.25);
}
.pillar-cyan .pillar-tag {
  background: rgba(56, 189, 248, 0.12);
  color: #38bdf8;
}

.pillar-amber:hover {
  border-color: rgba(245, 158, 11, 0.55);
  box-shadow: 0 12px 28px -10px rgba(245, 158, 11, 0.25);
}
.pillar-amber .pillar-tag {
  background: rgba(245, 158, 11, 0.12);
  color: #fbbf24;
}

.fade-sub-enter-active, .fade-sub-leave-active { transition: all 0.25s ease; }
.fade-sub-enter-from, .fade-sub-leave-to { opacity: 0; transform: translateY(-6px); }
</style>