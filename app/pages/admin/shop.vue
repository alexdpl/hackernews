<template>
  <div class="shop-admin-container">
    <!-- TOP BAR DI NAVIGAZIONE ADMIN -->
<div class="admin-top-bar">
  <div class="admin-breadcrumb">
    <span class="status-dot green"></span>
    <span class="breadcrumb-text">ADMIN CONTROL CENTER</span>
  </div>

  <NuxtLink to="/admin" class="btn-back-dashboard">
    📊 Torna alla Dashboard
  </NuxtLink>
</div>

    <h1 class="shop-title">Gestione <span class="highlight">DKP Shop SaaS</span></h1>
    <p class="shop-subtitle">Catalogo ufficiale dei plugin proprietari ed applicazioni distribuite nell'ecosistema.</p>

    <!-- Statistiche -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Prodotti In Catalogo</div>
        <div class="stat-value">7 Moduli</div>
        <div class="stat-sub">100% Architettura Modulare</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Download Totali SaaS</div>
        <div class="stat-value">413</div>
        <div class="stat-sub">File .ZIP erogati</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Valore Pacchetto Suite</div>
        <div class="stat-value">€673.00</div>
        <div class="stat-sub">Licenza Lifetime Full Access</div>
      </div>
    </div>

    <!-- Filtri e Ricerca -->
    <div class="controls-bar">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input type="text" v-model="searchQuery" placeholder="Cerca modulo, plugin o funzionalità..." />
      </div>
      <div class="filter-pills">
        <button class="pill active">Tutti (7)</button>
        <button class="pill">SaaS Modules</button>
        <button class="pill">Core Plugins</button>
        <button class="pill">AI & Tools</button>
      </div>
    </div>

    <!-- Griglia Prodotti -->
    <div class="products-grid">
      <article v-for="product in products" :key="product.id" class="product-card">
        <div class="card-header">
          <span :class="['category-badge', product.categoryClass]">{{ product.category }}</span>
          <span class="price">€{{ product.price.toFixed(2) }}</span>
        </div>
        
        <h3 class="product-title">{{ product.title }}</h3>
        <p class="product-desc">{{ product.description }}</p>

        <div class="file-meta">
          <div class="meta-row">
            <span>📦 versione: <strong class="text-white">{{ product.version }}</strong></span>
            <span>📥 download: <strong class="text-white">{{ product.downloads }}</strong></span>
          </div>
          <div class="file-path">
            📁 file: <span class="path-text">{{ product.filePath }}</span>
          </div>
        </div>

        <button @click="initiateCheckout(product)" class="btn-buy">
          💳 Acquista Licenza / Scarica .ZIP
        </button>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const searchQuery = ref('')

// Mock Data aggiornato alla v2.4-GOLD e con i nuovi prezzi
const products = ref([
  {
    id: 1,
    title: 'DKP Automated Crawler Engine Pro',
    category: 'SAAS MODULE',
    categoryClass: 'badge-saas',
    price: 199.00,
    description: 'Modulo di ingestione notizie automatico con integrazione HackerNews, clean-up Neon DB ed API Nitro ad alte prestazioni.',
    version: 'v2.4-GOLD',
    downloads: 45,
    filePath: '/downloads/dkp-automated-crawler-v2.4.zip'
  },
  {
    id: 2,
    title: 'DKP Translator Pro v2.4 Plugin',
    category: 'CORE PLUGIN',
    categoryClass: 'badge-core',
    price: 69.00,
    description: 'Composable globale e reattivo a 9 lingue con salvataggio cookie/localStorage, supporto Nuxt 3.',
    version: 'v2.4-GOLD',
    downloads: 120,
    filePath: '/downloads/dkp-translator-pro-v2.4.zip'
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
    filePath: '/downloads/dkp-ecosystem-shop-v2.4.zip'
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
    filePath: '/downloads/dkp-kernel-captcha-v2.4.zip'
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
    filePath: '/downloads/dkp-native-blog-pro-v2.4.zip'
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
    filePath: '/downloads/dkp-neural-playground-v2.4.zip'
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
    filePath: '/downloads/dkp-pulse-nexus-pro-v2.4.zip'
  }
])

const initiateCheckout = (product: any) => {
  // Placeholder per l'integrazione Stripe/PayPal della Roadmap Fase 1
  alert(`Inizializzazione pagamento per ${product.title} a €${product.price}\nProssimo step: Integrazione Stripe Checkout!`)
}
</script>

<style scoped>


/* ==========================================================================
   TOP BAR NAVIGAZIONE ADMIN (TORNA ALLA DASHBOARD)
   ========================================================================== */
.admin-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 10px;
  padding: 0.6rem 1rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.admin-breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  background: rgba(56, 189, 248, 0.08);
  border: 1px solid rgba(56, 189, 248, 0.25);
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
}

.breadcrumb-text {
  font-size: 0.75rem;
  font-weight: 800;
  color: #38bdf8;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.status-dot.green {
  background: #00dc82;
  box-shadow: 0 0 8px #00dc82;
}

/* BOTTONE NEON TORNA ALLA DASHBOARD */
.btn-back-dashboard {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: #020420;
  border: 1px solid #1e293b;
  color: #cbd5e1;
  padding: 0.45rem 0.9rem;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.btn-back-dashboard:hover {
  border-color: #00dc82;
  color: #00dc82;
  background: rgba(0, 220, 130, 0.08);
  box-shadow: 0 0 12px rgba(0, 220, 130, 0.2);
  transform: translateY(-1px);
}


.shop-admin-container { max-width: 1200px; margin: 2rem auto; padding: 0 1rem; font-family: system-ui, sans-serif; color: #f8fafc; }

.shop-top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.badge-admin { background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); color: #38bdf8; padding: 0.3rem 0.8rem; border-radius: 4px; font-weight: 800; font-size: 0.75rem; letter-spacing: 1px; }
.btn-back { background: transparent; border: 1px solid #334155; color: #cbd5e1; padding: 0.4rem 1rem; border-radius: 6px; text-decoration: none; font-size: 0.85rem; font-weight: 600; transition: 0.2s; }
.btn-back:hover { background: #1e293b; color: #fff; }

.shop-title { font-size: 2.5rem; font-weight: 900; margin: 0 0 0.5rem 0; }
.highlight { color: #00dc82; }
.shop-subtitle { color: #94a3b8; font-size: 1rem; margin-bottom: 2rem; }

/* Statistiche */
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
.stat-card { background: rgba(9, 13, 22, 0.6); border: 1px solid #1e293b; border-radius: 12px; padding: 1.5rem; text-align: left; }
.stat-label { color: #64748b; font-size: 0.85rem; font-weight: 700; text-transform: uppercase; margin-bottom: 0.5rem; }
.stat-value { color: #fff; font-size: 2rem; font-weight: 900; margin-bottom: 0.25rem; }
.stat-sub { color: #475569; font-size: 0.8rem; }

/* Filtri */
.controls-bar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 2rem; }
.search-box { display: flex; align-items: center; background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 0.5rem 1rem; flex: 1; max-width: 400px; }
.search-box input { background: transparent; border: none; color: #fff; width: 100%; outline: none; margin-left: 0.5rem; font-size: 0.9rem; }
.filter-pills { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.pill { background: transparent; border: 1px solid #334155; color: #cbd5e1; padding: 0.4rem 1rem; border-radius: 20px; font-size: 0.85rem; cursor: pointer; transition: 0.2s; }
.pill:hover { border-color: #64748b; }
.pill.active { border-color: #00dc82; color: #00dc82; background: rgba(0, 220, 130, 0.1); }

/* Prodotti */
.products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 1.5rem; }
.product-card { background: rgba(9, 13, 22, 0.8); border: 1px solid #1e293b; border-radius: 16px; padding: 1.5rem; display: flex; flex-direction: column; transition: all 0.2s; }
.product-card:hover { border-color: #38bdf8; box-shadow: 0 10px 30px rgba(0,0,0,0.5); transform: translateY(-2px); }

.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.category-badge { font-size: 0.7rem; font-weight: 800; padding: 0.2rem 0.6rem; border-radius: 4px; letter-spacing: 0.5px; }
.badge-saas { background: rgba(0, 220, 130, 0.1); color: #00dc82; border: 1px solid rgba(0, 220, 130, 0.3); }
.badge-core { background: rgba(56, 189, 248, 0.1); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); }
.badge-cms { background: rgba(167, 139, 250, 0.1); color: #a78bfa; border: 1px solid rgba(167, 139, 250, 0.3); }
.badge-ai { background: rgba(244, 114, 182, 0.1); color: #f472b6; border: 1px solid rgba(244, 114, 182, 0.3); }
.badge-flagship { background: linear-gradient(90deg, rgba(167,139,250,0.1), rgba(244,114,182,0.1)); color: #d8b4fe; border: 1px solid rgba(216, 180, 254, 0.4); }

.price { font-size: 1.5rem; font-weight: 900; color: #38bdf8; }
.product-title { font-size: 1.25rem; font-weight: 800; margin: 0 0 0.5rem 0; color: #fff; }
.product-desc { font-size: 0.9rem; color: #94a3b8; line-height: 1.5; margin-bottom: 1.5rem; flex-grow: 1; }

.file-meta { background: #060a12; border: 1px solid #1e293b; border-radius: 8px; padding: 0.8rem 1rem; margin-bottom: 1.2rem; font-size: 0.8rem; color: #64748b; }
.meta-row { display: flex; justify-content: space-between; margin-bottom: 0.4rem; border-bottom: 1px solid #1e293b; padding-bottom: 0.4rem; }
.text-white { color: #f8fafc; }
.path-text { color: #00dc82; font-family: monospace; }

.btn-buy { background: #00dc82; color: #020420; border: none; padding: 0.8rem; border-radius: 8px; font-weight: 800; font-size: 0.95rem; cursor: pointer; transition: 0.2s; width: 100%; }
.btn-buy:hover { transform: scale(1.02); box-shadow: 0 0 20px rgba(0, 220, 130, 0.3); }
</style>