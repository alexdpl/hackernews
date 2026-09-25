<!-- app/pages/admin/shop.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'

useDkpSeo({
  title: 'Gestione DKP Shop - Control Center SaaS v2.0',
  description: 'Pannello di gestione e distribuzione dei plugin proprietari SaaS per l\'ecosistema DevKernelPulse.'
})

interface SaasProduct {
  id: number
  title: string
  category: 'saas' | 'core' | 'ai' | 'cms'
  categoryLabel: string
  price: number
  version: string
  zipFile: string
  description: string
  downloads: number
  status: 'Active' | 'Beta' | 'Featured'
}

const searchQuery = ref('')
const selectedCategory = ref<string>('all')

// Catalogo 6 Prodotti SaaS Proprietari DKP v2.0
const products = ref<SaasProduct[]>([
  {
    id: 1,
    title: '🤖 DKP Automated Crawler Engine Pro',
    category: 'saas',
    categoryLabel: 'SAAS MODULE',
    price: 99.00,
    version: 'v2.0.0',
    zipFile: 'dkp-automated-crawler-pro-v2.0.zip',
    description: 'Modulo di ingestione notizie automatico con integrazione HackerNews, clean-up Neon DB ed API Nitro ad alte prestazioni.',
    downloads: 48,
    status: 'Featured'
  },
  {
    id: 2,
    title: '🌐 DKP Translator Pro v2.0 Plugin',
    category: 'core',
    categoryLabel: 'CORE PLUGIN',
    price: 69.00,
    version: 'v2.0.0',
    zipFile: 'dkp-translator-pro-v2.0.zip',
    description: 'Composable globale e reattivo a 9 lingue con salvataggio cookie/localStorage, supporto Nuxt 4 SSR e zero dipendenze esterne.',
    downloads: 62,
    status: 'Active'
  },
  {
    id: 3,
    title: '🛍️ DKP Ecosystem Shop Engine',
    category: 'saas',
    categoryLabel: 'SAAS MODULE',
    price: 79.00,
    version: 'v2.0.0',
    zipFile: 'dkp-ecosystem-shop-v2.0.zip',
    description: 'Sistema completo di monetizzazione, licenziamento SaaS e download automatico archivi .ZIP proprietari.',
    downloads: 34,
    status: 'Active'
  },
  {
    id: 4,
    title: '🛡️ DKP Kernel Captcha Engine',
    category: 'core',
    categoryLabel: 'CORE PLUGIN',
    price: 39.00,
    version: 'v2.0.0',
    zipFile: 'dkp-kernel-captcha-v2.0.zip',
    description: 'Sistema anti-bot equazionale proprietario a zero costi esterni per la protezione dei form di sottomissione.',
    downloads: 89,
    status: 'Active'
  },
  {
    id: 5,
    title: '📝 DKP Native Blog Pro CMS',
    category: 'cms',
    categoryLabel: 'CMS MODULE',
    price: 49.00,
    version: 'v2.0.0',
    zipFile: 'dkp-native-blog-pro-v2.0.zip',
    description: 'Motore CMS nativo per la pubblicazione di articoli tech, guide avanzate ed approfondimenti con supporto SEO.',
    downloads: 27,
    status: 'Active'
  },
  {
    id: 6,
    title: '🧠 DKP Neural Playground Suite',
    category: 'ai',
    categoryLabel: 'AI & TOOLS',
    price: 89.00,
    version: 'v2.0.0',
    zipFile: 'dkp-neural-playground-v2.0.zip',
    description: 'Pannello di testing prompt e integrazione modelli IA per l\'analisi automatica del codice e generazione contenuti.',
    downloads: 41,
    status: 'Featured'
  }
])

// KPI / Stats Calcolate
const totalProducts = computed(() => products.value.length)
const totalDownloads = computed(() => products.value.reduce((acc, p) => acc + p.downloads, 0))
const totalCatalogValue = computed(() => products.value.reduce((acc, p) => acc + p.price, 0))

// Prodotti Filtrati
const filteredProducts = computed(() => {
  return products.value.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesCategory = selectedCategory.value === 'all' || p.category === selectedCategory.value
    return matchesSearch && matchesCategory
  })
})
</script>

<template>
  <div class="shop-admin-container">
    
    <!-- HEADER SHOP ADMIN -->
    <div class="shop-header">
      <div class="header-titles">
        <span class="admin-badge">ADMIN CONTROL CENTER</span>
        <h1>Gestione <span class="highlight">DKP Shop SaaS</span></h1>
        <p class="subtitle">Catalogo ufficiale dei plugin proprietari ed applicazioni distribuite nell'ecosistema.</p>
      </div>
      <div class="header-actions">
        <NuxtLink to="/user/dashboard" class="btn-secondary">
          📊 Torna alla Dashboard
        </NuxtLink>
      </div>
    </div>

    <!-- METRICHE E KPI DASHBOARD -->
    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-label">Prodotti In Catalogo</span>
        <strong class="stat-value">{{ totalProducts }} Moduli</strong>
        <small class="stat-sub">100% Architettura Modulare</small>
      </div>
      <div class="stat-card">
        <span class="stat-label">Download Totali SaaS</span>
        <strong class="stat-value highlight-blue">{{ totalDownloads }}</strong>
        <small class="stat-sub">File .ZIP erogati</small>
      </div>
      <div class="stat-card">
        <span class="stat-label">Valore Pacchetto Suite</span>
        <strong class="stat-value highlight-green">€{{ totalCatalogValue.toFixed(2) }}</strong>
        <small class="stat-sub">Licenza Lifetime Full Access</small>
      </div>
    </div>

    <!-- CONTROLLI RICERCA E FILTRI -->
    <div class="filters-bar">
      <input 
        v-model="searchQuery" 
        type="text" 
        placeholder="🔍 Cerca modulo, plugin o funzionalità..." 
        class="search-input"
      />
      <div class="category-pills">
        <button 
          @click="selectedCategory = 'all'" 
          :class="{ active: selectedCategory === 'all' }"
          class="pill-btn"
        >
          Tutti ({{ products.length }})
        </button>
        <button 
          @click="selectedCategory = 'saas'" 
          :class="{ active: selectedCategory === 'saas' }"
          class="pill-btn"
        >
          SaaS Modules
        </button>
        <button 
          @click="selectedCategory = 'core'" 
          :class="{ active: selectedCategory === 'core' }"
          class="pill-btn"
        >
          Core Plugins
        </button>
        <button 
          @click="selectedCategory = 'ai'" 
          :class="{ active: selectedCategory === 'ai' }"
          class="pill-btn"
        >
          AI & Tools
        </button>
      </div>
    </div>

    <!-- GRID PRODOTTI SAAS PROPRIETARI -->
    <div class="shop-products-grid">
      <div v-for="product in filteredProducts" :key="product.id" class="product-card">
        
        <div class="product-header">
          <span class="product-badge" :class="product.category">{{ product.categoryLabel }}</span>
          <span class="product-price">€{{ product.price.toFixed(2) }}</span>
        </div>

        <h3>{{ product.title }}</h3>
        <p class="product-desc">{{ product.description }}</p>

        <div class="product-meta">
          <div class="meta-row">
            <span>📦 versione: <strong>{{ product.version }}</strong></span>
            <span>📥 download: <strong>{{ product.downloads }}</strong></span>
          </div>
          <div class="meta-file">
            📁 file: <code>/downloads/{{ product.zipFile }}</code>
          </div>
        </div>

        <div class="product-actions">
          <a :href="`/downloads/${product.zipFile}`" download class="btn-purchase">
            🛒 Acquista / Scarica .ZIP
          </a>
        </div>

      </div>
    </div>

  </div>
</template>

<style scoped>
.shop-admin-container {
  max-width: 1280px;
  margin: 2.5rem auto;
  padding: 0 1.5rem;
  color: #f8fafc;
}

.shop-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 1rem;
}

.admin-badge {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  font-size: 0.75rem;
  font-weight: 800;
  padding: 0.25rem 0.6rem;
  border-radius: 4px;
  border: 1px solid rgba(56, 189, 248, 0.3);
}

.shop-header h1 {
  font-size: 2.25rem;
  font-weight: 900;
  margin: 0.4rem 0 0.2rem;
}

.highlight { color: #00dc82; }
.subtitle { color: #94a3b8; font-size: 0.95rem; margin: 0; }

.btn-secondary {
  background: #090d16;
  border: 1px solid #1e293b;
  color: #cbd5e1;
  padding: 0.6rem 1.1rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 700;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.btn-secondary:hover { border-color: #38bdf8; color: #ffffff; }

/* STATS GRID */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.25rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
}

.stat-label { font-size: 0.8rem; font-weight: 700; color: #64748b; }
.stat-value { font-size: 1.75rem; font-weight: 900; color: #ffffff; margin: 0.2rem 0; }
.highlight-blue { color: #38bdf8; }
.highlight-green { color: #00dc82; }
.stat-sub { font-size: 0.75rem; color: #94a3b8; }

/* FILTRI E RICERCA */
.filters-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 280px;
  background: #090d16;
  border: 1px solid #1e293b;
  color: #ffffff;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  outline: none;
  font-size: 0.9rem;
}

.search-input:focus { border-color: #00dc82; }

.category-pills { display: flex; gap: 0.5rem; flex-wrap: wrap; }

.pill-btn {
  background: #090d16;
  border: 1px solid #1e293b;
  color: #94a3b8;
  padding: 0.5rem 0.85rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
}

.pill-btn:hover { color: #ffffff; border-color: #38bdf8; }
.pill-btn.active { background: rgba(0, 220, 130, 0.15); color: #00dc82; border-color: #00dc82; }

/* GRID PRODOTTI */
.shop-products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 1.5rem;
}

.product-card {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 14px;
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s, border-color 0.2s;
}

.product-card:hover {
  transform: translateY(-2px);
  border-color: #38bdf8;
}

.product-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.product-badge {
  background: rgba(0, 220, 130, 0.15);
  color: #00dc82;
  font-size: 0.7rem;
  font-weight: 800;
  padding: 0.2rem 0.55rem;
  border-radius: 4px;
  border: 1px solid rgba(0, 220, 130, 0.3);
}

.product-badge.core { background: rgba(56, 189, 248, 0.15); color: #38bdf8; border-color: rgba(56, 189, 248, 0.3); }
.product-badge.ai { background: rgba(168, 85, 247, 0.15); color: #c084fc; border-color: rgba(168, 85, 247, 0.3); }

.product-price { font-size: 1.35rem; font-weight: 900; color: #38bdf8; }

.product-card h3 { font-size: 1.15rem; color: #ffffff; margin: 0 0 0.5rem; font-weight: 800; }
.product-desc { color: #cbd5e1; font-size: 0.88rem; line-height: 1.5; margin-bottom: 1.25rem; flex: 1; }

.product-meta {
  background: #020420;
  border: 1px solid #1e293b;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.8rem;
  color: #94a3b8;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-bottom: 1.25rem;
}

.meta-row { display: flex; justify-content: space-between; }
.meta-file code { color: #00dc82; font-family: monospace; }

.btn-purchase {
  display: block;
  background: #00dc82;
  color: #020420;
  text-align: center;
  font-weight: 800;
  font-size: 0.9rem;
  padding: 0.75rem;
  border-radius: 8px;
  text-decoration: none;
  transition: background 0.2s, box-shadow 0.2s;
}

.btn-purchase:hover {
  background: #00bf71;
  box-shadow: 0 0 15px rgba(0, 220, 130, 0.3);
}
</style>