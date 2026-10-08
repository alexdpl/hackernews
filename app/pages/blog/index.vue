<!-- app/pages/blog/index.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'

useDkpSeo({
  title: 'DKP Technical Blog & Vault Articles NewsRoom - DevKernelPulse — v2.4-GOLD',
  description: 'Aggiornamenti di sistema, rilasci di kernel, annunci strategici e approfondimenti tecnologici direttamente scritti dalla community di DevKernelPulse.'
})

// --- 1. CARICAMENTO DATI DA NEON POSTGRESQL ---
const { data: catResponse, pending: loadingCats } = await useFetch('/api/admin/blog/categories')
const { data: postsResponse, pending: loadingPosts } = await useFetch('/api/blog/posts?public=true')

// Categorie Reali dal DB
const categories = computed(() => {
  const raw = (catResponse.value as any)?.data || (Array.isArray(catResponse.value) ? catResponse.value : [])
  return Array.isArray(raw) ? raw : []
})

// Articoli Reali dal DB
const posts = computed(() => {
  const raw = (postsResponse.value as any)?.data || (Array.isArray(postsResponse.value) ? postsResponse.value : [])
  return Array.isArray(raw) ? raw : []
})

// --- 2. STATI DI FILTRAGGIO & RICERCA ---
const selectedCategory = ref<string | null>(null)
const selectedSubcategory = ref<string | null>(null)
const searchQuery = ref('')

// Helper per estrarre in sicurezza il nome della categoria
function getCategoryName(category: any): string {
  if (!category) return 'Generale'
  if (typeof category === 'object') return category.name || category.title || 'Generale'
  return String(category)
}

// Helper per estrarre in sicurezza la sottocategoria
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

// Sottocategorie dinamiche della Categoria selezionata
const activeSubcategories = computed(() => {
  if (!selectedCategory.value) return []

  const cat = categories.value.find((c: any) => {
    const cName = getCategoryName(c)
    return cName.toLowerCase() === selectedCategory.value?.toLowerCase()
  })

  return cat?.subcategories || cat?.children || []
})

function selectCategory(catName: string | null) {
  selectedCategory.value = catName
  selectedSubcategory.value = null
}

// --- 3. FILTRO ARTICOLI COMPATIBILE CON NEON DB ---
const filteredPosts = computed(() => {
  return posts.value.filter((p: any) => {
    const catName = getCategoryName(p.category || p.categoryName)
    const subName = getSubcategoryName(p.subCategory || p.subcategory || p.subcategoryName)

    const matchesCat = !selectedCategory.value || catName.toLowerCase() === selectedCategory.value.toLowerCase()
    const matchesSub = !selectedSubcategory.value || subName.toLowerCase() === selectedSubcategory.value.toLowerCase()

    const q = searchQuery.value.trim().toLowerCase()
    const matchesSearch = !q ||
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.excerpt && p.excerpt.toLowerCase().includes(q)) ||
      (Array.isArray(p.tags) && p.tags.some((t: string) => t.toLowerCase().includes(q)))

    return matchesCat && matchesSub && matchesSearch
  })
})
</script>

<template>
  <div class="blog-container">
    <div class="blog-content-wrapper">
      
      <!-- HERO SECTION NEWSROOM -->
      <header class="blog-hero">
        <div class="badge-tag">
          <span class="badge-dot"></span>
          DKP Official Newsroom
        </div>
        <h1 class="hero-title">
          DKP Native <span class="highlight">Blog</span>
        </h1>
        <p class="hero-subtitle">
          Aggiornamenti di sistema, rilasci di kernel, annunci strategici e approfondimenti tecnologici direttamente dagli sviluppatori.
        </p>
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
          />
          <button v-if="searchQuery" @click="searchQuery = ''" class="clear-search-btn" type="button">×</button>
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
            @click="selectedSubcategory = null"
            :class="['sub-btn', { active: selectedSubcategory === null }]"
            type="button"
          >
            Tutte
          </button>
          <button
            v-for="sub in activeSubcategories"
            :key="sub.id || sub.name"
            @click="selectedSubcategory = sub.name"
            :class="['sub-btn', { active: selectedSubcategory === sub.name }]"
            type="button"
          >
            {{ sub.name }}
          </button>
        </div>
      </Transition>

      <!-- SPINNER & EMPTY STATE -->
      <div v-if="loadingPosts" class="loading-state">
        ⏳ Caricamento pubblicazioni da Neon DB GCP...
      </div>

      <div v-else-if="filteredPosts.length === 0" class="no-posts">
        <div class="empty-icon">📂</div>
        <h3>Nessun articolo trovato</h3>
        <p>Non ci sono post disponibili per i filtri o la ricerca selezionata.</p>
        <button @click="selectCategory(null); searchQuery = ''" class="btn-reset" type="button">Ripristina Filtri</button>
      </div>

      <!-- GRIGLIA ARTICOLI v2.4-GOLD -->
      <div v-else class="blog-grid">
        <article v-for="post in filteredPosts" :key="post.id" class="post-card">
          <div class="card-header">
            <span class="cat-badge">{{ getCategoryName(post.category) }}</span>
            <span v-if="post.isVerified" class="text-xs text-sky-400 font-bold" title="Verificato dal Vault DKP">🛡️ Verified</span>
            <span class="read-time">5 min</span>
          </div>

          <!-- Titolo Articolo -->
          <h2 class="post-title">
            <NuxtLink :to="`/blog/${post.slug || post.id}`" class="title-link">
              {{ post.title }}
            </NuxtLink>
          </h2>

          <!-- Estratto -->
          <p class="post-excerpt">{{ post.excerpt || 'Nessuna anteprima disponibile.' }}</p>

          <!-- TAGS ROW -->
          <div v-if="post.tags && post.tags.length > 0" class="tags-row">
            <span v-for="tag in post.tags" :key="tag" class="tag-badge">#{{ tag }}</span>
          </div>

          <!-- Footer Unificato (Autore, Data, Visualizzazioni e Bottone) -->
          <div class="post-footer">
            <div class="meta-info">
              <span class="post-author">👤 {{ post.authorName || post.author || 'Alessandro De Paola' }}</span>
              <span class="post-date">📅 {{ post.date || (post.createdAt ? String(post.createdAt).slice(0, 10) : '') }}</span>
              <span v-if="post.views !== undefined" class="post-views">👁️ {{ post.views }}</span>
            </div>

            <NuxtLink :to="`/blog/${post.slug || post.id}`" class="read-more-btn">
              Leggi articolo ↗
            </NuxtLink>
          </div>
        </article>
      </div>

      <!-- BADGE FOOTER PULSE NEXUS -->
      <div class="blog-footer-badge">
        <div class="pulse-nexus-badge">
          <span class="dot"></span> ⚡ Pulse Nexus <span class="ver">v2.4-GOLD</span>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.glass-panel {
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(12px);
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* CONTAINER GENERALE */
.blog-container {
  min-height: 100vh;
  background-color: #020420;
  color: #f8fafc;
  padding: 3rem 1.5rem;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.blog-content-wrapper {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* HERO SECTION */
.blog-hero {
  text-align: center;
  max-width: 720px;
  margin: 0 auto;
}

.badge-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(0, 220, 130, 0.12);
  color: #00dc82;
  padding: 0.35rem 0.8rem;
  border-radius: 9999px;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  border: 1px solid rgba(0, 220, 130, 0.3);
  letter-spacing: 0.05em;
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #00dc82;
  box-shadow: 0 0 8px #00dc82;
}

.hero-title {
  font-size: 2.6rem;
  color: #ffffff;
  font-weight: 900;
  margin: 0.5rem 0;
  letter-spacing: -0.02em;
}

.highlight {
  color: #00dc82;
  background: linear-gradient(135deg, #00dc82 0%, #38bdf8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-subtitle {
  color: #94a3b8;
  font-size: 1rem;
  line-height: 1.5;
  margin: 0;
}

/* BARRA DI RICERCA */
.search-bar-wrapper {
  max-width: 650px;
  margin: 0 auto;
  width: 100%;
}

.search-input-box {
  position: relative;
  display: flex;
  align-items: center;
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 0.4rem 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-input-box:focus-within {
  border-color: #00dc82;
  box-shadow: 0 0 15px rgba(0, 220, 130, 0.15);
}

.search-icon {
  font-size: 1.1rem;
  margin-right: 0.6rem;
}

.search-input {
  width: 100%;
  background: transparent;
  border: none;
  color: #ffffff;
  font-size: 0.92rem;
  padding: 0.5rem 0;
  outline: none;
}

.clear-search-btn {
  background: transparent;
  border: none;
  color: #ef4444;
  font-size: 1.3rem;
  font-weight: 900;
  cursor: pointer;
  padding: 0 0.2rem;
}

/* BARRA CATEGORIE */
.categories-bar {
  display: flex;
  justify-content: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.cat-btn {
  background: #090d16;
  border: 1px solid #1e293b;
  color: #94a3b8;
  padding: 0.5rem 1.1rem;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.cat-btn:hover {
  color: #ffffff;
  border-color: #334155;
  background: #0d1322;
}

.cat-btn.active {
  background: rgba(0, 220, 130, 0.15);
  color: #00dc82;
  border-color: #00dc82;
  box-shadow: 0 0 15px rgba(0, 220, 130, 0.15);
}

.cat-emoji {
  font-size: 1rem;
}

.loading-cats {
  font-size: 0.8rem;
  color: #64748b;
  font-family: monospace;
}

/* BARRA SOTTOCATEGORIE */
.subcategories-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  background: #090d16;
  border: 1px solid #1e293b;
  padding: 0.6rem 1rem;
  border-radius: 10px;
  max-width: 900px;
  margin: -0.5rem auto 0;
}

.sub-label {
  font-size: 0.78rem;
  font-weight: 800;
  color: #64748b;
  text-transform: uppercase;
  margin-right: 0.4rem;
}

.sub-btn {
  background: #020420;
  border: 1px solid #1e293b;
  color: #cbd5e1;
  padding: 0.3rem 0.7rem;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.sub-btn:hover {
  border-color: #38bdf8;
  color: #38bdf8;
}

.sub-btn.active {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  border-color: #38bdf8;
}

/* TRANSAZIONE SOTTOCATEGORIE */
.fade-sub-enter-active,
.fade-sub-leave-active {
  transition: all 0.25s ease;
}
.fade-sub-enter-from,
.fade-sub-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* GRIGLIA ARTICOLI */
.blog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.post-card {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1.5rem;
  color: #ffffff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: all 0.25s ease-in-out;
}

.post-card:hover {
  border-color: rgba(0, 220, 130, 0.4);
  transform: translateY(-3px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px rgba(0, 220, 130, 0.08);
}

/* CARD HEADER (Categoria + Tempo Lettura) */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.cat-badge {
  color: #00dc82;
  font-weight: 800;
  background: rgba(0, 220, 130, 0.12);
  border: 1px solid rgba(0, 220, 130, 0.25);
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  font-size: 0.75rem;
}

.read-time {
  color: #64748b;
  font-size: 0.78rem;
  font-family: monospace;
}

/* TITOLO & LINK */
.post-title {
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.35;
  margin-bottom: 0.75rem;
}

.title-link {
  color: #ffffff;
  text-decoration: none;
  transition: color 0.2s ease;
}

.title-link:hover {
  color: #38bdf8;
}

.post-excerpt {
  color: #94a3b8;
  font-size: 0.92rem;
  line-height: 1.5;
  margin: 0 0 1rem 0;
}

/* TAGS ROW */
.tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-bottom: 1.25rem;
}

.tag-badge {
  background: #020420;
  color: #38bdf8;
  border: 1px solid #1e293b;
  font-size: 0.72rem;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  font-family: monospace;
}

/* FOOTER UNIFICATO CARD */
.post-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #1e293b;
  padding-top: 1rem;
  margin-top: auto;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.meta-info {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.8rem;
  color: #64748b;
  flex-wrap: wrap;
}

.post-author {
  color: #cbd5e1;
  font-weight: 600;
}

.post-date,
.post-views {
  color: #64748b;
  font-size: 0.8rem;
  font-family: monospace;
}

.read-more-btn {
  color: #00dc82;
  text-decoration: none;
  font-weight: 800;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  transition: all 0.2s ease;
}

.read-more-btn:hover {
  color: #38bdf8;
  transform: translateX(3px);
}

/* STATE SPINNER & NOT FOUND */
.loading-state,
.no-posts {
  text-align: center;
  color: #94a3b8;
  padding: 3rem 1rem;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.btn-reset {
  background: #00dc82;
  color: #020420;
  border: none;
  font-weight: 800;
  padding: 0.55rem 1.1rem;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 1rem;
  transition: background 0.2s;
}

.btn-reset:hover {
  background: #38bdf8;
}

/* FOOTER BADGE */
.blog-footer-badge {
  display: flex;
  justify-content: center;
  margin-top: 1.5rem;
}

.pulse-nexus-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #090d16;
  border: 1px solid #00dc82;
  padding: 0.4rem 0.9rem;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 800;
  color: #ffffff;
}

.pulse-nexus-badge .dot {
  width: 8px;
  height: 8px;
  background: #00dc82;
  border-radius: 50%;
  box-shadow: 0 0 8px #00dc82;
}

.pulse-nexus-badge .ver {
  background: #00dc82;
  color: #020420;
  padding: 0.05rem 0.4rem;
  border-radius: 4px;
  font-size: 0.7rem;
}

@media (max-width: 640px) {
  .hero-title {
    font-size: 2rem;
  }
  .blog-grid {
    grid-template-columns: 1fr;
  }
  .post-footer {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>