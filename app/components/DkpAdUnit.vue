<!-- app/components/app/DkpAdUnit.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'

defineProps({
  categoryTag: {
    type: String,
    default: 'SPONSORIZZATO DKP'
  }
})

// Simulazione di un banner pubblicitario testuale intelligente del network
const ad = ref({
  title: '🚀 Sblocca il potenziale di Nuxt 3 con DKP Pulse Nexus Pro v2.5',
  snippet: 'Il motore di IA conversazionale e gamification definitivo per sviluppatori ed enterprise. Scopri di più.',
  url: '/shop',
  advertiser: 'DevKernelPulse Network'
})
</script>

<template>
  <div class="dkp-ad-container">
    <div class="ad-header">
      <span class="ad-badge">📢 {{ categoryTag }}</span>
      <span class="ad-provider">{{ ad.advertiser }}</span>
    </div>
    <a :href="ad.url" class="ad-body-link" target="_blank">
      <h4 class="ad-title">{{ ad.title }}</h4>
      <p class="ad-snippet">{{ ad.snippet }}</p>
    </a>
    <div class="ad-footer">
      <span class="ad-cta">Visita sponsor →</span>
      <span class="ad-privacy">DKP Ads Privacy Safe</span>
    </div>
  </div>
</template>

<style scoped>
.dkp-ad-container {
  background: linear-gradient(135deg, rgba(9, 13, 22, 0.95), rgba(15, 23, 42, 0.95));
  border: 1px dashed rgba(56, 189, 248, 0.4);
  border-radius: 12px;
  padding: 1.2rem;
  margin: 1.5rem 0;
  color: #fff;
  font-family: system-ui, sans-serif;
  transition: all 0.25s ease;
}
.dkp-ad-container:hover {
  border-color: #00dc82;
  box-shadow: 0 4px 20px rgba(0, 220, 130, 0.1);
}
.ad-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.6rem;
}
.ad-badge {
  font-size: 0.65rem;
  font-weight: 800;
  background: rgba(234, 179, 8, 0.1);
  color: #eab308;
  border: 1px solid rgba(234, 179, 8, 0.3);
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  letter-spacing: 0.05em;
}
.ad-provider {
  font-size: 0.7rem;
  color: #64748b;
}
.ad-body-link {
  text-decoration: none;
  display: block;
  margin-bottom: 0.8rem;
}
.ad-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: #38bdf8;
  margin: 0 0 0.3rem 0;
  transition: color 0.2s;
}
.ad-body-link:hover .ad-title {
  color: #00dc82;
}
.ad-snippet {
  font-size: 0.85rem;
  color: #94a3b8;
  margin: 0;
  line-height: 1.4;
}
.ad-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #1e293b;
  padding-top: 0.6rem;
  font-size: 0.7rem;
}
.ad-cta {
  color: #00dc82;
  font-weight: 700;
}
.ad-privacy {
  color: #475569;
}
</style>