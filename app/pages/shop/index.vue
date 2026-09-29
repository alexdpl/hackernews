<!-- app/pages/shop/index.vue -->
<template>
  <div class="shop-container">
    <!-- Header dello Shop -->
    <div class="shop-header">
      <span class="badge-gold">DKP v2.4-GOLD</span>
      <h1 class="shop-title">DKP SaaS <span class="highlight">Plugin Store</span></h1>
      <p class="shop-subtitle">Acquista licenze lifetime ed abbonamenti API con aggiornamenti nativi per Nuxt 3 e Nitro.</p>
    </div>

    <!-- Griglia Prodotti -->
    <div class="products-grid">
      <article v-for="product in products" :key="product.id" class="product-card" :class="{ 'featured-card': product.isFeatured }">
        <div class="card-header">
          <span :class="['category-badge', product.categoryClass]">{{ product.category }}</span>
          <span class="price">€{{ product.price.toFixed(2) }}<span v-if="product.recurring" class="recurring-text">/mo</span></span>
        </div>
        
        <h3 class="product-title">{{ product.title }}</h3>
        <p class="product-desc">{{ product.description }}</p>

        <div class="file-meta">
          <div class="meta-row">
            <span>📦 versione: <strong class="text-white">{{ product.version }}</strong></span>
            <span>📥 attivi/down: <strong class="text-white">{{ product.downloads }}</strong></span>
          </div>
          <div class="file-path">
            📁 {{ product.isApi ? 'endpoint' : 'file' }}: <span class="path-text">{{ product.filePath }}</span>
          </div>
        </div>

        <button @click="openCheckoutModal(product)" class="btn-buy" :class="{ 'btn-gold': product.isFeatured }">
          💳 {{ product.isApi ? 'Sblocca Licenza API' : 'Acquista Licenza' }}
        </button>
      </article>
    </div>

    <!-- 💳 MODAL DI CHECKOUT IBRIDO (Stripe / Google Pay / PayPal) -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-card">
          <button class="modal-close" @click="closeModal">✕</button>
          
          <div class="modal-header">
            <span class="modal-badge">CHECKOUT SICURO DKP</span>
            <h3>{{ selectedProduct?.title }}</h3>
            <div class="modal-price">
              €{{ selectedProduct?.price.toFixed(2) }} 
              <span class="tax-info">(IVA incl. - {{ selectedProduct?.recurring ? 'Abbonamento Mese' : 'Licenza Lifetime' }})</span>
            </div>
          </div>

          <form @submit.prevent="executeCheckout" class="modal-form">
            <!-- Email Cliente -->
            <div class="form-group">
              <label for="email">La tua Email (per la consegna della License Key / API Token):</label>
              <input 
                id="email" 
                v-model="customerEmail" 
                type="email" 
                placeholder="dev@azienda.com" 
                required 
                class="form-input"
              />
            </div>

            <!-- Selezione Metodo di Pagamento -->
            <div class="form-group">
              <label>Scegli il metodo di pagamento:</label>
              <div class="payment-options">
                <label :class="['payment-card', { active: paymentProvider === 'stripe' }]">
                  <input type="radio" v-model="paymentProvider" value="stripe" name="provider" />
                  <div class="payment-info">
                    <span class="provider-title">💳 Carta di Credito / Google Pay</span>
                    <span class="provider-sub">Elaborazione ultra-veloce via Stripe</span>
                  </div>
                </label>

                <label :class="['payment-card', { active: paymentProvider === 'paypal' }]">
                  <input type="radio" v-model="paymentProvider" value="paypal" name="provider" />
                  <div class="payment-info">
                    <span class="provider-title">🅿️ PayPal</span>
                    <span class="provider-sub">Conto PayPal o carte con protezione acquisti</span>
                  </div>
                </label>
              </div>
            </div>

            <!-- Messaggio di Errore -->
            <div v-if="errorMessage" class="error-banner">
              ⚠️ {{ errorMessage }}
            </div>

            <!-- Pulsante di Invio -->
            <button type="submit" class="btn-checkout-submit" :disabled="isLoading">
              <span v-if="!isLoading">🚀 Procedi al Pagamento Safe</span>
              <span v-else>⌛ Reindirizzamento in corso...</span>
            </button>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const showModal = ref(false)
const selectedProduct = ref<any>(null)
const customerEmail = ref('')
const paymentProvider = ref<'stripe' | 'paypal'>('stripe')
const isLoading = ref(false)
const errorMessage = ref('')

const products = ref([
  // ⚡ NUOVA LICENZA API PRO
  {
    id: 'dkp-api-pro-gold',
    title: 'DKP API Kernel 2.4-Gold (Pro Pass)',
    category: 'API LICENSE',
    categoryClass: 'badge-api',
    price: 29.00,
    recurring: true,
    isApi: true,
    isFeatured: true,
    description: 'Sblocca il backend DKP con 100.000 req/mese, AI Code Scanner v2.3 illimitato e priorità Vault SHA-256.',
    version: 'v2.4-GOLD',
    downloads: 312,
    filePath: '/api/v2.4/kernel-pro-bearer'
  },
  // ⚡ NUOVA LICENZA API ENTERPRISE
  {
    id: 'dkp-api-enterprise-gold',
    title: 'DKP Kernel Enterprise Cluster API',
    category: 'ENTERPRISE API',
    categoryClass: 'badge-flagship',
    price: 99.00,
    recurring: true,
    isApi: true,
    isFeatured: false,
    description: 'Infrastruttura riservata GCP per team enterprise con req illimitate, SLA 99.99% e Webhook personalizzati.',
    version: 'v2.4-GOLD',
    downloads: 48,
    filePath: '/api/v2.4/enterprise-cluster'
  },
  // PRODOTTI SAAS E PLUGIN ESISTENTI
  {
    id: 'dkp-automated-crawler-pro',
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
    id: 'dkp-translator-pro',
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
    id: 'dkp-ecosystem-shop',
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
    id: 'dkp-kernel-captcha',
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
    id: 'dkp-native-blog-pro',
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
    id: 'dkp-neural-playground',
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
    id: 'dkp-pulse-nexus-pro',
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

const openCheckoutModal = (product: any) => {
  selectedProduct.value = product
  errorMessage.value = ''
  showModal.value = true
}

const closeModal = () => {
  if (isLoading.value) return
  showModal.value = false
  selectedProduct.value = null
}

/**
 * Esegue la chiamata al Gateway selezionato (Stripe o PayPal)
 */
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

    if (paymentProvider.value === 'stripe') {
      const res: any = await $fetch('/api/checkout/stripe', {
        method: 'POST',
        body: payload
      })

      if (res?.checkoutUrl) {
        window.location.href = res.checkoutUrl
      } else {
        throw new Error('URL Stripe Checkout non generato')
      }
    } else {
      const res: any = await $fetch('/api/checkout/paypal', {
        method: 'POST',
        body: payload
      })

      if (res?.approveUrl) {
        window.location.href = res.approveUrl
      } else {
        throw new Error('URL di approvazione PayPal non generato')
      }
    }
  } catch (err: any) {
    console.error('[CHECKOUT ERROR]:', err)
    errorMessage.value = err?.data?.statusMessage || err?.message || 'Errore durante la creazione del checkout.'
    isLoading.value = false
  }
}
</script>

<style scoped>
.shop-container { max-width: 1200px; margin: 2rem auto; padding: 0 1rem; color: #f8fafc; font-family: system-ui, sans-serif; }
.shop-header { text-align: center; margin-bottom: 3rem; }
.badge-gold { background: rgba(234, 179, 8, 0.1); border: 1px solid rgba(234, 179, 8, 0.3); color: #eab308; padding: 0.3rem 0.8rem; border-radius: 20px; font-weight: 800; font-size: 0.8rem; }
.shop-title { font-size: 2.8rem; font-weight: 900; margin: 0.8rem 0 0.4rem 0; }
.highlight { color: #00dc82; }
.shop-subtitle { color: #94a3b8; font-size: 1.1rem; }

/* Product Cards */
.products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 1.5rem; }
.product-card { background: rgba(9, 13, 22, 0.85); border: 1px solid #1e293b; border-radius: 16px; padding: 1.5rem; display: flex; flex-direction: column; backdrop-filter: blur(10px); transition: all 0.25s ease; }
.product-card:hover { border-color: #00dc82; box-shadow: 0 10px 30px rgba(0,220,130,0.15); }

/* Highlight per Licenza API Gold */
.product-card.featured-card { border-color: #eab308; box-shadow: 0 0 20px rgba(234, 179, 8, 0.15); }

.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.category-badge { font-size: 0.7rem; font-weight: 800; padding: 0.2rem 0.6rem; border-radius: 4px; }
.badge-saas { background: rgba(0, 220, 130, 0.1); color: #00dc82; border: 1px solid rgba(0, 220, 130, 0.3); }
.badge-core { background: rgba(56, 189, 248, 0.1); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); }
.badge-cms { background: rgba(167, 139, 250, 0.1); color: #a78bfa; border: 1px solid rgba(167, 139, 250, 0.3); }
.badge-ai { background: rgba(244, 114, 182, 0.1); color: #f472b6; border: 1px solid rgba(244, 114, 182, 0.3); }
.badge-flagship { background: linear-gradient(90deg, rgba(167,139,250,0.1), rgba(244,114,182,0.1)); color: #d8b4fe; border: 1px solid rgba(216, 180, 254, 0.4); }

/* Badge Speciale per API Pass */
.badge-api { background: rgba(234, 179, 8, 0.15); color: #facc15; border: 1px solid rgba(234, 179, 8, 0.4); }

.price { font-size: 1.6rem; font-weight: 900; color: #38bdf8; }
.recurring-text { font-size: 0.8rem; color: #94a3b8; font-weight: 500; }

.product-title { font-size: 1.25rem; font-weight: 800; margin: 0 0 0.5rem 0; color: #fff; }
.product-desc { font-size: 0.9rem; color: #94a3b8; line-height: 1.5; margin-bottom: 1.5rem; flex-grow: 1; }

.file-meta { background: #060a12; border: 1px solid #1e293b; border-radius: 8px; padding: 0.8rem 1rem; margin-bottom: 1.2rem; font-size: 0.8rem; color: #64748b; }
.meta-row { display: flex; justify-content: space-between; margin-bottom: 0.4rem; border-bottom: 1px solid #1e293b; padding-bottom: 0.4rem; }
.text-white { color: #f8fafc; }
.path-text { color: #00dc82; font-family: monospace; }

.btn-buy { background: #00dc82; color: #020420; border: none; padding: 0.85rem; border-radius: 8px; font-weight: 800; font-size: 0.95rem; cursor: pointer; transition: 0.2s; width: 100%; }
.btn-buy:hover { transform: translateY(-2px); box-shadow: 0 0 20px rgba(0, 220, 130, 0.3); }

.btn-gold { background: #eab308; color: #020420; }
.btn-gold:hover { box-shadow: 0 0 20px rgba(234, 179, 8, 0.4); }

/* Modal Styling */
.modal-overlay { position: fixed; inset: 0; background: rgba(2, 4, 32, 0.85); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 1rem; }
.modal-card { background: #090d16; border: 1px solid #334155; border-radius: 20px; width: 100%; max-width: 520px; padding: 2rem; position: relative; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7); }
.modal-close { position: absolute; top: 1.2rem; right: 1.2rem; background: transparent; border: none; color: #64748b; font-size: 1.2rem; cursor: pointer; }
.modal-close:hover { color: #fff; }

.modal-badge { font-size: 0.65rem; font-weight: 900; background: rgba(56, 189, 248, 0.1); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); padding: 0.2rem 0.5rem; border-radius: 4px; letter-spacing: 1px; }
.modal-header h3 { font-size: 1.4rem; margin: 0.5rem 0; color: #fff; }
.modal-price { font-size: 1.8rem; font-weight: 900; color: #00dc82; margin-bottom: 1.5rem; }
.tax-info { font-size: 0.8rem; color: #64748b; font-weight: 400; }

.form-group { margin-bottom: 1.2rem; text-align: left; }
.form-group label { display: block; font-size: 0.85rem; color: #cbd5e1; font-weight: 600; margin-bottom: 0.5rem; }
.form-input { width: 100%; background: #020420; border: 1px solid #334155; border-radius: 8px; padding: 0.8rem 1rem; color: #fff; font-size: 0.95rem; outline: none; }
.form-input:focus { border-color: #00dc82; }

.payment-options { display: flex; flex-direction: column; gap: 0.8rem; }
.payment-card { display: flex; align-items: center; background: #020420; border: 1px solid #334155; border-radius: 10px; padding: 0.8rem 1rem; cursor: pointer; transition: 0.2s; }
.payment-card.active { border-color: #00dc82; background: rgba(0, 220, 130, 0.05); }
.payment-card input { margin-right: 0.8rem; accent-color: #00dc82; }
.payment-info { display: flex; flex-direction: column; }
.provider-title { font-weight: 700; color: #fff; font-size: 0.9rem; }
.provider-sub { font-size: 0.75rem; color: #64748b; }

.error-banner { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; padding: 0.8rem; border-radius: 8px; font-size: 0.85rem; margin-bottom: 1rem; }
.btn-checkout-submit { background: linear-gradient(135deg, #00dc82, #38bdf8); color: #020420; border: none; padding: 1rem; border-radius: 10px; font-weight: 900; font-size: 1rem; cursor: pointer; width: 100%; transition: 0.2s; }
.btn-checkout-submit:hover:not(:disabled) { transform: scale(1.02); box-shadow: 0 0 25px rgba(0, 220, 130, 0.4); }
.btn-checkout-submit:disabled { opacity: 0.6; cursor: not-allowed; }
</style>