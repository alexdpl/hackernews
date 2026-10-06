<!-- app/pages/blog.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'

useDkpSeo({
  title: 'Blog & Knowledge Vault — DevKernelPulse v2.4-GOLD',
  description: 'Articoli tecnici, analisi di sicurezza, guide su Nuxt 4, AI locali e architetture micro-kernel.'
})

// --- 1. FETCH CATEGORIE DAL DB NEON / GCP ---
const { data: catResponse, pending: loadingCats } = await useFetch<any>('/api/blog/categories')

const categories = computed(() => {
  const raw = catResponse.value?.data || (Array.isArray(catResponse.value) ? catResponse.value : [])
  if (raw && raw.length > 0) return raw
  
  // Fallback se il database è in prima inizializzazione
  return [
    {
      id: 1,
      name: 'AI, LLM & Machine Learning',
      slug: 'ai-llm-machine-learning',
      icon: '🤖',
      color: '#00dc82',
      subcategories: [
        { id: 101, name: 'LLM Architecture', slug: 'llm-architecture' },
        { id: 102, name: 'Local AI & Ollama', slug: 'local-ai-ollama' },
        { id: 103, name: 'AI Agents', slug: 'ai-agents' }
      ]
    },
    {
      id: 2,
      name: 'Cloud Native & DevOps',
      slug: 'cloud-native-devops',
      icon: '☁️',
      color: '#38bdf8',
      subcategories: [
        { id: 201, name: 'Docker & Kubernetes', slug: 'docker-kubernetes' },
        { id: 202, name: 'CI/CD Pipelines', slug: 'cicd-pipelines' }
      ]
    },
    {
      id: 3,
      name: 'Cybersecurity & Vault',
      slug: 'cybersecurity-vault',
      icon: '🛡️️',
      color: '#8b5cf6',
      subcategories: [
        { id: 301, name: 'Zero Trust', slug: 'zero-trust' },
        { id: 302, name: 'Vault & Hashing', slug: 'vault-hashing' }
      ]
    }
  ]
})

// --- 2. FETCH ARTICOLI PUBBLICATI DAL DB NEON / GCP ---
const { data: postsResponse, pending: loadingPosts } = await useFetch<any>('/api/blog/posts')

const posts = computed(() => {
  const raw = postsResponse.value?.data || (Array.isArray(postsResponse.value) ? postsResponse.value : [])
  if (raw && raw.length > 0) return raw

  // Fallback Post Demo
  return [
    {
      id: 1,
      title: 'Lancio Ufficiale DevKernelPulse v2.4-GOLD',
      slug: 'lancio-ufficiale-dkp-v24',
      category: 'Cloud Native & DevOps',
      subCategory: 'CI/CD Pipelines',
      excerpt: 'Architettura rinnovata con Nuxt 4, Drizzle ORM e supporto nativo a Neon PostgreSQL per massimizzare le prestazioni.',
      tags: ['Nuxt4', 'NeonPostgres', 'GCP', 'Release'],
      date: '2026-09-28',
      readTime: '5 min',
      views: 1420
    },
    {
      id: 2,
      title: 'Guida Completa a Vault & Hashing Avanzato su GCP',
      slug: 'guida-vault-hashing',
      category: 'Cybersecurity & Vault',
      subCategory: 'Vault & Hashing',
      excerpt: 'Metodologie di protezione del kernel e gestione avanzata delle chiavi crittografiche per ambienti cloud e serverless.',
      tags: ['Security', 'Vault', 'Crypto', 'OAuth2'],
      date: '2026-09-25',
      readTime: '8 min',
      views: 890
    },
    {
      id: 3,
      title: 'Esecuzione di LLM in Locale con Ollama & Nuxt 4 Modules',
      slug: 'ollama-local-ai-nuxt4',
      category: 'AI, LLM & Machine Learning',
      subCategory: 'Local AI & Ollama',
      excerpt: 'Come integrare agenti IA e modelli trasformativi direttamente sulle tue macchine locali senza dipendenze cloud esterne.',
      tags: ['Ollama', 'LocalAI', 'RAG', 'Python'],
      date: '2026-10-02',
      readTime: '6 min',
      views: 650
    }
  ]
})

// --- 3. STATI FILTRI & RICERCA ---
const selectedCategory = ref<string | null>(null)
const selectedSubcategory = ref<string | null>(null)
const searchQuery = ref('')

// Sottocategorie attive in base alla categoria selezionata
const activeSubcategories = computed(() => {
  if (!selectedCategory.value) return []
  const cat = categories.value.find((c: any) => c.name.toLowerCase() === selectedCategory.value?.toLowerCase())
  return cat?.subcategories || []
})

// Reset sottocategoria quando cambia la categoria principale
function selectCategory(catName: string | null) {
  selectedCategory.value = catName
  selectedSubcategory.value = null
}

// Filtro Articoli Unificato
const filteredPosts = computed(() => {
  return posts.value.filter((p: any) => {
    // Filtro Categoria
    const matchesCategory = !selectedCategory.value || 
      p.category?.toLowerCase() === selectedCategory.value.toLowerCase()

    // Filtro Sottocategoria
    const matchesSubcategory = !selectedSubcategory.value || 
      p.subCategory?.toLowerCase() === selectedSubcategory.value.toLowerCase()

    // Filtro Ricerca
    const q = searchQuery.value.trim().toLowerCase()
    const matchesSearch = !q || 
      p.title.toLowerCase().includes(q) || 
      p.excerpt.toLowerCase().includes(q) ||
      (p.tags && p.tags.some((t: string) => t.toLowerCase().includes(q)))

    return matchesCategory && matchesSubcategory && matchesSearch
  })
})
</script>

<template>
  <div class="blog-page-container">
    <div class="blog-content-wrapper">
      
      <!-- HERO HEADER BLOG v2.4-GOLD -->
      <header class="hero-section">
        <div class="badge">
          <span class="badge-dot"></span>
          DKP KNOWLEDGE VAULT &amp; BLOG
        </div>
        <h1 class="hero-title">
          DevKernelPulse <span class="highlight">Blog</span>
        </h1>
        <p class="hero-subtitle">
          Articoli tecnici, analisi di sicurezza, guida all'architettura e aggiornamenti dall'ecosistema DKP v2.4-GOLD.
        </p>
      </header>

      <!-- BARRA DI RICERCA LIVE -->
      <div class="search-bar-wrapper">
        <div class="search-input-box">
          <span class="search-icon">🔍</span>
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Cerca per titolo, contenuto o tag (es. #Nuxt4, #Security, #Ollama)..." 
            class="search-input"
          />
          <button v-if="searchQuery" @click="searchQuery = ''" class="clear-search-btn">×</button>
        </div>
      </div>

      <!-- 🏷️ BARRA FILTRI CATEGORIE DINAMICHE DAL DB -->
      <nav class="categories-bar">
        <!-- BOTTONE TUTTI -->
        <button
          @click="selectCategory(null)"
          :class="['cat-btn', { active: selectedCategory === null }]"
        >
          🌐 Tutti gli Articoli
        </button>

        <!-- SPINNER CARICAMENTO CATEGORIE -->
        <div v-if="loadingCats" class="loading-cats">
          ⏳ Caricamento categorie da Neon DB...
        </div>

        <!-- CATEGORIE REALI DAL DB -->
        <button
          v-for="cat in categories"
          :key="cat.id"
          @click="selectCategory(cat.name)"
          :class="['cat-btn', { active: selectedCategory === cat.name }]"
        >
          <span class="cat-icon-emoji">{{ cat.icon || '🏷️' }}</span>
          <span>{{ cat.name }}</span>
        </button>
      </nav>

      <!-- 📌 BARRA SOTTOCATEGORIE (SE SELEZIONATA UNA CATEGORIA) -->
      <Transition name="fade-sub">
        <div v-if="activeSubcategories.length > 0" class="subcategories-bar">
          <span class="sub-label">Sottocategorie:</span>
          <button
            @click="selectedSubcategory = null"
            :class="['sub-btn', { active: selectedSubcategory === null }]"
          >
            Tutte
          </button>
          <button
            v-for="sub in activeSubcategories"
            :key="sub.id || sub.name"
            @click="selectedSubcategory = sub.name"
            :class="['sub-btn', { active: selectedSubcategory === sub.name }]"
          >
            {{ sub.name }}
          </button>
        </div>
      </Transition>

      <!-- 📚 SPINNER & EMPTY STATE ARTICOLI -->
      <div v-if="loadingPosts" class="loading-state">
        ⏳ Caricamento articoli dal Database Neon GCP...
      </div>

      <div v-else-if="filteredPosts.length === 0" class="empty-state">
        <div class="empty-icon">📂</div>
        <h3>Nessun articolo trovato</h3>
        <p>Prova a modificare i filtri o la ricerca per trovare altri contenuti.</p>
        <button @click="selectCategory(null); searchQuery = ''" class="btn-reset-filters">Ripristina Filtri</button>
      </div>

      <!-- 📚 GRIGLIA ARTICOLI STILE v2.4-GOLD -->
      <div v-else class="articles-grid">
        <article
          v-for="post in filteredPosts"
          :key="post.id"
          class="post-card"
        >
          <div class="post-card-body">
            <div class="post-meta-top">
              <span class="post-cat-tag">
                {{ post.category }}
              </span>
              <span class="read-time">{{ post.readTime || '5 min' }}</span>
            </div>

            <h2 class="post-title">
              <NuxtLink :to="`/blog/${post.slug}`" class="title-link">
                {{ post.title }}
              </NuxtLink>
            </h2>

            <p class="post-excerpt">
              {{ post.excerpt }}
            </p>

            <!-- LISTA TAGS DELL'ARTICOLO -->
            <div v-if="post.tags &amp;&amp; post.tags.length > 0" class="post-tags-row">
              <span v-for="tag in post.tags" :key="tag" class="tag-badge">#{{ tag }}</span>
            </div>
          </div>

          <div class="post-card-footer">
            <div class="meta-bottom">
              <span class="post-date">{{ post.date }}</span>
              <span v-if="post.views" class="post-views">👁️ {{ post.views }}</span>
            </div>
            <NuxtLink :to="`/blog/${post.slug}`" class="read-more-link">
              Leggi articolo →
            </NuxtLink>
          </div>
        </article>
      </div>

      <!-- FOOTER BADGE NEXUS -->
      <div class="blog-footer-badge">
        <div class="pulse-nexus-badge">
          <span class="dot"></span> ⚡ Pulse Nexus <span class="ver">v2.4-GOLD</span>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* CONTENITORE PRINCIPALE v2.4-GOLD */
.blog-page-container {
  min-height: 100vh;
  background-color: #020420;
  color: #f8fafc;
  padding: 3rem 1.5rem;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.blog-content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* HERO SECTION */
.hero-section {
  text-align: center;
  max-width: 720px;
  margin: 0 auto;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(0, 220, 130, 0.12);
  color: #00dc82;
  font-size: 0.75rem;
  font-weight: 800;
  padding: 0.35rem 0.8rem;
  border-radius: 9999px;
  border: 1px solid rgba(0, 220, 130, 0.3);
  margin-bottom: 1rem;
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
  font-weight: 900;
  color: #ffffff;
  margin: 0.4rem 0;
  letter-spacing: -0.025em;
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

/* BARRA DI RICERCA LIVE */
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
  transition: border-color 0.2s;
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
}

/* BARRA FILTRI CATEGORIE */
.categories-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
}

.cat-btn {
  background: #090d16;
  border: 1px solid #1e293b;
  color: #94a3b8;
  padding: 0.55rem 1.1rem;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.cat-btn:hover {
  color: #f8fafc;
  border-color: #334155;
  background: #0d1322;
}

.cat-btn.active {
  background: rgba(0, 220, 130, 0.15);
  color: #00dc82;
  border-color: #00dc82;
  box-shadow: 0 0 15px rgba(0, 220, 130, 0.15);
}

.cat-icon-emoji { font-size: 1rem; }
.loading-cats { font-size: 0.8rem; color: #64748b; font-family: monospace; }

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

.sub-label { font-size: 0.78rem; font-weight: 800; color: #64748b; text-transform: uppercase; margin-right: 0.4rem; }
.sub-btn { background: #020420; border: 1px solid #1e293b; color: #cbd5e1; padding: 0.3rem 0.7rem; border-radius: 6px; font-size: 0.78rem; font-weight: 600; cursor: pointer; transition: all 0.15s ease; }
.sub-btn:hover { border-color: #38bdf8; color: #38bdf8; }
.sub-btn.active { background: rgba(56, 189, 248, 0.15); color: #38bdf8; border-color: #38bdf8; }

/* STATES */
.loading-state, .empty-state { text-align: center; padding: 3rem 1rem; color: #94a3b8; }
.empty-icon { font-size: 3rem; margin-bottom: 0.5rem; }
.btn-reset-filters { background: #00dc82; color: #020420; border: none; font-weight: 800; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; margin-top: 1rem; }

/* GRIGLIA ARTICOLI */
.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 1.5rem;
}

.post-card {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 14px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: all 0.25s ease-in-out;
}

.post-card:hover {
  border-color: rgba(0, 220, 130, 0.4);
  transform: translateY(-4px);
  box-shadow: 0 12px 30px -5px rgba(0, 0, 0, 0.6), 0 0 18px rgba(0, 220, 130, 0.1);
}

.post-card-body { display: flex; flex-direction: column; gap: 0.85rem; }
.post-meta-top { display: flex; justify-content: space-between; align-items: center; }

.post-cat-tag {
  background: rgba(0, 220, 130, 0.1);
  color: #00dc82;
  border: 1px solid rgba(0, 220, 130, 0.25);
  font-size: 0.72rem;
  font-weight: 800;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
}

.read-time { color: #64748b; font-size: 0.75rem; font-family: monospace; }
.post-title { font-size: 1.25rem; font-weight: 800; margin: 0; line-height: 1.4; }
.title-link { color: #ffffff; text-decoration: none; transition: color 0.2s; }
.post-card:hover .title-link { color: #00dc82; }

.post-excerpt {
  color: #94a3b8;
  font-size: 0.88rem;
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-tags-row { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.25rem; }
.tag-badge { background: #020420; color: #38bdf8; border: 1px solid #1e293b; font-size: 0.7rem; padding: 0.15rem 0.4rem; border-radius: 4px; font-family: monospace; }

/* FOOTER CARD */
.post-card-footer {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #1e293b;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
}

.meta-bottom { display: flex; gap: 0.8rem; align-items: center; color: #64748b; font-size: 0.78rem; }
.read-more-link { color: #00dc82; font-weight: 800; text-decoration: none; transition: opacity 0.2s; }
.read-more-link:hover { text-decoration: underline; opacity: 0.85; }

/* FOOTER BADGE NEXUS */
.blog-footer-badge { display: flex; justify-content: center; margin-top: 2rem; }
.pulse-nexus-badge { display: inline-flex; align-items: center; gap: 0.5rem; background: #090d16; border: 1px solid #00dc82; padding: 0.4rem 0.9rem; border-radius: 9999px; font-size: 0.8rem; font-weight: 800; color: #ffffff; }
.pulse-nexus-badge .dot { width: 8px; height: 8px; background: #00dc82; border-radius: 50%; box-shadow: 0 0 8px #00dc82; }
.pulse-nexus-badge .ver { background: #00dc82; color: #020420; padding: 0.05rem 0.4rem; border-radius: 4px; font-size: 0.7rem; }
</style>