<script setup lang="ts">
import { ref, computed } from 'vue'
import DkpAdminShell from '~/components/admin/DkpAdminShell.vue'

definePageMeta({
  middleware: 'admin-only'
})

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

const { data: affiliateData, refresh: refreshAffiliates } = await useFetch<any>('/api/ads/active', {
  key: 'admin-affiliate-books',
  server: false,
  lazy: true
})

const affiliateBooks = computed<any[]>(() => {
  const list = affiliateData.value?.ads
  return Array.isArray(list) ? list : []
})

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
    return triggerToast('Inserisci Titolo e URL destinazione.', 'warning')
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
      triggerToast(`Campagna attivata su Neon DB (ID: ${res.campaign.id})`, 'success')
      showCreateAdModal.value = false
      await refreshCampaigns()
    }
  } catch (err: any) {
    triggerToast(`${err?.data?.statusMessage || 'Errore creazione campagna.'}`, 'error')
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
      nextStatus === 'active' ? `Campagna "${campaign.title}" riattivata!` : `Campagna "${campaign.title}" messa in pausa.`,
      'success'
    )
    await refreshCampaigns()
  } catch (err: any) {
    triggerToast(`${err?.data?.statusMessage || 'Errore aggiornamento stato.'}`, 'error')
  }
}

async function deleteCampaign(campaign: LiveAdCampaign) {
  if (!confirm(`Eliminare definitivamente la campagna "${campaign.title}" da Neon DB?`)) return
  try {
    await $fetch(`/api/admin/ads/${campaign.id}`, {
      method: 'DELETE'
    })
    triggerToast('Campagna rimossa dal database.', 'success')
    await refreshCampaigns()
  } catch (err: any) {
    triggerToast(`${err?.data?.statusMessage || 'Errore eliminazione.'}`, 'error')
  }
}

async function runRealStripeTest(plan: ApiPlanItem) {
  try {
    triggerToast(`Inizializzazione sessione Stripe per ${plan.title}...`, 'warning')
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
      triggerToast('Checkout Stripe aperto in una nuova scheda!', 'success')
    } else {
      triggerToast('Stripe non ha restituito un checkoutUrl.', 'warning')
    }
  } catch (err: any) {
    triggerToast(`${err?.data?.statusMessage || 'Errore connessione Stripe.'}`, 'error')
  }
}
</script>

<template>
  <DkpAdminShell
    title="Shop, DKP ADS & Dev Library"
    subtitle="Monitora in tempo reale impressioni, click e campagne sponsor su Neon DB, gestisci le licenze API v2.6 e verifica la libreria affiliata Amazon."
    badge="DKP v2.6-PURE-SQL MONETIZATION"
    seo-title="Shop, DKP ADS & Affiliate Control Center v2.6 — DKP Admin"
    seo-description="Gestione centralizzata del circuito DKP ADS su Neon Pure-SQL, licenze API v2.6 e affiliazioni Amazon Dev Library."
  >
    <template #actions>
      <NuxtLink
        to="/shop"
        class="px-3.5 py-2.5 rounded-xl font-bold text-xs text-cyan-300 bg-dkp-bg border border-dkp-border hover:border-cyan-400 no-underline transition-all"
      >
        Store Pubblico &nearr;
      </NuxtLink>
      <button
        type="button"
        @click="refreshCampaigns(); refreshAffiliates()"
        class="px-3.5 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
      >
         Aggiorna Dati
      </button>
      <button
        type="button"
        @click="openNewAdModal"
        class="px-4 py-2.5 rounded-xl font-extrabold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-none transition-all shadow-[0_0_20px_rgba(0,220,130,0.25)] cursor-pointer"
      >
        + Nuova Campagna DKP ADS
      </button>
    </template>

    <!-- FLOATING TOAST -->
    <div
      v-if="showToast"
      :class="[
        'fixed top-6 right-6 z-50 p-4 rounded-xl backdrop-blur-md border shadow-2xl max-w-md flex items-center gap-3 font-mono text-xs font-semibold',
        toastType === 'success' ? 'bg-[#041a13]/95 border-emerald-500/50 text-emerald-300' :
        toastType === 'error' ? 'bg-[#1e070a]/95 border-rose-500/50 text-rose-300' :
        'bg-[#1a1403]/95 border-amber-500/50 text-amber-300'
      ]"
    >
      <span>{{ toastType === 'success' ? '⚡' : toastType === 'error' ? '🚫' : '⚠️' }}</span>
      <span>{{ toastMessage }}</span>
    </div>

    <!-- KPI TELEMETRY CARDS -->
    <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
      <div class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-5 flex flex-col justify-between hover:border-purple-500/40 card-glow">
        <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Campagne ADS Attive</span>
        <div class="text-3xl font-black text-purple-400 my-2">{{ adsStats.activeCount }} / {{ liveCampaigns.length }}</div>
        <span class="text-[11px] text-slate-500">Tabella dkp_ads_campaigns</span>
      </div>

      <div class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-5 flex flex-col justify-between hover:border-sky-500/40 card-glow">
        <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Impression &amp; Click ADS</span>
        <div class="text-2xl font-black text-sky-400 my-2">
          {{ adsStats.totalImpressions.toLocaleString() }} <span class="text-sm text-slate-400">/ {{ adsStats.totalClicks }} click</span>
        </div>
        <span class="text-[11px] text-emerald-400 font-bold">CTR Medio: {{ globalCtr }}%</span>
      </div>

      <div class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-5 flex flex-col justify-between hover:border-emerald-500/40 card-glow">
        <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Valore Ordini DKP ADS</span>
        <div class="text-3xl font-black text-emerald-400 my-2">&euro;{{ (adsStats.totalRevenueCents / 100).toFixed(2) }}</div>
        <span class="text-[11px] text-slate-500">Self-Serve &amp; Buyer Esterni</span>
      </div>

      <div class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-5 flex flex-col justify-between hover:border-amber-500/40 card-glow">
        <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Dev Library (Amazon)</span>
        <div class="text-3xl font-black text-amber-400 my-2">{{ affiliateBooks.length }} Libri</div>
        <span class="text-[11px] text-slate-500">Circuito Affiliazione v2.5</span>
      </div>
    </section>

    <!-- TABS & SEARCH BAR -->
    <section class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-4 sm:p-5 card-glow flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
      <div class="flex items-center gap-2 font-mono text-xs flex-wrap">
        <button
          type="button"
          @click="activeSection = 'ADS_CIRCUIT'"
          :class="[
            'px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer border',
            activeSection === 'ADS_CIRCUIT'
              ? 'bg-purple-500/15 text-purple-300 border-purple-500/50'
              : 'bg-dkp-bg text-slate-400 border-dkp-border hover:border-slate-700'
          ]"
        >
          Circuito DKP ADS ({{ liveCampaigns.length }})
        </button>

        <button
          type="button"
          @click="activeSection = 'API_LICENSES'"
          :class="[
            'px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer border',
            activeSection === 'API_LICENSES'
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/50'
              : 'bg-dkp-bg text-slate-400 border-dkp-border hover:border-slate-700'
          ]"
        >
          Licenze API v2.6 ({{ apiPlans.length }})
        </button>

        <button
          type="button"
          @click="activeSection = 'AFFILIATE_LIBRARY'"
          :class="[
            'px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer border',
            activeSection === 'AFFILIATE_LIBRARY'
              ? 'bg-amber-500/15 text-amber-400 border-amber-500/50'
              : 'bg-dkp-bg text-slate-400 border-dkp-border hover:border-slate-700'
          ]"
        >
          Libri Amazon ({{ affiliateBooks.length }})
        </button>
      </div>

      <div class="relative flex-1 max-w-md">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Filtra per titolo, buyer, placement o URL..."
          class="w-full bg-dkp-bg border border-dkp-border px-4 py-2.5 rounded-xl text-slate-100 text-xs outline-none focus:border-emerald-500 font-mono box-border"
        />
      </div>
    </section>

    <!-- SEZIONE 1: CAMPAGNE DKP ADS -->
    <section v-if="activeSection === 'ADS_CIRCUIT'" class="flex flex-col gap-4">
      <div v-if="isLoadingAds" class="p-10 text-center text-slate-400 font-mono text-xs bg-dkp-card/95 rounded-2xl border border-dkp-border">
        Caricamento campagne da Neon PostgreSQL...
      </div>

      <div v-else-if="filteredCampaigns.length === 0" class="p-12 text-center bg-dkp-card/95 rounded-2xl border border-dkp-border flex flex-col items-center gap-3">
        <p class="text-slate-400 text-sm m-0">Nessuna campagna sponsor attiva su <code>dkp_ads_campaigns</code> (i widget stanno servendo le House Ads native).</p>
        <button
          type="button"
          @click="openNewAdModal"
          class="px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-mono font-extrabold text-xs cursor-pointer border-none"
        >
          + Crea la prima campagna ADS
        </button>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <article
          v-for="camp in filteredCampaigns"
          :key="camp.id"
          :class="[
            'bg-dkp-card/95 border rounded-2xl p-5 card-glow flex flex-col justify-between gap-4 transition-all',
            camp.status === 'active' ? 'border-purple-500/40' : 'border-dkp-border opacity-75'
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
                {{ camp.status }} &bull; {{ camp.tier }}
              </span>
              <span class="text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded">
                {{ camp.placement }}
              </span>
            </div>

            <div>
              <h3 class="text-white font-bold text-base m-0 mb-1">{{ camp.title }}</h3>
              <p class="text-slate-400 text-xs leading-relaxed line-clamp-2 m-0">{{ camp.tagline }}</p>
            </div>

            <div class="bg-dkp-bg border border-dkp-border rounded-xl p-3 font-mono text-[11px] flex flex-col gap-1.5">
              <div class="flex justify-between text-slate-400">
                <span>Impressioni:</span>
                <strong class="text-white">
                  {{ camp.impressionsCount.toLocaleString() }}
                  <span v-if="camp.maxImpressions" class="text-slate-500">/ {{ camp.maxImpressions.toLocaleString() }}</span>
                </strong>
              </div>
              <div class="flex justify-between text-slate-400">
                <span>Click / CTR:</span>
                <strong class="text-emerald-400">{{ camp.clicksCount }} ({{ camp.ctr }}%)</strong>
              </div>
              <div class="flex justify-between text-slate-400 border-t border-dkp-border pt-1.5">
                <span>Buyer:</span>
                <span class="text-slate-300 truncate max-w-[160px]">{{ camp.buyerName }}</span>
              </div>
              <div class="text-sky-400 truncate text-[10px]">{{ camp.targetUrl }}</div>
            </div>
          </div>

          <div class="flex items-center gap-2 font-mono text-xs pt-2 border-t border-dkp-border/80">
            <button
              type="button"
              @click="toggleCampaignStatus(camp)"
              class="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold cursor-pointer border-none"
            >
              {{ camp.status === 'active' ? 'Pausa' : 'Attiva' }}
            </button>
            <button
              type="button"
              @click="deleteCampaign(camp)"
              class="py-2 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 font-bold cursor-pointer"
            >
              Elimina
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
        class="bg-dkp-card/95 border border-dkp-border hover:border-emerald-500/50 rounded-2xl p-6 card-glow flex flex-col justify-between gap-4"
      >
        <div class="flex flex-col gap-3">
          <div class="flex items-center justify-between font-mono">
            <span class="px-2.5 py-0.5 rounded text-[10px] font-black bg-sky-500/15 text-sky-400 border border-sky-500/30 uppercase">
              {{ plan.category }}
            </span>
            <span class="text-xl font-black text-emerald-400">&euro;{{ plan.price.toFixed(2) }}/mo</span>
          </div>

          <h3 class="text-white font-bold text-lg m-0">{{ plan.title }}</h3>
          <p class="text-slate-400 text-xs leading-relaxed m-0">{{ plan.description }}</p>

          <div class="bg-dkp-bg border border-dkp-border rounded-xl p-3 font-mono text-[11px] flex flex-col gap-1">
            <span class="text-slate-400">Quota: <strong class="text-white">{{ plan.quotaLimit }}</strong></span>
            <span class="text-emerald-400 truncate">{{ plan.endpoint }}</span>
          </div>
        </div>

        <button
          type="button"
          @click="runRealStripeTest(plan)"
          class="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-extrabold text-xs cursor-pointer border-none"
        >
          Test Checkout Reale Stripe
        </button>
      </article>
    </section>

    <!-- SEZIONE 3: DKP DEV LIBRARY -->
    <section v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <div
        v-if="filteredAffiliateBooks.length === 0"
        class="col-span-full p-10 text-center text-slate-500 font-mono text-xs bg-dkp-card/95 rounded-2xl border border-dkp-border"
      >
        Nessun libro affiliato recuperato da <code>/api/ads/active</code>.
      </div>

      <article
        v-for="(book, idx) in filteredAffiliateBooks"
        :key="book.id || idx"
        class="bg-dkp-card/95 border border-amber-500/30 rounded-2xl p-5 card-glow flex flex-col justify-between gap-3"
      >
        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between font-mono text-[10px]">
            <span class="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 font-black">
              AMAZON AFFILIATE
            </span>
            <span class="text-slate-500">ID #{{ book.id }}</span>
          </div>

          <h3 class="text-white font-bold text-base m-0">{{ book.title }}</h3>
          <p class="text-slate-400 text-xs leading-relaxed line-clamp-3 m-0">{{ book.snippet }}</p>
        </div>

        <div class="pt-3 border-t border-dkp-border flex items-center justify-between font-mono text-xs">
          <span class="text-slate-500 truncate max-w-[180px]">{{ book.url }}</span>
          <a
            :href="book.url"
            target="_blank"
            rel="noopener noreferrer"
            class="text-amber-400 hover:text-amber-300 font-bold no-underline"
          >
            Apri Link &nearr;
          </a>
        </div>
      </article>
    </section>

    <!-- MODAL NUOVA CAMPAGNA DKP ADS -->
    <Teleport to="body">
      <div
        v-if="showCreateAdModal"
        class="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4"
        @click.self="showCreateAdModal = false"
      >
        <div class="bg-dkp-card border border-dkp-border rounded-2xl w-full max-w-lg p-6 shadow-2xl flex flex-col gap-4 font-mono text-xs">
          <div class="flex justify-between items-center border-b border-dkp-border pb-3">
            <h3 class="text-white font-bold text-base font-display m-0">Attiva Nuova Campagna DKP ADS</h3>
            <button type="button" @click="showCreateAdModal = false" class="text-slate-500 hover:text-white text-lg cursor-pointer bg-transparent border-none"></button>
          </div>

          <form @submit.prevent="createLiveCampaign" class="flex flex-col gap-3">
            <input v-model="newAdForm.title" required placeholder="Titolo Campagna *" class="bg-dkp-bg border border-dkp-border text-white p-3 rounded-xl outline-none focus:border-emerald-400 box-border" />
            <textarea v-model="newAdForm.tagline" rows="2" placeholder="Descrizione breve annuncio..." class="bg-dkp-bg border border-dkp-border text-white p-3 rounded-xl outline-none focus:border-emerald-400 resize-none box-border"></textarea>
            <input v-model="newAdForm.targetUrl" required placeholder="URL destinazione (https://... o /rotta-interna) *" class="bg-dkp-bg border border-dkp-border text-sky-400 p-3 rounded-xl outline-none focus:border-emerald-400 box-border" />

            <div class="grid grid-cols-2 gap-3">
              <select v-model="newAdForm.placement" class="bg-dkp-bg border border-dkp-border text-white p-3 rounded-xl outline-none cursor-pointer">
                <option value="nodeTalks">Placement: nodeTalks</option>
                <option value="blogSidebar">Placement: blogSidebar</option>
                <option value="feedInline">Placement: feedInline</option>
                <option value="global">Placement: global</option>
              </select>

              <select v-model="newAdForm.tier" class="bg-dkp-bg border border-dkp-border text-emerald-400 font-bold p-3 rounded-xl outline-none cursor-pointer">
                <option value="STARTER">STARTER (10k imp)</option>
                <option value="PRO_NODE">PRO_NODE (50k imp)</option>
                <option value="ECOSYSTEM_TAKEOVER">TAKEOVER (200k imp)</option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <input v-model="newAdForm.buyerName" placeholder="Nome Sponsor / Partner" class="bg-dkp-bg border border-dkp-border text-white p-3 rounded-xl outline-none box-border" />
              <input v-model="newAdForm.accentColor" placeholder="Colore (emerald/sky/purple/amber)" class="bg-dkp-bg border border-dkp-border text-white p-3 rounded-xl outline-none box-border" />
            </div>

            <div class="flex justify-end gap-2 pt-2">
              <button type="button" @click="showCreateAdModal = false" class="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold cursor-pointer border-none">
                Annulla
              </button>
              <button type="submit" :disabled="isSavingAd" class="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-extrabold cursor-pointer border-none disabled:opacity-50">
                {{ isSavingAd ? 'Salvataggio...' : 'Salva su Neon DB' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </DkpAdminShell>
</template>