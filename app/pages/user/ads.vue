<!-- app/pages/user/ads.vue -->
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import DkpAdManager from '~/components/dashboard/DkpAdManager.vue'

useDkpSeo({
  title: 'DKP Ads & Affiliate Manager — DevKernelPulse v2.6-PURE-SQL',
  description: 'Gestisci i tuoi ~100 link affiliati Amazon, campagne click & impressioni e telemetria CTR.',
  noindex: true
})

const { currentUser } = useAuthCore()
const { getMainUrl } = useDomain()

const resolvedUsername = computed(() => currentUser.value?.username || 'alexdpl')
const resolvedEmail = computed(() => currentUser.value?.email || '')
const isAdmin = computed(
  () =>
    String(currentUser.value?.role || '').toUpperCase() === 'ADMIN' ||
    resolvedUsername.value.toLowerCase() === 'alexdpl'
)

const scopeFilter = ref<'MINE' | 'ALL_NETWORK'>('ALL_NETWORK')
const selectedStatusFilter = ref<'ALL' | 'ACTIVE' | 'PAUSED' | 'EXHAUSTED'>('ALL')
const billingFilter = ref<'ALL' | 'CLICKS' | 'IMPRESSIONS' | 'HYBRID'>('ALL')
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = 8

const campaigns = ref<any[]>([])
const isLoading = ref(false)
const showToast = ref(false)
const toastMessage = ref('')

function triggerToast(msg: string) {
  toastMessage.value = msg
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3500)
}

const loadError = ref<string | null>(null)

async function fetchCampaigns() {
  isLoading.value = true
  loadError.value = null
  try {
    const res: any = await $fetch('/api/ads/manage', {
      query: {
        buyer: resolvedUsername.value,
        email: resolvedEmail.value || undefined,
        scope: isAdmin.value && scopeFilter.value === 'ALL_NETWORK' ? 'all' : 'mine',
        _t: Date.now()
      }
    })

    if (!res?.success && res?.error) {
      loadError.value = res.error
    }

    const raw = res?.data || []
    campaigns.value = Array.isArray(raw) ? raw : []
  } catch (err: any) {
    loadError.value = err?.data?.statusMessage || err?.message || 'Errore chiamata /api/ads/manage'
  } finally {
    isLoading.value = false
  }
}

const filteredCampaigns = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()

  return campaigns.value.filter((ad: any) => {
    const status = String(ad.status || 'active').toUpperCase()
    if (selectedStatusFilter.value !== 'ALL' && status !== selectedStatusFilter.value) return false

    const model = String(ad.billingModel || 'HYBRID').toUpperCase()
    if (billingFilter.value !== 'ALL' && model !== billingFilter.value) return false

    if (!q) return true

    return (
      String(ad.title || '').toLowerCase().includes(q) ||
      String(ad.tagline || '').toLowerCase().includes(q) ||
      String(ad.targetUrl || '').toLowerCase().includes(q) ||
      String(ad.categoryTag || '').toLowerCase().includes(q) ||
      String(ad.buyerName || '').toLowerCase().includes(q)
    )
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredCampaigns.value.length / itemsPerPage)))

const paginatedCampaigns = computed(() => {
  const safePage = Math.min(Math.max(1, currentPage.value), totalPages.value)
  const start = (safePage - 1) * itemsPerPage
  return filteredCampaigns.value.slice(start, start + itemsPerPage)
})

watch([searchQuery, selectedStatusFilter, billingFilter, scopeFilter], () => {
  currentPage.value = 1
})

const telemetryStats = computed(() => {
  return campaigns.value.reduce(
    (acc, ad: any) => {
      acc.total += 1
      if (String(ad.status || 'active').toLowerCase() === 'active') acc.active += 1
      acc.impressions += Number(ad.impressionsCount ?? 0)
      acc.clicks += Number(ad.clicksCount ?? 0)
      acc.maxClicks += Number(ad.maxClicks ?? 100)
      return acc
    },
    { total: 0, active: 0, impressions: 0, clicks: 0, maxClicks: 0 }
  )
})

const averageCtr = computed(() => {
  if (telemetryStats.value.impressions === 0) return '0.00%'
  return ((telemetryStats.value.clicks / telemetryStats.value.impressions) * 100).toFixed(2) + '%'
})

function clickProgressPercent(ad: any) {
  const max = Math.max(1, Number(ad.maxClicks || 100))
  const cur = Number(ad.clicksCount || 0)
  return Math.min(100, Math.round((cur / max) * 100))
}

function impressionProgressPercent(ad: any) {
  const max = Math.max(1, Number(ad.maxImpressions || 10000))
  const cur = Number(ad.impressionsCount || 0)
  return Math.min(100, Math.round((cur / max) * 100))
}

async function toggleCampaignStatus(ad: any) {
  const isCurrentlyActive = String(ad.status || 'active').toLowerCase() === 'active'
  const nextStatus = isCurrentlyActive ? 'paused' : 'active'

  try {
    const res: any = await $fetch(`/api/ads/${encodeURIComponent(ad.id)}`, {
      method: 'PATCH',
      body: { status: nextStatus }
    })
    if (res?.success) {
      ad.status = nextStatus
      triggerToast(nextStatus === 'active' ? '▶️ Inserzione riattivata!' : '⏸️ Inserzione in pausa.')
    }
  } catch (err: any) {
    triggerToast(`❌ ${err?.data?.statusMessage || 'Errore aggiornamento stato.'}`)
  }
}

async function topUpCampaign(ad: any) {
  try {
    const res: any = await $fetch(`/api/ads/${encodeURIComponent(ad.id)}`, {
      method: 'PATCH',
      body: { action: 'topup', addClicks: 100, addImpressions: 10000 }
    })
    if (res?.success && res.campaign) {
      ad.maxClicks = res.campaign.maxClicks
      ad.maxImpressions = res.campaign.maxImpressions
      ad.status = 'active'
      triggerToast('⚡ +100 Click e +10.000 Impressioni aggiunti!')
    }
  } catch (err: any) {
    triggerToast(`❌ ${err?.data?.statusMessage || 'Errore durante la ricarica.'}`)
  }
}

async function deleteCampaign(ad: any) {
  if (!confirm(`Eliminare definitivamente "${ad.title}"?`)) return
  try {
    const res: any = await $fetch(`/api/ads/${encodeURIComponent(ad.id)}`, { method: 'DELETE' })
    if (res?.success) {
      campaigns.value = campaigns.value.filter((item) => item.id !== ad.id)
      if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
      triggerToast('🗑️ Inserzione eliminata.')
    }
  } catch (err: any) {
    triggerToast(`❌ ${err?.data?.statusMessage || 'Errore eliminazione.'}`)
  }
}

function handleCampaignCreated() {
  triggerToast('🎉 Nuova inserzione aggiunta al circuito!')
  fetchCampaigns()
}

watch([resolvedUsername, scopeFilter], () => {
  fetchCampaigns()
})

onMounted(() => {
  fetchCampaigns()
})
</script>

<template>
  <div class="min-h-screen bg-[#020420] text-slate-100 font-sans px-4 sm:px-6 py-8 sm:py-12 relative">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="translate-y-2 opacity-0 scale-95"
      enter-to-class="translate-y-0 opacity-100 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="translate-y-0 opacity-100 scale-100"
      leave-to-class="translate-y-2 opacity-0 scale-95"
    >
      <div
        v-if="showToast"
        class="fixed top-20 sm:top-5 right-1/2 translate-x-1/2 sm:translate-x-0 sm:right-5 bg-slate-950 border border-emerald-500 text-emerald-400 px-6 py-3 rounded-xl shadow-[0_4px_20px_rgba(16,185,129,0.25)] font-bold text-sm z-50 whitespace-nowrap"
      >
        {{ toastMessage }}
      </div>
    </Transition>

    <div class="max-w-7xl mx-auto flex flex-col gap-6">
      <!-- BARRA NAVIGAZIONE UNIFICATA A 7 TAB -->
      <nav class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 bg-[#090d16] p-2 border border-slate-800 rounded-2xl shadow-xl font-mono">
        <NuxtLink to="/user/dashboard?tab=profile" class="py-2.5 px-3 rounded-xl font-extrabold text-xs text-slate-400 hover:text-white text-center truncate no-underline">
          ⚙️ Profilo
        </NuxtLink>
        <NuxtLink to="/user/dashboard?tab=content" class="py-2.5 px-3 rounded-xl font-extrabold text-xs text-slate-400 hover:text-white text-center truncate no-underline">
          📰 Contenuti &amp; Commenti
        </NuxtLink>
        <NuxtLink to="/user/dashboard?tab=vault" class="py-2.5 px-3 rounded-xl font-extrabold text-xs text-slate-400 hover:text-white text-center truncate no-underline">
          🛡️ Vault
        </NuxtLink>
        <NuxtLink to="/user/dashboard?tab=api" class="py-2.5 px-3 rounded-xl font-extrabold text-xs text-slate-400 hover:text-white text-center truncate no-underline">
          🔑 API Console
        </NuxtLink>
        <NuxtLink to="/user/dashboard?tab=gamification" class="py-2.5 px-3 rounded-xl font-extrabold text-xs text-slate-400 hover:text-white text-center truncate no-underline">
          🏆 XP &amp; Livelli
        </NuxtLink>
        <span class="py-2.5 px-3 rounded-xl font-extrabold text-xs bg-sky-500/15 border border-sky-500/40 text-sky-400 text-center truncate">
          📢 I Miei Link &amp; Ads
        </span>
        <NuxtLink to="/bounties" class="py-2.5 px-3 rounded-xl font-extrabold text-xs bg-amber-500/10 border border-amber-500/40 text-amber-400 hover:bg-amber-500/20 text-center truncate no-underline">
          🎯 Bounties
        </NuxtLink>
      </nav>

      <!-- HEADER -->
      <div class="bg-[#090d16] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative overflow-hidden">
        <div class="absolute -top-10 right-0 w-80 h-40 bg-sky-500/10 blur-[100px] pointer-events-none rounded-full"></div>

        <div class="relative z-10">
          <div class="flex flex-wrap items-center gap-2.5">
            <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight m-0">
              📢 DKP Ads &amp; Affiliate Manager
            </h1>
            <span class="text-[11px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-md font-mono font-black uppercase">
              CLICKS + IMPRESSIONS
            </span>
            <span
              v-if="isAdmin"
              class="text-[11px] bg-amber-500/15 text-amber-400 border border-amber-500/40 px-2.5 py-0.5 rounded-md font-mono font-black uppercase"
            >
              👑 ADMIN ({{ telemetryStats.total }} Link)
            </span>
          </div>
          <p class="text-slate-400 text-xs sm:text-sm mt-1.5 mb-0 max-w-2xl">
            Gestione unificata dei tuoi link affiliati Amazon e delle campagne sponsorizzate su <code class="text-sky-400">dkp_ads_campaigns</code>.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-4 bg-[#020420] border border-slate-800 p-4 rounded-2xl shrink-0 relative z-10 font-mono">
          <div class="flex flex-col">
            <span class="text-[10px] text-slate-500 font-black uppercase">Link Attivi</span>
            <span class="text-lg font-black text-emerald-400">{{ telemetryStats.active }} / {{ telemetryStats.total }}</span>
          </div>
          <div class="h-8 w-px bg-slate-800"></div>
          <div class="flex flex-col">
            <span class="text-[10px] text-slate-500 font-black uppercase">Click Erogati</span>
            <span class="text-lg font-black text-sky-400">{{ telemetryStats.clicks }} <small class="text-[10px] text-slate-500">/ {{ telemetryStats.maxClicks }}</small></span>
          </div>
          <div class="h-8 w-px bg-slate-800"></div>
          <div class="flex flex-col">
            <span class="text-[10px] text-slate-500 font-black uppercase">Impressioni / CTR</span>
            <span class="text-lg font-black text-white">{{ telemetryStats.impressions.toLocaleString('it-IT') }} <small class="text-xs text-amber-400">({{ averageCtr }})</small></span>
          </div>
          <NuxtLink
            :to="getMainUrl(`/user/${resolvedUsername}`)"
            external
            class="bg-slate-900 hover:bg-emerald-500/10 border border-slate-700 text-emerald-400 font-bold text-xs px-3 py-2 rounded-xl no-underline"
          >
            🌐 Profilo
          </NuxtLink>
        </div>
      </div>

      <!-- GRIGLIA PRINCIPALE -->
      <div class="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div class="xl:col-span-5">
          <DkpAdManager
            :username="resolvedUsername"
            :email="resolvedEmail"
            @campaign-created="handleCampaignCreated"
            @toast="triggerToast"
          />
        </div>

        <div class="xl:col-span-7 bg-[#090d16] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-5">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 class="text-xl font-black text-white m-0">📚 Libri &amp; Campagne in Rotazione</h2>
              <p class="text-slate-400 text-xs mt-0.5 mb-0">
                Mostrati <strong class="text-emerald-400">{{ filteredCampaigns.length }}</strong> elementi su {{ campaigns.length }} totali.
              </p>
            </div>

            <div class="flex items-center gap-2 font-mono">
              <div v-if="isAdmin" class="flex bg-[#020420] border border-slate-800 p-1 rounded-xl text-[11px]">
                <button
                  type="button"
                  @click="scopeFilter = 'ALL_NETWORK'"
                  :class="[
                    'px-2.5 py-1 rounded-lg font-bold cursor-pointer border-none transition-colors',
                    scopeFilter === 'ALL_NETWORK' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-white bg-transparent'
                  ]"
                >
                  👑 Tutti ({{ campaigns.length }})
                </button>
                <button
                  type="button"
                  @click="scopeFilter = 'MINE'"
                  :class="[
                    'px-2.5 py-1 rounded-lg font-bold cursor-pointer border-none transition-colors',
                    scopeFilter === 'MINE' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white bg-transparent'
                  ]"
                >
                  👤 I Miei
                </button>
              </div>

              <button
                type="button"
                @click="fetchCampaigns"
                class="bg-[#020420] border border-sky-500/40 text-sky-400 font-bold text-xs px-3.5 py-2 rounded-xl hover:bg-sky-500/10 transition-all cursor-pointer"
              >
                🔄 Aggiorna
              </button>
            </div>
          </div>

          <!-- RICERCA E FILTRI -->
          <div class="flex flex-col gap-2.5 bg-[#020420] p-3 border border-slate-800 rounded-2xl font-mono">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="🔍 Cerca tra i tuoi ~100 libri per titolo, ASIN/URL Amazon o tag..."
              class="w-full bg-[#090d16] border border-slate-700/80 text-white p-2.5 rounded-xl text-xs outline-none focus:border-sky-400"
            />

            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex gap-1 overflow-x-auto">
                <button
                  v-for="st in (['ALL', 'ACTIVE', 'PAUSED', 'EXHAUSTED'] as const)"
                  :key="st"
                  type="button"
                  @click="selectedStatusFilter = st"
                  class="px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer border"
                  :class="
                    selectedStatusFilter === st
                      ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                      : 'text-slate-400 hover:text-white border-transparent bg-transparent'
                  "
                >
                  {{ st }}
                </button>
              </div>

              <div class="flex gap-1 overflow-x-auto">
                <button
                  v-for="bm in ([
                    { id: 'ALL', label: 'Tutti i Modelli' },
                    { id: 'CLICKS', label: '🖱️ Click' },
                    { id: 'IMPRESSIONS', label: '👁️ Imp' },
                    { id: 'HYBRID', label: '⚡ Ibrido' }
                  ] as const)"
                  :key="bm.id"
                  type="button"
                  @click="billingFilter = bm.id"
                  class="px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer border"
                  :class="
                    billingFilter === bm.id
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'text-slate-400 hover:text-white border-transparent bg-transparent'
                  "
                >
                  {{ bm.label }}
                </button>
              </div>
            </div>
          </div>
        <div v-if="loadError" class="bg-rose-500/10 border border-rose-500/40 text-rose-300 rounded-2xl p-4 font-mono text-xs">
             ⚠️ Errore diagnostico: {{ loadError }}
            </div>
          <div v-if="isLoading" class="py-12 text-center text-slate-400 font-mono text-xs flex items-center justify-center gap-2">
            <span class="animate-spin text-sky-400">⚡</span> Sincronizzazione link e telemetria Neon DB...
          </div>

          <!-- LISTA CAMPAGNE -->
          <div v-else-if="paginatedCampaigns.length > 0" class="flex flex-col gap-3.5">
            <div
              v-for="ad in paginatedCampaigns"
              :key="ad.id"
              class="bg-[#020420] border border-slate-800/90 hover:border-emerald-500/40 rounded-2xl p-5 flex flex-col gap-3.5 transition-all"
            >
              <!-- TOP BAR -->
              <div class="flex flex-wrap justify-between items-center gap-2 font-mono">
                <div class="flex items-center gap-2 flex-wrap">
                  <span
                    class="w-2.5 h-2.5 rounded-full"
                    :class="
                      String(ad.status).toLowerCase() === 'active'
                        ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse'
                        : String(ad.status).toLowerCase() === 'paused'
                          ? 'bg-amber-400'
                          : 'bg-rose-400'
                    "
                  ></span>
                  <span class="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-black px-2 py-0.5 rounded-md uppercase">
                    {{ ad.categoryTag || ad.badge || 'LIBRI AMAZON' }}
                  </span>
                  <span class="bg-sky-500/10 text-sky-400 border border-sky-500/30 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                    {{ ad.billingModel || 'HYBRID' }}
                  </span>
                  <span class="text-[10px] text-slate-500">{{ ad.id }}</span>
                </div>

                <span
                  class="text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase border"
                  :class="
                    String(ad.status).toLowerCase() === 'active'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : String(ad.status).toLowerCase() === 'paused'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  "
                >
                  {{ String(ad.status || 'active').toUpperCase() }}
                </span>
              </div>

              <!-- TITOLO & URL -->
              <div>
                <h3 class="text-white font-extrabold text-sm sm:text-base leading-snug m-0">{{ ad.title }}</h3>
                <p v-if="ad.tagline" class="text-slate-400 text-xs mt-1 mb-0 line-clamp-2">{{ ad.tagline }}</p>
                <a
                  :href="ad.targetUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-sky-400 text-xs font-mono hover:text-emerald-400 transition-colors inline-flex items-center gap-1 mt-1.5 break-all no-underline"
                >
                  🔗 {{ ad.targetUrl }}
                </a>
              </div>

              <!-- DOPPIA BARRA TELEMETRIA: CLICK + IMPRESSIONI -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#090d16] border border-slate-800/80 p-3 rounded-xl font-mono text-xs">
                <div class="flex flex-col gap-1.5">
                  <div class="flex justify-between text-[11px]">
                    <span class="text-slate-400 font-bold">🖱️ Quota Click</span>
                    <span class="text-emerald-400 font-black">
                      {{ Number(ad.clicksCount || 0) }} / {{ Number(ad.maxClicks || 100) }}
                    </span>
                  </div>
                  <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-emerald-400 rounded-full transition-all"
                      :style="{ width: `${clickProgressPercent(ad)}%` }"
                    ></div>
                  </div>
                </div>

                <div class="flex flex-col gap-1.5">
                  <div class="flex justify-between text-[11px]">
                    <span class="text-slate-400 font-bold">👁️ Impressioni</span>
                    <span class="text-sky-400 font-black">
                      {{ Number(ad.impressionsCount || 0).toLocaleString('it-IT') }} / {{ Number(ad.maxImpressions || 10000).toLocaleString('it-IT') }}
                    </span>
                  </div>
                  <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-sky-400 rounded-full transition-all"
                      :style="{ width: `${impressionProgressPercent(ad)}%` }"
                    ></div>
                  </div>
                </div>
              </div>

              <!-- FOOTER AZIONI -->
              <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs font-mono">
                <span class="text-slate-400">
                  CTR:
                  <strong class="text-amber-400">
                    {{
                      Number(ad.impressionsCount || 0) > 0
                        ? ((Number(ad.clicksCount || 0) / Number(ad.impressionsCount || 0)) * 100).toFixed(2)
                        : '0.00'
                    }}%
                  </strong>
                </span>

                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    @click="topUpCampaign(ad)"
                    title="Aggiungi +100 Click e +10.000 Impressioni"
                    class="px-2.5 py-1.5 rounded-lg text-[11px] font-black cursor-pointer bg-sky-500/10 text-sky-400 border border-sky-500/30 hover:bg-sky-500/20"
                  >
                    +100 Click
                  </button>

                  <button
                    type="button"
                    @click="toggleCampaignStatus(ad)"
                    class="px-2.5 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer border"
                    :class="
                      String(ad.status).toLowerCase() === 'active'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                    "
                  >
                    {{ String(ad.status).toLowerCase() === 'active' ? '⏸ Pausa' : '▶️ Attiva' }}
                  </button>

                  <button
                    type="button"
                    @click="deleteCampaign(ad)"
                    class="px-2.5 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>

            <!-- PAGINAZIONE -->
            <div class="flex justify-between items-center mt-1 pt-4 border-t border-slate-800 text-xs font-mono">
              <button
                type="button"
                @click="currentPage--"
                :disabled="currentPage <= 1"
                class="px-4 py-2 bg-[#020420] border border-slate-800 text-emerald-400 font-bold rounded-xl hover:border-emerald-500 transition disabled:opacity-40 cursor-pointer"
              >
                ← Precedenti
              </button>

              <span class="text-slate-400 text-xs">
                Pagina <strong class="text-emerald-400">{{ currentPage }}</strong> / {{ totalPages }}
                <span class="text-slate-500 ml-1">({{ filteredCampaigns.length }} link)</span>
              </span>

              <button
                type="button"
                @click="currentPage++"
                :disabled="currentPage >= totalPages"
                class="px-4 py-2 bg-[#020420] border border-slate-800 text-emerald-400 font-bold rounded-xl hover:border-emerald-500 transition disabled:opacity-40 cursor-pointer"
              >
                Successivi →
              </button>
            </div>
          </div>

          <div v-else class="bg-[#020420] border border-dashed border-slate-800 rounded-2xl p-8 text-center flex flex-col items-center gap-2">
            <span class="text-3xl">📭</span>
            <p class="font-bold text-slate-300 text-sm m-0">Nessuna campagna trovata con i filtri attuali.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>