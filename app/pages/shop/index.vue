<!-- app/pages/shop/index.vue -->
<script setup lang="ts">
import { ref } from 'vue'

const showModal = ref(false)
const selectedProduct = ref<any>(null)
const customerEmail = ref('')
const paymentProvider = ref<'stripe' | 'paypal'>('stripe')
const isLoading = ref(false)
const errorMessage = ref('')

// Pacchetti aggiornati con nuovi Tier API e Moduli ADS in Beta
const products = ref([
  {
    id: 'dkp-api-core-pass',
    title: 'DKP Core API Starter',
    category: 'DEVELOPER API',
    categoryClass: 'badge-core',
    price: 19.00,
    rateLimit: '15.000 req/mo',
    endpoint: '/api/v2.5/core',
    description: 'Accesso base al Kernel DKP, notarizzazione crittografica Vault e routing standard.',
    isFeatured: false,
    isBeta: false
  },
  {
    id: 'dkp-api-neural-pro',
    title: 'DKP Neural Trinity Pro',
    category: 'AI & LLM ENGINE',
    categoryClass: 'badge-ai',
    price: 49.00,
    rateLimit: '50.000 req/mo',
    endpoint: '/api/v2.5/neural',
    description: 'Accesso completo ai modelli DKP Trinity (MoE, Coder, Pro) e streaming in tempo reale su OpenUI Studio.',
    isFeatured: true,
    isBeta: false
  },
  {
    id: 'dkp-api-neural-ultra',
    title: 'DKP Neural Trinity Ultra',
    category: 'AI & POWER ENGINE',
    categoryClass: 'badge-ai',
    price: 99.00,
    rateLimit: '250.000 req/mo',
    endpoint: '/api/v2.5/neural',
    description: 'Progettato per heavy user e team. Generazione UI intensiva, audit IA illimitati e priorità di calcolo sul Gateway.',
    isFeatured: false,
    isBeta: false
  },
  {
    id: 'dkp_ads_starter_100',
    title: 'DKP Ads Starter Pack',
    category: 'ADVERTISING',
    categoryClass: 'badge-ads',
    price: 9.00,
    rateLimit: '100 Click/mo',
    endpoint: '/api/v2.5/ads',
    description: 'Metti il tuo prodotto davanti agli occhi di migliaia di sviluppatori. 100 Click reali garantiti sul nostro network.',
    isFeatured: false,
    isBeta: true
  },
  {
    id: 'dkp-api-ads-network',
    title: 'DKP Ads Publisher API',
    category: 'MONETIZATION ADS',
    categoryClass: 'badge-ads',
    price: 29.00,
    rateLimit: 'Illimitato (Publisher)',
    endpoint: '/api/v2.5/ads/publisher',
    description: 'Il nostro motore di inserzioni DKP Ads per monetizzare il tuo traffico tech con banner mirati e payout istantanei.',
    isFeatured: false,
    isBeta: true
  },
  {
    id: 'dkp-api-enterprise-cluster',
    title: 'DKP Enterprise Cluster',
    category: 'ENTERPRISE SLA',
    categoryClass: 'badge-flagship',
    price: 199.00,
    rateLimit: 'Req. Illimitate / SLA 99.99%',
    endpoint: '/api/v2.5/enterprise',
    description: 'Infrastruttura GCP dedicata con bilanciamento di carico, HSM crittografato e supporto architetturale prioritario.',
    isFeatured: false,
    isBeta: false
  }
])

const openCheckoutModal = (product: any) => {
  if (product.isBeta) return
  selectedProduct.value = product
  errorMessage.value = ''
  showModal.value = true
}

const closeModal = () => {
  if (isLoading.value) return
  showModal.value = false
  selectedProduct.value = null
}

const executeCheckout = async () => {
  if (!customerEmail.value || !selectedProduct.value) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    const payload = {
      productId: selectedProduct.value.id,
      productName: selectedProduct.value.title,
      amount: selectedProduct.value.price,
      customerEmail: customerEmail.value
    }

    const endpoint = paymentProvider.value === 'stripe' ? '/api/checkout/stripe' : '/api/checkout/paypal'
    const res: any = await $fetch(endpoint, {
      method: 'POST',
      body: payload
    })

    const redirectUrl = res?.checkoutUrl || res?.approveUrl
    if (redirectUrl) {
      window.location.href = redirectUrl
    } else {
      throw new Error('URL di reindirizzamento pagamento non generato')
    }
  } catch (err: any) {
    console.error('[CHECKOUT ERROR]:', err)
    errorMessage.value = err?.data?.statusMessage || err?.message || 'Errore durante la creazione del checkout.'
    isLoading.value = false
  }
}
</script>

<template>
  <div class="shop-container">
    <!-- Header dello Shop -->
    <div class="shop-header">
      <span class="badge-gold">DKP v2.5-GOLD API ECOSYSTEM</span>
      <h1 class="shop-title">DKP Developer <span class="highlight">API Gateway</span></h1>
      <p class="shop-subtitle">Accedi alle API proprietarie ad alte prestazioni per Nuxt 4, LLM Trinity e al programma Early Access del network DKP Ads.</p>
    </div>

    <!-- Griglia API Prodotti -->
    <div class="products-grid">
      <article v-for="product in products" :key="product.id" class="product-card" :class="{ 'featured-card': product.isFeatured }">
        <div class="card-header">
          <span :class="['category-badge', product.categoryClass]">{{ product.category }}</span>
          <span class="price">€{{ product.price.toFixed(2) }}<span class="recurring-text">/mo</span></span>
        </div>
        
        <h3 class="product-title">{{ product.title }}</h3>
        <p class="product-desc">{{ product.description }}</p>

        <div class="file-meta">
          <div class="meta-row">
            <span>⚡ rate limit: <strong class="text-white">{{ product.rateLimit }}</strong></span>
            <span>🔑 auth: <strong class="text-white">Bearer Token</strong></span>
          </div>
          <div class="file-path">
            📁 route base: <span class="path-text">{{ product.endpoint }}</span>
          </div>
        </div>

        <button 
          v-if="!product.isBeta"
          @click="openCheckoutModal(product)" 
          class="btn-buy" 
          :class="{ 'btn-gold': product.isFeatured }"
        >
          🚀 Attiva API Pass
        </button>
        <button 
          v-else 
          disabled 
          class="btn-buy btn-disabled"
        >
          🚧 In Beta Test
        </button>
      </article>
    </div>

    <!-- 💳 MODAL DI CHECKOUT API -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-card">
          <button class="modal-close" @click="closeModal">✕</button>
          
          <div class="modal-header">
            <span class="modal-badge">DKP SECURE GATEWAY</span>
            <h3>{{ selectedProduct?.title }}</h3>
            <div class="modal-price">
              €{{ selectedProduct?.price.toFixed(2) }} /mo 
              <span class="tax-info">(Fatturazione mensile - Cancelli quando vuoi)</span>
            </div>
          </div>

          <form @submit.prevent="executeCheckout" class="modal-form">
            <div class="form-group">
              <label for="email">Email per ricezione API Token & Credenziali:</label>
              <input 
                id="email" 
                v-model="customerEmail" 
                type="email" 
                placeholder="dev@tuodominio.com" 
                required 
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label>Seleziona Gateway di Pagamento:</label>
              <div class="payment-options">
                <label :class="['payment-card', { active: paymentProvider === 'stripe' }]">
                  <input type="radio" v-model="paymentProvider" value="stripe" name="provider" />
                  <div class="payment-info">
                    <span class="provider-title">💳 Carta di Credito / Google Pay</span>
                    <span class="provider-sub">Stripe Secure Checkout</span>
                  </div>
                </label>

                <label :class="['payment-card', { active: paymentProvider === 'paypal' }]">
                  <input type="radio" v-model="paymentProvider" value="paypal" name="provider" />
                  <div class="payment-info">
                    <span class="provider-title">🅿️ PayPal</span>
                    <span class="provider-sub">Abbonamento ricorrente PayPal</span>
                  </div>
                </label>
              </div>
            </div>

            <div v-if="errorMessage" class="error-banner">
              ⚠️ {{ errorMessage }}
            </div>

            <button type="submit" class="btn-checkout-submit" :disabled="isLoading">
              <span v-if="!isLoading">⚡ Genera Sub & API Key</span>
              <span v-else>⌛ Connessione al Gateway...</span>
            </button>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.shop-container { max-width: 1200px; margin: 2rem auto; padding: 0 1rem; color: #f8fafc; font-family: system-ui, sans-serif; }
.shop-header { text-align: center; margin-bottom: 3rem; }
.badge-gold { background: rgba(234, 179, 8, 0.1); border: 1px solid rgba(234, 179, 8, 0.3); color: #eab308; padding: 0.3rem 0.8rem; border-radius: 20px; font-weight: 800; font-size: 0.8rem; }
.shop-title { font-size: 2.8rem; font-weight: 900; margin: 0.8rem 0 0.4rem 0; }
.highlight { color: #00dc82; }
.shop-subtitle { color: #94a3b8; font-size: 1.1rem; max-width: 700px; margin: 0 auto; }

/* Product Cards */
.products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
.product-card { background: rgba(9, 13, 22, 0.85); border: 1px solid #1e293b; border-radius: 16px; padding: 1.5rem; display: flex; flex-direction: column; backdrop-filter: blur(10px); transition: all 0.25s ease; }
.product-card:hover { border-color: #00dc82; box-shadow: 0 10px 30px rgba(0,220,130,0.15); }
.product-card.featured-card { border-color: #eab308; box-shadow: 0 0 20px rgba(234, 179, 8, 0.15); }

.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.category-badge { font-size: 0.65rem; font-weight: 800; padding: 0.2rem 0.6rem; border-radius: 4px; }
.badge-core { background: rgba(56, 189, 248, 0.1); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); }
.badge-ai { background: rgba(244, 114, 182, 0.1); color: #f472b6; border: 1px solid rgba(244, 114, 182, 0.3); }
.badge-ads { background: rgba(234, 179, 8, 0.1); color: #eab308; border: 1px solid rgba(234, 179, 8, 0.3); }
.badge-flagship { background: linear-gradient(90deg, rgba(167,139,250,0.1), rgba(244,114,182,0.1)); color: #d8b4fe; border: 1px solid rgba(216, 180, 254, 0.4); }

.price { font-size: 1.6rem; font-weight: 900; color: #38bdf8; }
.recurring-text { font-size: 0.8rem; color: #94a3b8; font-weight: 500; }

.product-title { font-size: 1.2rem; font-weight: 800; margin: 0 0 0.5rem 0; color: #fff; }
.product-desc { font-size: 0.85rem; color: #94a3b8; line-height: 1.5; margin-bottom: 1.5rem; flex-grow: 1; }

.file-meta { background: #060a12; border: 1px solid #1e293b; border-radius: 8px; padding: 0.8rem; margin-bottom: 1.2rem; font-size: 0.75rem; color: #64748b; }
.meta-row { display: flex; justify-content: space-between; margin-bottom: 0.4rem; border-bottom: 1px solid #1e293b; padding-bottom: 0.4rem; }
.text-white { color: #f8fafc; }
.path-text { color: #00dc82; font-family: monospace; }

/* Pulsanti */
.btn-buy { background: #00dc82; color: #020420; border: none; padding: 0.85rem; border-radius: 8px; font-weight: 800; font-size: 0.9rem; cursor: pointer; transition: 0.2s; width: 100%; }
.btn-buy:hover:not(.btn-disabled) { transform: translateY(-2px); box-shadow: 0 0 20px rgba(0, 220, 130, 0.3); }
.btn-gold { background: #eab308; color: #020420; }
.btn-gold:hover:not(.btn-disabled) { box-shadow: 0 0 20px rgba(234, 179, 8, 0.4); }

.btn-disabled { background: #1e293b; color: #64748b; cursor: not-allowed; opacity: 0.8; }
.btn-disabled:hover { transform: none; box-shadow: none; }

/* Modal Styling */
.modal-overlay { position: fixed; inset: 0; background: rgba(2, 4, 32, 0.85); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 1rem; }
.modal-card { background: #090d16; border: 1px solid #334155; border-radius: 20px; width: 100%; max-width: 520px; padding: 2rem; position: relative; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7); }
.modal-close { position: absolute; top: 1.2rem; right: 1.2rem; background: transparent; border: none; color: #64748b; font-size: 1.2rem; cursor: pointer; }
.modal-close:hover { color: #fff; }

.modal-badge { font-size: 0.65rem; font-weight: 900; background: rgba(56, 189, 248, 0.1); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); padding: 0.2rem 0.5rem; border-radius: 4px; letter-spacing: 1px; }
.modal-header h3 { font-size: 1.3rem; margin: 0.5rem 0; color: #fff; }
.modal-price { font-size: 1.6rem; font-weight: 900; color: #00dc82; margin-bottom: 1.5rem; }
.tax-info { font-size: 0.75rem; color: #64748b; font-weight: 400; }

.form-group { margin-bottom: 1.2rem; text-align: left; }
.form-group label { display: block; font-size: 0.8rem; color: #cbd5e1; font-weight: 600; margin-bottom: 0.5rem; }
.form-input { width: 100%; background: #020420; border: 1px solid #334155; border-radius: 8px; padding: 0.8rem 1rem; color: #fff; font-size: 0.9rem; outline: none; }
.form-input:focus { border-color: #00dc82; }

.payment-options { display: flex; flex-direction: column; gap: 0.8rem; }
.payment-card { display: flex; align-items: center; background: #020420; border: 1px solid #334155; border-radius: 10px; padding: 0.8rem 1rem; cursor: pointer; transition: 0.2s; }
.payment-card.active { border-color: #00dc82; background: rgba(0, 220, 130, 0.05); }
.payment-card input { margin-right: 0.8rem; accent-color: #00dc82; }
.payment-info { display: flex; flex-direction: column; }
.provider-title { font-weight: 700; color: #fff; font-size: 0.85rem; }
.provider-sub { font-size: 0.7rem; color: #64748b; }

.error-banner { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; padding: 0.8rem; border-radius: 8px; font-size: 0.85rem; margin-bottom: 1rem; }
.btn-checkout-submit { background: linear-gradient(135deg, #00dc82, #38bdf8); color: #020420; border: none; padding: 1rem; border-radius: 10px; font-weight: 900; font-size: 0.95rem; cursor: pointer; width: 100%; transition: 0.2s; }
.btn-checkout-submit:hover:not(:disabled) { transform: scale(1.02); box-shadow: 0 0 25px rgba(0, 220, 130, 0.4); }
.btn-checkout-submit:disabled { opacity: 0.6; cursor: not-allowed; }
</style>