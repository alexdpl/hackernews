<!-- app/pages/shop/index.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'

useHead({
  title: 'DKP Developer API Gateway & Ads Marketplace v2.6',
  meta: [
    { name: 'description', content: 'Accedi alle API proprietarie ad alte prestazioni per Nuxt 4, Crawler, Jobs Feed e al network pubblicitario DKP Ads.' }
  ]
})

export interface ShopProduct {
  id: string
  title: string
  type: 'API_LICENSE' | 'ADS_SPONSOR'
  category: 'CRAWLER API' | 'JOBS FEED API' | 'MAIL & WEBHOOKS API' | 'NODES API' | 'SPONSORED JOB ADS' | 'NEWSLETTER ADS' | 'BANNER ADS'
  price: number
  billingCycle: 'MONTHLY' | 'ANNUAL' | 'PER_10K_CALLS' | 'ONE_TIME'
  rateLimit: string
  endpoint: string
  description: string
  isFeatured?: boolean
  isBeta?: boolean
}

// Catalogo Prodotti Pubblico (Sincronizzato con l'Ecosistema API & Ads)
const products = ref<ShopProduct[]>([
  {
    id: 'dkp-api-crawler-ent',
    title: 'DKP Crawler Engine API',
    type: 'API_LICENSE',
    category: 'CRAWLER API',
    price: 149.00,
    billingCycle: 'MONTHLY',
    rateLimit: '1.000.000 req/mo',
    endpoint: '/api/v2.6/crawler',
    description: 'Accesso completo REST & Nitro Stream per l\'ingestione automatizzata di notizie tech, HackerNews ed AI summarization.',
    isFeatured: true,
    isBeta: false
  },
  {
    id: 'dkp-api-jobs-pro',
    title: 'Tech Jobs Feed API Pro',
    type: 'API_LICENSE',
    category: 'JOBS FEED API',
    price: 79.00,
    billingCycle: 'MONTHLY',
    rateLimit: '250.000 req/mo',
    endpoint: '/api/v2.6/jobs/feed',
    description: 'Sincronizzazione in real-time delle offerte di lavoro tech verificate da RemoteOK con tag e range salariali.',
    isFeatured: false,
    isBeta: false
  },
  {
    id: 'dkp-api-mail-webhook',
    title: 'DKP Mail & Webhooks API',
    type: 'API_LICENSE',
    category: 'MAIL & WEBHOOKS API',
    price: 49.00,
    billingCycle: 'MONTHLY',
    rateLimit: '100.000 req/mo',
    endpoint: '/api/v2.6/mail/dispatch',
    description: 'Integrazione diretta con la pipeline email, gestione autoresponder sequenziali e verifica Deliverability DKIM/SPF.',
    isFeatured: false,
    isBeta: false
  },
  {
    id: 'dkp-ads-job-featured',
    title: 'Sponsored Job Listing (Featured)',
    type: 'ADS_SPONSOR',
    category: 'SPONSORED JOB ADS',
    price: 199.00,
    billingCycle: 'ONE_TIME',
    rateLimit: '30 Giorni Highlight',
    endpoint: '/api/v2.6/ads/jobs',
    description: 'Posizionamento in cima al Tech Jobs Hub + Badge Gold + Invio dedicato nel digest settimanale della Newsletter.',
    isFeatured: false,
    isBeta: true
  },
  {
    id: 'dkp-ads-newsletter-header',
    title: 'DKP Newsletter Header Ad',
    type: 'ADS_SPONSOR',
    category: 'NEWSLETTER ADS',
    price: 299.00,
    billingCycle: 'ONE_TIME',
    rateLimit: '1 Uscita Dedicated (~15k Devs)',
    endpoint: '/api/v2.6/ads/newsletter',
    description: 'Banner pubblicitario esclusivo posizionato in testa al bollettino settimanale inviato alla community tech DKP.',
    isFeatured: false,
    isBeta: true
  },
  {
    id: 'dkp-ads-nodes-banner',
    title: 'DKP Nodes Sidebar Banner Ad',
    type: 'ADS_SPONSOR',
    category: 'BANNER ADS',
    price: 129.00,
    billingCycle: 'MONTHLY',
    rateLimit: '50.000 Impression stimate',
    endpoint: '/api/v2.6/ads/nodes',
    description: 'Banner fisso nativo nella sidebar dei Nodi della community con tracciamento click a zero impatto sulle prestazioni.',
    isFeatured: false,
    isBeta: true
  }
])

// Filtri & Ricerca
const searchQuery = ref('')
const activeTypeFilter = ref<'ALL' | 'API_LICENSE' | 'ADS_SPONSOR'>('ALL')

const filteredProducts = computed(() => {
  return products.value.filter(p => {
    const matchesType = activeTypeFilter.value === 'ALL' || p.type === activeTypeFilter.value
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                          p.category.toLowerCase().includes(searchQuery.value.toLowerCase())
    return matchesType && matchesSearch
  })
})

// Stato Checkout Modal
const showModal = ref(false)
const selectedProduct = ref<ShopProduct | null>(null)
const customerEmail = ref('')
const paymentProvider = ref<'stripe' | 'paypal'>('stripe')
const isLoading = ref(false)
const errorMessage = ref('')

const openCheckoutModal = (product: ShopProduct) => {
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
      customerEmail: customerEmail.value,
      type: selectedProduct.value.type
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
      throw new Error('URL di reindirizzamento pagamento non generato dal server.')
    }
  } catch (err: any) {
    console.error('[CHECKOUT ERROR]:', err)
    errorMessage.value = err?.data?.statusMessage || err?.message || 'Errore durante la creazione del checkout.'
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#020420] text-slate-300 py-12 px-4 sm:px-6 font-sans">
    <div class="max-w-7xl mx-auto flex flex-col gap-10">
      
      <!-- HEADER HERO SHOP SAAS & ADS v2.6 -->
      <header class="text-center flex flex-col items-center gap-4 relative overflow-hidden py-8">
        <!-- Glows Decorativi di Sfondo -->
        <div class="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute top-10 right-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="flex items-center gap-2 font-mono">
          <span class="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/40 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-[0_0_12px_rgba(0,220,130,0.25)]">
            DKP v2.6-PURE-SQL ECOSYSTEM
          </span>
          <span class="bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
            📢 ADS &amp; SPONSOR BETA
          </span>
        </div>

        <h1 class="text-3xl sm:text-5xl font-black text-white tracking-tight">
          DKP Developer <span class="text-emerald-400">API &amp; Ads Marketplace</span>
        </h1>
        
        <p class="text-slate-400 text-sm sm:text-base max-w-2xl leading-relaxed">
          Accedi agli endpoint API ad alte prestazioni per Crawler, Jobs Feed e Webhooks, oppure promuovi il tuo brand con gli spot pubblicitari del network DKP Ads.
        </p>
      </header>

      <!-- BARRA FILTRI E RICERCA -->
      <section class="bg-[#080d1a] border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        <div class="relative flex-1">
          <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Cerca piano API, endpoint o tipologia di Ads..." 
            class="w-full bg-[#040814] border border-slate-800 pl-11 pr-4 py-3 rounded-xl text-slate-100 text-xs sm:text-sm outline-none focus:border-emerald-500 transition-all font-mono"
          />
        </div>

        <div class="flex items-center gap-2 font-mono text-xs flex-wrap">
          <button 
            @click="activeTypeFilter = 'ALL'" 
            :class="[
              'px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer border',
              activeTypeFilter === 'ALL' 
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/50 shadow-[0_0_10px_rgba(0,220,130,0.2)]' 
                : 'bg-[#040814] text-slate-400 border-slate-800 hover:border-slate-700'
            ]"
          >
            Tutti ({{ products.length }})
          </button>
          <button 
            @click="activeTypeFilter = 'API_LICENSE'" 
            :class="[
              'px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer border',
              activeTypeFilter === 'API_LICENSE' 
                ? 'bg-sky-500/15 text-sky-400 border-sky-500/50 shadow-[0_0_10px_rgba(56,189,248,0.2)]' 
                : 'bg-[#040814] text-slate-400 border-slate-800 hover:border-slate-700'
            ]"
          >
            🔑 Licenze API
          </button>
          <button 
            @click="activeTypeFilter = 'ADS_SPONSOR'" 
            :class="[
              'px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer border',
              activeTypeFilter === 'ADS_SPONSOR' 
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]' 
                : 'bg-[#040814] text-slate-400 border-slate-800 hover:border-slate-700'
            ]"
          >
            📢 Ads &amp; Sponsor (Beta)
          </button>
        </div>
      </section>

      <!-- GRIGLIA PRODOTTI -->
      <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <article 
          v-for="product in filteredProducts" 
          :key="product.id" 
          :class="[
            'bg-[#080d1a] border rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 group relative overflow-hidden backdrop-blur-md',
            product.isFeatured ? 'border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.15)]' :
            product.type === 'ADS_SPONSOR' ? 'border-amber-500/30 hover:border-amber-500/60' :
            'border-slate-800/80 hover:border-emerald-500/50'
          ]"
        >
          <!-- Badge Featured / Glow internal -->
          <div v-if="product.isFeatured" class="absolute -right-12 -top-12 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none"></div>

          <div class="flex flex-col gap-4">
            <div class="flex justify-between items-center font-mono">
              <div class="flex items-center gap-1.5">
                <span 
                  :class="[
                    'px-2.5 py-0.5 rounded text-[10px] font-black border uppercase',
                    product.type === 'API_LICENSE' ? 'bg-sky-500/15 text-sky-400 border-sky-500/30' : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  ]"
                >
                  {{ product.category }}
                </span>
                <span v-if="product.isBeta" class="px-2 py-0.5 rounded text-[9px] font-extrabold bg-amber-500 text-slate-950 uppercase">
                  BETA
                </span>
              </div>
              
              <div class="flex flex-col items-end">
                <span class="text-2xl font-black text-sky-400 font-mono">€{{ product.price.toFixed(2) }}</span>
                <span class="text-[10px] text-slate-500 uppercase font-bold font-mono">
                  {{ product.billingCycle === 'MONTHLY' ? '/mese' : product.billingCycle === 'ANNUAL' ? '/anno' : 'una tantum' }}
                </span>
              </div>
            </div>

            <h3 class="text-white font-bold text-lg group-hover:text-emerald-400 transition-colors">{{ product.title }}</h3>
            <p class="text-slate-400 text-xs leading-relaxed line-clamp-3">{{ product.description }}</p>

            <div class="bg-[#040814] border border-slate-800/80 rounded-xl p-3 font-mono text-[11px] flex flex-col gap-1.5">
              <div class="flex justify-between border-b border-slate-800 pb-1.5 text-slate-400">
                <span>⚡ Rate limit: <strong class="text-white font-bold">{{ product.rateLimit }}</strong></span>
                <span>🔑 Auth: <strong class="text-white font-bold">Bearer Token</strong></span>
              </div>
              <div class="text-slate-400 truncate pt-0.5">
                📁 Route base: <span class="text-emerald-400 font-bold">{{ product.endpoint }}</span>
              </div>
            </div>
          </div>

          <div class="mt-6 pt-4 border-t border-slate-800/60 font-mono">
            <button 
              @click="openCheckoutModal(product)" 
              :class="[
                'w-full py-3 px-4 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2',
                product.isFeatured 
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
                  : product.type === 'ADS_SPONSOR'
                  ? 'bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(0,220,130,0.25)]'
              ]"
            >
              <span v-if="product.type === 'API_LICENSE'">🚀 Attiva API Pass</span>
              <span v-else>📢 Prenota Spot Ads</span>
            </button>
          </div>
        </article>

        <div v-if="filteredProducts.length === 0" class="col-span-full p-12 text-center text-slate-500 font-mono text-xs">
          📭 Nessun pacchetto trovato corrispondente ai criteri di ricerca.
        </div>
      </section>

    </div>

    <!-- 💳 MODAL DI CHECKOUT API / ADS -->
    <Teleport to="body">
      <Transition name="fade">
        <div 
          v-if="showModal" 
          class="fixed inset-0 z-50 bg-[#020420]/80 backdrop-blur-md flex items-center justify-center p-4" 
          @click.self="closeModal"
        >
          <div class="bg-[#080d1a] border border-slate-800 rounded-2xl w-full max-w-lg p-6 sm:p-8 shadow-2xl flex flex-col gap-6 relative font-sans">
            <button @click="closeModal" class="absolute top-5 right-5 text-slate-500 hover:text-white font-bold text-xl cursor-pointer">✕</button>

            <div class="flex flex-col gap-2 border-b border-slate-800 pb-4">
              <span class="bg-sky-500/15 text-sky-400 border border-sky-500/30 px-2.5 py-0.5 rounded text-[10px] font-black uppercase font-mono w-fit">
                DKP SECURE GATEWAY
              </span>
              <h3 class="text-white font-black text-xl sm:text-2xl">{{ selectedProduct?.title }}</h3>
              <div class="text-2xl font-black text-emerald-400 font-mono flex items-baseline gap-2 mt-1">
                €{{ selectedProduct?.price.toFixed(2) }} 
                <span class="text-xs text-slate-500 font-normal">
                  ({{ selectedProduct?.billingCycle === 'MONTHLY' ? 'Fatturazione mensile' : selectedProduct?.billingCycle === 'ANNUAL' ? 'Fatturazione annuale' : 'Pagamento una tantum' }})
                </span>
              </div>
            </div>

            <form @submit.prevent="executeCheckout" class="flex flex-col gap-5 font-mono text-xs">
              <div class="flex flex-col gap-1.5">
                <label for="email" class="text-slate-400 font-bold uppercase">Email per ricezione API Token &amp; Credenziali *</label>
                <input 
                  id="email" 
                  v-model="customerEmail" 
                  type="email" 
                  placeholder="dev@tuodominio.com" 
                  required 
                  class="bg-[#040814] border border-slate-800 text-white px-4 py-3 rounded-xl font-bold outline-none focus:border-emerald-500 transition-all text-sm"
                />
              </div>

              <div class="flex flex-col gap-2">
                <label class="text-slate-400 font-bold uppercase">Seleziona Gateway di Pagamento *</label>
                <div class="flex flex-col gap-2.5">
                  <label 
                    :class="[
                      'flex items-center gap-3 bg-[#040814] border rounded-xl p-3.5 cursor-pointer transition-all',
                      paymentProvider === 'stripe' ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-800 hover:border-slate-700'
                    ]"
                  >
                    <input type="radio" v-model="paymentProvider" value="stripe" name="provider" class="w-4 h-4 accent-emerald-500 cursor-pointer" />
                    <div class="flex flex-col">
                      <span class="text-white font-bold text-sm">💳 Carta di Credito / Google Pay</span>
                      <span class="text-[11px] text-slate-500">Stripe Secure Checkout</span>
                    </div>
                  </label>

                  <label 
                    :class="[
                      'flex items-center gap-3 bg-[#040814] border rounded-xl p-3.5 cursor-pointer transition-all',
                      paymentProvider === 'paypal' ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-800 hover:border-slate-700'
                    ]"
                  >
                    <input type="radio" v-model="paymentProvider" value="paypal" name="provider" class="w-4 h-4 accent-emerald-500 cursor-pointer" />
                    <div class="flex flex-col">
                      <span class="text-white font-bold text-sm">🅿️ PayPal</span>
                      <span class="text-[11px] text-slate-500">Pagamento / Abbonamento PayPal</span>
                    </div>
                  </label>
                </div>
              </div>

              <div v-if="errorMessage" class="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-xl text-xs">
                ⚠️ {{ errorMessage }}
              </div>

              <button 
                type="submit" 
                :disabled="isLoading" 
                class="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 text-slate-950 font-black rounded-xl text-sm transition-all shadow-[0_0_20px_rgba(0,220,130,0.3)] cursor-pointer disabled:opacity-50 mt-2"
              >
                <span v-if="!isLoading">⚡ Genera Sub &amp; API Key</span>
                <span v-else>⌛ Connessione al Gateway...</span>
              </button>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>