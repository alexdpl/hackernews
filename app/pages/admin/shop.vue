<!-- Snippet Scheda Prodotto DKP Shop SaaS -->
<template>
  <div class="shop-products-grid">
    
    <!-- CARD PRODOTTO 1: DKP AUTOMATED CRAWLER PRO -->
    <div class="product-card">
      <div class="product-header">
        <span class="product-badge">SAAS MODULE</span>
        <span class="product-price">€99.00</span>
      </div>
      <h3>🤖 DKP Automated Crawler Engine Pro</h3>
      <p class="product-desc">
        Modulo di ingestione notizie automatico con integrazione HackerNews, clean-up Neon DB ed API Nitro ad alte prestazioni.
      </p>
      <div class="product-meta">
        <span>📦 versione: <strong>v1.0.0</strong></span>
        <span>📁 file: <code>dkp-automated-crawler-pro-v1.0.zip</code></span>
      </div>
      <div class="product-actions">
        <NuxtLink to="/admin/shop?action=download&id=1" class="btn-purchase">
          🛒 Acquista / Scarica .ZIP
        </NuxtLink>
      </div>
    </div>

    <!-- CARD PRODOTTO 2: DKP TRANSLATOR PRO -->
    <div class="product-card">
      <div class="product-header">
        <span class="product-badge">CORE PLUGIN</span>
        <span class="product-price">€69.00</span>
      </div>
      <h3>🌐 DKP Translator Pro v2.0 Plugin</h3>
      <p class="product-desc">
        Composable globale e reattivo a 9 lingue con salvataggio cookie/localStorage, supporto Nuxt 4 SSR e zero dipendenze esterne.
      </p>
      <div class="product-meta">
        <span>📦 versione: <strong>v2.0.0</strong></span>
        <span>📁 file: <code>dkp-translator-pro-v2.0.zip</code></span>
      </div>
      <div class="product-actions">
        <NuxtLink to="/admin/shop?action=download&id=2" class="btn-purchase">
          🛒 Acquista / Scarica .ZIP
        </NuxtLink>
      </div>
    </div>

  </div>
</template>

<style scoped>
.shop-products-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem; margin-top: 2rem; }
.product-card { background: #090d16; border: 1px solid #1e293b; border-radius: 14px; padding: 1.75rem; display: flex; flex-direction: column; }
.product-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.product-badge { background: rgba(0, 220, 130, 0.15); color: #00dc82; font-size: 0.7rem; font-weight: 800; padding: 0.2rem 0.5rem; border-radius: 4px; border: 1px solid rgba(0, 220, 130, 0.3); }
.product-price { font-size: 1.25rem; font-weight: 900; color: #38bdf8; }
.product-card h3 { font-size: 1.2rem; color: #ffffff; margin: 0 0 0.5rem; }
.product-desc { color: #cbd5e1; font-size: 0.88rem; line-height: 1.5; margin-bottom: 1.25rem; flex: 1; }
.product-meta { background: #020420; border: 1px solid #1e293b; padding: 0.75rem; border-radius: 8px; font-size: 0.8rem; color: #94a3b8; display: flex; flex-direction: column; gap: 0.3rem; margin-bottom: 1.25rem; }
.product-meta code { color: #00dc82; }
.btn-purchase { background: #00dc82; color: #020420; text-align: center; font-weight: 800; font-size: 0.9rem; padding: 0.75rem; border-radius: 8px; text-decoration: none; transition: background 0.2s; }
.btn-purchase:hover { background: #00bf71; }
</style>