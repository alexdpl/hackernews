<!-- app/pages/blog/index.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'

useDkpSeo({
  title: 'DKP Official Newsroom & Technical Blog — v2.4-GOLD',
  description: 'Aggiornamenti di sistema, rilasci di kernel, annunci strategici e approfondimenti tecnologici direttamente dal team DevKernelPulse.'
})

// --- 1. CARICAMENTO DATI (FETCH CATEGORIE E ARTICOLI) ---
const { data: catResponse, pending: loadingCats } = await useFetch<any>('/api/blog/categories')
const { data: postsResponse, pending: loadingPosts } = await useFetch<any>('/api/blog/posts')

// Categorie Reali dal DB con Fallback Estetico
const categories = computed(() => {
  const raw = catResponse.value?.data || (Array.isArray(catResponse.value) ? catResponse.value : [])
  if (raw && raw.length > 0) return raw

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
      icon: '🛡️',
      color: '#8b5cf6',
      subcategories: [
        { id: 301, name: 'Zero Trust', slug: 'zero-trust' },
        { id: 302, name: 'Vault & Hashing', slug: 'vault-hashing' }
      ]
    }
  ]
})

// Articoli Reali dal DB con Fallback Estetico
const posts = computed(() => {
  const raw = postsResponse.value?.data || (Array.isArray(postsResponse.value) ? postsResponse.value : [])
  if (raw && raw.length > 0) return raw

  return [
    {
      id: 1,
      title: 'Lancio Ufficiale DevKernelPulse v2.4-GOLD',
      slug: 'lancio-ufficiale-dkp-v24',
      category: 'Cloud Native & DevOps',
      subCategory: 'CI/CD Pipelines',
      author: 'Alessandro De Paola',
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
      author: 'Alessandro De Paola',
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
      author: 'Alessandro De Paola',
      excerpt: 'Come integrare agenti IA e modelli trasformativi direttamente sulle tue macchine locali senza dipendenze cloud esterne.',
      tags: ['Ollama', 'LocalAI', 'RAG', 'Python'],
      date: '2026-10-02',
      readTime: '6 min',
      views: 650
    }
  ]
})

// --- 2. STATI DI FILTRAGGIO & RICERCA ---
const selectedCategory = ref<string | null>(null)
const selectedSubcategory = ref<string | null>(null)
const searchQuery = ref('')

// Sottocategorie dinamiche della Categoria selezionata
const activeSubcategories = computed(() => {
  if (!selectedCategory.value) return []
  const cat = categories.value.find((c: any) => c.name.toLowerCase() === selectedCategory.value?.toLowerCase())
  return cat?.subcategories || []
})

function selectCategory(catName: string | null) {
  selectedCategory.value = catName
  selectedSubcategory.value = null
}

// Filtro Articoli
const filteredPosts = computed(() => {
  return posts.value.filter((p: any) => {
    const matchesCat = !selectedCategory.value || p.category?.toLowerCase() === selectedCategory.value.toLowerCase()
    const matchesSub = !selectedSubcategory.value || p.subCategory?.toLowerCase() === selectedSubcategory.value.toLowerCase()
    
    const q = searchQuery.value.trim().toLowerCase()
    const matchesSearch = !q || 
      p.title.toLowerCase().includes(q) || 
      p.excerpt.toLowerCase().includes(q) ||
      (p.tags && p.tags.some((t: string) => t.toLowerCase().includes(q)))

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
          <button v-if="searchQuery" @click="searchQuery = ''" class="clear-search-btn">×</button>
        </div>
      </div>

      <!-- BARRA CATEGORIE DINAMICHE -->
      <nav class="categories-bar">
        <button 
          @click="selectCategory(null)" 
          :class="['cat-btn', { active: selectedCategory === null }]"
        >
          🔥 Tutti
        </button>

        <div v-if="loadingCats" class="loading-cats">⏳ Caricamento categorie...</div>

        <button 
          v-for="cat in categories" 
          :key="cat.id" 
          @click="selectCategory(cat.name)"
          :class="['cat-btn', { active: selectedCategory === cat.name }]"
        >
          <span class="cat-emoji">{{ cat.icon || '🏷️' }}</span>
          <span>{{ cat.name }}</span>
        </button>
      </nav>

      <!-- BARRA SOTTOCATEGORIE DINAMICHE -->
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

      <!-- SPINNER & EMPTY STATE -->
      <div v-if="loadingPosts" class="loading-state">
        ⏳ Caricamento pubblicazioni da Neon DB GCP...
      </div>

      <div v-else-if="filteredPosts.length === 0" class="no-posts">
        <div class="empty-icon">📂</div>
        <h3>Nessun articolo trovato</h3>
        <p>Non ci sono post disponibili per i filtri o la ricerca selezionata.</p>
        <button @click="selectCategory(null); searchQuery = ''" class="btn-reset">Ripristina Filtri</button>
      </div>

      <!-- GRIGLIA ARTICOLI v2.4-GOLD -->
      <div v-else class="posts-grid">
        <article v-for="post in filteredPosts" :key="post.id" class="post-card">
          <div class="post-meta">
            <div class="cat-pill-group">
              <span class="post-cat">{{ post.category }}</span>
              <span v-if="post.subCategory" class="post-sub-cat">→ {{ post.subCategory }}</span>
            </div>
            <span class="post-date">📅 {{ post.date }}</span>
          </div>

          <h2 class="post-title">
            <NuxtLink :to="`/blog/${post.slug || post.id}`" class="post-link">
              {{ post.title }}
            </NuxtLink>
          </h2>

          <p class="post-excerpt">{{ post.excerpt }}</p>

          <!-- TAGS ROW -->
          <div v-if="post.tags &amp;&amp; post.tags.length > 0" class="tags-row">
            <span v-for="tag in post.tags" :key="tag" class="tag-badge">#{{ tag }}</span>
          </div>

          <div class="post-footer">
            <div class="author-views">
              <span class="post-author">👤 {{ post.author || 'Alessandro De Paola' }}</span>
              <span v-if="post.views" class="post-views">👁️ {{ post.views }}</span>
            </div>
            <NuxtLink :to="`/blog/${post.slug || post.id}`" class="read-more-btn">
              Leggi Articolo ↗
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

/* SEARCH BAR */
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

.search-icon { font-size: 1.1rem; margin-right: 0.6rem; }

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

/* CATEGORIES BAR */
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

.cat-emoji { font-size: 1rem; }
.loading-cats { font-size: 0.8rem; color: #64748b; font-family: monospace; }

/* SUBCATEGORIES BAR */
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

/* POSTS GRID */
.posts-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.post-card {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1.75rem;
  color: #ffffff;
  transition: all 0.25s ease-in-out;
}

.post-card:hover {
  border-color: rgba(0, 220, 130, 0.4);
  transform: translateY(-3px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px rgba(0, 220, 130, 0.08);
}

.post-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  margin-bottom: 0.75rem;
}

.cat-pill-group { display: flex; align-items: center; gap: 0.4rem; }

.post-cat {
  color: #00dc82;
  font-weight: 800;
  background: rgba(0, 220, 130, 0.12);
  border: 1px solid rgba(0, 220, 130, 0.25);
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  font-size: 0.75rem;
}

.post-sub-cat { color: #38bdf8; font-size: 0.78rem; font-weight: 700; }
.post-date { color: #64748b; font-size: 0.8rem; font-family: monospace; }

.post-title {
  font-size: 1.35rem;
  font-weight: 800;
  margin: 0 0 0.75rem 0;
  line-height: 1.4;
}

.post-link { color: #ffffff; text-decoration: none; transition: color 0.2s; }
.post-card:hover .post-link { color: #00dc82; }

.post-excerpt {
  color: #94a3b8;
  font-size: 0.92rem;
  line-height: 1.5;
  margin: 0 0 1rem 0;
}

.tags-row { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-bottom: 1.25rem; }
.tag-badge { background: #020420; color: #38bdf8; border: 1px solid #1e293b; font-size: 0.72rem; padding: 0.15rem 0.45rem; border-radius: 4px; font-family: monospace; }

.post-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #1e293b;
  padding-top: 1rem;
}

.author-views { display: flex; align-items: center; gap: 1rem; }
.post-author { color: #cbd5e1; font-size: 0.85rem; font-weight: 600; }
.post-views { color: #64748b; font-size: 0.8rem; font-family: monospace; }

.read-more-btn {
  color: #00dc82;
  text-decoration: none;
  font-weight: 800;
  font-size: 0.9rem;
  transition: opacity 0.2s;
}

.read-more-btn:hover { text-decoration: underline; opacity: 0.85; }

.loading-state, .no-posts {
  text-align: center;
  color: #94a3b8;
  padding: 3rem 1rem;
}

.empty-icon { font-size: 3rem; margin-bottom: 0.5rem; }
.btn-reset { background: #00dc82; color: #020420; border: none; font-weight: 800; padding: 0.55rem 1.1rem; border-radius: 6px; cursor: pointer; margin-top: 1rem; }

/* FOOTER BADGE */
.blog-footer-badge { display: flex; justify-content: center; margin-top: 1.5rem; }
.pulse-nexus-badge { display: inline-flex; align-items: center; gap: 0.5rem; background: #090d16; border: 1px solid #00dc82; padding: 0.4rem 0.9rem; border-radius: 9999px; font-size: 0.8rem; font-weight: 800; color: #ffffff; }
.pulse-nexus-badge .dot { width: 8px; height: 8px; background: #00dc82; border-radius: 50%; box-shadow: 0 0 8px #00dc82; }
.pulse-nexus-badge .ver { background: #00dc82; color: #020420; padding: 0.05rem 0.4rem; border-radius: 4px; font-size: 0.7rem; }
</style>