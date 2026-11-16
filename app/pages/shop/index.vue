<!-- app/pages/shop/index.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import DkpAdsWidget from '~/components/DkpAdsWidget.vue'

useHead({
  title: 'DKP Marketplace v2.6-PURE-SQL • API Gateway, DKP ADS & Dev Library',
  meta: [
    {
      name: 'description',
      content:
        'Licenze API ad alte prestazioni (Sentinel SAST, Blockchain Vault, Crawler), spazi pubblicitari self-serve DKP ADS e libreria tecnica selezionata.'
    }
  ]
})

type ProductType = 'API_LICENSE' | 'ADS_SPONSOR' | 'AFFILIATE_BOOK'

interface ShopProduct {
  id: string
  dbCampaignId?: string | number
  title: string
  type: ProductType
  category: string
  price?: number
  billingCycle?: 'MONTHLY' | 'ANNUAL' | 'ONE_TIME'
  rateLimit: string
  endpoint: string
  description: string
  affiliateUrl?: string
  provider?: string
  defaultPlacement?: 'nodeTalks' | 'blogSidebar' | 'feedInline' | 'global'
  defaultTier?: 'STARTER' | 'PRO_NODE' | 'ECOSYSTEM_TAKEOVER'
  isFeatured?: boolean
  isBeta?: boolean
}

// 1. Catalogo Nativo: Licenze API v2.6 + Pacchetti Circuito DKP ADS
const coreProducts: ShopProduct[] = [
  {
    id: 'dkp-api-sentinel-trinity',
    title: 'DKP AI Trinity & Sentinel SAST API',
    type: 'API_LICENSE',
    category: 'AI & SECURITY API',
    price: 99.0,
    billingCycle: 'MONTHLY',
    rateLimit: '500.000 req/mo',
    endpoint: '/api/ai/sentinel • /api/ai/chat',
    description:
      'Accesso diretto a Pulse Sentinel SAST con OpenRouter Structured Outputs (strict: true) e streaming multi-modello DKP-Coder / DKP-Pro.',
    isFeatured: true,
    isBeta: false
  },
  {
    id: 'dkp-api-vault-notary',
    title: 'DKP Blockchain Vault© Enterprise API',
    type: 'API_LICENSE',
    category: 'ON-CHAIN LEDGER API',
    price: 79.0,
    billingCycle: 'MONTHLY',
    rateLimit: '250.000 req/mo',
    endpoint: '/api/vault/notarize • /api/vault/verify',
    description:
      'Notarizzazione SHA-256 concatenata su ledger Pure-SQL con generazione automatica di Merkle Root e certificati verificabili via SDK.',
    isFeatured: false,
    isBeta: false
  },
  {
    id: 'dkp-api-crawler-ent',
    title: 'DKP Crawler & Tech Jobs Feed API',
    type: 'API_LICENSE',
    category: 'CRAWLER & DATA API',
    price: 129.0,
    billingCycle: 'MONTHLY',
    rateLimit: '1.000.000 req/mo',
    endpoint: '/api/v2.6/crawler • /api/v2.6/jobs',
    description:
      'Ingestione automatizzata di feed tech, AI summarization e sincronizzazione in real-time delle offerte di lavoro developer verificate.',
    isFeatured: false,
    isBeta: false
  },
  {
    id: 'dkp-ads-starter',
    title: 'DKP ADS • Starter Node Spot',
    type: 'ADS_SPONSOR',
    category: 'DKP ADS STARTER',
    price: 49.0,
    billingCycle: 'ONE_TIME',
    rateLimit: '10.000 Impression (14 gg)',
    endpoint: '/api/ads/serve?placement=nodeTalks',
    description:
      'Card nativa nel circuito DKP ADS all interno dei DKP Nodes e dei thread tecnici con telemetria impression/click in tempo reale.',
    defaultPlacement: 'nodeTalks',
    defaultTier: 'STARTER',
    isFeatured: false,
    isBeta: false
  },
  {
    id: 'dkp-ads-pro-node',
    title: 'DKP ADS • Pro Node & Blog Campaign',
    type: 'ADS_SPONSOR',
    category: 'DKP ADS PRO NODE',
    price: 149.0,
    billingCycle: 'ONE_TIME',
    rateLimit: '50.000 Impression (30 gg)',
    endpoint: '/api/ads/serve?placement=blogSidebar',
    description:
      'Alta visibilità prioritaria nei DKP Nodes, nelle discussioni attive e negli articoli tecnici del blog con rotazione garantita.',
    defaultPlacement: 'blogSidebar',
    defaultTier: 'PRO_NODE',
    isFeatured: true,
    isBeta: false
  },
  {
    id: 'dkp-ads-takeover',
    title: 'DKP ADS • Ecosystem Takeover',
    type: 'ADS_SPONSOR',
    category: 'ECOSYSTEM TAKEOVER',
    price: 399.0,
    billingCycle: 'ONE_TIME',
    rateLimit: '200.000 Impression + Digest',
    endpoint: '/api/ads/serve?placement=global',
    description:
      'Massima priorità su tutto il network DevKernelPulse (Nodes, Blog, Docs, Feed) + menzione dedicata nel bollettino settimanale.',
    defaultPlacement: 'global',
    defaultTier: 'ECOSYSTEM_TAKEOVER',
    isFeatured: false,
    isBeta: false
  }
]

// 2. Fallback Libri Tecnici (usati solo se /api/ads/active non restituisce record)
const fallbackAffiliateBooks: ShopProduct[] = [
  {
    id: 'book-ddia',
    title: 'Designing Data-Intensive Applications',
    type: 'AFFILIATE_BOOK',
    category: 'AMAZON DEV LIBRARY',
    rateLimit: 'Sistemi Distribuiti & DB',
    endpoint: 'Amazon Partner • Verified Pick',
    description:
      'Il riferimento assoluto per progettare database scalabili, replicazione, partizionamento e architetture resilienti.',
    affiliateUrl: 'https://www.amazon.it/s?k=Designing+Data-Intensive+Applications',
    provider: 'Amazon Partner'
  },
  {
    id: 'book-ddd-clean',
    title: 'Domain-Driven Design & Clean Architecture',
    type: 'AFFILIATE_BOOK',
    category: 'AMAZON DEV LIBRARY',
    rateLimit: 'Software Architecture',
    endpoint: 'Amazon Partner • Verified Pick',
    description:
      'Pattern strategici e tattici per dominare la complessità del software enterprise e mantenere il dominio disaccoppiato.',
    affiliateUrl: 'https://www.amazon.it/s?k=Domain-Driven+Design+Eric+Evans',
    provider: 'Amazon Partner'
  },
  {
    id: 'book-ai-engineering',
    title: 'AI Engineering: Building Applications with Foundation Models',
    type: 'AFFILIATE_BOOK',
    category: 'AMAZON DEV LIBRARY',
    rateLimit: 'AI, LLM & Production',
    endpoint: 'Amazon Partner • Verified Pick',
    description:
      'Dalla progettazione di prompt e Structured Outputs fino alla valutazione, sicurezza e deploy di agenti AI in produzione.',
    affiliateUrl: 'https://www.amazon.it/s?k=AI+Engineering+Chip+Huyen',
    provider: 'Amazon Partner'
  }
]

// 3. Caricamento dinamico dei tuoi link affiliati Amazon da /api/ads/active
const { data: affiliateRes } = await useFetch<any>('/api/ads/active', {
  key: 'shop-affiliate-books',
  server: false,
  lazy: true
})

const affiliateProducts = computed<ShopProduct[]>(() => {
  const rows = affiliateRes.value?.ads
  if (!Array.isArray(rows) || rows.length === 0) {
    return fallbackAffiliateBooks
  }

  return rows.map((ad: any, idx: number): ShopProduct => {
    const rawUrl = String(ad.url || ad.targetUrl || '').trim()
    const isAmazon = /amazon\.|amzn\./i.test(rawUrl)
    return {
      id: `aff-${ad.id ?? idx}`,
      dbCampaignId: ad.id,
      title: String(ad.title || 'Risorsa Tecnica Consigliata'),
      type: 'AFFILIATE_BOOK',
      category: isAmazon ? 'AMAZON DEV LIBRARY' : String(ad.tag || 'PARTNER PICK'),
      rateLimit: isAmazon ? 'Libro Consigliato' : 'Risorsa Selezionata',
      endpoint: isAmazon ? 'Amazon Partner • Affiliate' : 'DKP Verified Partner',
      description: String(ad.snippet || 'Testo tecnico selezionato dal team DevKernelPulse.'),
      affiliateUrl: rawUrl.startsWith('http') ? rawUrl : 'https://www.amazon.it',
      provider: isAmazon ? 'Amazon Partner' : String(ad.provider || 'DKP Partner')
    }
  })
})

const allProducts = computed<ShopProduct[]>(() => [
  ...coreProducts,
  ...affiliateProducts.value
])

// Filtri & Ricerca
const searchQuery = ref('')
const activeTypeFilter = ref<'ALL' | ProductType>('ALL')

const counts = computed(() => ({
  ALL: allProducts.value.length,
  API_LICENSE: coreProducts.filter((p) => p.type === 'API_LICENSE').length,
  ADS_SPONSOR: coreProducts.filter((p) => p.type === 'ADS_SPONSOR').length,
  AFFILIATE_BOOK: affiliateProducts.value.length
}))

const filteredProducts = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  return allProducts.value.filter((p) => {
    const matchesType = activeTypeFilter.value === 'ALL' || p.type === activeTypeFilter.value
    if (!matchesType) return false
    if (!q) return true

    return (
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.endpoint.toLowerCase().includes(q)
    )
  })
})

// Apertura Libro Affiliato Amazon + Tracking Click su /api/ads/track
function openAffiliateProduct(product: ShopProduct) {
  if (product.dbCampaignId && !String(product.dbCampaignId).startsWith('fallback-')) {
    const payload = JSON.stringify({
      campaignId: product.dbCampaignId,
      actionType: 'click'
    })
    if (import.meta.client && navigator.sendBeacon) {
      navigator.sendBeacon('/api/ads/track', new Blob([payload], { type: 'application/json' }))
    } else {
      $fetch('/api/ads/track', {
        method: 'POST',
        body: { campaignId: product.dbCampaignId, actionType: 'click' }
      }).catch(() => null)
    }
  }

  if (import.meta.client && product.affiliateUrl) {
    window.open(product.affiliateUrl, '_blank', 'noopener,noreferrer')
  }
}

// Stato Checkout Modal (API Licenses + DKP ADS Campaigns)
const showModal = ref(false)
const selectedProduct = ref<ShopProduct | null>(null)
const customerEmail = ref('')
const paymentProvider = ref<'stripe' | 'paypal'>('stripe')
const isLoading = ref(false)
const errorMessage = ref('')

// Campi creativi campagna (attivi quando si acquista un pacchetto ADS_SPONSOR)
const adCampaignForm = ref({
  adTitle: '',
  adTagline: '',
  adTargetUrl: '',
  adPlacement: 'nodeTalks' as 'nodeTalks' | 'blogSidebar' | 'feedInline' | 'global'
})

const openCheckoutModal = (product: ShopProduct) => {
  if (product.type === 'AFFILIATE_BOOK') {
    return openAffiliateProduct(product)
  }

  selectedProduct.value = product
  errorMessage.value = ''
  adCampaignForm.value = {
    adTitle: '',
    adTagline: '',
    adTargetUrl: '',
    adPlacement: product.defaultPlacement || 'nodeTalks'
  }
  showModal.value = true
}

const closeModal = () => {
  if (isLoading.value) return
  showModal.value = false
  selectedProduct.value = null
}

const executeCheckout = async () => {
  if (!customerEmail.value || !selectedProduct.value) return

  if (selectedProduct.value.type === 'ADS_SPONSOR') {
    if (!adCampaignForm.value.adTitle.trim() || !adCampaignForm.value.adTargetUrl.trim()) {
      errorMessage.value = 'Inserisci il Titolo e l URL HTTPS della tua campagna sponsor.'
      return
    }
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const payload: Record<string, any> = {
      productId: selectedProduct.value.id,
      productName: selectedProduct.value.title,
      amount: selectedProduct.value.price,
      customerEmail: customerEmail.value,
      type: selectedProduct.value.type
    }

    if (selectedProduct.value.type === 'ADS_SPONSOR') {
      payload.adCampaign = {
        title: adCampaignForm.value.adTitle.trim(),
        tagline: adCampaignForm.value.adTagline.trim() || selectedProduct.value.description,
        targetUrl: adCampaignForm.value.adTargetUrl.trim(),
        placement: adCampaignForm.value.adPlacement,
        tier: selectedProduct.value.defaultTier || 'PRO_NODE'
      }
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
      <!-- HEADER HERO MARKETPLACE v2.6 -->
      <header class="text-center flex flex-col items-center gap-4 relative overflow-hidden py-6">
        <div class="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute top-10 right-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="flex flex-wrap items-center justify-center gap-2 font-mono">
          <span class="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/40 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-[0_0_12px_rgba(0,220,130,0.25)]">
            DKP v2.6-PURE-SQL STORE
          </span>
          <span class="bg-sky-500/15 text-sky-400 border border-sky-500/30 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
            SDK v1.0.0 STABLE
          </span>
          <span class="bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
            ADS &amp; DEV LIBRARY
          </span>
        </div>

        <h1 class="text-3xl sm:text-5xl font-black text-white tracking-tight font-sans m-0">
          DKP Developer <span class="text-emerald-400">API, Ads &amp; Library</span>
        </h1>

        <p class="text-slate-400 text-sm sm:text-base max-w-2xl leading-relaxed font-sans m-0">
          Sblocca gli endpoint API ad alte prestazioni per Sentinel SAST e Blockchain Vault©, attiva campagne self-serve sul circuito DKP ADS oppure esplora la nostra selezione di libri tecnici.
        </p>
      </header>

      <!-- BARRA FILTRI E RICERCA -->
      <section class="bg-[#090d16] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
        <div class="relative flex-1">
          <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cerca API Pass, pacchetto DKP ADS o libro tecnico..."
            class="w-full bg-[#020420] border border-slate-800 pl-11 pr-4 py-3 rounded-xl text-slate-100 text-xs sm:text-sm outline-none focus:border-emerald-500 transition-all font-mono"
          />
        </div>

        <div class="flex items-center gap-2 font-mono text-xs flex-wrap">
          <button
            @click="activeTypeFilter = 'ALL'"
            :class="[
              'px-3.5 py-2.5 rounded-xl font-bold transition-all cursor-pointer border',
              activeTypeFilter === 'ALL'
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/50 shadow-[0_0_10px_rgba(0,220,130,0.2)]'
                : 'bg-[#020420] text-slate-400 border-slate-800 hover:border-slate-700'
            ]"
          >
            Tutti ({{ counts.ALL }})
          </button>

          <button
            @click="activeTypeFilter = 'API_LICENSE'"
            :class="[
              'px-3.5 py-2.5 rounded-xl font-bold transition-all cursor-pointer border',
              activeTypeFilter === 'API_LICENSE'
                ? 'bg-sky-500/15 text-sky-400 border-sky-500/50 shadow-[0_0_10px_rgba(56,189,248,0.2)]'
                : 'bg-[#020420] text-slate-400 border-slate-800 hover:border-slate-700'
            ]"
          >
            🔑 Licenze API ({{ counts.API_LICENSE }})
          </button>

          <button
            @click="activeTypeFilter = 'ADS_SPONSOR'"
            :class="[
              'px-3.5 py-2.5 rounded-xl font-bold transition-all cursor-pointer border',
              activeTypeFilter === 'ADS_SPONSOR'
                ? 'bg-purple-500/15 text-purple-300 border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                : 'bg-[#020420] text-slate-400 border-slate-800 hover:border-slate-700'
            ]"
          >
            📢 Circuito DKP ADS ({{ counts.ADS_SPONSOR }})
          </button>

          <button
            @click="activeTypeFilter = 'AFFILIATE_BOOK'"
            :class="[
              'px-3.5 py-2.5 rounded-xl font-bold transition-all cursor-pointer border',
              activeTypeFilter === 'AFFILIATE_BOOK'
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                : 'bg-[#020420] text-slate-400 border-slate-800 hover:border-slate-700'
            ]"
          >
            📚 Dev Library ({{ counts.AFFILIATE_BOOK }})
          </button>
        </div>
      </section>

      <!-- GRIGLIA UNIFICATA PRODOTTI / ADS / LIBRI -->
      <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <article
          v-for="product in filteredProducts"
          :key="product.id"
          :class="[
            'bg-[#090d16] border rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 group relative overflow-hidden backdrop-blur-md',
            product.isFeatured
              ? 'border-emerald-500/60 shadow-[0_0_20px_rgba(0,220,130,0.12)]'
              : product.type === 'ADS_SPONSOR'
                ? 'border-purple-500/30 hover:border-purple-400/60'
                : product.type === 'AFFILIATE_BOOK'
                  ? 'border-amber-500/30 hover:border-amber-400/60'
                  : 'border-slate-800 hover:border-sky-500/50'
          ]"
        >
          <div
            v-if="product.isFeatured"
            class="absolute -right-12 -top-12 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"
          ></div>

          <div class="flex flex-col gap-4">
            <!-- TOP BADGE & PRICE -->
            <div class="flex justify-between items-start gap-2 font-mono">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span
                  :class="[
                    'px-2.5 py-0.5 rounded text-[10px] font-black border uppercase',
                    product.type === 'API_LICENSE'
                      ? 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                      : product.type === 'ADS_SPONSOR'
                        ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                        : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  ]"
                >
                  {{ product.category }}
                </span>

                <span
                  v-if="product.isFeatured"
                  class="px-2 py-0.5 rounded text-[9px] font-extrabold bg-emerald-500 text-slate-950 uppercase"
                >
                  TOP PICK
                </span>
              </div>

              <!-- Prezzo per API/ADS oppure Badge Partner per Libri Amazon -->
              <div v-if="product.price !== undefined" class="flex flex-col items-end shrink-0">
                <span class="text-2xl font-black text-white font-mono">€{{ product.price.toFixed(2) }}</span>
                <span class="text-[10px] text-slate-500 uppercase font-bold font-mono">
                  {{
                    product.billingCycle === 'MONTHLY'
                      ? '/mese'
                      : product.billingCycle === 'ANNUAL'
                        ? '/anno'
                        : 'una tantum'
                  }}
                </span>
              </div>

              <div v-else class="flex flex-col items-end shrink-0">
                <span class="text-xs font-black text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg">
                  AMAZON ↗
                </span>
              </div>
            </div>

            <!-- TITOLO & DESCRIZIONE -->
            <h3 class="text-white font-bold text-lg group-hover:text-emerald-400 transition-colors font-sans m-0">
              {{ product.title }}
            </h3>
            <p class="text-slate-400 text-xs leading-relaxed line-clamp-3 font-sans m-0">
              {{ product.description }}
            </p>

            <!-- METADATI TECNICI -->
            <div class="bg-[#020420] border border-slate-800 rounded-xl p-3 font-mono text-[11px] flex flex-col gap-1.5">
              <div class="flex justify-between border-b border-slate-800 pb-1.5 text-slate-400">
                <span>
                  ⚡ {{ product.type === 'AFFILIATE_BOOK' ? 'Topic' : 'Quota' }}:
                  <strong class="text-white font-bold">{{ product.rateLimit }}</strong>
                </span>
                <span>
                  {{ product.type === 'AFFILIATE_BOOK' ? '📚 Store' : '🔑 Auth' }}:
                  <strong class="text-white font-bold">
                    {{ product.type === 'AFFILIATE_BOOK' ? 'Affiliato' : 'Bearer' }}
                  </strong>
                </span>
              </div>
              <div class="text-slate-400 truncate pt-0.5">
                📁 {{ product.type === 'AFFILIATE_BOOK' ? 'Canale' : 'Endpoint' }}:
                <span
                  :class="[
                    'font-bold',
                    product.type === 'AFFILIATE_BOOK' ? 'text-amber-400' : 'text-emerald-400'
                  ]"
                >
                  {{ product.endpoint }}
                </span>
              </div>
            </div>
          </div>

          <!-- CTA BUTTON -->
          <div class="mt-6 pt-4 border-t border-slate-800 font-mono">
            <button
              @click="openCheckoutModal(product)"
              :class="[
                'w-full py-3 px-4 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2 border-none',
                product.type === 'API_LICENSE'
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(0,220,130,0.25)]'
                  : product.type === 'ADS_SPONSOR'
                    ? 'bg-purple-500 hover:bg-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.25)]'
                    : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
              ]"
            >
              <span v-if="product.type === 'API_LICENSE'">🚀 Attiva API Pass</span>
              <span v-else-if="product.type === 'ADS_SPONSOR'">📢 Configura &amp; Prenota Spot</span>
              <span v-else>📚 Acquista su Amazon ↗</span>
            </button>
          </div>
        </article>

        <div
          v-if="filteredProducts.length === 0"
          class="col-span-full p-12 text-center text-slate-500 font-mono text-xs bg-[#090d16] rounded-2xl border border-slate-800"
        >
          📭 Nessuna risorsa trovata corrispondente ai criteri di ricerca.
        </div>
      </section>

      <!-- SHOWCASE LIVE DEL CIRCUITO DKP ADS v2.6 -->
      <section class="pt-4">
        <AdsDkpAdsWidget placement="global" :compact="true" />
      </section>
    </div>

    <!-- 💳 MODAL DI CHECKOUT API & PROVISIONING DKP ADS -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showModal"
          class="fixed inset-0 z-50 bg-[#020420]/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          @click.self="closeModal"
        >
          <div class="bg-[#090d16] border border-slate-800 rounded-2xl w-full max-w-lg p-6 sm:p-8 shadow-2xl flex flex-col gap-5 relative font-sans my-auto">
            <button
              @click="closeModal"
              class="absolute top-5 right-5 text-slate-500 hover:text-white font-bold text-xl cursor-pointer bg-transparent border-none"
            >
              ✕
            </button>

            <div class="flex flex-col gap-1.5 border-b border-slate-800 pb-4">
              <span class="bg-sky-500/15 text-sky-400 border border-sky-500/30 px-2.5 py-0.5 rounded text-[10px] font-black uppercase font-mono w-fit">
                DKP SECURE GATEWAY • v2.6
              </span>
              <h3 class="text-white font-black text-xl sm:text-2xl font-sans m-0">
                {{ selectedProduct?.title }}
              </h3>
              <div class="text-2xl font-black text-emerald-400 font-mono flex items-baseline gap-2 mt-1">
                €{{ selectedProduct?.price?.toFixed(2) }}
                <span class="text-xs text-slate-500 font-normal">
                  ({{
                    selectedProduct?.billingCycle === 'MONTHLY'
                      ? 'Fatturazione mensile'
                      : 'Pagamento una tantum'
                  }})
                </span>
              </div>
            </div>

            <form @submit.prevent="executeCheckout" class="flex flex-col gap-4 font-mono text-xs">
              <div class="flex flex-col gap-1.5">
                <label for="email" class="text-slate-400 font-bold uppercase">
                  {{
                    selectedProduct?.type === 'ADS_SPONSOR'
                      ? 'Email Referente Campagna & Fatturazione *'
                      : 'Email per ricezione API Token & Credenziali *'
                  }}
                </label>
                <input
                  id="email"
                  v-model="customerEmail"
                  type="email"
                  placeholder="dev@tuodominio.com"
                  required
                  class="bg-[#020420] border border-slate-800 text-white px-4 py-3 rounded-xl font-bold outline-none focus:border-emerald-500 transition-all text-sm font-sans"
                />
              </div>

              <!-- CAMPI CREATIVI CAMPAGNA SE IL PRODOTTO È UNO SPAZIO DKP ADS -->
              <div
                v-if="selectedProduct?.type === 'ADS_SPONSOR'"
                class="bg-[#020420] border border-purple-500/30 rounded-xl p-4 flex flex-col gap-3"
              >
                <span class="text-[10px] font-black text-purple-300 uppercase">
                  📢 Configurazione Creatività DKP ADS
                </span>

                <input
                  v-model="adCampaignForm.adTitle"
                  required
                  maxlength="120"
                  placeholder="Titolo Annuncio (es. Serverless Postgres per Team)"
                  class="bg-[#090d16] border border-slate-700 text-white px-3.5 py-2.5 rounded-lg outline-none focus:border-purple-400 font-sans text-xs"
                />

                <input
                  v-model="adCampaignForm.adTargetUrl"
                  required
                  type="url"
                  placeholder="https://tuodominio.com/landing"
                  class="bg-[#090d16] border border-slate-700 text-sky-400 px-3.5 py-2.5 rounded-lg outline-none focus:border-purple-400 font-mono text-xs"
                />

                <textarea
                  v-model="adCampaignForm.adTagline"
                  rows="2"
                  maxlength="240"
                  placeholder="Breve descrizione del prodotto/servizio..."
                  class="bg-[#090d16] border border-slate-700 text-slate-200 px-3.5 py-2 rounded-lg outline-none focus:border-purple-400 font-sans text-xs resize-none"
                ></textarea>

                <select
                  v-model="adCampaignForm.adPlacement"
                  class="bg-[#090d16] border border-slate-700 text-emerald-400 font-bold px-3.5 py-2.5 rounded-lg outline-none focus:border-purple-400 cursor-pointer"
                >
                  <option value="nodeTalks">Placement: DKP Nodes &amp; Thread</option>
                  <option value="blogSidebar">Placement: Blog Tecnico &amp; Articoli</option>
                  <option value="feedInline">Placement: Feed &amp; Discussioni</option>
                  <option value="global">Placement: Globale su tutto l ecosistema</option>
                </select>
              </div>

              <div class="flex flex-col gap-2">
                <label class="text-slate-400 font-bold uppercase">Seleziona Gateway di Pagamento *</label>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label
                    :class="[
                      'flex items-center gap-2.5 bg-[#020420] border rounded-xl p-3 cursor-pointer transition-all',
                      paymentProvider === 'stripe'
                        ? 'border-emerald-500 bg-emerald-500/5'
                        : 'border-slate-800 hover:border-slate-700'
                    ]"
                  >
                    <input
                      type="radio"
                      v-model="paymentProvider"
                      value="stripe"
                      name="provider"
                      class="w-4 h-4 accent-emerald-500 cursor-pointer"
                    />
                    <div class="flex flex-col">
                      <span class="text-white font-bold text-xs font-sans">💳 Stripe / Card</span>
                      <span class="text-[10px] text-slate-500">Checkout Istantaneo</span>
                    </div>
                  </label>

                  <label
                    :class="[
                      'flex items-center gap-2.5 bg-[#020420] border rounded-xl p-3 cursor-pointer transition-all',
                      paymentProvider === 'paypal'
                        ? 'border-emerald-500 bg-emerald-500/5'
                        : 'border-slate-800 hover:border-slate-700'
                    ]"
                  >
                    <input
                      type="radio"
                      v-model="paymentProvider"
                      value="paypal"
                      name="provider"
                      class="w-4 h-4 accent-emerald-500 cursor-pointer"
                    />
                    <div class="flex flex-col">
                      <span class="text-white font-bold text-xs font-sans">🅿️ PayPal</span>
                      <span class="text-[10px] text-slate-500">Account o Carta</span>
                    </div>
                  </label>
                </div>
              </div>

              <div
                v-if="errorMessage"
                class="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-xl text-xs"
              >
                ⚠️ {{ errorMessage }}
              </div>

              <button
                type="submit"
                :disabled="isLoading"
                class="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 text-slate-950 font-black rounded-xl text-sm transition-all shadow-[0_0_20px_rgba(0,220,130,0.3)] cursor-pointer disabled:opacity-50 mt-1 border-none"
              >
                <span v-if="!isLoading">
                  {{
                    selectedProduct?.type === 'ADS_SPONSOR'
                      ? '📢 Procedi & Attiva Campagna ADS'
                      : '⚡ Genera Sub & API Key'
                  }}
                </span>
                <span v-else>⌛ Connessione al Gateway...</span>
              </button>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
  <div class="mt-2 mb-6">
       <DkpAdsWidget placement="global" />
      </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>