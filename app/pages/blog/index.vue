<-- app/pages/blog/index.vue -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import DkpHomeTelemetry from '~/components/DkpHomeTelemetry.vue'
import DkpHomeWidget from '~/components/DkpHomeWidget.vue'
import DkpRelatedNodesWidget from '~/components/widgets/DkpRelatedNodesWidget.vue'
import DkpAdStrip from '~/components/DkpAdStrip.vue'
import DkpAdsWidget from '~/components/ads/DkpAdsWidget.vue'

useDkpSeo({
  title: 'DKP Native Blog & Vault \u2014 Deep-Dive Certificati SHA-256 | DevKernelPulse',
  description: 'Approfondimenti di sistema, architetture cloud, rilasci del kernel e guide notarizzate su Neon PostgreSQL dalla community.',
  type: 'collection',
  canonicalPath: '/blog'
})

const heroCards = [
  {
    to: '/news',
    icon: '\uD83C\uDF0D',
    badge: 'LIVE STREAM',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/35',
    title: 'DKP Tech Feed',
    desc: 'Segnali tech e newsroom filtrati in tempo reale da Trinity AI'
  },
  {
    to: '/nodes',
    icon: '\uD83D\uDCAC',
    badge: 'COMMUNITY',
    badgeClass: 'bg-violet-500/15 text-violet-300 border-violet-500/35',
    title: 'DKP Talks Hub',
    desc: 'Nodi tematici, architetture, bounty e discussioni tecniche'
  },
  {
    to: '/tools',
    icon: '\uD83D\uDEE0\uFE0F',
    badge: 'SECURITY & DEV',
    badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/35',
    title: 'Developer Tools',
    desc: 'Utility crittografiche, audit SAST e diagnostica per ingegneri'
  },
  {
    to: '/blog',
    icon: '\uD83D\uDCDD',
    badge: 'VAULT VERIFIED',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/35',
    title: 'DKP Editorial Hub',
    desc: 'Deep-dive tecnici con certificazione SHA-256 immutabile'
  }
]

const FALLBACK_CATEGORIES = [
  {
    name: 'AI, LLM & Machine Learning',
    icon: '\uD83E\uDD16',
    subcategories: [
      'Machine Learning & Deep Learning',
      'LLM & Generative AI',
      'AI Agents & Agentic Workflows',
      'RAG & Vector Databases',
      'Prompt Engineering',
      'AI Safety & Robustness'
    ]
  },
  {
    name: 'Cloud Native & DevOps',
    icon: '\u2601\uFE0F',
    subcategories: ['Kubernetes & Containers', 'CI/CD & GitOps', 'Serverless & Edge', 'Observability & Telemetry']
  },
  {
    name: 'Blockchain & Web3',
    icon: '\u26D3\uFE0F',
    subcategories: ['SHA-256 Notarization', 'Smart Contracts', 'Zero-Knowledge Proofs', 'DePIN & Distributed Ledgers']
  },
  {
    name: 'Frontend Architecture',
    icon: '\uD83C\uDFA8',
    subcategories: ['Nuxt 4 & Vue 3', 'TypeScript Patterns', 'Design Systems & Tailwind', 'Web Performance & Core Web Vitals']
  },
  {
    name: 'Backend & Microservices',
    icon: '\u2699\uFE0F',
    subcategories: ['Nitro & Edge APIs', 'Distributed Systems', 'Event-Driven Architecture', 'gRPC & GraphQL']
  },
  {
    name: 'Cybersecurity & Vault',
    icon: '\uD83D\uDEE1\uFE0F',
    subcategories: ['SAST & Static Analysis', 'Zero-Trust Auth', 'Cryptography & Hashing', 'API Hardening']
  },
  {
    name: 'DKP Ecosystem & Releases',
    icon: '\uD83D\uDE80',
    subcategories: ['Kernel v2.6 Pure SQL', 'BEMYAGENT.md', 'DKP SDK & CLI', 'Sentinel AI Updates']
  },
  {
    name: 'Databases & Data Pipeline',
    icon: '\uD83D\uDCBE',
    subcategories: ['Neon PostgreSQL', 'Pure SQL Optimization', 'Indexing & Query Tuning', 'ETL & Streaming']
  }
]

const { data: postsRes, pending, refresh } = await useFetch<any>('/api/blog/posts', {
  key: 'dkp-blog-posts-hub',
  query: { limit: 100 }
})

const { data: catsRes } = await useFetch<any>('/api/blog/categories', {
  key: 'dkp-blog-categories-hub'
})

const allPosts = computed<any[]>(() => {
  const raw = postsRes.value?.data || postsRes.value || []
  return Array.isArray(raw) ? raw : []
})

function getCategoryIcon(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('ai') || n.includes('llm')) return '\uD83E\uDD16'
  if (n.includes('cloud')) return '\u2601\uFE0F'
  if (n.includes('blockchain') || n.includes('web3')) return '\u26D3\uFE0F'
  if (n.includes('frontend')) return '\uD83C\uDFA8'
  if (n.includes('backend')) return '\u2699\uFE0F'
  if (n.includes('security') || n.includes('vault')) return '\uD83D\uDEE1\uFE0F'
  if (n.includes('ecosystem') || n.includes('release')) return '\uD83D\uDE80'
  if (n.includes('database') || n.includes('data')) return '\uD83D\uDCBE'
  if (n.includes('mobile')) return '\uD83D\uDCF1'
  if (n.includes('game')) return '\uD83C\uDFAE'
  if (n.includes('kernel') || n.includes('low-level')) return '\uD83E\uDDEC'
  return '\u26A1'
}

const categories = computed(() => {
  const dbCats = catsRes.value?.data || []
  if (Array.isArray(dbCats) && dbCats.length > 0) {
    return dbCats.map((c: any) => {
      const rawSubs = Array.isArray(c.subcategories) ? c.subcategories : []
      const subNames = rawSubs
        .map((s: any) => (typeof s === 'string' ? s : String(s?.name || '')))
        .filter(Boolean)
      return {
        id: Number(c.id || 0),
        slug: String(c.slug || ''),
        name: String(c.name),
        icon: getCategoryIcon(String(c.name)),
        subcategories: subNames
      }
    })
  }
  return FALLBACK_CATEGORIES.map((c, idx) => ({ ...c, id: idx + 1, slug: '' }))
})

const searchQuery = ref('')
const selectedCategory = ref('Tutti')
const selectedSubcategory = ref('Tutte')
const currentPage = ref(1)
const pageSize = 9

const activeCategoryObj = computed(() =>
  categories.value.find((c) => c.name === selectedCategory.value) || null
)

function selectCategory(catName: string) {
  selectedCategory.value = catName
  selectedSubcategory.value = 'Tutte'
  currentPage.value = 1
}

const filteredPosts = computed<any[]>(() => {
  const q = searchQuery.value.toLowerCase().trim()
  const activeCat = activeCategoryObj.value
  return allPosts.value.filter((post: any) => {
    if (selectedCategory.value !== 'Tutti') {
      const postCat = String(post.category || '').trim().toLowerCase()
      const selCat = selectedCategory.value.trim().toLowerCase()
      const idMatch = activeCat?.id && Number(post.categoryId) === Number(activeCat.id)
      const slugMatch = activeCat?.slug && String(post.categorySlug || '') === activeCat.slug
      if (!idMatch && !slugMatch && postCat !== selCat) return false
    }
    if (selectedSubcategory.value !== 'Tutte') {
      const selSub = selectedSubcategory.value.trim().toLowerCase()
      const postSub = String(post.subcategory || '').trim().toLowerCase()
      const hay = `${postSub} ${post.title || ''} ${post.excerpt || ''} ${(post.tags || []).join(' ')}`.toLowerCase()
      if (postSub !== selSub && !hay.includes(selSub)) return false
    }
    if (q) {
      const hay = `${post.title || ''} ${post.excerpt || ''} ${post.category || ''} ${post.subcategory || ''} ${post.authorName || ''} ${(post.tags || []).join(' ')}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
})

const featuredPost = computed<any | null>(() => {
  if (currentPage.value !== 1 || filteredPosts.value.length === 0) return null
  return filteredPosts.value[0]
})

const gridSourcePosts = computed<any[]>(() => {
  if (currentPage.value === 1 && filteredPosts.value.length > 0) {
    return filteredPosts.value.slice(1)
  }
  return filteredPosts.value
})

const totalPages = computed(() => Math.max(1, Math.ceil(gridSourcePosts.value.length / pageSize)))

const paginatedPosts = computed<any[]>(() => {
  const start = (currentPage.value - 1) * pageSize
  return gridSourcePosts.value.slice(start, start + pageSize)
})

watch([searchQuery, selectedSubcategory], () => {
  currentPage.value = 1
})

function estimateReadMin(post: any): number {
  const txt = `${post?.excerpt || ''} ${post?.content || ''}`.trim()
  const words = txt ? txt.split(/\s+/).length : 180
  return Math.max(3, Math.ceil(words / 180))
}

function formatDate(raw: any): string {
  if (!raw) return new Date().toLocaleDateString('it-IT')
  const d = new Date(raw)
  return isNaN(d.getTime()) ? new Date().toLocaleDateString('it-IT') : d.toLocaleDateString('it-IT')
}

// Modale Pubblica Articolo (+150 XP)
const showPublishModal = ref(false)
const isPublishing = ref(false)
const publishError = ref('')
const publishSuccess = ref('')

const articleForm = ref({
  title: '',
  category: 'DKP Ecosystem & Releases',
  excerpt: '',
  content: '',
  tagsRaw: 'PureSQL, Nuxt4, SentinelAI'
})

async function submitNewArticle() {
  publishError.value = ''
  publishSuccess.value = ''
  if (!articleForm.value.title.trim() || !articleForm.value.content.trim()) {
    publishError.value = 'Inserisci titolo e contenuto tecnico dell articolo.'
    return
  }
  isPublishing.value = true
  try {
    const tags = articleForm.value.tagsRaw
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean)

    const res: any = await $fetch('/api/blog/submit', {
      method: 'POST',
      body: {
        title: articleForm.value.title.trim(),
        category: articleForm.value.category,
        excerpt: articleForm.value.excerpt.trim() || articleForm.value.content.trim().slice(0, 180),
        content: articleForm.value.content.trim(),
        tags
      }
    })
    if (res?.success || res?.data || res?.id) {
      publishSuccess.value = 'Articolo notarizzato su SHA-256 Vault! +150 XP accreditati.'
      articleForm.value = {
        title: '',
        category: 'DKP Ecosystem & Releases',
        excerpt: '',
        content: '',
        tagsRaw: 'PureSQL, Nuxt4, SentinelAI'
      }
      await refresh()
      setTimeout(() => {
        showPublishModal.value = false
        publishSuccess.value = ''
      }, 1600)
    }
  } catch (err: any) {
    publishError.value = err?.data?.statusMessage || 'Errore durante la notarizzazione nel Vault.'
  } finally {
    isPublishing.value = false
  }
}
</script>

<template>
  <div class="bg-dkp-bg text-dkp-text font-display min-h-screen bg-grid-pattern relative">
    <DkpHomeTelemetry />

    <!-- HERO SECTION GEMELLA DELLA HOME & /news -->
    <section class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-4 text-center">
      <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-dkp-card border border-dkp-border font-mono text-xs text-dkp-accent font-bold mb-6 card-glow">
        <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
        <span> DKP EDITORIAL HUB &bull; SHA-256 VAULT V2.6-PURE-SQL</span>
      </div>

      <h1 class="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight m-0 mb-5">
        <span class="text-white">DKP Native </span>
        <span class="bg-gradient-to-r from-emerald-400 via-cyan-400 to-amber-400 bg-clip-text text-transparent">
          Blog &amp; Vault
        </span>
      </h1>

      <p class="text-slate-300 text-base sm:text-lg max-w-3xl mx-auto leading-relaxed mb-8">
        Approfondimenti di sistema, architetture cloud, rilasci del kernel e guide notarizzate su Neon PostgreSQL dalla community.
      </p>

      <!-- 4 CARD PRINCIPALI -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left mb-7">
        <NuxtLink
          v-for="card in heroCards"
          :key="card.to"
          :to="card.to"
          :class="[
            'bg-dkp-card/95 border rounded-2xl p-5 no-underline transition-all card-glow group flex flex-col justify-between gap-4',
            card.to === '/blog' ? 'border-amber-400/60 shadow-[0_0_20px_rgba(251,191,36,0.14)]' : 'border-dkp-border hover:border-cyan-400/60'
          ]"
        >
          <div class="flex items-center justify-between">
            <span class="text-2xl">{{ card.icon }}</span>
            <span :class="['font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-md border uppercase', card.badgeClass]">
              {{ card.badge }}
            </span>
          </div>
          <div>
            <h2 class="text-base font-bold text-white group-hover:text-dkp-accent transition-colors flex items-center justify-between m-0 mb-1.5">
              <span>{{ card.title }}</span>
              <span class="text-slate-400 group-hover:text-dkp-accent transition-transform group-hover:translate-x-1">&rarr;</span>
            </h2>
            <p class="text-xs text-slate-300 leading-relaxed m-0">{{ card.desc }}</p>
          </div>
        </NuxtLink>
      </div>

      <!-- PULSANTE PUBBLICA ARTICOLO (+150 XP) + AGGIORNA FEED -->
      <div class="flex flex-wrap items-center justify-center gap-3 mb-6">
        <NuxtLink
          to="/user/dashboard?tab=content"
          class="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs sm:text-sm font-extrabold no-underline shadow-[0_0_20px_rgba(16,185,129,0.28)] transition-all inline-flex items-center gap-2"
        >
           Pubblica Articolo (+150 XP)
        </NuxtLink>

        <button
          type="button"
          @click="() => refresh()"
          class="px-4 py-2.5 rounded-xl bg-dkp-card border border-dkp-border hover:border-cyan-400 text-slate-200 font-mono text-xs sm:text-sm font-bold cursor-pointer transition-colors"
        >
           Aggiorna Feed
        </button>
      </div>

      <!-- BARRA RICERCA + CONTATORE ARTICOLI -->
      <div class="max-w-3xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div class="relative flex-1">
          <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cerca articoli, release notes o tag (es. #PureSQL, #Nuxt4, #Security)..."
            class="w-full bg-dkp-card/95 border border-dkp-border focus:border-cyan-400 text-white pl-10 pr-4 py-3 rounded-xl font-mono text-xs outline-none box-border"
          />
        </div>
        <div class="px-4 py-3 rounded-xl bg-dkp-card/95 border border-dkp-border font-mono text-xs font-bold text-emerald-400 shrink-0">
           {{ filteredPosts.length }} articoli
        </div>
      </div>
    </section>

    <!-- LAYOUT CON SIDEBAR UNIFICATA + CONTENUTI BLOG + CRAWLER NEWS & NODES -->
    <DkpLayout :hide-section-header="true" :show-sidebar-ads="true">
      <!-- 1. PILLS CATEGORIE + SOTTOCATEGORIE DINAMICHE -->
      <section class="space-y-4">
        <div class="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            @click="selectCategory('Tutti')"
            :class="[
              'px-3.5 py-2 rounded-xl font-mono text-xs font-bold border cursor-pointer transition-all',
              selectedCategory === 'Tutti'
                ? 'bg-emerald-500/15 border-emerald-400 text-emerald-300'
                : 'bg-dkp-card/95 border-dkp-border text-slate-300 hover:border-slate-600'
            ]"
          >
             Tutti
          </button>

          <button
            v-for="cat in categories"
            :key="cat.name"
            type="button"
            @click="selectCategory(cat.name)"
            :class="[
              'px-3.5 py-2 rounded-xl font-mono text-xs font-bold border cursor-pointer transition-all',
              selectedCategory === cat.name
                ? 'bg-emerald-500/15 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.16)]'
                : 'bg-dkp-card/95 border-dkp-border text-slate-300 hover:border-slate-600'
            ]"
          >
            {{ cat.icon }} {{ cat.name }}
          </button>
        </div>

        <!-- Pannello Sottocategorie quando una categoria e' selezionata -->
        <div
          v-if="activeCategoryObj && activeCategoryObj.subcategories.length > 0"
          class="bg-dkp-card/95 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3"
        >
          <div class="flex flex-wrap items-center gap-2 font-mono text-xs">
            <span class="text-slate-400 uppercase font-bold">SOTTOCATEGORIE:</span>
            <button
              type="button"
              @click="selectedSubcategory = 'Tutte'"
              :class="[
                'px-3 py-1 rounded-lg border font-bold cursor-pointer',
                selectedSubcategory === 'Tutte'
                  ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                  : 'bg-dkp-bg border-slate-800 text-slate-300'
              ]"
            >
              Tutte
            </button>
            <button
              v-for="sub in activeCategoryObj.subcategories"
              :key="sub"
              type="button"
              @click="selectedSubcategory = sub"
              :class="[
                'px-3 py-1 rounded-lg border font-bold cursor-pointer transition-colors',
                selectedSubcategory === sub
                  ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                  : 'bg-transparent border-transparent text-slate-300 hover:text-white'
              ]"
            >
              {{ sub }}
            </button>
          </div>
        </div>
      </section>

      <!-- 2. CARICAMENTO O ARTICOLI BLOG -->
      <div v-if="pending && allPosts.length === 0" class="bg-dkp-card border border-dkp-border rounded-2xl p-10 text-center font-mono text-xs text-emerald-400 animate-pulse">
         Lettura articoli certificati dal database Pure SQL...
      </div>

      <template v-else>
	  <!-- CIRCUITO DKP ADS + ACQUISTA SPAZIO (ORIZZONTALE) -->
<DkpAdsWidget
  placement="feedInline"
  layout="horizontal"
  :limit="3"
  :show-advertise-link="true"
/>
        <!-- HERO CARD: ULTIMO ARTICOLO -->
        <article
          v-if="featuredPost"
          class="bg-[#050a18]/95 border border-slate-700/90 hover:border-emerald-400/60 rounded-2xl p-6 sm:p-8 card-glow transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
        >
          <div class="space-y-4 flex-1 min-w-0">
            <div class="flex flex-wrap items-center gap-2.5 font-mono text-[11px]">
              <span class="px-2.5 py-1 rounded bg-emerald-500 text-slate-950 font-extrabold uppercase">
                 ULTIMO ARTICOLO
              </span>
              <span class="px-2.5 py-1 rounded bg-sky-500/15 text-sky-300 border border-sky-500/35 font-bold">
                {{ featuredPost.category || 'DKP Ecosystem & Releases' }}
              </span>
              <span class="px-2.5 py-1 rounded bg-teal-500/15 text-teal-300 border border-teal-500/35 font-bold">
                 Verified
              </span>
              <span class="text-slate-400"> {{ estimateReadMin(featuredPost) }} min &bull;  {{ formatDate(featuredPost.createdAt) }}</span>
            </div>

            <NuxtLink
              :to="`/blog/${featuredPost.slug}`"
              class="text-2xl sm:text-3xl font-extrabold text-sky-400 hover:text-cyan-300 no-underline block leading-tight"
            >
              {{ featuredPost.title }}
            </NuxtLink>

            <p class="text-slate-300 text-sm leading-relaxed m-0">
              {{ featuredPost.excerpt }}
            </p>

            <div v-if="featuredPost.tags?.length" class="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
              <span
                v-for="tag in featuredPost.tags"
                :key="tag"
                class="px-2.5 py-0.5 rounded bg-[#081226] border border-slate-700/80 text-sky-400 font-bold"
              >
                #{{ tag }}
              </span>
            </div>
          </div>

          <div class="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-4 shrink-0 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-800">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-full bg-emerald-500 text-slate-950 font-extrabold flex items-center justify-center text-sm">
                {{ String(featuredPost.authorName || 'A').charAt(0).toUpperCase() }}
              </div>
              <div class="text-left">
                <div class="text-white font-bold text-xs">{{ featuredPost.authorName || 'alexdpl' }}</div>
                <div class="text-emerald-400 font-mono text-[10px]"> Kernel Initiate</div>
              </div>
            </div>

            <NuxtLink
              :to="`/blog/${featuredPost.slug}`"
              class="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-extrabold no-underline transition-colors"
            >
              Leggi ora &rarr;
            </NuxtLink>
          </div>
        </article>

        <!-- GRIGLIA A 3 COLONNE DELLE CARD DEL BLOG -->
        <div v-if="paginatedPosts.length > 0" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <article
            v-for="post in paginatedPosts"
            :key="post.id"
            class="bg-[#050a18]/95 border border-slate-800 hover:border-cyan-400/60 rounded-2xl p-5 card-glow transition-all flex flex-col justify-between gap-4"
          >
            <div class="space-y-3">
              <div class="flex items-center justify-between gap-2 font-mono text-[11px]">
                <span class="px-2.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/35 font-bold truncate max-w-[185px]">
                  {{ post.category || 'DKP Editorial Hub' }}
                </span>
                <span class="text-slate-400 shrink-0"> {{ estimateReadMin(post) }} min</span>
              </div>

              <div>
                <span class="inline-block px-2 py-0.5 rounded bg-teal-500/15 text-teal-300 border border-teal-500/35 font-mono text-[10px] font-bold mb-2">
                   Verified
                </span>
                <NuxtLink
                  :to="`/blog/${post.slug}`"
                  class="text-base sm:text-lg font-extrabold text-sky-400 hover:text-cyan-300 no-underline block leading-snug line-clamp-3"
                >
                  {{ post.title }}
                </NuxtLink>
              </div>

              <p class="text-slate-300 text-xs leading-relaxed m-0 line-clamp-3">
                {{ post.excerpt }}
              </p>
            </div>

            <div class="space-y-3 pt-1">
              <div v-if="post.tags?.length" class="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
                <span
                  v-for="tag in post.tags.slice(0, 3)"
                  :key="tag"
                  class="px-2 py-0.5 rounded bg-[#081226] border border-slate-700/80 text-sky-400 font-bold"
                >
                  #{{ tag }}
                </span>
              </div>

              <div class="pt-2.5 border-t border-slate-800/90 flex items-center justify-between font-mono text-[11px]">
                <span class="text-slate-400">by @{{ post.authorName || 'alexdpl' }}</span>
                <NuxtLink :to="`/blog/${post.slug}`" class="text-emerald-400 hover:text-emerald-300 font-extrabold no-underline">
                  Leggi articolo &rarr;
                </NuxtLink>
              </div>
            </div>
          </article>
        </div>

        <!-- PAGINAZIONE -->
        <nav v-if="totalPages > 1" aria-label="Paginazione Blog" class="flex flex-wrap items-center justify-center gap-2 pt-2 font-mono text-xs">
          <button
            type="button"
            :disabled="currentPage <= 1"
            @click="currentPage--"
            class="px-3.5 py-2 rounded-xl bg-dkp-card border border-dkp-border disabled:opacity-40 text-slate-200 font-bold cursor-pointer"
          >
            &larr; Indietro
          </button>

          <button
            v-for="p in totalPages"
            :key="p"
            type="button"
            @click="currentPage = p"
            :class="[
              'w-9 h-9 rounded-xl border font-extrabold cursor-pointer',
              currentPage === p
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                : 'bg-dkp-card border-dkp-border text-slate-300 hover:border-slate-600'
            ]"
          >
            {{ p }}
          </button>

          <button
            type="button"
            :disabled="currentPage >= totalPages"
            @click="currentPage++"
            class="px-3.5 py-2 rounded-xl bg-dkp-card border border-dkp-border disabled:opacity-40 text-slate-200 font-bold cursor-pointer"
          >
            Avanti &rarr;
          </button>
        </nav>
      </template>

      <!-- 3. IDENTICO ALLA HOME: Ultime Discussioni Nodi & Ultime Notizie Crawler AI -->
      <DkpRelatedNodesWidget />
      <DkpHomeWidget />

      <!-- 4. IDENTICO ALLA HOME: Circuito Approfondimenti dal Vault -->
      <DkpAdStrip
        layout="horizontal"
        category-tag="DKP ADS NETWORK &bull; APPROFONDIMENTI DAL VAULT"
        topic="pure sql ai security architecture"
        :tags="['sql', 'ai', 'security', 'architecture']"
      />
    </DkpLayout>
  </div>
</template>