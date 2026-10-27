<!-- app/components/DKPAdBanner.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps({ 
  categoryTag: { type: String, default: 'SPONSORIZZATO DKP' } 
})

const isLoading = ref(true)

// Fallback multi-annuncio identico allo standard DKP per riempire sempre i 3 slot verticali
const fallbackAds = [
  {
    id: 'dkp-vault-promo',
    title: 'DKP Sentinel & Vault v2.5',
    snippet: 'Notarizza il tuo codice su Neon DB con hash SHA-256 e ottieni +100 $PULSE.',
    targetUrl: '/vault',
    categoryTag: 'PROMOZIONALE DKP',
    provider: 'DevKernelPulse Network'
  },
  {
    id: 'dkp-crawler-promo',
    title: 'DKP API Gateway & Crawler',
    snippet: 'Accedi alle API ad alta velocità con licenza sviluppatore DKP.',
    targetUrl: '/api-console',
    categoryTag: 'SPONSORIZZATO DKP',
    provider: 'DKP Edge Network'
  },
  {
    id: 'dkp-pulse-promo',
    title: '🚀 DKP Pulse Nexus Pro v2.5',
    snippet: 'Il motore di IA conversazionale e gamification definitivo per sviluppatori.',
    targetUrl: '/shop',
    categoryTag: 'HIGHLIGHT',
    provider: 'DKP Ecosystem'
  }
]

const ads = ref([...fallbackAds])

async function fetchSponsoredAds() {
  isLoading.value = true
  try {
    const res: any = await $fetch('/api/ads/active')
    if (res && res.success && res.data) {
      // Se l'API restituisce un singolo oggetto o un array, lo integriamo
      const dbAd = Array.isArray(res.data) ? res.data : [res.data]
      const formatted = dbAd.map((ad: any) => ({
        id: ad.id,
        title: ad.title,
        snippet: ad.snippet || 'Scopri l\'offerta sponsorizzata.',
        targetUrl: ad.targetUrl || ad.url || '/',
        categoryTag: ad.categoryTag || 'SPONSOR',
        provider: ad.provider || 'DKP Partner'
      }))
      // Uniamo col fallback per garantire sempre 3 card verticali
      ads.value = [...formatted, ...fallbackAds].slice(0, 3)
    }
  } catch (e) {
    // Mantiene i fallback in caso di errore
    ads.value = [...fallbackAds]
  } finally {
    isLoading.value = false
  }
}

async function trackClick(adId: string | number) {
  if (String(adId).startsWith('dkp-')) return
  try {
    await $fetch(`/api/ads/click?id=${adId}`, { method: 'POST' })
  } catch (_) {}
}

onMounted(() => {
  fetchSponsoredAds()
})
</script>

<template>
  <div class="bg-[#090d16] border border-amber-500/30 rounded-xl p-4 shadow-xl relative overflow-hidden font-mono text-xs flex flex-col gap-3">
    <!-- LIGHTING ACCENT -->
    <div class="absolute -top-12 -right-12 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none"></div>

    <!-- HEADER DEL BANNER -->
    <div class="flex items-center justify-between pb-2 border-b border-slate-800">
      <span class="text-[9px] bg-amber-500/15 text-amber-400 font-extrabold px-2 py-0.5 rounded border border-amber-500/30 tracking-wider">
        📣 {{ categoryTag }}
      </span>
      <span class="text-[9px] text-slate-500">Ad Network</span>
    </div>

    <div v-if="isLoading" class="py-6 text-center text-slate-500 text-[11px]">
      Caricamento sponsor...
    </div>

    <!-- PILA VERTICALE A 3 SLOT -->
    <div v-else class="flex flex-col gap-2.5">
      <div 
        v-for="ad in ads" 
        :key="ad.id" 
        class="bg-[#020420] border border-slate-800 hover:border-amber-500/40 rounded-lg p-3 transition-all flex flex-col gap-1.5 group"
      >
        <div class="flex items-center justify-between text-[9px]">
          <span class="text-sky-400 font-bold bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">
            {{ ad.categoryTag }}
          </span>
          <span class="text-slate-500">{{ ad.provider || 'DKP Partner' }}</span>
        </div>

        <h4 class="font-bold text-slate-100 text-xs group-hover:text-amber-300 transition-colors">
          <a :href="ad.targetUrl" target="_blank" @click="trackClick(ad.id)" class="flex items-center justify-between gap-1">
            <span>{{ ad.title }}</span>
            <span class="text-[10px]">↗</span>
          </a>
        </h4>

        <p class="text-slate-400 text-[10px] leading-relaxed font-sans line-clamp-2">
          {{ ad.snippet }}
        </p>

        <a 
          :href="ad.targetUrl" 
          target="_blank" 
          @click="trackClick(ad.id)"
          class="mt-1 text-center py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded font-bold text-[9px] transition-all"
        >
          Scopri di più →
        </a>
      </div>
    </div>
  </div>
</template>