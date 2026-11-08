<!-- app/pages/user/ads.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import DkpAdManager from '~/components/dashboard/DkpAdManager.vue'

useDkpSeo({
  title: 'DKP Ads Network Manager — DevKernelPulse v2.5-GOLD',
  description: 'Gestisci le tue campagne pubblicitarie, monitora la rotazione dei banner, controlla il CTR e acquista crediti sui nodi DKP.'
})

// 1. Stato della paginazione e filtri
const currentPage = ref(1)
const searchQuery = ref('')
const selectedStatusFilter = ref<'ALL' | 'ACTIVE' | 'PAUSED' | 'COMPLETED'>('ALL')
const showToast = ref(false)
const toastMessage = ref('')

function triggerToast(msg: string) {
  toastMessage.value = msg
  showToast.value = true
  setTimeout(() => showToast.value = false, 3500)
}

// 2. Fetch reattivo delle campagne
const { data: responseData, pending, refresh } = await useFetch('/api/v2.5/ads/manage', {
  query: computed(() => ({ 
    page: currentPage.value, 
    limit: 5,
    search: searchQuery.value,
    status: selectedStatusFilter.value !== 'ALL' ? selectedStatusFilter.value : undefined
  })),
  watch: [currentPage, selectedStatusFilter]
}).catch(() => ({ data: ref(null), pending: ref(false), refresh: () => {} }))

// Fallback fittizio per anteprima e test completo di interfaccia
const fallbackCampaigns = [
  {
    id: 'ad-101',
    title: 'Promuovi il tuo Micro-SaaS con Ollama & Nuxt 4',
    categoryTag: 'AI & LLM',
    targetUrl: 'https://devkernelpulse.com/hub/ai-tools',
    budgetCredits: 1450,
    usedCredits: 550,
    clicksCount: 320,
    impressionsCount: 8400,
    status: 'ACTIVE'
  },
  {
    id: 'ad-102',
    title: 'Vault Security Audit Pass - Sconto 30% VIP',
    categoryTag: 'CYBERSECURITY',
    targetUrl: 'https://devkernelpulse.com/vault/audit',
    budgetCredits: 800,
    usedCredits: 800,
    clicksCount: 195,
    impressionsCount: 4200,
    status: 'COMPLETED'
  },
  {
    id: 'ad-103',
    title: 'Corso Architettura Serverless & Cloud Native',
    categoryTag: 'DEVOPS',
    targetUrl: 'https://devkernelpulse.com/courses/devops',
    budgetCredits: 500,
    usedCredits: 120,
    clicksCount: 45,
    impressionsCount: 1100,
    status: 'PAUSED'
  }
]

// 3. Estrazione e filtraggio sicuro dei dati
const rawCampaigns = computed(() => {
  const data = responseData.value?.data
  return (data && data.length > 0) ? data : fallbackCampaigns
})

const filteredCampaigns = computed(() => {
  return rawCampaigns.value.filter((ad: any) => {
    const matchesSearch = ad.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                          (ad.categoryTag && ad.categoryTag.toLowerCase().includes(searchQuery.value.toLowerCase()))
    const matchesStatus = selectedStatusFilter.value === 'ALL' || ad.status === selectedStatusFilter.value
    return matchesSearch && matchesStatus
  })
})

const hasMore = computed(() => responseData.value?.pagination?.hasMore || false)

// 4. Paginazione
const nextPage = () => {
  if (hasMore.value && !pending.value) currentPage.value++
}
const prevPage = () => {
  if (currentPage.value > 1 && !pending.value) currentPage.value--
}

function handleCampaignCreated() {
  triggerToast('🎉 Nuova Campagna creata e inviata alla rete!')
  refresh()
}

// Statistiche Sintetiche
const totalActive = computed(() => rawCampaigns.value.filter((a: any) => a.status === 'ACTIVE').length)
const totalClicks = computed(() => rawCampaigns.value.reduce((acc: number, a: any) => acc + (a.clicksCount || 0), 0))
</script>

<template>
  <div class="min-h-screen bg-[#020420] text-slate-100 font-sans px-4 sm:px-6 py-8 sm:py-12 relative">
    
    <!-- TOAST NOTIFICATION -->
    <Transition name="fade">
      <div v-if="showToast" class="fixed top-20 sm:top-5 right-1/2 translate-x-1/2 sm:translate-x-0 sm:right-5 bg-slate-950 border border-emerald-500 text-emerald-400 px-6 py-3 rounded-xl shadow-[0_4px_20px_rgba(16,185,129,0.25)] font-bold text-sm z-50 whitespace-nowrap text-center">
        {{ toastMessage }}
      </div>
    </Transition>

    <div class="max-w-6xl mx-auto flex flex-col gap-6">
      
      <!-- NAVIGATION TABS BAR -->
      <nav class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 bg-[#090d16] p-2 border border-slate-800 rounded-2xl shadow-xl">
        <NuxtLink to="/user/dashboard?tab=profile" class="py-2.5 px-3 rounded-xl font-extrabold text-xs text-slate-400 hover:text-white border border-transparent text-center truncate">
          ⚙️ Profilo &amp; Social
        </NuxtLink>
        <NuxtLink to="/user/dashboard?tab=content" class="py-2.5 px-3 rounded-xl font-extrabold text-xs text-slate-400 hover:text-white border border-transparent text-center truncate">
          📰 I Miei Contenuti
        </NuxtLink>
        <NuxtLink to="/user/dashboard?tab=vault" class="py-2.5 px-3 rounded-xl font-extrabold text-xs text-slate-400 hover:text-white border border-transparent text-center truncate">
          🛡️ Proof of Code Vault
        </NuxtLink>
        <NuxtLink to="/user/dashboard?tab=api" class="py-2.5 px-3 rounded-xl font-extrabold text-xs text-slate-400 hover:text-white border border-transparent text-center truncate">
          🔑 DKP API Console
        </NuxtLink>
        <NuxtLink to="/user/dashboard?tab=gamification" class="py-2.5 px-3 rounded-xl font-extrabold text-xs text-slate-400 hover:text-white border border-transparent text-center truncate">
          🏆 Gamification &amp; XP
        </NuxtLink>
        <NuxtLink to="/bounties" class="py-2.5 px-3 rounded-xl font-extrabold text-xs bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 text-center truncate">
          🎯 Bounty &amp; $PULSE
        </NuxtLink>
      </nav>

      <!-- PAGE HEADER CARD -->
      <div class="bg-[#090d16] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative overflow-hidden">
        <div class="absolute -top-10 right-0 w-80 h-40 bg-sky-500/10 blur-[100px] pointer-events-none rounded-full"></div>

        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight">
              📢 DKP Ads Network Manager
            </h1>
            <span class="text-xs bg-sky-500/15 text-sky-400 border border-sky-500/30 px-2.5 py-0.5 rounded-md font-mono font-bold uppercase">v2.5 Engine</span>
          </div>
          <p class="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Crea campagne sponsorizzate, inserisci link affiliati e monitora la rotazione degli annunci e i click in tempo reale.
          </p>
        </div>

        <div class="flex items-center gap-4 bg-[#020420] border border-slate-800 p-4 rounded-2xl shrink-0">
          <div class="flex flex-col">
            <span class="text-[10px] text-slate-500 font-black uppercase tracking-wider">Campagne Attive</span>
            <span class="text-xl font-black text-emerald-400">{{ totalActive }}</span>
          </div>
          <div class="h-8 w-px bg-slate-800"></div>
          <div class="flex flex-col">
            <span class="text-[10px] text-slate-500 font-black uppercase tracking-wider">Click Totali</span>
            <span class="text-xl font-black text-sky-400 font-mono">{{ totalClicks }}</span>
          </div>
        </div>
      </div>

      <!-- MAIN DASHBOARD GRID -->
      <div class="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        <!-- COLONNA SINISTRA: Form Creazione Campagna -->
        <div class="xl:col-span-5 bg-[#090d16] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-4">
          <DkpAdManager @campaign-created="handleCampaignCreated" />
        </div>

        <!-- COLONNA DESTRA: Statistiche, Lista & Filtri -->
        <div class="xl:col-span-7 bg-[#090d16] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6">
          
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 class="text-xl font-black text-white">📊 Campagne in Rotazione</h3>
              <p class="text-slate-400 text-xs mt-0.5">Elenco dettagliato e telemetria inserzioni attive.</p>
            </div>
            
            <button 
              @click="refresh" 
              class="bg-[#020420] border border-sky-500/40 text-sky-400 font-bold text-xs px-3.5 py-2 rounded-xl hover:bg-sky-500/10 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
            >
              🔄 Aggiorna Dati
            </button>
          </div>

          <!-- BARRA DI RICERCA E FILTRI STATO -->
          <div class="flex flex-col sm:flex-row gap-3 bg-[#020420] p-3 border border-slate-800 rounded-2xl">
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Cerca inserzione per titolo o tag..." 
              class="flex-1 bg-[#090d16] border border-slate-700/80 text-white p-2.5 rounded-xl text-xs outline-none focus:border-sky-400"
            />
            
            <div class="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
              <button 
                v-for="st in ['ALL', 'ACTIVE', 'PAUSED', 'COMPLETED'] as const" 
                :key="st"
                @click="selectedStatusFilter = st"
                class="px-3 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer whitespace-nowrap"
                :class="selectedStatusFilter === st ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40' : 'text-slate-400 hover:text-white'"
              >
                {{ st }}
              </button>
            </div>
          </div>

          <!-- STATE LOADER -->
          <div v-if="pending" class="py-12 text-center text-slate-400 font-mono text-xs flex items-center justify-center gap-2">
            <span class="animate-spin text-sky-400">⚡</span> Sincronizzazione con il database Neon in corso...
          </div>

          <!-- STATE LISTA -->
          <div v-else-if="filteredCampaigns && filteredCampaigns.length > 0" class="flex flex-col gap-4">
            
            <div 
              v-for="ad in filteredCampaigns" 
              :key="ad.id" 
              class="bg-[#020420] border border-slate-800/80 hover:border-emerald-500/40 rounded-2xl p-5 flex flex-col gap-4 transition-all hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
            >
              <!-- CARD TOP BAR -->
              <div class="flex justify-between items-center">
                <div class="flex items-center gap-2">
                  <span 
                    class="w-2.5 h-2.5 rounded-full"
                    :class="ad.status === 'ACTIVE' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse' : ad.status === 'PAUSED' ? 'bg-amber-400' : 'bg-slate-600'"
                  ></span>
                  <span class="bg-sky-500/10 text-sky-400 border border-sky-500/30 text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase">
                    {{ ad.categoryTag || 'SPONSOR' }}
                  </span>
                </div>

                <span 
                  class="text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase border"
                  :class="ad.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : ad.status === 'PAUSED' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'"
                >
                  {{ ad.status }}
                </span>
              </div>
              
              <!-- TITOLO E TARGET URL -->
              <div>
                <h4 class="text-white font-extrabold text-base leading-tight">{{ ad.title }}</h4>
                <a 
                  :href="ad.targetUrl" 
                  target="_blank" 
                  class="text-slate-400 text-xs hover:text-emerald-400 transition-colors inline-flex items-center gap-1 mt-1 truncate max-w-full"
                >
                  🔗 {{ ad.targetUrl }}
                </a>
              </div>
              
              <!-- FOOTER TELEMETRIA -->
              <div class="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 text-xs">
                <div class="flex flex-col">
                  <span class="text-[10px] text-slate-500 font-bold uppercase">Budget Residuo</span>
                  <span class="font-mono font-black text-slate-200 mt-0.5">
                    {{ ad.budgetCredits }} <small class="text-slate-500 text-[10px]">Crediti</small>
                  </span>
                </div>

                <div class="flex flex-col">
                  <span class="text-[10px] text-slate-500 font-bold uppercase">Click / Impress.</span>
                  <span class="font-mono font-black text-sky-400 mt-0.5">
                    {{ ad.clicksCount || 0 }} <small class="text-slate-500 text-[10px]">/ {{ ad.impressionsCount || 0 }}</small>
                  </span>
                </div>

                <div class="flex flex-col items-end">
                  <span class="text-[10px] text-slate-500 font-bold uppercase">CTR Stimato</span>
                  <span class="font-mono font-black text-emerald-400 mt-0.5">
                    {{ ad.impressionsCount ? ((ad.clicksCount / ad.impressionsCount) * 100).toFixed(1) : '0.0' }}%
                  </span>
                </div>
              </div>
            </div>

            <!-- CONTROLLI PAGINAZIONE -->
            <div class="flex justify-between items-center mt-2 pt-4 border-t border-slate-800 text-xs">
              <button 
                @click="prevPage" 
                :disabled="currentPage === 1 || pending"
                class="px-4 py-2 bg-[#020420] border border-slate-800 text-emerald-400 font-bold rounded-xl hover:border-emerald-500 transition disabled:opacity-40 cursor-pointer"
              >
                ← Precedenti
              </button>
              
              <span class="text-slate-400 font-mono text-xs">
                Pagina <strong class="text-emerald-400">{{ currentPage }}</strong>
              </span>
              
              <button 
                @click="nextPage" 
                :disabled="!hasMore || pending"
                class="px-4 py-2 bg-[#020420] border border-slate-800 text-emerald-400 font-bold rounded-xl hover:border-emerald-500 transition disabled:opacity-40 cursor-pointer"
              >
                Successivi →
              </button>
            </div>

          </div>

          <!-- EMPTY STATE -->
          <div v-else class="bg-[#020420] border border-dashed border-slate-800 rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-2">
            <span class="text-3xl">📭</span>
            <p class="font-bold text-slate-300 text-sm m-0">Nessuna campagna trovata.</p>
            <span class="text-xs text-slate-500">Usa il manager a fianco per lanciare la tua prima inserzione sul network!</span>
          </div>

        </div>

      </div>

    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { 
  transition: opacity 0.4s ease, transform 0.4s ease; 
}
.fade-enter-from, .fade-leave-to { 
  opacity: 0; 
  transform: translateY(-10px); 
}
</style>