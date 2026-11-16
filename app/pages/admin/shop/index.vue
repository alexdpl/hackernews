<!-- app/pages/admin/shop/index.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'

useHead({
  title: 'Shop, DKP ADS & Affiliate Control Center v2.6 — DKP Admin',
  meta: [
    {
      name: 'description',
      content:
        'Gestione centralizzata del circuito DKP ADS su Neon Pure-SQL, licenze API v2.6 e affiliazioni Amazon Dev Library.'
    }
  ]
})

const { getMainUrl, getApiUrl } = useDomain()

interface LiveAdCampaign {
  id: string
  title: string
  tagline: string
  badge: string
  ctaText: string
  targetUrl: string
  isInternal: boolean
  placement: string
  tier: string
  accentColor: string
  buyerName: string
  buyerEmail: string
  pricePaidCents: number
  impressionsCount: number
  clicksCount: number
  ctr: number
  maxImpressions: number | null
  status: 'active' | 'paused' | 'exhausted' | 'pending'
  createdAt?: string
}

interface ApiPlanItem {
  id: string
  title: string
  category: string
  price: number
  billingCycle: 'MONTHLY' | 'ANNUAL'
  quotaLimit: string
  endpoint: string
  description: string
  tier: 'STARTER' | 'PRO' | 'ENTERPRISE'
}

// 1. Fetch Campagne Reali DKP ADS da Neon DB
const {
  data: adsData,
  pending: isLoadingAds,
  refresh: refreshCampaigns
} = await useFetch<{
  success: boolean
  campaigns: LiveAdCampaign[]
  stats: {
    activeCount: number
    totalImpressions: number
    totalClicks: number
    totalRevenueCents: number
  }
}>('/api/admin/ads/campaigns', {
  key: 'admin-dkp-ads-campaigns',
  default: () => ({
    success: true,
    campaigns: [],
    stats: { activeCount: 0, totalImpressions: 0, totalClicks: 0, totalRevenueCents: 0 }
  })
})

const liveCampaigns = computed(() => adsData.value?.campaigns || [])
const adsStats = computed(
  () =>
    adsData.value?.stats || {
      activeCount: 0,
      totalImpressions: 0,
      totalClicks: 0,
      totalRevenueCents: 0
    }
)

const globalCtr = computed(() => {
  if (!adsStats.value.totalImpressions) return '0.00'
  return ((adsStats.value.totalClicks / adsStats.value.totalImpressions) * 100).toFixed(2)
})

// 2. Fetch Affiliazioni Amazon & Libri Tecnici (/api/v2.5/ads/active)
const { data: affiliateData, refresh: refreshAffiliates } = await useFetch<any>('/api/v2.5/ads/active', {
  key: 'admin-affiliate-books',
  server: false,
  lazy: true
})

const affiliateBooks = computed<any[]>(() => {
  const list = affiliateData.value?.ads
  return Array.isArray(list) ? list : []
})

// 3. Piani Licenze API v2.6 (allineati con /shop)
const apiPlans = ref<ApiPlanItem[]>([
  {
    id: 'dkp-api-sentinel-trinity',
    title: 'DKP AI Trinity & Sentinel SAST API',
    category: 'AI & SECURITY API',
    price: 99.0,
    billingCycle: 'MONTHLY',
    quotaLimit: '500.000 req/mo',
    endpoint: '/api/ai/sentinel • /api/ai/chat',
    description:
      'Accesso diretto a Pulse Sentinel SAST con OpenRouter Structured Outputs (strict: true) e streaming multi-modello DKP-Coder / DKP-Pro.',
    tier: 'ENTERPRISE'
  },
  {
    id: 'dkp-api-vault-notary',
    title: 'DKP Blockchain Vault© Enterprise API',
    category: 'ON-CHAIN LEDGER API',
    price: 79.0,
    billingCycle: 'MONTHLY',
    quotaLimit: '250.000 req/mo',
    endpoint: '/api/vault/notarize • /api/vault/verify',
    description:
      'Notarizzazione SHA-256 concatenata su ledger Pure-SQL con generazione automatica di Merkle Root e certificati verificabili via SDK.',
    tier: 'PRO'
  },
  {
    id: 'dkp-api-crawler-ent',
    title: 'DKP Crawler & Tech Jobs Feed API',
    category: 'CRAWLER & DATA API',
    price: 129.0,
    billingCycle: 'MONTHLY',
    quotaLimit: '1.000.000 req/mo',
    endpoint: '/api/v2.6/crawler • /api/v2.6/jobs',
    description:
      'Ingestione automatizzata di feed tech, AI summarization e sincronizzazione in real-time delle offerte di lavoro developer verificate.',
    tier: 'ENTERPRISE'
  }
])

// Navigazione Tab & Ricerca
const activeSection = ref<'ADS_CIRCUIT' | 'API_LICENSES' | 'AFFILIATE_LIBRARY'>('ADS_CIRCUIT')
const searchQuery = ref('')

const filteredCampaigns = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return liveCampaigns.value
  return liveCampaigns.value.filter(
    (c) =>
      c.title.toLowerCase().includes(q) ||
      c.tagline.toLowerCase().includes(q) ||
      c.buyerName.toLowerCase().includes(q) ||
      c.placement.toLowerCase().includes(q)
  )
})

const filteredAffiliateBooks = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return affiliateBooks.value
  return affiliateBooks.value.filter(
    (b: any) =>
      String(b.title || '').toLowerCase().includes(q) ||
      String(b.snippet || '').toLowerCase().includes(q) ||
      String(b.url || '').toLowerCase().includes(q)
  )
})

// Toast System
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error' | 'warning'>('success')

function triggerToast(msg: string, type: 'success' | 'error' | 'warning' = 'success') {
  toastMessage.value = msg
  toastType.value = type
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3500)
}

// Azioni su Campagne DKP ADS (Neon DB)
const showCreateAdModal = ref(false)
const isSavingAd = ref(false)

const newAdForm = ref({
  title: '',
  tagline: '',
  badge: 'SPONSORED',
  ctaText: 'Scopri di più',
  targetUrl: '',
  placement: 'nodeTalks' as 'nodeTalks' | 'blogSidebar' | 'feedInline' | 'docs' | 'global',
  tier: 'PRO_NODE' as 'STARTER' | 'PRO_NODE' | 'ECOSYSTEM_TAKEOVER',
  accentColor: 'emerald' as 'emerald' | 'sky' | 'purple' | 'amber',
  buyerName: 'DKP Partner',
  buyerEmail: 'admin@devkernelpulse.org'
})

function openNewAdModal() {
  newAdForm.value = {
    title: '',
    tagline: '',
    badge: 'SPONSORED',
    ctaText: 'Scopri di più',
    targetUrl: '',
    placement: 'nodeTalks',
    tier: 'PRO_NODE',
    accentColor: 'emerald',
    buyerName: 'DKP Partner',
    buyerEmail: 'admin@devkernelpulse.org'
  }
  showCreateAdModal.value = true
}

async function createLiveCampaign() {
  if (!newAdForm.value.title.trim() || !newAdForm.value.targetUrl.trim()) {
    return triggerToast('❌ Inserisci Titolo e URL destinazione.', 'warning')
  }

  isSavingAd.value = true
  try {
    const res: any = await $fetch('/api/ads/purchase', {
      method: 'POST',
      body: {
        ...newAdForm.value,
        tagline: newAdForm.value.tagline.trim() || 'Soluzione verificata sul circuito DKP ADS v2.6.'
      }
    })
    if (res?.success) {
      triggerToast(`🚀 Campagna attivata su Neon DB (ID: ${res.campaign.id})`, 'success')
      showCreateAdModal.value = false
      await refreshCampaigns()
    }
  } catch (err: any) {
    triggerToast(`🚫 ${err?.data?.statusMessage || 'Errore creazione campagna.'}`, 'error')
  } finally {
    isSavingAd.value = false
  }
}

async function toggleCampaignStatus(campaign: LiveAdCampaign) {
  const nextStatus = campaign.status === 'active' ? 'paused' : 'active'
  try {
    await $fetch(`/api/admin/ads/${campaign.id}`, {
      method: 'PATCH',
      body: { status: nextStatus }
    })
    triggerToast(
      nextStatus === 'active' ? `▶️ Campagna "${campaign.title}" riattivata!` : `⏸️ Campagna "${campaign.title}" messa in pausa.`,
      'success'
    )
    await refreshCampaigns()
  } catch (err: any) {
    triggerToast(`🚫 ${err?.data?.statusMessage || 'Errore aggiornamento stato.'}`, 'error')
  }
}

async function deleteCampaign(campaign: LiveAdCampaign) {
  if (!confirm(`Eliminare definitivamente la campagna "${campaign.title}" da Neon DB?`)) return
  try {
    await $fetch(`/api/admin/ads/${campaign.id}`, {
      method: 'DELETE'
    })
    triggerToast('🗑️ Campagna rimossa dal database.', 'success')
    await refreshCampaigns()
  } catch (err: any) {
    triggerToast(`🚫 ${err?.data?.statusMessage || 'Errore eliminazione.'}`, 'error')
  }
}

// Test Checkout Reale Stripe per Licenze API
async function runRealStripeTest(plan: ApiPlanItem) {
  try {
    triggerToast(`⌛ Inizializzazione sessione Stripe per ${plan.title}...`, 'warning')
    const res: any = await $fetch('/api/checkout/stripe', {
      method: 'POST',
      body: {
        productId: plan.id,
        productName: plan.title,
        amount: plan.price,
        customerEmail: 'admin@devkernelpulse.org',
        type: 'API_LICENSE'
      }
    })
    if (res?.checkoutUrl) {
      window.open(res.checkoutUrl, '_blank', 'noopener,noreferrer')
      triggerToast('✅ Checkout Stripe aperto in una nuova scheda!', 'success')
    } else {
      triggerToast('⚠️ Stripe non ha restituito un checkoutUrl.', 'warning')
    }
  } catch (err: any) {
    triggerToast(`🚫 ${err?.data?.statusMessage || 'Errore connessione Stripe.'}`, 'error')
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#020420] text-slate-300 py-10 px-4 sm:px-6 font-sans">
    <!-- FLOATING TOAST -->
    <Transition name="toast-fade">
      <div
        v-if="showToast"
        :class="[
          'fixed top-6 right-6 z-50 p-4 rounded-xl backdrop-blur-md border shadow-2xl max-w-md flex items-center gap-3 font-mono text-xs sm:text-sm font-semibold transition-all',
          toastType === 'success'
            ? 'bg-[#041a13]/90 border-emerald-500/50 text-emerald-300 shadow-[0_0_20px_rgba(0,220,130,0.2)]'
            : toastType === 'error'
              ? 'bg-[#1e070a]/90 border-rose-500/50 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.2)]'
              : 'bg-[#1a1403]/90 border-amber-500/50 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
        ]"
      >
        <span class="text-xl">{{ toastType === 'success' ? '⚡' : toastType === 'error' ? '🚫' : '⚠️' }}</span>
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

          <div class="flex items-center gap-2">
            <NuxtLink
              to="/shop"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all no-underline"
            >
              🌐 Apri Store Pubblico
            </NuxtLink>
            <NuxtLink
              :to="getMainUrl('/admin')"
              external
              class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-bold text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/40 hover:bg-cyan-500/20 transition-all no-underline"
            >
              🏠 Dashboard Main
            </NuxtLink>
          </div>
        </div>

        <nav class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 font-mono">
          <NuxtLink :to="getApiUrl('/admin/api-gateway')" external class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/30 hover:bg-emerald-500/15 transition-all no-underline">
            ⚙️ API Gateway
          </NuxtLink>
          <NuxtLink :to="getMainUrl('/admin/mail')" external class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/30 hover:bg-emerald-500/15 transition-all no-underline">
            📧 Mail
          </NuxtLink>
          <NuxtLink :to="getMainUrl('/admin/newsletter')" external class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/30 hover:bg-emerald-500/15 transition-all no-underline">
            📣 Newsletter
          </NuxtLink>
          <NuxtLink :to="getMainUrl('/admin/crawler')" external class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/30 hover:bg-emerald-500/15 transition-all no-underline">
            🤖 Crawler
          </NuxtLink>
          <NuxtLink :to="getMainUrl('/admin/blog')" external class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/30 hover:bg-emerald-500/15 transition-all no-underline">
            📝 Blog
          </NuxtLink>
          <NuxtLink :to="getMainUrl('/admin/nodes')" external class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs text-sky-400 bg-sky-500/10 border border-sky-500/40 hover:bg-sky-500/20 transition-all no-underline">
            💬 Gestione Nodi
          </NuxtLink>
          <NuxtLink :to="getMainUrl('/admin/shop')" external class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs text-emerald-300 bg-emerald-500/20 border border-emerald-500/50 shadow-[0_0_10px_rgba(0,220,130,0.2)] no-underline">
            🛍️ Shop &amp; ADS
          </NuxtLink>
          <NuxtLink :to="getMainUrl('/admin/jobs')" external class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/30 hover:bg-emerald-500/15 transition-all no-underline">
            💼 Jobs
          </NuxtLink>
        </nav>
      </div>

      <!-- HEADER HERO -->
      <header class="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-gradient-to-r from-[#080d1a] via-[#091124] to-[#040711] border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl gap-6 relative overflow-hidden">
        <div class="absolute -right-20 -top-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -left-20 -bottom-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="relative z-10 flex flex-col gap-2">
          <div class="flex items-center gap-2.5 mb-1 flex-wrap font-mono">
            <span class="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-3 py-0.5 rounded-full text-xs font-black uppercase">
              DKP v2.6-PURE-SQL MONETIZATION
            </span>
            <span class="bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase">
              LIVE DB SYNC
            </span>
          </div>
          <h1 class="text-2xl sm:text-4xl font-black text-white tracking-tight m-0">
            Shop, <span class="text-emerald-400">DKP ADS &amp; Dev Library</span>
          </h1>
          <p class="text-slate-400 text-xs sm:text-sm max-w-2xl m-0">
            Monitora in tempo reale impressioni, click e campagne sponsor su Neon DB, gestisci le licenze API v2.6 e verifica la libreria affiliata Amazon.
          </p>
        </div>

        <div class="relative z-10 font-mono flex flex-wrap gap-2.5 w-full sm:w-auto">
          <button
            @click="refreshCampaigns(); refreshAffiliates()"
            class="px-4 py-3 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer transition-all"
          >
            ↻ Aggiorna Dati
          </button>
          <button
            @click="openNewAdModal"
            class="flex-1 sm:flex-initial px-5 py-3 rounded-xl font-black text-xs sm:text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-[0_0_20px_rgba(0,220,130,0.25)] cursor-pointer border-none"
          >
            ➕ Nuova Campagna DKP ADS
          </button>
        </div>
      </header>

      <!-- KPI TELEMETRY CARDS (REAL NEON DB) -->
      <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div class="bg-[#080d1a] border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-purple-500/40 transition-all shadow-lg">
          <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Campagne ADS Attive</span>
          <div class="text-3xl font-black text-purple-400 my-2">{{ adsStats.activeCount }} / {{ liveCampaigns.length }}</div>
          <span class="text-[11px] text-slate-500">Tabella dkp_ads_campaigns</span>
        </div>

        <div class="bg-[#080d1a] border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-sky-500/40 transition-all shadow-lg">
          <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Impression &amp; Click ADS</span>
          <div class="text-2xl font-black text-sky-400 my-2">
            {{ adsStats.totalImpressions.toLocaleString() }} <span class="text-sm text-slate-400">/ {{ adsStats.totalClicks }} click</span>
          </div>
          <span class="text-[11px] text-emerald-400 font-bold">CTR Medio: {{ globalCtr }}%</span>
        </div>

        <div class="bg-[#080d1a] border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-emerald-500/40 transition-all shadow-lg">
          <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Valore Ordini DKP ADS</span>
          <div class="text-3xl font-black text-emerald-400 my-2">€{{ (adsStats.totalRevenueCents / 100).toFixed(2) }}</div>
          <span class="text-[11px] text-slate-500">Self-Serve &amp; Buyer Esterni</span>
        </div>

        <div class="bg-[#080d1a] border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-amber-500/40 transition-all shadow-lg">
          <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Dev Library (Amazon)</span>
          <div class="text-3xl font-black text-amber-400 my-2">{{ affiliateBooks.length }} Libri</div>
          <span class="text-[11px] text-slate-500">Circuito Affiliazione v2.5</span>
        </div>
      </section>

      <!-- TABS & SEARCH BAR -->
      <section class="bg-[#080d1a] border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
        <div class="flex items-center gap-2 font-mono text-xs flex-wrap">
          <button
            @click="activeSection = 'ADS_CIRCUIT'"
            :class="[
              'px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer border',
              activeSection === 'ADS_CIRCUIT'
                ? 'bg-purple-500/15 text-purple-300 border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                : 'bg-[#040814] text-slate-400 border-slate-800 hover:border-slate-700'
            ]"
          >
            📢 Circuito DKP ADS ({{ liveCampaigns.length }})
          </button>

          <button
            @click="activeSection = 'API_LICENSES'"
            :class="[
              'px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer border',
              activeSection === 'API_LICENSES'
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/50 shadow-[0_0_10px_rgba(0,220,130,0.2)]'
                : 'bg-[#040814] text-slate-400 border-slate-800 hover:border-slate-700'
            ]"
          >
            🔑 Licenze API v2.6 ({{ apiPlans.length }})
          </button>

          <button
            @click="activeSection = 'AFFILIATE_LIBRARY'"
            :class="[
              'px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer border',
              activeSection === 'AFFILIATE_LIBRARY'
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                : 'bg-[#040814] text-slate-400 border-slate-800 hover:border-slate-700'
            ]"
          >
            📚 Libri Amazon ({{ affiliateBooks.length }})
          </button>
        </div>

        <div class="relative flex-1 max-w-md">
          <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Filtra per titolo, buyer, placement o URL..."
            class="w-full bg-[#040814] border border-slate-800 pl-11 pr-4 py-2.5 rounded-xl text-slate-100 text-xs outline-none focus:border-emerald-500 transition-all font-mono"
          />
        </div>
      </section>

      <!-- SEZIONE 1: CAMPAGNE DKP ADS SU NEON DB -->
      <section v-if="activeSection === 'ADS_CIRCUIT'" class="flex flex-col gap-4">
        <div v-if="isLoadingAds" class="p-10 text-center text-slate-500 font-mono text-xs bg-[#080d1a] rounded-2xl border border-slate-800">
          Caricamento campagne da Neon PostgreSQL...
        </div>

        <div v-else-if="filteredCampaigns.length === 0" class="p-12 text-center bg-[#080d1a] rounded-2xl border border-slate-800 flex flex-col items-center gap-3">
          <p class="text-slate-400 text-sm m-0">Nessuna campagna sponsor attiva su <code>dkp_ads_campaigns</code> (i widget stanno servendo le House Ads native).</p>
          <button
            @click="openNewAdModal"
            class="px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-mono font-black text-xs cursor-pointer border-none"
          >
            ➕ Crea la prima campagna ADS
          </button>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <article
            v-for="camp in filteredCampaigns"
            :key="camp.id"
            :class="[
              'bg-[#080d1a] border rounded-2xl p-5 shadow-xl flex flex-col justify-between gap-4 transition-all',
              camp.status === 'active' ? 'border-purple-500/40' : 'border-slate-800 opacity-75'
            ]"
          >
            <div class="flex flex-col gap-3">
              <div class="flex items-center justify-between gap-2 font-mono text-[10px]">
                <span
                  :class="[
                    'px-2 py-0.5 rounded font-black uppercase border',
                    camp.status === 'active'
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  ]"
                >
                  {{ camp.status }} • {{ camp.tier }}
                </span>
                <span class="text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded">
                  {{ camp.placement }}
                </span>
              </div>

              <div>
                <h3 class="text-white font-bold text-base m-0 mb-1">{{ camp.title }}</h3>
                <p class="text-slate-400 text-xs leading-relaxed line-clamp-2 m-0">{{ camp.tagline }}</p>
              </div>

              <div class="bg-[#040814] border border-slate-800 rounded-xl p-3 font-mono text-[11px] flex flex-col gap-1.5">
                <div class="flex justify-between text-slate-400">
                  <span>👁️ Impressioni:</span>
                  <strong class="text-white">
                    {{ camp.impressionsCount.toLocaleString() }}
                    <span v-if="camp.maxImpressions" class="text-slate-500">/ {{ camp.maxImpressions.toLocaleString() }}</span>
                  </strong>
                </div>
                <div class="flex justify-between text-slate-400">
                  <span>🖱️ Click / CTR:</span>
                  <strong class="text-emerald-400">{{ camp.clicksCount }} ({{ camp.ctr }}%)</strong>
                </div>
                <div class="flex justify-between text-slate-400 border-t border-slate-800 pt-1.5">
                  <span>👤 Buyer:</span>
                  <span class="text-slate-300 truncate max-w-[160px]">{{ camp.buyerName }}</span>
                </div>
                <div class="text-sky-400 truncate text-[10px]">🔗 {{ camp.targetUrl }}</div>
              </div>
            </div>

            <div class="flex items-center gap-2 font-mono text-xs pt-2 border-t border-slate-800/80">
              <button
                @click="toggleCampaignStatus(camp)"
                class="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold cursor-pointer border-none transition-all"
              >
                {{ camp.status === 'active' ? '⏸️ Pausa' : '▶️ Attiva' }}
              </button>
              <button
                @click="deleteCampaign(camp)"
                class="py-2 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 font-bold cursor-pointer transition-all"
                title="Elimina campagna"
              >
                🗑️
              </button>
            </div>
          </article>
        </div>
      </section>

      <!-- SEZIONE 2: LICENZE API v2.6 -->
      <section v-else-if="activeSection === 'API_LICENSES'" class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <article
          v-for="plan in apiPlans"
          :key="plan.id"
          class="bg-[#080d1a] border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-6 shadow-xl flex flex-col justify-between gap-4 transition-all"
        >
          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between font-mono">
              <span class="px-2.5 py-0.5 rounded text-[10px] font-black bg-sky-500/15 text-sky-400 border border-sky-500/30 uppercase">
                {{ plan.category }}
              </span>
              <span class="text-xl font-black text-emerald-400">€{{ plan.price.toFixed(2) }}/mo</span>
            </div>

            <h3 class="text-white font-bold text-lg m-0">{{ plan.title }}</h3>
            <p class="text-slate-400 text-xs leading-relaxed m-0">{{ plan.description }}</p>

            <div class="bg-[#040814] border border-slate-800 rounded-xl p-3 font-mono text-[11px] flex flex-col gap-1">
              <span class="text-slate-400">⚡ Quota: <strong class="text-white">{{ plan.quotaLimit }}</strong></span>
              <span class="text-emerald-400 truncate">📁 {{ plan.endpoint }}</span>
            </div>
          </div>

          <button
            @click="runRealStripeTest(plan)"
            class="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-black text-xs cursor-pointer border-none transition-all"
          >
            💳 Test Checkout Reale Stripe
          </button>
        </article>
      </section>

      <!-- SEZIONE 3: DKP DEV LIBRARY (AFFILIAZIONI AMAZON v2.5) -->
      <section v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div
          v-if="filteredAffiliateBooks.length === 0"
          class="col-span-full p-10 text-center text-slate-500 font-mono text-xs bg-[#080d1a] rounded-2xl border border-slate-800"
        >
          Nessun libro affiliato recuperato da <code>/api/v2.5/ads/active</code>.
        </div>

        <article
          v-for="(book, idx) in filteredAffiliateBooks"
          :key="book.id || idx"
          class="bg-[#080d1a] border border-amber-500/30 rounded-2xl p-5 shadow-xl flex flex-col justify-between gap-3"
        >
          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between font-mono text-[10px]">
              <span class="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 font-black">
                📚 AMAZON AFFILIATE
              </span>
              <span class="text-slate-500">ID #{{ book.id }}</span>
            </div>

            <h3 class="text-white font-bold text-base m-0">{{ book.title }}</h3>
            <p class="text-slate-400 text-xs leading-relaxed line-clamp-3 m-0">{{ book.snippet }}</p>
          </div>

          <div class="pt-3 border-t border-slate-800 flex items-center justify-between font-mono text-xs">
            <span class="text-slate-500 truncate max-w-[180px]">{{ book.url }}</span>
            <a
              :href="book.url"
              target="_blank"
              rel="noopener noreferrer"
              class="text-amber-400 hover:text-amber-300 font-bold no-underline"
            >
              Apri Link ↗
            </a>
          </div>
        </article>
      </section>
    </div>

    <!-- MODAL NUOVA CAMPAGNA DKP ADS SU NEON DB -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showCreateAdModal"
          class="fixed inset-0 z-50 bg-[#020420]/85 backdrop-blur-sm flex items-center justify-center p-4"
          @click.self="showCreateAdModal = false"
        >
          <div class="bg-[#080d1a] border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl flex flex-col gap-4 font-mono text-xs">
            <div class="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 class="text-white font-bold text-base font-sans m-0">➕ Attiva Nuova Campagna DKP ADS</h3>
              <button @click="showCreateAdModal = false" class="text-slate-500 hover:text-white text-lg cursor-pointer bg-transparent border-none">✕</button>
            </div>

            <form @submit.prevent="createLiveCampaign" class="flex flex-col gap-3">
              <input v-model="newAdForm.title" required placeholder="Titolo Campagna *" class="bg-[#040814] border border-slate-700 text-white p-3 rounded-xl outline-none focus:border-emerald-400" />
              <textarea v-model="newAdForm.tagline" rows="2" placeholder="Descrizione breve annuncio..." class="bg-[#040814] border border-slate-700 text-white p-3 rounded-xl outline-none focus:border-emerald-400 resize-none"></textarea>
              <input v-model="newAdForm.targetUrl" required placeholder="URL destinazione (https://... o /rotta-interna) *" class="bg-[#040814] border border-slate-700 text-sky-400 p-3 rounded-xl outline-none focus:border-emerald-400" />

              <div class="grid grid-cols-2 gap-3">
                <select v-model="newAdForm.placement" class="bg-[#040814] border border-slate-700 text-white p-3 rounded-xl outline-none focus:border-emerald-400 cursor-pointer">
                  <option value="nodeTalks">Placement: nodeTalks</option>
                  <option value="blogSidebar">Placement: blogSidebar</option>
                  <option value="feedInline">Placement: feedInline</option>
                  <option value="global">Placement: global</option>
                </select>

                <select v-model="newAdForm.tier" class="bg-[#040814] border border-slate-700 text-emerald-400 font-bold p-3 rounded-xl outline-none focus:border-emerald-400 cursor-pointer">
                  <option value="STARTER">STARTER (10k imp)</option>
                  <option value="PRO_NODE">PRO_NODE (50k imp)</option>
                  <option value="ECOSYSTEM_TAKEOVER">TAKEOVER (200k imp)</option>
                </select>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <input v-model="newAdForm.buyerName" placeholder="Nome Sponsor / Partner" class="bg-[#040814] border border-slate-700 text-white p-3 rounded-xl outline-none focus:border-emerald-400" />
                <input v-model="newAdForm.accentColor" placeholder="Colore (emerald/sky/purple/amber)" class="bg-[#040814] border border-slate-700 text-white p-3 rounded-xl outline-none focus:border-emerald-400" />
              </div>

              <div class="flex justify-end gap-2 pt-2">
                <button type="button" @click="showCreateAdModal = false" class="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold cursor-pointer border-none">
                  Annulla
                </button>
                <button type="submit" :disabled="isSavingAd" class="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black cursor-pointer border-none disabled:opacity-50">
                  {{ isSavingAd ? 'Salvataggio...' : '💾 Salva su Neon DB' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(-15px) scale(0.95);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>