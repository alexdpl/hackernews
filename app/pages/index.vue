<-- app/pages/index.vue -->
<script setup lang="ts">
import DkpHomeTelemetry from '~/components/DkpHomeTelemetry.vue'
import DkpRelatedBlogWidget from '~/components/widgets/DkpRelatedBlogWidget.vue'
import DkpRelatedNodesWidget from '~/components/widgets/DkpRelatedNodesWidget.vue'
import DkpAdStrip from '~/components/DkpAdStrip.vue'
import DkpAdsWidget from '~/components/ads/DkpAdsWidget.vue'

useDkpSeo({
  title: 'DevKernelPulse \u2014 La Piattaforma per Sviluppatori & Sentinel AI',
  description: 'Notarizzazione crittografica del codice, strumenti di sicurezza e aggregatore tech ad alto segnale arricchito in tempo reale da Trinity AI.'
})

const heroCards = [
  {
    to: '/news',
    icon: '\uD83C\uDF0D',
    badge: 'LIVE STREAM',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/35',
    title: 'DKP News & Crawler AI',
    desc: 'Segnali tech HN + Reddit filtrati in tempo reale da Sentinel AI'
  },
  {
    to: '/nodes',
    icon: '\uD83D\uDCAC',
    badge: 'COMMUNITY',
    badgeClass: 'bg-violet-500/15 text-violet-300 border-violet-500/35',
    title: 'DKP Talks Hub',
    desc: 'Nodi tematici, architetture, bounty e discussioni tecniche'
  },
  {
    to: '/tools',
    icon: '\uD83D\uDEE0\uFE0F',
    badge: 'SECURITY & DEV',
    badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/35',
    title: 'Developer Tools',
    desc: 'Utility crittografiche, audit SAST e diagnostica per ingegneri'
  },
  {
    to: '/blog',
    icon: '\uD83D\uDCDD',
    badge: 'VAULT VERIFIED',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/35',
    title: 'DKP Editorial Hub',
    desc: 'Deep-dive tecnici con certificazione SHA-256 immutabile'
  }
]
</script>

<template>
  <div class="bg-dkp-bg text-dkp-text font-display min-h-screen bg-grid-pattern relative">
    <DkpHomeTelemetry />
    <!-- HERO SECTION VETRINA + 4 CARD + 3 METRICHE KPI -->
    <section class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-4 text-center">
      <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-dkp-card border border-dkp-border font-mono text-xs text-dkp-accent font-bold mb-6 card-glow">
        <span class="text-amber-400 text-xs leading-none"></span>
        <span>DEVKERNELPULSE PRO V2.6 &bull; BEMYAGENT.md &bull; PURE SQL &amp; SHA-256 VAULT</span>
      </div>

      <h1 class="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight m-0 mb-5">
        <span class="text-white">La Piattaforma per </span>
        <span class="bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
          Sviluppatori &amp; Sentinel AI
        </span>
      </h1>

      <p class="text-slate-300 text-base sm:text-lg max-w-3xl mx-auto leading-relaxed mb-10">
        Notarizzazione crittografica del codice, strumenti di sicurezza e aggregatore tech ad alto segnale arricchito in tempo reale da Trinity AI &amp; Sentinel Crawler.
      </p>

      <!-- 4 CARD PRINCIPALI -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left mb-6">
        <NuxtLink
          v-for="card in heroCards"
          :key="card.to"
          :to="card.to"
          class="bg-dkp-card/95 border border-dkp-border hover:border-cyan-400/60 rounded-2xl p-5 no-underline transition-all card-glow group flex flex-col justify-between gap-4"
        >
          <div class="flex items-center justify-between">
            <span class="text-2xl">{{ card.icon }}</span>
            <span :class="['font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-md border uppercase', card.badgeClass]">
              {{ card.badge }}
            </span>
          </div>
          <div>
            <h2 class="text-base font-bold text-white group-hover:text-dkp-accent transition-colors flex items-center justify-between m-0 mb-1.5">
              <span>{{ card.title }}</span>
              <span class="text-slate-400 group-hover:text-dkp-accent transition-transform group-hover:translate-x-1">&rarr;</span>
            </h2>
            <p class="text-xs text-slate-300 leading-relaxed m-0">{{ card.desc }}</p>
          </div>
        </NuxtLink>
      </div>

      <!-- 3 METRICHE KPI -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
        <div class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-5 flex items-center gap-4 card-glow">
          <div class="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-400/35 flex items-center justify-center text-2xl shrink-0">
            
          </div>
          <div>
            <div class="text-2xl sm:text-3xl font-extrabold text-white font-mono">1.2M+</div>
            <div class="text-[11px] font-mono text-slate-300 uppercase tracking-wider">LINEE CODICE NOTARIZZATE</div>
          </div>
        </div>

        <div class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-5 flex items-center gap-4 card-glow">
          <div class="w-12 h-12 rounded-xl bg-violet-500/15 border border-violet-400/35 flex items-center justify-center text-2xl shrink-0">
            
          </div>
          <div>
            <div class="text-2xl sm:text-3xl font-extrabold text-white font-mono">48K+</div>
            <div class="text-[11px] font-mono text-slate-300 uppercase tracking-wider">BOUNTIES RISOLTE ($PULSE)</div>
          </div>
        </div>

        <div class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-5 flex items-center gap-4 card-glow">
          <div class="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-400/35 flex items-center justify-center text-2xl shrink-0">
            
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-2xl sm:text-3xl font-extrabold text-white font-mono">Live</span>
              <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-dkp-pass border border-emerald-500/35">
                ONLINE
              </span>
            </div>
            <div class="text-[11px] font-mono text-slate-300 uppercase tracking-wider">SENTINEL THREAT GUARD</div>
          </div>
        </div>
      </div>
    </section>

    <!-- LAYOUT CON SIDEBAR + CONTENUTI -->
    <DkpLayout :hide-section-header="true" :show-sidebar-ads="true">
	<!-- CIRCUITO DKP ADS + ACQUISTA SPAZIO (ORIZZONTALE) -->
<DkpAdsWidget
  placement="feedInline"
  layout="horizontal"
  :limit="3"
  :show-advertise-link="true"
/>
      <!-- 1. Ultime News dal Crawler AI -->
      <DkpHomeWidget />

      <!-- 2. Ultimi Articoli Blog & Ultime Discussioni Nodi affiancati -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DkpRelatedBlogWidget />
        <DkpRelatedNodesWidget />
      </div>

     <!-- 3. Circuito 2 (Orizzontale - 3 Libri / Approfondimenti dal Vault) -->
      <DkpAdStrip
        layout="horizontal"
        category-tag="DKP ADS NETWORK &bull; APPROFONDIMENTI DAL VAULT"
      />
    </DkpLayout>
  </div>
</template>