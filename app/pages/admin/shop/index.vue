<!-- app/pages/admin/shop/index.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// definePageMeta({ middleware: 'admin-only' })

useDkpSeo({
  title: 'Ecosystem Shop SaaS v2.4-GOLD - DKP Admin Control Center',
  description: 'Gestione catalogo prodotti SaaS, moduli proprietari, licenze ed archivi .ZIP distribuiti.'
})

const { getMainUrl, getMailUrl, getApiUrl } = useDomain()

interface Product {
  id: number | string
  title: string
  category: 'SAAS MODULE' | 'CORE PLUGIN' | 'CMS MODULE' | 'AI & TOOLS' | 'FLAGSHIP AI MODULE'
  categoryClass: string
  price: number
  description: string
  version: string
  downloads: number
  filePath: string
  isPublished?: boolean
}

// Stato Reattivo Catalogo
const products = ref<Product[]>([
  {
    id: 1,
    title: 'DKP Automated Crawler Engine Pro',
    category: 'SAAS MODULE',
    categoryClass: 'badge-saas',
    price: 199.00,
    description: 'Modulo di ingestione notizie automatico con integrazione HackerNews, clean-up Neon DB ed API Nitro ad alte prestazioni.',
    version: 'v2.4-GOLD',
    downloads: 45,
    filePath: '/downloads/dkp-automated-crawler-v2.4.zip',
    isPublished: true
  },
  {
    id: 2,
    title: 'DKP Translator Pro v2.4 Plugin',
    category: 'CORE PLUGIN',
    categoryClass: 'badge-core',
    price: 69.00,
    description: 'Composable globale e reattivo a 9 lingue con salvataggio cookie/localStorage, supporto Nuxt 3 e Nuxt 4.',
    version: 'v2.4-GOLD',
    downloads: 120,
    filePath: '/downloads/dkp-translator-pro-v2.4.zip',
    isPublished: true
  },
  {
    id: 3,
    title: 'DKP Ecosystem Shop Engine',
    category: 'SAAS MODULE',
    categoryClass: 'badge-saas',
    price: 79.00,
    description: 'Sistema completo di monetizzazione, licenziamento SaaS e download automatico archivi .ZIP proprietari.',
    version: 'v2.4-GOLD',
    downloads: 34,
    filePath: '/downloads/dkp-ecosystem-shop-v2.4.zip',
    isPublished: true
  },
  {
    id: 4,
    title: 'DKP Kernel Captcha Engine',
    category: 'CORE PLUGIN',
    categoryClass: 'badge-core',
    price: 39.00,
    description: 'Sistema anti-bot equazionale proprietario a zero costi esterni per la protezione dei form di sottomissione.',
    version: 'v2.4-GOLD',
    downloads: 89,
    filePath: '/downloads/dkp-kernel-captcha-v2.4.zip',
    isPublished: true
  },
  {
    id: 5,
    title: 'DKP Native Blog Pro CMS',
    category: 'CMS MODULE',
    categoryClass: 'badge-cms',
    price: 49.00,
    description: 'Motore CMS nativo per la pubblicazione di articoli tech, guide avanzate ed approfondimenti con supporto SEO.',
    version: 'v2.4-GOLD',
    downloads: 27,
    filePath: '/downloads/dkp-native-blog-pro-v2.4.zip',
    isPublished: true
  },
  {
    id: 6,
    title: 'DKP Neural Playground Suite',
    category: 'AI & TOOLS',
    categoryClass: 'badge-ai',
    price: 89.00,
    description: 'Pannello di testing prompt e integrazione modelli IA per l\'analisi automatica del codice e generazione contenuti.',
    version: 'v2.4-GOLD',
    downloads: 41,
    filePath: '/downloads/dkp-neural-playground-v2.4.zip',
    isPublished: true
  },
  {
    id: 7,
    title: 'DKP Pulse Nexus Pro (AI Agent)',
    category: 'FLAGSHIP AI MODULE',
    categoryClass: 'badge-flagship',
    price: 149.00,
    description: 'Chat floating glassmorphic in real-time con l\'agente "Pulse Sentinel", motore di Gamification con XP, Livelli e classifica DB.',
    version: 'v2.4-GOLD',
    downloads: 112,
    filePath: '/downloads/dkp-pulse-nexus-pro-v2.4.zip',
    isPublished: true
  }
])

const isLoading = ref(false)
const searchQuery = ref('')
const activeCategoryFilter = ref('ALL')

// Toast Notification System
const showToast = ref(false)
const toastMessage = ref('')

function triggerToast(msg: string) {
  toastMessage.value = msg
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3500)
}

// Stats Computate Dinamicamente
const totalDownloads = computed(() => products.value.reduce((acc, p) => acc + p.downloads, 0))
const totalSuiteValue = computed(() => products.value.reduce((acc, p) => acc + p.price, 0))

// Modal Form Prodotto (Creazione/Modifica)
const showModal = ref(false)
const isEditing = ref(false)
const currentProduct = ref<Product>({
  id: '',
  title: '',
  category: 'SAAS MODULE',
  categoryClass: 'badge-saas',
  price: 49.00,
  description: '',
  version: 'v2.4-GOLD',
  downloads: 0,
  filePath: '/downloads/dkp-new-plugin-v2.4.zip',
  isPublished: true
})

function openCreateModal() {
  isEditing.value = false
  currentProduct.value = {
    id: Date.now(),
    title: '',
    category: 'SAAS MODULE',
    categoryClass: 'badge-saas',
    price: 49.00,
    description: '',
    version: 'v2.4-GOLD',
    downloads: 0,
    filePath: '/downloads/dkp-module-v2.4.zip',
    isPublished: true
  }
  showModal.value = true
}

function openEditModal(prod: Product) {
  isEditing.value = true
  currentProduct.value = JSON.parse(JSON.stringify(prod))
  showModal.value = true
}

// Assegnazione Automatica Classe Badge
function updateCategoryClass() {
  switch (currentProduct.value.category) {
    case 'SAAS MODULE': currentProduct.value.categoryClass = 'badge-saas'; break
    case 'CORE PLUGIN': currentProduct.value.categoryClass = 'badge-core'; break
    case 'CMS MODULE': currentProduct.value.categoryClass = 'badge-cms'; break
    case 'AI & TOOLS': currentProduct.value.categoryClass = 'badge-ai'; break
    case 'FLAGSHIP AI MODULE': currentProduct.value.categoryClass = 'badge-flagship'; break
  }
}

async function saveProduct() {
  if (!currentProduct.value.title || !currentProduct.value.description) {
    triggerToast('❌ Compila Titolo e Descrizione del prodotto!')
    return
  }

  updateCategoryClass()
  isLoading.value = true

  try {
    if (isEditing.value) {
      const idx = products.value.findIndex(p => p.id === currentProduct.value.id)
      if (idx !== -1) products.value[idx] = { ...currentProduct.value }
      triggerToast('✅ Prodotto aggiornato con successo nel catalogo SaaS!')
    } else {
      products.value.unshift({ ...currentProduct.value })
      triggerToast('🚀 Nuovo modulo pubblicato nello Shop DKP!')
    }
    showModal.value = false
  } catch (err: any) {
    triggerToast('⚠️️ Errore salvataggio prodotto.')
  } finally {
    isLoading.value = false
  }
}

function deleteProduct(id: string | number) {
  if (!confirm('Sei sicuro di voler rimuovere questo modulo dal catalogo Shop?')) return
  products.value = products.value.filter(p => p.id !== id)
  triggerToast('🗑️ Prodotto rimosso dal catalogo.')
}

function initiateCheckout(product: Product) {
  triggerToast(`💳 Test Stripe Checkout: Inizializzato ordine per ${product.title} (€${product.price.toFixed(2)})`)
}

// Prodotti Filtrati
const filteredProducts = computed(() => {
  return products.value.filter(p => {
    const matchesCategory = activeCategoryFilter.value === 'ALL' || p.category === activeCategoryFilter.value
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                          p.category.toLowerCase().includes(searchQuery.value.toLowerCase())
    return matchesCategory && matchesSearch
  })
})
</script>

<template>
  <div class="shop-admin-container">
    <!-- TOAST NOTIFICATION FLOATING -->
    <Transition name="toast-fade">
      <div v-if="showToast" class="dkp-toast-success">
        <div class="toast-content">
          <span class="toast-text">{{ toastMessage }}</span>
        </div>
      </div>
    </Transition>

    <!-- NAVBAR GRID ADMIN UNIFICATA v2.4-GOLD -->
    <div class="admin-nav-container">
      <div class="admin-nav-top">
        <div class="nav-branding">
          <span class="status-dot green"></span>
          <span class="nav-title">DKP ADMIN CONTROL CENTER</span>
        </div>

        <NuxtLink :to="getMainUrl('/admin')" external class="nav-tab btn-dashboard-main">
          🏠 Dashboard Main
        </NuxtLink>
      </div>

      <!-- GRID MODULI ADMIN -->
      <nav class="admin-grid-nav">
        <NuxtLink :to="getApiUrl('/admin/api-gateway')" class="nav-tab btn-dashboard" active-class="active">⚙️ API Gateway</NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/mail')" class="nav-tab btn-dashboard" active-class="active">📧 Mail Center</NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/newsletter')" class="nav-tab btn-dashboard" active-class="active">📣 Newsletter</NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/autoresponder')" class="nav-tab btn-dashboard" active-class="active">📡 Autoresponder</NuxtLink>

        <NuxtLink :to="getMainUrl('/admin/crawler')" class="nav-tab btn-dashboard" active-class="active">🤖 Crawler Engine</NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/blog')" class="nav-tab btn-dashboard" active-class="active">📝 Gestione Blog</NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/shop')" class="nav-tab btn-dashboard" active-class="active">🛍️ Gestione Shop</NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/jobs')" class="nav-tab btn-dashboard" active-class="active">💼 Gestione Jobs</NuxtLink>
      </nav>
    </div>

    <!-- HEADER HERO SHOP SAAS -->
    <header class="panel-header">
      <div class="header-title">
        <div class="hero-badge">
          <span class="badge-status gold">DKP ECOSYSTEM SHOP v2.4-GOLD</span>
        </div>
        <h2>Gestione <span class="highlight">DKP Shop SaaS</span></h2>
        <p class="sub-lead">
          Catalogo ufficiale dei plugin proprietari, applicazioni distribuite e monetizzazione dell'ecosistema.
        </p>
      </div>

      <div class="header-actions">
        <button @click="openCreateModal" class="btn-primary-action">
          ➕ Nuovo Modulo SaaS
        </button>
      </div>
    </header>

    <!-- STATISTICHE PANNELLO -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Prodotti In Catalogo</div>
        <div class="stat-value">{{ products.length }} Moduli</div>
        <div class="stat-sub">100% Architettura Modulare Nuxt 4</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Download Totali SaaS</div>
        <div class="stat-value text-cyan">{{ totalDownloads }}</div>
        <div class="stat-sub">Archivi .ZIP erogati</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Valore Pacchetto Suite</div>
        <div class="stat-value text-green">€{{ totalSuiteValue.toFixed(2) }}</div>
        <div class="stat-sub">Licenze Lifetime Full Access</div>
      </div>
    </div>

    <!-- BARRA FILTRI E RICERCA -->
    <section class="controls-bar">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input v-model="searchQuery" type="text" placeholder="Cerca modulo, plugin o funzionalità..." class="dark-input search-input" />
      </div>

      <div class="filter-pills">
        <button 
          @click="activeCategoryFilter = 'ALL'" 
          class="pill" 
          :class="{ active: activeCategoryFilter === 'ALL' }"
        >
          Tutti ({{ products.length }})
        </button>
        <button 
          @click="activeCategoryFilter = 'SAAS MODULE'" 
          class="pill" 
          :class="{ active: activeCategoryFilter === 'SAAS MODULE' }"
        >
          SaaS Modules
        </button>
        <button 
          @click="activeCategoryFilter = 'CORE PLUGIN'" 
          class="pill" 
          :class="{ active: activeCategoryFilter === 'CORE PLUGIN' }"
        >
          Core Plugins
        </button>
        <button 
          @click="activeCategoryFilter = 'AI & TOOLS'" 
          class="pill" 
          :class="{ active: activeCategoryFilter === 'AI & TOOLS' }"
        >
          AI & Tools
        </button>
      </div>
    </section>

    <!-- GRIGLIA PRODOTTI SHOP -->
    <div class="products-grid">
      <article v-for="product in filteredProducts" :key="product.id" class="product-card">
        <div class="card-header">
          <span :class="['category-badge', product.categoryClass]">{{ product.category }}</span>
          <span class="price">€{{ product.price.toFixed(2) }}</span>
        </div>

        <h3 class="product-title">{{ product.title }}</h3>
        <p class="product-desc">{{ product.description }}</p>

        <div class="file-meta">
          <div class="meta-row">
            <span>📦 Versione: <strong class="text-white">{{ product.version }}</strong></span>
            <span>📥 Download: <strong class="text-white">{{ product.downloads }}</strong></span>
          </div>
          <div class="file-path">
            📁 File: <span class="path-text">{{ product.filePath }}</span>
          </div>
        </div>

        <div class="card-actions-row">
          <button @click="initiateCheckout(product)" class="btn-buy">
            💳 Test Licenza / .ZIP
          </button>
          <button @click="openEditModal(product)" class="btn-icon edit" title="Modifica Prodotto">✏️</button>
          <button @click="deleteProduct(product.id)" class="btn-icon delete" title="Elimina Prodotto">🗑️</button>
        </div>
      </article>

      <div v-if="filteredProducts.length === 0" class="empty-shop">
        📭 Nessun modulo trovato corrispondente ai criteri di ricerca.
      </div>
    </div>

    <!-- MODAL CREAZIONE / MODIFICA PRODOTTO -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ isEditing ? '✏️ Modifica Prodotto SaaS' : '➕ Aggiungi Nuovo Modulo in Catalogo' }}</h3>
          <button @click="showModal = false" class="btn-close">&times;</button>
        </div>

        <div class="modal-body">
          <div class="input-grid">
            <div class="input-group full-width">
              <label>Titolo Modulo / Plugin *</label>
              <input v-model="currentProduct.title" type="text" placeholder="es. DKP Automated Crawler Engine Pro" class="dark-input" />
            </div>

            <div class="input-group">
              <label>Categoria Categoria *</label>
              <select v-model="currentProduct.category" @change="updateCategoryClass" class="dark-input">
                <option value="SAAS MODULE">SaaS Module</option>
                <option value="CORE PLUGIN">Core Plugin</option>
                <option value="CMS MODULE">CMS Module</option>
                <option value="AI & TOOLS">AI & Tools</option>
                <option value="FLAGSHIP AI MODULE">Flagship AI Module</option>
              </select>
            </div>

            <div class="input-group">
              <label>Prezzo Licenza (€) *</label>
              <input v-model.number="currentProduct.price" type="number" step="0.01" class="dark-input" />
            </div>

            <div class="input-group">
              <label>Versione Release</label>
              <input v-model="currentProduct.version" type="text" placeholder="v2.4-GOLD" class="dark-input" />
            </div>

            <div class="input-group">
              <label>Percorso Archivo .ZIP</label>
              <input v-model="currentProduct.filePath" type="text" placeholder="/downloads/dkp-module.zip" class="dark-input" />
            </div>

            <div class="input-group full-width">
              <label>Descrizione Dettagliata Modulo</label>
              <textarea v-model="currentProduct.description" rows="3" placeholder="Descrivi le funzionalità principali e i benefit del plugin..." class="dark-input textarea"></textarea>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="showModal = false" class="btn-secondary">Annulla</button>
          <button @click="saveProduct" :disabled="isLoading" class="btn-primary-action">
            💾 {{ isEditing ? 'Aggiorna Modulo' : 'Pubblica in Shop' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ==========================================================================
   STILI NAVBAR ADMIN UNIFICATA v2.4-GOLD
   ========================================================================== */
.admin-nav-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #090d16;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 20px;
}

.admin-nav-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.nav-branding { display: flex; align-items: center; gap: 8px; }

.status-dot.green {
  width: 8px;
  height: 8px;
  background-color: #00ff87;
  border-radius: 50%;
  box-shadow: 0 0 8px #00ff87;
}

.nav-title {
  color: #00f0ff;
  font-weight: 800;
  font-size: 0.85rem;
  letter-spacing: 0.05em;
  text-shadow: 0 0 10px rgba(0, 240, 255, 0.3);
}

.admin-grid-nav {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.nav-tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.88rem;
  text-decoration: none;
  transition: all 0.2s ease-in-out;
  cursor: pointer;
}

.btn-dashboard {
  color: #00ff87;
  background: rgba(0, 255, 135, 0.04);
  border: 1px solid rgba(0, 255, 135, 0.3);
}

.btn-dashboard:hover,
.btn-dashboard.active {
  background: rgba(0, 255, 135, 0.12);
  border-color: #00ff87;
  box-shadow: 0 0 12px rgba(0, 255, 135, 0.25);
  transform: translateY(-1px);
}

.btn-dashboard-main {
  color: #00f0ff;
  background: rgba(0, 240, 255, 0.06);
  border: 1px solid rgba(0, 240, 255, 0.4);
}

.btn-dashboard-main:hover {
  background: rgba(0, 240, 255, 0.16);
  border-color: #00f0ff;
  box-shadow: 0 0 14px rgba(0, 240, 255, 0.35);
  transform: translateY(-1px);
}

@media (max-width: 1024px) {
  .admin-grid-nav { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 580px) {
  .admin-grid-nav { grid-template-columns: 1fr; }
}

/* ==========================================================================
   TOAST NOTIFICATION FLOATING
   ========================================================================== */
.dkp-toast-success {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 999999;
  background: #061811;
  border: 1px solid #00dc82;
  box-shadow: 0 10px 30px rgba(0, 220, 130, 0.35);
  padding: 0.9rem 1.3rem;
  border-radius: 10px;
  backdrop-filter: blur(16px);
  max-width: 420px;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  color: #f8fafc;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.85rem;
  font-weight: 600;
}

.toast-fade-enter-active, .toast-fade-leave-active { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.toast-fade-enter-from, .toast-fade-leave-to { opacity: 0; transform: translateY(-15px) scale(0.95); }

/* ==========================================================================
   LAYOUT PANNELLO & HERO
   ========================================================================== */
.shop-admin-container {
  max-width: 1240px;
  margin: 0 auto;
  padding-bottom: 4rem;
  color: #f8fafc;
  font-family: system-ui, -apple-system, sans-serif;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1.5rem 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  flex-wrap: wrap;
  gap: 1rem;
}

.hero-badge { margin-bottom: 0.5rem; }

.badge-status.gold {
  background: rgba(0, 220, 130, 0.15);
  color: #00dc82;
  border: 1px solid #00dc82;
  padding: 0.2rem 0.55rem;
  border-radius: 4px;
  font-size: 0.72rem;
  font-weight: 800;
  box-shadow: 0 0 10px rgba(0, 220, 130, 0.2);
}

.panel-header h2 { font-size: 1.8rem; font-weight: 900; margin: 0 0 0.4rem 0; color: #ffffff; }
.highlight { color: #00dc82; }
.sub-lead { color: #94a3b8; font-size: 0.92rem; margin: 0; }

.btn-primary-action {
  background: #00dc82;
  color: #020420;
  font-weight: 900;
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.88rem;
  transition: all 0.2s ease;
}

.btn-primary-action:hover { box-shadow: 0 0 18px rgba(0, 220, 130, 0.4); transform: translateY(-1px); }

.btn-secondary {
  background: #020420;
  color: #f8fafc;
  font-weight: 700;
  border: 1px solid #1e293b;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.88rem;
}

/* STATS GRID */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1.25rem;
}

.stat-label { color: #64748b; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.4rem; }
.stat-value { color: #fff; font-size: 1.8rem; font-weight: 900; margin-bottom: 0.2rem; }
.stat-value.text-cyan { color: #38bdf8; }
.stat-value.text-green { color: #00dc82; }
.stat-sub { color: #475569; font-size: 0.78rem; }

/* CONTROLS BAR */
.controls-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.search-box {
  display: flex;
  align-items: center;
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  flex: 1;
  min-width: 280px;
}

.search-icon { color: #64748b; margin-right: 0.5rem; }

.dark-input {
  background: #020420;
  border: 1px solid #1e293b;
  color: #fff;
  padding: 0.65rem 0.85rem;
  border-radius: 8px;
  font-size: 0.88rem;
  outline: none;
  width: 100%;
}

.dark-input:focus { border-color: #00dc82; }
.search-input { background: transparent !important; border: none !important; padding: 0 !important; }

.filter-pills { display: flex; gap: 0.5rem; flex-wrap: wrap; }

.pill {
  background: #090d16;
  border: 1px solid #1e293b;
  color: #cbd5e1;
  padding: 0.45rem 1rem;
  border-radius: 20px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pill:hover { border-color: #00dc82; color: #00dc82; }
.pill.active { border-color: #00dc82; color: #00dc82; background: rgba(0, 220, 130, 0.12); box-shadow: 0 0 10px rgba(0, 220, 130, 0.2); }

/* PRODUCTS GRID */
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 1.5rem;
}

.product-card {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 14px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  transition: all 0.2s ease;
}

.product-card:hover { border-color: #38bdf8; transform: translateY(-2px); box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5); }

.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem; }

.category-badge { font-size: 0.68rem; font-weight: 800; padding: 0.2rem 0.55rem; border-radius: 4px; letter-spacing: 0.04em; }
.badge-saas { background: rgba(0, 220, 130, 0.12); color: #00dc82; border: 1px solid rgba(0, 220, 130, 0.3); }
.badge-core { background: rgba(56, 189, 248, 0.12); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); }
.badge-cms { background: rgba(167, 139, 250, 0.12); color: #a78bfa; border: 1px solid rgba(167, 139, 250, 0.3); }
.badge-ai { background: rgba(244, 114, 182, 0.12); color: #f472b6; border: 1px solid rgba(244, 114, 182, 0.3); }
.badge-flagship { background: linear-gradient(90deg, rgba(167,139,250,0.15), rgba(244,114,182,0.15)); color: #d8b4fe; border: 1px solid rgba(216, 180, 254, 0.4); }

.price { font-size: 1.4rem; font-weight: 900; color: #38bdf8; }
.product-title { font-size: 1.15rem; font-weight: 800; margin: 0 0 0.4rem 0; color: #fff; }
.product-desc { font-size: 0.88rem; color: #94a3b8; line-height: 1.5; margin-bottom: 1.25rem; flex-grow: 1; }

.file-meta { background: #020420; border: 1px solid #1e293b; border-radius: 8px; padding: 0.75rem 0.9rem; margin-bottom: 1.2rem; font-size: 0.78rem; color: #64748b; }
.meta-row { display: flex; justify-content: space-between; margin-bottom: 0.35rem; border-bottom: 1px solid #1e293b; padding-bottom: 0.35rem; }
.text-white { color: #f8fafc; }
.path-text { color: #00dc82; font-family: monospace; }

.card-actions-row { display: flex; gap: 0.5rem; align-items: center; }

.btn-buy {
  flex: 1;
  background: #00dc82;
  color: #020420;
  border: none;
  padding: 0.75rem;
  border-radius: 8px;
  font-weight: 900;
  font-size: 0.88rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-buy:hover { box-shadow: 0 0 16px rgba(0, 220, 130, 0.3); transform: translateY(-1px); }

.btn-icon {
  background: #020420;
  border: 1px solid #1e293b;
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  color: #fff;
  transition: all 0.2s ease;
}

.btn-icon:hover { border-color: #00dc82; transform: translateY(-1px); }

.empty-shop { grid-column: 1 / -1; text-align: center; padding: 3rem; color: #64748b; font-size: 0.9rem; }

/* MODAL STYLES */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(2, 4, 32, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1.5rem;
}

.modal-content {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  width: 100%;
  max-width: 640px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-header { padding: 1.25rem 1.5rem; border-bottom: 1px solid #1e293b; display: flex; justify-content: space-between; align-items: center; }
.modal-header h3 { margin: 0; color: #ffffff; font-size: 1.15rem; }
.btn-close { background: none; border: none; color: #64748b; font-size: 1.5rem; cursor: pointer; }
.modal-body { padding: 1.5rem; overflow-y: auto; }

.input-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
@media (max-width: 580px) { .input-grid { grid-template-columns: 1fr; } }

.input-group { display: flex; flex-direction: column; gap: 0.35rem; }
.input-group.full-width { grid-column: 1 / -1; }
.input-group label { font-size: 0.78rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.04em; }

.textarea { resize: vertical; }

.modal-footer { padding: 1.25rem 1.5rem; border-top: 1px solid #1e293b; display: flex; justify-content: flex-end; gap: 0.75rem; }
</style>