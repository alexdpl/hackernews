<!-- app/pages/blog/index.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBlog } from '~/composables/useBlog'

useDkpSeo({
  title: 'DKP Technical Blog & Vault Articles NewsRoom - DevKernelPulse — v2.5',
  description: 'Aggiornamenti di sistema, rilasci di kernel, annunci strategici e approfondimenti tecnologici direttamente scritti dalla community di DevKernelPulse.'
})

// --- 1. CARICAMENTO DATI ---
const { posts, fetchPosts, getAuthorRank, isLoading } = useBlog()

const { data: catResponse, pending: loadingCats } = await useFetch('/api/blog/categories')

const categories = computed(() => {
  const raw = (catResponse.value as any)?.data || []
  return Array.isArray(raw) ? raw : []
})

onMounted(async () => {
  await fetchPosts()
})

// --- 2. STATI DI FILTRAGGIO, RICERCA & PAGINAZIONE ---
const selectedCategory = ref<string | null>(null)
const selectedSubcategory = ref<string | null>(null)
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = 9 // 🟢 9 articoli per pagina (griglie perfette da 3x3)

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
  currentPage.value = 1 // Reset pagina al cambio filtro
}

// --- 3. FILTRO ARTICOLI ---
const filteredPosts = computed(() => {
  return posts.value.filter((p: any) => {
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

// --- 4. PAGINAZIONE CALCOLATA ---
const totalPages = computed(() => Math.ceil(filteredPosts.value.length / itemsPerPage))

const paginatedPosts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredPosts.value.slice(start, end)
})

function changePage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    window.scrollTo({ top: 300, behavior: 'smooth' })
  }
}
</script>

<template>
  <div class="blog-container">
    <div class="blog-content-wrapper">
      
      <!-- HERO SECTION NEWSROOM PREMIUM -->
      <header class="blog-hero relative">
        <div class="flex justify-center mb-6">
          <div class="flex items-center gap-2 bg-[#020420] border border-emerald-500/30 px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <span class="relative flex h-2.5 w-2.5">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span class="text-[0.7rem] font-mono font-bold text-emerald-400 uppercase tracking-widest">
              Pulse Sentinel AI Content Filter Active
            </span>
          </div>
        </div>

        <div class="badge-tag mx-auto">
          <span class="badge-dot"></span>
          DKP Editorial Hub v2.5
        </div>
        
        <h1 class="hero-title mt-4">
          DKP Native <span class="highlight">Blog</span>
        </h1>
        
        <p class="hero-subtitle mt-2 max-w-2xl mx-auto">
          Approfondimenti di sistema, architetture cloud, annunci strategici e guide notarizzate direttamente dalla community.
        </p>

        <div class="mt-8 flex justify-center gap-4">
          <NuxtLink to="/user/dashboard?tab=content" class="bg-emerald-500 hover:bg-emerald-400 text-[#020420] font-extrabold px-6 py-2.5 rounded-lg transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transform hover:-translate-y-1">
            ✍️ Sottoponi un Articolo
          </NuxtLink>
        </div>
      </header>

      <!-- BARRA DI RICERCA LIVE -->
      <div class="search-bar-wrapper">
        <div class="search-input-box">
          <span class="search-icon">🔍</span>
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Cerca notizie, guide o tag (es. #Nuxt4, #Security, #Ollama)..." 
            class="search-input"
            @input="currentPage = 1"
          />
          <button v-if="searchQuery" @click="searchQuery = ''; currentPage = 1" class="clear-search-btn" type="button">×</button>
        </div>
      </div>

      <!-- BARRA CATEGORIE DINAMICHE -->
      <nav class="categories-bar">
        <button 
          @click="selectCategory(null)" 
          :class="['cat-btn', { active: selectedCategory === null }]"
          type="button"
        >
          🔥 Tutti
        </button>

        <div v-if="loadingCats" class="loading-cats">⏳ Caricamento categorie...</div>

        <button 
          v-for="cat in categories" 
          :key="cat.id" 
          @click="selectCategory(cat.name)"
          :style="selectedCategory === cat.name ? getCategoryStyle(cat) : {}"
          :class="['cat-btn', { active: selectedCategory === cat.name }]"
          type="button"
        >
          <span class="cat-emoji">{{ getCategoryIcon(cat) }}</span>
          <span>{{ getCategoryName(cat) }}</span>
        </button>
      </nav>

      <!-- BARRA SOTTOCATEGORIE DINAMICHE -->
      <Transition name="fade-sub">
        <div v-if="activeSubcategories.length > 0" class="subcategories-bar">
          <span class="sub-label">Sottocategorie:</span>
          <button
            @click="selectedSubcategory = null; currentPage = 1"
            :class="['sub-btn', { active: selectedSubcategory === null }]"
            type="button"
          >
            Tutte
          </button>
          <button
            v-for="sub in activeSubcategories"
            :key="sub.id || sub.name"
            @click="selectedSubcategory = sub.name; currentPage = 1"
            :class="['sub-btn', { active: selectedSubcategory === sub.name }]"
            type="button"
          >
            {{ sub.name }}
          </button>
        </div>
      </Transition>

      <!-- SPINNER & EMPTY STATE -->
      <div v-if="isLoading" class="loading-state">
        ⏳ Estrazione articoli dal Vault in corso...
      </div>

      <div v-else-if="filteredPosts.length === 0" class="no-posts">
        <div class="empty-icon">📂</div>
        <h3>Nessun articolo trovato</h3>
        <p>Non ci sono post disponibili. Usa il form di Gestione Post per scriverne uno.</p>
        <button @click="selectCategory(null); searchQuery = ''; currentPage = 1" class="btn-reset" type="button">Ripristina Filtri</button>
      </div>

      <!-- GRIGLIA ARTICOLI v2.5-GOLD (PAGINATA) -->
      <div v-else class="blog-grid">
        <article v-for="post in paginatedPosts" :key="post.id" class="post-card group hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all">
          <div class="card-header">
            <span class="cat-badge">{{ getCategoryName(post.categoryObject || post.category) }}</span>
            <span v-if="post.isVerified" class="text-xs text-emerald-400 font-bold border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 rounded" title="Verificato dal Vault DKP">🛡️ Verified</span>
            <span class="read-time">5 min</span>
          </div>

          <!-- Titolo Articolo -->
          <h2 class="post-title">
            <NuxtLink :to="`/blog/${post.slug || post.id}`" class="title-link group-hover:text-emerald-400">
              {{ post.title }}
            </NuxtLink>
          </h2>

          <!-- Estratto -->
          <p class="post-excerpt">{{ post.excerpt || post.summary || 'Nessuna anteprima disponibile.' }}</p>

          <!-- TAGS ROW -->
          <div v-if="post.tags && post.tags.length > 0" class="tags-row">
            <span v-for="tag in post.tags" :key="tag" class="tag-badge">#{{ tag }}</span>
          </div>

          <!-- Footer Unificato Gamificato -->
          <div class="post-footer">
            <div class="flex items-center gap-2 mb-2 w-full border-b border-slate-800/50 pb-2">
              <div class="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-[10px] border"
                   :style="{ background: `linear-gradient(135deg, ${getAuthorRank(post.authorXp).color}, #0f172a)`, borderColor: getAuthorRank(post.authorXp).color }">
                {{ (post.authorName || 'D')[0].toUpperCase() }}
              </div>
              <div class="flex flex-col">
                <span class="text-xs font-bold text-slate-300 leading-tight">{{ post.authorName || 'DevKernelPulse' }}</span>
                <span class="text-[0.60rem] leading-tight" :style="{ color: getAuthorRank(post.authorXp).color }">
                  {{ getAuthorRank(post.authorXp).badge }} {{ getAuthorRank(post.authorXp).title }}
                </span>
              </div>
            </div>

            <div class="meta-info w-full flex justify-between items-center">
              <span class="post-date">📅 {{ post.createdAt ? new Date(post.createdAt).toLocaleDateString('it-IT') : (post.date || 'Recente') }}</span>
              <div class="flex gap-3 text-xs">
                <span title="Visualizzazioni" class="text-slate-400">👁️ {{ post.views || 0 }}</span>
                <span title="Karma Likes" class="text-rose-400/80">❤️ {{ post.likes || 0 }}</span>
              </div>
            </div>

            <NuxtLink :to="`/blog/${post.slug || post.id}`" class="read-more-btn mt-2 w-full text-right block">
              Leggi articolo ↗
            </NuxtLink>
          </div>
        </article>
      </div>

      <!-- 🟢 CONTROLLI PAGINAZIONE NUMERATA -->
      <div v-if="totalPages > 1" class="pagination-container">
        <button 
          @click="changePage(currentPage - 1)" 
          :disabled="currentPage === 1"
          class="page-btn"
          type="button"
        >
          ← Indietro
        </button>

        <div class="page-numbers">
          <button 
            v-for="page in totalPages" 
            :key="page"
            @click="changePage(page)"
            :class="['page-number-btn', { active: currentPage === page }]"
            type="button"
          >
            {{ page }}
          </button>
        </div>

        <button 
          @click="changePage(currentPage + 1)" 
          :disabled="currentPage === totalPages"
          class="page-btn"
          type="button"
        >
          Avanti →
        </button>
      </div>

      <!-- BADGE FOOTER PULSE NEXUS -->
      <div class="blog-footer-badge">
        <div class="pulse-nexus-badge">
          <span class="dot"></span> ⚡ Pulse Nexus <span class="ver">v2.5</span>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.glass-panel { background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(12px); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.blog-container { min-height: 100vh; background-color: #020420; color: #f8fafc; padding: 3rem 1.5rem; font-family: system-ui, -apple-system, sans-serif; }
.blog-content-wrapper { max-width: 1100px; margin: 0 auto; display: flex; flex-direction: column; gap: 2rem; }

.blog-hero { text-align: center; max-width: 720px; margin: 0 auto; }
.badge-tag { display: inline-flex; align-items: center; gap: 0.5rem; background: rgba(0, 220, 130, 0.12); color: #00dc82; padding: 0.35rem 0.8rem; border-radius: 9999px; font-size: 0.78rem; font-weight: 800; text-transform: uppercase; border: 1px solid rgba(0, 220, 130, 0.3); letter-spacing: 0.05em; }
.badge-dot { width: 6px; height: 6px; border-radius: 50%; background-color: #00dc82; box-shadow: 0 0 8px #00dc82; }
.hero-title { font-size: 2.6rem; color: #ffffff; font-weight: 900; margin: 0.5rem 0; letter-spacing: -0.02em; }
.highlight { color: #00dc82; background: linear-gradient(135deg, #00dc82 0%, #38bdf8 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.hero-subtitle { color: #94a3b8; font-size: 1rem; line-height: 1.5; margin: 0; }

.search-bar-wrapper { max-width: 650px; margin: 0 auto; width: 100%; }
.search-input-box { position: relative; display: flex; align-items: center; background: #090d16; border: 1px solid #1e293b; border-radius: 12px; padding: 0.4rem 1rem; transition: border-color 0.2s, box-shadow 0.2s; }
.search-input-box:focus-within { border-color: #00dc82; box-shadow: 0 0 15px rgba(0, 220, 130, 0.15); }
.search-icon { font-size: 1.1rem; margin-right: 0.6rem; }
.search-input { width: 100%; background: transparent; border: none; color: #ffffff; font-size: 0.92rem; padding: 0.5rem 0; outline: none; }
.clear-search-btn { background: transparent; border: none; color: #ef4444; font-size: 1.3rem; font-weight: 900; cursor: pointer; padding: 0 0.2rem; }

.categories-bar { display: flex; justify-content: center; gap: 0.6rem; flex-wrap: wrap; }
.cat-btn { background: #090d16; border: 1px solid #1e293b; color: #94a3b8; padding: 0.5rem 1.1rem; border-radius: 10px; font-size: 0.85rem; font-weight: 700; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 0.4rem; }
.cat-btn:hover { color: #ffffff; border-color: #334155; background: #0d1322; }
.cat-btn.active { background: rgba(0, 220, 130, 0.15); color: #00dc82; border-color: #00dc82; box-shadow: 0 0 15px rgba(0, 220, 130, 0.15); }
.cat-emoji { font-size: 1rem; }
.loading-cats { font-size: 0.8rem; color: #64748b; font-family: monospace; }

.subcategories-bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 0.4rem; background: #090d16; border: 1px solid #1e293b; padding: 0.6rem 1rem; border-radius: 10px; max-width: 900px; margin: -0.5rem auto 0; }
.sub-label { font-size: 0.78rem; font-weight: 800; color: #64748b; text-transform: uppercase; margin-right: 0.4rem; }
.sub-btn { background: #020420; border: 1px solid #1e293b; color: #cbd5e1; padding: 0.3rem 0.7rem; border-radius: 6px; font-size: 0.78rem; font-weight: 600; cursor: pointer; transition: all 0.15s ease; }
.sub-btn:hover { border-color: #38bdf8; color: #38bdf8; }
.sub-btn.active { background: rgba(56, 189, 248, 0.15); color: #38bdf8; border-color: #38bdf8; }

.fade-sub-enter-active, .fade-sub-leave-active { transition: all 0.25s ease; }
.fade-sub-enter-from, .fade-sub-leave-to { opacity: 0; transform: translateY(-6px); }

.blog-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; }
.post-card { background: #090d16; border: 1px solid #1e293b; border-radius: 12px; padding: 1.5rem; color: #ffffff; display: flex; flex-direction: column; justify-content: space-between; }

.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
.cat-badge { color: #00dc82; font-weight: 800; background: rgba(0, 220, 130, 0.12); border: 1px solid rgba(0, 220, 130, 0.25); padding: 0.25rem 0.6rem; border-radius: 6px; font-size: 0.75rem; }
.read-time { color: #64748b; font-size: 0.78rem; font-family: monospace; }

.post-title { font-size: 1.25rem; font-weight: 700; line-height: 1.35; margin-bottom: 0.75rem; }
.title-link { color: #ffffff; text-decoration: none; transition: color 0.2s ease; }
.post-excerpt { color: #94a3b8; font-size: 0.92rem; line-height: 1.5; margin: 0 0 1rem 0; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }

.tags-row { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-bottom: 1.25rem; }
.tag-badge { background: #020420; color: #38bdf8; border: 1px solid #1e293b; font-size: 0.72rem; padding: 0.15rem 0.45rem; border-radius: 4px; font-family: monospace; }

.post-footer { display: flex; flex-direction: column; align-items: flex-start; border-top: 1px solid #1e293b; padding-top: 1rem; margin-top: auto; }
.post-date { color: #64748b; font-family: monospace; }

.read-more-btn { color: #00dc82; text-decoration: none; font-weight: 800; font-size: 0.9rem; transition: all 0.2s ease; }
.read-more-btn:hover { color: #38bdf8; transform: translateX(3px); }

/* STILI PAGINAZIONE */
.pagination-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #1e293b;
}

.page-btn {
  background: #090d16;
  border: 1px solid #1e293b;
  color: #cbd5e1;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  border-color: #00dc82;
  color: #00dc82;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 0.4rem;
}

.page-number-btn {
  background: #090d16;
  border: 1px solid #1e293b;
  color: #94a3b8;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.page-number-btn:hover {
  border-color: #334155;
  color: #ffffff;
}

.page-number-btn.active {
  background: rgba(0, 220, 130, 0.15);
  color: #00dc82;
  border-color: #00dc82;
  box-shadow: 0 0 10px rgba(0, 220, 130, 0.2);
}

.loading-state, .no-posts { text-align: center; color: #94a3b8; padding: 3rem 1rem; }
.empty-icon { font-size: 3rem; margin-bottom: 0.5rem; }
.btn-reset { background: #00dc82; color: #020420; border: none; font-weight: 800; padding: 0.55rem 1.1rem; border-radius: 6px; cursor: pointer; margin-top: 1rem; transition: background 0.2s; }
.btn-reset:hover { background: #38bdf8; }

.blog-footer-badge { display: flex; justify-content: center; margin-top: 1.5rem; }
.pulse-nexus-badge { display: inline-flex; align-items: center; gap: 0.5rem; background: #090d16; border: 1px solid #00dc82; padding: 0.4rem 0.9rem; border-radius: 9999px; font-size: 0.8rem; font-weight: 800; color: #ffffff; }
.pulse-nexus-badge .dot { width: 8px; height: 8px; background: #00dc82; border-radius: 50%; box-shadow: 0 0 8px #00dc82; }
.pulse-nexus-badge .ver { background: #00dc82; color: #020420; padding: 0.05rem 0.4rem; border-radius: 4px; font-size: 0.7rem; }

@media (max-width: 640px) {
  .hero-title { font-size: 2rem; }
  .blog-grid { grid-template-columns: 1fr; }
}
</style>