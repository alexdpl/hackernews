<!-- app/pages/shop/index.vue -->
<script setup lang="ts">
import { ref } from 'vue'

const { products } = useShop()
const checkoutSuccess = ref<string | null>(null)

function simulateCheckout(productName: string, filename: string) {
  checkoutSuccess.value = `🎉 Acquisto completato con successo per "${productName}"! Il pacchetto ${filename} è pronto per il download sicuro.`
  window.scrollTo({ top: 0, behavior: 'smooth' })
  setTimeout(() => checkoutSuccess.value = null, 7000)
}
</script>

<template>
  <div class="shop-container">
    <div class="shop-hero">
      <span class="badge-tag">DKP Commercial Marketplace</span>
      <h1>DKP Enterprise Plugins & .ZIP Store</h1>
      <p>Acquista le nostre tecnologie proprietarie e pacchetti pronti all'uso per accelerare lo sviluppo dei tuoi progetti enterprise.</p>
    </div>

    <div v-if="checkoutSuccess" class="success-banner">
      {{ checkoutSuccess }}
    </div>

    <div class="products-grid">
      <div v-for="p in products" :key="p.id" class="product-card">
        <div class="product-header">
          <span class="version-badge">{{ p.version }}</span>
          <span class="price-tag">€{{ p.price }}</span>
        </div>
        <h3>{{ p.title }}</h3>
        <p>{{ p.description }}</p>
        <div class="stack-info">
          <span>💻 Stack: <strong>{{ p.stack }}</strong></span>
          <span>📦 File: <code>{{ p.zipFilename }}</code></span>
        </div>
        <button @click="simulateCheckout(p.title, p.zipFilename)" class="buy-btn">
          🛒 Acquista Licenza & Scarica .ZIP
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.shop-container { max-width: 1100px; margin: 3rem auto; padding: 0 1.5rem; }
.shop-hero { text-align: center; margin-bottom: 3rem; }
.badge-tag { background: rgba(0, 220, 130, 0.15); color: #00a862; padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.85rem; font-weight: 700; text-transform: uppercase; border: 1px solid rgba(0, 220, 130, 0.3); }
.shop-hero h1 { font-size: 2.2rem; color: #020420; font-weight: 800; margin-top: 1rem; }
.shop-hero p { color: #64748b; font-size: 1rem; max-width: 650px; margin: 0.5rem auto 0; }
.success-banner { background: rgba(0, 220, 130, 0.15); border: 1px solid #00dc82; color: #006636; padding: 1rem; border-radius: 8px; font-weight: 600; margin-bottom: 2rem; text-align: center; }
.products-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem; }
.product-card { background: #020420; border: 1px solid #1e293b; border-radius: 12px; padding: 2rem; color: #ffffff; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); transition: transform 0.2s, border-color 0.2s; }
.product-card:hover { transform: translateY(-4px); border-color: #00dc82; }
.product-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.version-badge { background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.8rem; font-weight: 700; }
.price-tag { font-size: 1.5rem; font-weight: 800; color: #00dc82; }
.product-card h3 { font-size: 1.3rem; font-weight: 700; color: #ffffff; margin-bottom: 0.75rem; }
.product-card p { color: #94a3b8; font-size: 0.9rem; line-height: 1.5; margin-bottom: 1.5rem; flex-grow: 1; }
.stack-info { background: #090d16; border: 1px solid #1e293b; padding: 0.75rem; border-radius: 6px; font-size: 0.8rem; color: #cbd5e1; margin-bottom: 1.5rem; display: flex; flex-direction: column; gap: 0.3rem; }
.stack-info code { color: #00dc82; font-family: monospace; }
.buy-btn { background: #00dc82; color: #020420; border: none; padding: 0.75rem; border-radius: 6px; font-weight: 800; font-size: 0.9rem; cursor: pointer; transition: opacity 0.2s; width: 100%; }
.buy-btn:hover { opacity: 0.9; }
</style>