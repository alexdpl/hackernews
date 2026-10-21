<!-- app/components/DkpAdStrip.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'

defineProps({
  categoryTag: {
    type: String,
    default: 'DKP ADS SPONSORED FEED'
  }
})

// 1. I nostri "House Ads" di riserva (fallback se il DB è vuoto o ha meno di 3 sponsor attivi)
const fallbackAds = [
  {
    id: 'fallback-1',
    title: '🚀 DKP Pulse Nexus Pro v2.5',
    snippet: 'Il motore di IA conversazionale e gamification definitivo per sviluppatori ed enterprise.',
    url: '/shop',
    tag: 'SPONSOR',
    provider: 'DevKernelPulse Network'
  },
  {
    id: 'fallback-2',
    title: '☁️ GCP, Azure o AWS? La guida definitiva',
    snippet: 'Non sai quale cloud provider scegliere? Leggi il nostro confronto tecnico e operativo.',
    url: '/blog/gcp-azure-aws-scelta-cloud', 
    tag: 'HIGHLIGHT',
    provider: 'DKP Editorial Hub'
  },
  {
    id: 'fallback-3',
    title: '🛡️ Sentinel AI Security Suite',
    snippet: 'Proteggi il tuo ecosistema Cloud con il monitoraggio attivo e le whitelist di sicurezza.',
    url: '/vault',
    tag: 'VAULT',
    provider: 'DevKernelPulse Network'
  }
]

// Array reattivo che conterrà il mix finale da mostrare a video
const ads = ref([...fallbackAds])

// 2. Fetch dal Database (Neon DB) all'avvio del componente
onMounted(async () => {
  try {
    const res = await $fetch<any>('/api/v2.5/ads/active')
    
    if (res.success && res.ads && res.ads.length > 0) {
      const dbAds = res.ads.map((ad: any) => ({
        id: ad.id,
        title: ad.title,
        snippet: ad.snippet || 'Scopri l\'offerta sponsorizzata selezionata dal Vault.',
        url: ad.url,
        tag: ad.tag || 'SPONSOR',
        provider: ad.provider || 'DKP Partner'
      }))

      // Uniamo gli annunci DB con i fallback per riempire sempre esattamente 3 slot
      ads.value = [...dbAds, ...fallbackAds].slice(0, 3)

      // Tracciamo un'impressione nel database per gli annunci reali mostrati a video
      dbAds.forEach((ad: any) => {
        $fetch('/api/v2.5/ads/track', {
          method: 'POST',
          body: { campaignId: ad.id, actionType: 'impression' }
        }).catch(e => console.error('Errore tracking impression silente:', e))
      })
    }
  } catch (err) {
    console.error('Nessun annuncio attivo recuperato, uso fallback.', err)
  }
})

// 3. Gestione Click & Consumo Crediti
const handleAdClick = async (adId: string | number) => {
  // Se è un fallback interno, non sprechiamo chiamate al DB
  if (String(adId).startsWith('fallback-')) return

  try {
    // Ping all'API di tracking per scalare 1 credito all'inserzionista
    await $fetch('/api/v2.5/ads/track', {
      method: 'POST',
      body: { campaignId: adId, actionType: 'click' }
    })
    console.log(`[DKP Ads] Click registrato e credito scalato per campagna: ${adId}`)
  } catch (err) {
    console.error('Errore durante il tracking del click:', err)
  }
}
</script>

<template>
  <div class="dkp-ad-strip">
    <div class="strip-header">
      <span class="strip-badge">📢 {{ categoryTag }}</span>
      <span class="strip-info">Annunci verificati dal Vault • DKP Ads Privacy Safe</span>
    </div>

    <div class="strip-grid">
      <NuxtLink 
        v-for="ad in ads" 
        :key="ad.id" 
        :to="ad.url"
        :external="!ad.url.startsWith('/')"
        :target="!ad.url.startsWith('/') ? '_blank' : '_self'"
        class="strip-item"
        @click="handleAdClick(ad.id)"
      >
        <div class="item-meta">
          <span class="item-tag">{{ ad.tag }}</span>
          <span class="item-provider">{{ ad.provider }}</span>
        </div>
        
        <h5 class="item-title">{{ ad.title }}</h5>
        <p class="item-snippet">{{ ad.snippet }}</p>
        
        <div class="item-footer">
          <span class="item-action">Visita sponsor →</span>
          <span class="privacy-tag">Secure</span>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.dkp-ad-strip {
  background: linear-gradient(135deg, rgba(9, 13, 22, 0.98), rgba(15, 23, 42, 0.98));
  border: 1px dashed rgba(56, 189, 248, 0.4);
  border-radius: 14px;
  padding: 1.2rem 1.5rem;
  margin: 2rem 0;
  font-family: system-ui, sans-serif;
  grid-column: 1 / -1; 
}

.strip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  border-bottom: 1px solid rgba(30, 41, 59, 0.8);
  padding-bottom: 0.6rem;
}

.strip-badge {
  font-size: 0.65rem;
  font-weight: 800;
  color: #eab308;
  background: rgba(234, 179, 8, 0.1);
  border: 1px solid rgba(234, 179, 8, 0.3);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  letter-spacing: 0.05em;
}

.strip-info {
  font-size: 0.7rem;
  color: #64748b;
}

.strip-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.strip-item {
  background: #020420;
  border: 1px solid #1e293b;
  border-radius: 10px;
  padding: 1rem;
  text-decoration: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition: all 0.25s ease;
  cursor: pointer;
}

.strip-item:hover {
  border-color: #00dc82;
  transform: translateY(-2.5px);
  box-shadow: 0 6px 20px rgba(0, 220, 130, 0.12);
}

.item-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-tag {
  font-size: 0.6rem;
  font-weight: 800;
  background: rgba(56, 189, 248, 0.1);
  color: #38bdf8;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
}

.item-provider {
  font-size: 0.65rem;
  color: #64748b;
}

.item-title {
  font-size: 0.95rem;
  font-weight: 800;
  color: #fff;
  margin: 0;
  line-height: 1.3;
}

.item-snippet {
  font-size: 0.8rem;
  color: #94a3b8;
  margin: 0;
  line-height: 1.4;
  flex-grow: 1;
}

.item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #1e293b;
  padding-top: 0.5rem;
  margin-top: 0.2rem;
  font-size: 0.7rem;
}

.item-action {
  color: #00dc82;
  font-weight: 700;
}

.privacy-tag {
  color: #475569;
}

@media (max-width: 1024px) {
  .strip-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .strip-grid { grid-template-columns: 1fr; }
}
</style>