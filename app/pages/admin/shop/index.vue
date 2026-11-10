<!-- app/pages/admin/shop/index.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'

useHead({
  title: 'API Licenses & Ads Control Center v2.6 — DKP Admin',
  meta: [
    { name: 'description', content: 'Gestione licenze API per gli endpoint di piattaforma e monetizzazione Ads/Sponsorizzazioni (Beta).' }
  ]
})

const { getMainUrl, getApiUrl } = useDomain()

interface ShopItem {
  id: number | string
  title: string
  type: 'API_LICENSE' | 'ADS_SPONSOR'
  category: 'CRAWLER API' | 'JOBS FEED API' | 'MAIL & WEBHOOKS API' | 'NODES API' | 'SPONSORED JOB ADS' | 'NEWSLETTER ADS' | 'BANNER ADS'
  price: number
  billingCycle: 'MONTHLY' | 'ANNUAL' | 'PER_10K_CALLS' | 'ONE_TIME'
  quotaLimit: string
  description: string
  tier: 'STARTER' | 'PRO' | 'ENTERPRISE' | 'BETA_SPONSOR'
  activeSubscriptions: number
  isBeta?: boolean
  isPublished: boolean
}

// Stato Reattivo Catalogo Licenze API & Ads
const products = ref<ShopItem[]>([
  {
    id: 1,
    title: 'DKP Crawler Engine API - Enterprise Tier',
    type: 'API_LICENSE',
    category: 'CRAWLER API',
    price: 149.00,
    billingCycle: 'MONTHLY',
    quotaLimit: '1.000.000 chiamate/mese',
    description: 'Accesso completo REST & Stream Nitro per ingestione automatizzata news tech, HackerNews, pulizia Neon DB ed AI summarization.',
    tier: 'ENTERPRISE',
    activeSubscriptions: 18,
    isPublished: true
  },
  {
    id: 2,
    title: 'Tech Jobs Feed API Pro',
    type: 'API_LICENSE',
    category: 'JOBS FEED API',
    price: 79.00,
    billingCycle: 'MONTHLY',
    quotaLimit: '250.000 chiamate/mese',
    description: 'Sincronizzazione in real-time delle offerte di lavoro tech arricchite e verificate da RemoteOK con tag e range salariali.',
    tier: 'PRO',
    activeSubscriptions: 34,
    isPublished: true
  },
  {
    id: 3,
    title: 'DKP Mail & Autoresponder Webhook API',
    type: 'API_LICENSE',
    category: 'MAIL & WEBHOOKS API',
    price: 49.00,
    billingCycle: 'MONTHLY',
    quotaLimit: '100.000 webhook/mese',
    description: 'Integrazione diretta con la pipeline email, gestione autoresponder sequenziali e verifica Deliverability DKIM/SPF.',
    tier: 'STARTER',
    activeSubscriptions: 52,
    isPublished: true
  },
  {
    id: 4,
    title: 'Sponsored Job Listing (Featured Spot)',
    type: 'ADS_SPONSOR',
    category: 'SPONSORED JOB ADS',
    price: 199.00,
    billingCycle: 'ONE_TIME',
    quotaLimit: '30 Giorni in Evidenza',
    description: 'Posizionamento in cima al Tech Jobs Hub + Badge Gold + Invio dedicato nel digest settimanale della Newsletter.',
    tier: 'BETA_SPONSOR',
    activeSubscriptions: 12,
    isBeta: true,
    isPublished: true
  },
  {
    id: 5,
    title: 'DKP Newsletter Header Banner Ad',
    type: 'ADS_SPONSOR',
    category: 'NEWSLETTER ADS',
    price: 299.00,
    billingCycle: 'ONE_TIME',
    quotaLimit: '1 Uscita Dedicated (~15k Devs)',
    description: 'Banner pubblicitario esclusivo posizionato in testa al bollettino settimanale inviato alla community tech DKP.',
    tier: 'BETA_SPONSOR',
    activeSubscriptions: 5,
    isBeta: true,
    isPublished: true
  },
  {
    id: 6,
    title: 'DKP Nodes & Forum Sticky Banner Ad',
    type: 'ADS_SPONSOR',
    category: 'BANNER ADS',
    price: 129.00,
    billingCycle: 'MONTHLY',
    quotaLimit: '50.000 Impression stimate',
    description: 'Banner fisso nativo nella sidebar dei Nodi della community con tracciamento click a zero impatto sulle prestazioni.',
    tier: 'BETA_SPONSOR',
    activeSubscriptions: 8,
    isBeta: true,
    isPublished: true
  }
])

const isLoading = ref(false)
const searchQuery = ref('')
const activeTypeFilter = ref<'ALL' | 'API_LICENSE' | 'ADS_SPONSOR'>('ALL')

// Toast System
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error' | 'warning'>('success')

function triggerToast(msg: string, type: 'success' | 'error' | 'warning' = 'success') {
  toastMessage.value = msg
  toastType.value = type
  showToast.value = true
  setTimeout(() => { showToast.value = false }, 3500)
}

// Computazione Metriche MRR & Subscriptions
const totalApiSubscriptions = computed(() => 
  products.value.filter(p => p.type === 'API_LICENSE').reduce((acc, p) => acc + p.activeSubscriptions, 0)
)

const totalAdsCampaigns = computed(() => 
  products.value.filter(p => p.type === 'ADS_SPONSOR').reduce((acc, p) => acc + p.activeSubscriptions, 0)
)

const estimatedMRR = computed(() => {
  return products.value.reduce((acc, p) => {
    if (p.billingCycle === 'MONTHLY') return acc + (p.price * p.activeSubscriptions)
    if (p.billingCycle === 'ANNUAL') return acc + ((p.price / 12) * p.activeSubscriptions)
    return acc + (p.price * p.activeSubscriptions * 0.25) // Stima conversione per le inserzioni one-time
  }, 0)
})

// Modal Form Prodotto / Licenza
const showModal = ref(false)
const isEditing = ref(false)
const currentItem = ref<ShopItem>({
  id: '',
  title: '',
  type: 'API_LICENSE',
  category: 'CRAWLER API',
  price: 49.00,
  billingCycle: 'MONTHLY',
  quotaLimit: '100.000 req/mo',
  description: '',
  tier: 'PRO',
  activeSubscriptions: 0,
  isBeta: false,
  isPublished: true
})

function openCreateModal() {
  isEditing.value = false
  currentItem.value = {
    id: Date.now(),
    title: '',
    type: 'API_LICENSE',
    category: 'CRAWLER API',
    price: 49.00,
    billingCycle: 'MONTHLY',
    quotaLimit: '100.000 chiamate/mese',
    description: '',
    tier: 'PRO',
    activeSubscriptions: 0,
    isBeta: false,
    isPublished: true
  }
  showModal.value = true
}

function openEditModal(item: ShopItem) {
  isEditing.value = true
  currentItem.value = JSON.parse(JSON.stringify(item))
  showModal.value = true
}

async function saveItem() {
  if (!currentItem.value.title || !currentItem.value.description) {
    triggerToast('❌ Compila Titolo e Descrizione del piano!', 'warning')
    return
  }

  isLoading.value = true
  try {
    if (isEditing.value) {
      const idx = products.value.findIndex(p => p.id === currentItem.value.id)
      if (idx !== -1) products.value[idx] = { ...currentItem.value }
      triggerToast('✅ Piano Licenza/Ads aggiornato con successo!', 'success')
    } else {
      products.value.unshift({ ...currentItem.value })
      triggerToast('🚀 Nuovo pacchetto API/Ads pubblicato nello Shop!', 'success')
    }
    showModal.value = false
  } catch (err: any) {
    triggerToast('⚠️ Errore durante il salvataggio.', 'error')
  } finally {
    isLoading.value = false
  }
}

function deleteItem(id: string | number) {
  if (!confirm('Sei sicuro di voler rimuovere questo pacchetto dal catalogo Shop?')) return
  products.value = products.value.filter(p => p.id !== id)
  triggerToast('🗑️ Pacchetto rimosso dal catalogo.', 'success')
}

function testCheckout(item: ShopItem) {
  triggerToast(`💳 Test Checkout Stripe: Inizializzato ordine per ${item.title} (€${item.price.toFixed(2)})`, 'success')
}

// Prodotti Filtrati
const filteredProducts = computed(() => {
  return products.value.filter(p => {
    const matchesType = activeTypeFilter.value === 'ALL' || p.type === activeTypeFilter.value
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                          p.category.toLowerCase().includes(searchQuery.value.toLowerCase())
    return matchesType && matchesSearch
  })
})
</script>

<template>
  <div class="min-h-screen bg-[#020420] text-slate-300 py-10 px-4 sm:px-6 font-sans">
    
    <!-- FLOATING TOAST NOTIFICATION -->
    <Transition name="toast-fade">
      <div 
        v-if="showToast" 
        :class="[
          'fixed top-6 right-6 z-50 p-4 rounded-xl backdrop-blur-md border shadow-2xl max-w-md flex items-center gap-3 font-mono text-xs sm:text-sm font-semibold transition-all',
          toastType === 'success' ? 'bg-[#041a13]/90 border-emerald-500/50 text-emerald-300 shadow-[0_0_20px_rgba(0,220,130,0.2)]' :
          toastType === 'error' ? 'bg-[#1e070a]/90 border-rose-500/50 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.2)]' :
          'bg-[#1a1403]/90 border-amber-500/50 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
        ]"
      >
        <span class="text-xl">
          {{ toastType === 'success' ? '⚡' : toastType === 'error' ? '🚫' : '⚠️' }}
        </span>
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>

    <div class="max-w-7xl mx-auto flex flex-col gap-6">
      
      <!-- NAVBAR GRID MODULI ADMIN v2.6 -->
      <div class="flex flex-col gap-3 bg-[#080d1a] border border-slate-800/80 rounded-2xl p-4 shadow-xl">
        <div class="flex justify-between items-center pb-3 border-b border-slate-800/60 font-mono">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-[0_0_8px_#00dc82]"></span>
            <span class="text-cyan-400 font-black text-xs tracking-wider uppercase">DKP ADMIN CONTROL CENTER</span>
          </div>

          <NuxtLink :to="getMainUrl('/admin')" external class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-bold text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/40 hover:bg-cyan-500/20 transition-all">
            🏠 Dashboard Main
          </NuxtLink>
        </div>

        <!-- GRID NAVIGATION -->
        <nav class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 font-mono">
          <NuxtLink :to="getApiUrl('/admin/api-gateway')" external class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/30 hover:bg-emerald-500/15 transition-all">
            ⚙️ API Gateway
          </NuxtLink>
          <NuxtLink :to="getMainUrl('/admin/mail')" external class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/30 hover:bg-emerald-500/15 transition-all">
            📧 Mail
          </NuxtLink>
          <NuxtLink :to="getMainUrl('/admin/newsletter')" external class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/30 hover:bg-emerald-500/15 transition-all">
            📣 Newsletter
          </NuxtLink>
          <NuxtLink :to="getMainUrl('/admin/crawler')" external class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/30 hover:bg-emerald-500/15 transition-all">
            🤖 Crawler
          </NuxtLink>
          <NuxtLink :to="getMainUrl('/admin/blog')" external class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/30 hover:bg-emerald-500/15 transition-all">
            📝 Blog
          </NuxtLink>
          <NuxtLink :to="getMainUrl('/admin/nodes')" external class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs text-sky-400 bg-sky-500/10 border border-sky-500/40 hover:bg-sky-500/20 transition-all">
            💬 Gestione Nodi
          </NuxtLink>
          <NuxtLink :to="getMainUrl('/admin/shop')" external class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs text-emerald-300 bg-emerald-500/20 border border-emerald-500/50 shadow-[0_0_10px_rgba(0,220,130,0.2)]">
            🛍️ Shop (API &amp; Ads)
          </NuxtLink>
          <NuxtLink :to="getMainUrl('/admin/jobs')" external class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/30 hover:bg-emerald-500/15 transition-all">
            💼 Jobs
          </NuxtLink>
        </nav>
      </div>

      <!-- HEADER HERO API LICENSES & ADS v2.6-PURE-SQL -->
      <header class="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-gradient-to-r from-[#080d1a] via-[#091124] to-[#040711] border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl gap-6 relative overflow-hidden">
        <div class="absolute -right-20 -top-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -left-20 -bottom-20 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="relative z-10 flex flex-col gap-2">
          <div class="flex items-center gap-3 mb-1 flex-wrap font-mono">
            <span class="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/40 px-3 py-0.5 rounded-full text-xs font-black uppercase shadow-[0_0_12px_rgba(0,220,130,0.25)]">
              DKP ECOSYSTEM SHOP v2.6-PURE-SQL
            </span>
            <span class="bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase">
              📢 ADS SYSTEM (BETA ACTIVE)
            </span>
          </div>
          <h1 class="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Licenze <span class="text-emerald-400">API &amp; Piattaforma Ads</span>
          </h1>
          <p class="text-slate-400 text-xs sm:text-sm max-w-2xl">
            Gestisci i piani di licenza API per gli endpoint dell'ecosistema e monetizza la community con il nuovo motore pubblicitario Ads (Beta).
          </p>
        </div>

        <div class="relative z-10 font-mono w-full sm:w-auto">
          <button 
            @click="openCreateModal" 
            class="w-full sm:w-auto px-5 py-3 rounded-xl font-black text-xs sm:text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-[0_0_20px_rgba(0,220,130,0.25)] flex items-center justify-center gap-2 cursor-pointer"
          >
            ➕ Crea Piano API / Spot Ads
          </button>
        </div>
      </header>

      <!-- STATISTICHE PANNELLO -->
      <section class="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
        <div class="bg-[#080d1a] border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-emerald-500/40 transition-all shadow-lg">
          <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Licenze API Attive</span>
          <div class="text-3xl font-black text-emerald-400 my-2">{{ totalApiSubscriptions }} Chiavi</div>
          <span class="text-[11px] text-slate-500">Crawler, Jobs, Mail &amp; Webhooks</span>
        </div>

        <div class="bg-[#080d1a] border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-amber-500/40 transition-all shadow-lg">
          <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Campagne Ads (Beta)</span>
          <div class="text-3xl font-black text-amber-400 my-2">{{ totalAdsCampaigns }} Inserzioni</div>
          <span class="text-[11px] text-slate-500">Jobs Featured, Newsletter &amp; Banners</span>
        </div>

        <div class="bg-[#080d1a] border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-sky-500/40 transition-all shadow-lg">
          <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Stima Run-Rate MRR</span>
          <div class="text-3xl font-black text-sky-400 my-2">€{{ estimatedMRR.toFixed(2) }}/mo</div>
          <span class="text-[11px] text-slate-500">Monetizzazione Ecosistema DKP</span>
        </div>
      </section>

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

        <div class="flex items-center gap-1.5 font-mono text-xs flex-wrap">
          <button 
            @click="activeTypeFilter = 'ALL'" 
            :class="[
              'px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer border',
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
              'px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer border',
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
              'px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer border',
              activeTypeFilter === 'ADS_SPONSOR' 
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]' 
                : 'bg-[#040814] text-slate-400 border-slate-800 hover:border-slate-700'
            ]"
          >
            📢 Ads &amp; Sponsor (Beta)
          </button>
        </div>
      </section>

      <!-- GRIGLIA PRODOTTI SHOP (API & ADS) -->
      <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <article 
          v-for="item in filteredProducts" 
          :key="item.id" 
          :class="[
            'bg-[#080d1a] border rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 group relative overflow-hidden',
            item.type === 'ADS_SPONSOR' ? 'border-amber-500/30 hover:border-amber-500/60' : 'border-slate-800/80 hover:border-emerald-500/50'
          ]"
        >
          <div class="flex flex-col gap-4">
            <div class="flex justify-between items-center font-mono">
              <div class="flex items-center gap-1.5">
                <span 
                  :class="[
                    'px-2.5 py-0.5 rounded text-[10px] font-black border uppercase',
                    item.type === 'API_LICENSE' ? 'bg-sky-500/15 text-sky-400 border-sky-500/30' : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  ]"
                >
                  {{ item.category }}
                </span>
                <span v-if="item.isBeta" class="px-2 py-0.5 rounded text-[9px] font-extrabold bg-amber-500 text-slate-950 uppercase">
                  BETA
                </span>
              </div>
              <div class="flex flex-col items-end">
                <span class="text-2xl font-black text-emerald-400 font-mono">€{{ item.price.toFixed(2) }}</span>
                <span class="text-[10px] text-slate-500 uppercase font-bold font-mono">
                  {{ item.billingCycle === 'MONTHLY' ? '/mese' : item.billingCycle === 'ANNUAL' ? '/anno' : 'una tantum' }}
                </span>
              </div>
            </div>

            <h3 class="text-white font-bold text-lg group-hover:text-emerald-400 transition-colors">{{ item.title }}</h3>
            <p class="text-slate-400 text-xs leading-relaxed line-clamp-3">{{ item.description }}</p>

            <div class="bg-[#040814] border border-slate-800/80 rounded-xl p-3 font-mono text-[11px] flex flex-col gap-1.5">
              <div class="flex justify-between border-b border-slate-800 pb-1.5 text-slate-400">
                <span>⚡ Quota/Limiti: <strong class="text-white font-bold">{{ item.quotaLimit }}</strong></span>
              </div>
              <div class="flex justify-between text-slate-400 pt-0.5">
                <span>📊 Sub/Slot Attivi: <strong class="text-emerald-400 font-bold">{{ item.activeSubscriptions }}</strong></span>
                <span>Tier: <strong class="text-sky-400 font-bold">{{ item.tier }}</strong></span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2 mt-6 font-mono">
            <button 
              @click="testCheckout(item)" 
              class="flex-1 py-2.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-[0_0_12px_rgba(0,220,130,0.2)] cursor-pointer"
            >
              💳 Test Order Stripe
            </button>
            <button 
              @click="openEditModal(item)" 
              class="p-2.5 bg-slate-800 hover:bg-sky-500 hover:text-slate-950 text-sky-400 rounded-xl text-xs transition-all cursor-pointer" 
              title="Modifica Piano"
            >
              ✏️
            </button>
            <button 
              @click="deleteItem(item.id)" 
              class="p-2.5 bg-rose-500/15 border border-rose-500/30 hover:bg-rose-500 hover:text-white text-rose-400 rounded-xl text-xs transition-all cursor-pointer" 
              title="Elimina Piano"
            >
              🗑️
            </button>
          </div>
        </article>

        <div v-if="filteredProducts.length === 0" class="col-span-full p-12 text-center text-slate-500 font-mono text-xs">
          📭 Nessun pacchetto trovato corrispondente ai criteri di ricerca.
        </div>
      </section>

      <!-- MODAL CREAZIONE / MODIFICA PIANO -->
      <Transition name="fade">
        <div 
          v-if="showModal" 
          class="fixed inset-0 z-50 bg-[#020420]/80 backdrop-blur-sm flex items-center justify-center p-4"
          @click.self="showModal = false"
        >
          <div class="bg-[#080d1a] border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-hidden">
            
            <div class="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 class="text-white font-bold text-base sm:text-lg flex items-center gap-2">
                <span>{{ isEditing ? '✏️ Modifica Piano API / Spot Ads' : '➕ Nuovo Piano API / Inserzione Ads' }}</span>
              </h3>
              <button @click="showModal = false" class="text-slate-500 hover:text-white font-bold text-xl cursor-pointer">✕</button>
            </div>

            <div class="flex flex-col gap-4 overflow-y-auto pr-1 font-mono text-xs">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="flex flex-col gap-1.5">
                  <label class="text-slate-400 font-bold uppercase">Tipologia Offerta *</label>
                  <select 
                    v-model="currentItem.type" 
                    class="bg-[#040814] border border-slate-800 text-white px-3.5 py-2.5 rounded-xl font-bold outline-none focus:border-emerald-500 transition-all cursor-pointer"
                  >
                    <option value="API_LICENSE">🔑 Licenza API Ecosistema</option>
                    <option value="ADS_SPONSOR">📢 Inserzione Advertising (Ads)</option>
                  </select>
                </div>

                <div class="flex flex-col gap-1.5">
                  <label class="text-slate-400 font-bold uppercase">Categoria *</label>
                  <select 
                    v-model="currentItem.category" 
                    class="bg-[#040814] border border-slate-800 text-white px-3.5 py-2.5 rounded-xl font-bold outline-none focus:border-emerald-500 transition-all cursor-pointer"
                  >
                    <template v-if="currentItem.type === 'API_LICENSE'">
                      <option value="CRAWLER API">Crawler Engine API</option>
                      <option value="JOBS FEED API">Tech Jobs Feed API</option>
                      <option value="MAIL & WEBHOOKS API">Mail &amp; Webhooks API</option>
                      <option value="NODES API">Nodes &amp; Forum API</option>
                    </template>
                    <template v-else>
                      <option value="SPONSORED JOB ADS">Sponsored Job Listing</option>
                      <option value="NEWSLETTER ADS">Newsletter Header Ad</option>
                      <option value="BANNER ADS">DKP Nodes Sidebar Banner</option>
                    </template>
                  </select>
                </div>
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-slate-400 font-bold uppercase">Titolo Offerta / Piano *</label>
                <input 
                  v-model="currentItem.title" 
                  type="text" 
                  placeholder="es. DKP Crawler Engine API - Enterprise Tier" 
                  class="bg-[#040814] border border-slate-800 text-white px-3.5 py-2.5 rounded-xl font-bold outline-none focus:border-emerald-500 transition-all"
                />
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="flex flex-col gap-1.5">
                  <label class="text-slate-400 font-bold uppercase">Prezzo (€) *</label>
                  <input 
                    v-model.number="currentItem.price" 
                    type="number" 
                    step="0.01" 
                    class="bg-[#040814] border border-slate-800 text-white px-3.5 py-2.5 rounded-xl font-bold outline-none focus:border-emerald-500 transition-all"
                  />
                </div>

                <div class="flex flex-col gap-1.5">
                  <label class="text-slate-400 font-bold uppercase">Ciclo Fatturazione</label>
                  <select 
                    v-model="currentItem.billingCycle" 
                    class="bg-[#040814] border border-slate-800 text-white px-3.5 py-2.5 rounded-xl font-bold outline-none focus:border-emerald-500 transition-all cursor-pointer"
                  >
                    <option value="MONTHLY">Mensile (/mo)</option>
                    <option value="ANNUAL">Annuale (/yr)</option>
                    <option value="PER_10K_CALLS">Per 10k Chiamate</option>
                    <option value="ONE_TIME">Una Tantum</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="flex flex-col gap-1.5">
                  <label class="text-slate-400 font-bold uppercase">Quota / Limite di Utilizzo</label>
                  <input 
                    v-model="currentItem.quotaLimit" 
                    type="text" 
                    placeholder="es. 1.000.000 chiamate/mese" 
                    class="bg-[#040814] border border-slate-800 text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-emerald-500 transition-all"
                  />
                </div>

                <div class="flex flex-col gap-1.5">
                  <label class="text-slate-400 font-bold uppercase">Livello Tier</label>
                  <select 
                    v-model="currentItem.tier" 
                    class="bg-[#040814] border border-slate-800 text-white px-3.5 py-2.5 rounded-xl font-bold outline-none focus:border-emerald-500 transition-all cursor-pointer"
                  >
                    <option value="STARTER">Starter</option>
                    <option value="PRO">Pro</option>
                    <option value="ENTERPRISE">Enterprise</option>
                    <option value="BETA_SPONSOR">Beta Sponsor</option>
                  </select>
                </div>
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-slate-400 font-bold uppercase">Descrizione Breve</label>
                <textarea 
                  v-model="currentItem.description" 
                  rows="3" 
                  placeholder="Descrivi i vantaggi della licenza o le metriche di reach dell'inserzione..." 
                  class="bg-[#040814] border border-slate-800 text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-emerald-500 transition-all"
                ></textarea>
              </div>

              <div class="flex flex-col gap-2 pt-2 border-t border-slate-800/80">
                <label class="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input v-model="currentItem.isBeta" type="checkbox" class="w-4 h-4 accent-amber-500 rounded cursor-pointer" />
                  <span>📢 Contrassegna come Funzionalità Ads Beta</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input v-model="currentItem.isPublished" type="checkbox" class="w-4 h-4 accent-emerald-500 rounded cursor-pointer" />
                  <span>🌐 Pubblica Immediatamente nello Shop DKP</span>
                </label>
              </div>
            </div>

            <div class="border-t border-slate-800 pt-4 flex justify-end gap-3 font-mono">
              <button @click="showModal = false" class="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer">
                Annulla
              </button>
              <button @click="saveItem" :disabled="isLoading" class="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50">
                💾 {{ isEditing ? 'Aggiorna Offerta' : 'Pubblica in Shop' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>

    </div>
  </div>
</template>

<style scoped>
.toast-fade-enter-active, .toast-fade-leave-active { transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
.toast-fade-enter-from, .toast-fade-leave-to { opacity: 0; transform: translateY(-15px) scale(0.95); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>