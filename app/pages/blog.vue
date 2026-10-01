<!-- app/pages/blog.vue -->
<script setup lang="ts">
// Fetch Categorie dal DB Neon
const { data: catResponse, pending: loadingCats } = await useFetch('/api/blog/categories')
const categories = computed(() => catResponse.value?.data || [])

// Filtro Categoria Selezionata
const selectedCategory = ref<string | null>(null)

// Articoli (Mock temporaneo in attesa di fetch dal DB)
const posts = ref([
  {
    id: 1,
    title: 'Lancio Ufficiale DevKernelPulse v2.4-GOLD',
    slug: 'lancio-ufficiale-dkp-v24',
    category: 'Release Ufficiali',
    excerpt: 'Architettura rinnovata con Nuxt 4, Drizzle ORM e supporto nativo a Neon PostgreSQL per massimizzare le prestazioni.',
    date: '2026-09-28',
    readTime: '5 min'
  },
  {
    id: 2,
    title: 'Guida completa a Vault & Hashing Avanzato',
    slug: 'guida-vault-hashing',
    category: 'Cybersecurity',
    excerpt: 'Metodologie di protezione del kernel e gestione avanzata delle chiavi crittografiche per ambienti cloud e serverless.',
    date: '2026-09-25',
    readTime: '8 min'
  }
])

// Articoli Filtrati
const filteredPosts = computed(() => {
  if (!selectedCategory.value) return posts.value
  return posts.value.filter(p => p.category.toLowerCase() === selectedCategory.value?.toLowerCase())
})
</script>

<template>
  <div class="blog-page-container">
    <div class="blog-content-wrapper">
      
      <!-- Hero Header Blog v2.4-GOLD -->
      <div class="hero-section">
        <div class="badge">
          <span class="badge-dot"></span>
          DKP KNOWLEDGE VAULT
        </div>
        <h1 class="hero-title">
          DevKernelPulse <span class="highlight">Blog</span>
        </h1>
        <p class="hero-subtitle">
          Articoli tecnici, analisi di sicurezza e aggiornamenti sull'ecosistema DKP v2.4-GOLD.
        </p>
      </div>

      <!-- 🏷️ BARRA FILTRI CATEGORIE DINAMICHE DAL DB -->
      <div class="categories-bar">
        <!-- Bottone TUTTI -->
        <button
          @click="selectedCategory = null"
          :class="['cat-btn', { active: selectedCategory === null }]"
        >
          Tutti gli Articoli
        </button>

        <!-- Spinner caricamento categorie -->
        <div v-if="loadingCats" class="loading-cats">
          Caricamento categorie...
        </div>

        <!-- Categorie Reali caricate dal DB Neon -->
        <button
          v-for="cat in categories"
          :key="cat.id"
          @click="selectedCategory = cat.name"
          :class="['cat-btn', { active: selectedCategory === cat.name }]"
        >
          <UIcon v-if="cat.icon" :name="cat.icon" class="cat-icon" :style="{ color: cat.color || '#00dc82' }" />
          <span>{{ cat.name }}</span>
        </button>
      </div>

      <!-- 📚 GRIGLIA ARTICOLI STILE v2.4-GOLD -->
      <div class="articles-grid">
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
              <span class="read-time">{{ post.readTime }}</span>
            </div>

            <h2 class="post-title">
              {{ post.title }}
            </h2>

            <p class="post-excerpt">
              {{ post.excerpt }}
            </p>
          </div>

          <div class="post-card-footer">
            <span class="post-date">{{ post.date }}</span>
            <NuxtLink :to="`/blog/${post.slug}`" class="read-more-link">
              Leggi articolo →
            </NuxtLink>
          </div>
        </article>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* Contenitore Principale v2.4-GOLD */
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
  gap: 2.5rem;
}

/* Hero Section */
.hero-section {
  text-align: center;
  max-width: 700px;
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
  font-size: 2.5rem;
  font-weight: 800;
  color: #ffffff;
  margin: 0.5rem 0;
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

/* Barra Filtri Categorie */
.categories-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding-top: 0.5rem;
}

.cat-btn {
  background: #090d16;
  border: 1px solid #1e293b;
  color: #94a3b8;
  padding: 0.5rem 1rem;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 600;
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

.cat-icon {
  width: 1rem;
  height: 1rem;
}

.loading-cats {
  font-size: 0.8rem;
  color: #64748b;
  font-family: monospace;
}

/* Griglia Articoli */
.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
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
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px rgba(0, 220, 130, 0.08);
}

.post-card-body {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.post-meta-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.post-cat-tag {
  background: rgba(0, 220, 130, 0.1);
  color: #00dc82;
  border: 1px solid rgba(0, 220, 130, 0.25);
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
}

.read-time {
  color: #64748b;
  font-size: 0.75rem;
  font-family: monospace;
}

.post-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
  line-height: 1.4;
  transition: color 0.2s;
}

.post-card:hover .post-title {
  color: #00dc82;
}

.post-excerpt {
  color: #94a3b8;
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Footer Card */
.post-card-footer {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #1e293b;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
}

.post-date {
  color: #64748b;
}

.read-more-link {
  color: #00dc82;
  font-weight: 700;
  text-decoration: none;
  transition: opacity 0.2s;
}

.read-more-link:hover {
  text-decoration: underline;
  opacity: 0.85;
}
</style>