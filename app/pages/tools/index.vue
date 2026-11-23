<script setup lang="ts">
import DkpHomeTelemetry from '~/components/DkpHomeTelemetry.vue'
import DkpRelatedBlogWidget from '~/components/widgets/DkpRelatedBlogWidget.vue'
import DkpRelatedNodesWidget from '~/components/widgets/DkpRelatedNodesWidget.vue'
import DkpAdsWidget from '~/components/ads/DkpAdsWidget.vue'
import DkpAdStrip from '~/components/DkpAdStrip.vue'

useDkpSeo({
  title: 'Developer Tools & Utility - DevKernelPulse Kernel v2.6-PURE-SQL',
  description: 'Suite completa di strumenti per sviluppatori e ingegneri AI: Proof of Code Vault SHA-256, OpenUI Studio, AI Repo Scanner, Terminal Web Shell, AI Scanner e CLI Toolkit.',
  type: 'website',
  canonicalPath: '/tools'
})

const heroCards = [
  {
    to: '/news',
    tag: 'NEWS',
    badge: 'LIVE STREAM',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/35',
    title: 'DKP News & Crawler AI',
    desc: 'Segnali tech HN + Reddit filtrati in tempo reale da Sentinel AI'
  },
  {
    to: '/nodes',
    tag: 'NODES',
    badge: 'COMMUNITY',
    badgeClass: 'bg-violet-500/15 text-violet-300 border-violet-500/35',
    title: 'DKP Talks Hub',
    desc: 'Nodi tematici, architetture, bounty e discussioni tecniche'
  },
  {
    to: '/tools',
    tag: 'TOOLS',
    badge: 'SECURITY & DEV',
    badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/35',
    title: 'Developer Tools',
    desc: 'Utility crittografiche, audit SAST e diagnostica per ingegneri'
  },
  {
    to: '/blog',
    tag: 'BLOG',
    badge: 'VAULT VERIFIED',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/35',
    title: 'DKP Editorial Hub',
    desc: 'Deep-dive tecnici con certificazione SHA-256 immutabile'
  }
]

const developerToolsCatalog = [
  {
    to: '/tools/sentinel-scan',
    tag: 'SENTINEL',
    badge: 'SAST + VAULT',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
    title: 'Sentinel Scan & Proof of Safety',
    desc: 'Audit SAST CWE, rilevamento secret hardcoded e certificazione SHA-256 Proof of Safety via API DKP_live.'
  },  {
    to: '/tools/proof-of-code',
    tag: 'VAULT',
    badge: 'SHA-256 VAULT',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
    title: 'Proof of Code Vault',
    desc: 'Genera impronte crittografiche SHA-256, verifica l integrita dei sorgenti e certifica snippet su Pure SQL.'
  },
  {
    to: '/tools/openui-studio',
    tag: 'STUDIO',
    badge: 'AI STUDIO',
    badgeClass: 'bg-violet-500/15 text-violet-300 border-violet-500/40',
    title: 'OpenUI Studio',
    desc: 'Workspace interattivo per prototipazione UI, prompt engineering e ispezione componenti guidata da AI.'
  },
  {
    to: '/tools/ai-repo-scanner',
    tag: 'REPO',
    badge: 'REPO AUDIT',
    badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40',
    title: 'AI Repo Scanner',
    desc: 'Analisi strutturale di repository, dipendenze e pattern architetturali con diagnostica Sentinel AI.'
  },
  {
    to: '/tools/terminal',
    tag: 'SHELL',
    badge: 'WEB SHELL',
    badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/40',
    title: 'Terminal Web Shell',
    desc: 'Console diagnostica per ispezionare comandi, payload, token e flussi del Kernel v2.6 in tempo reale.'
  },
  {
    to: '/tools/ai-scanner',
    tag: 'SAST',
    badge: 'SENTINEL SAST',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
    title: 'AI Code Scanner',
    desc: 'Scansione statica e analisi di sicurezza su frammenti di codice, vulnerabilita comuni e secret leak.'
  },
  {
    to: '/tools/cli-toolkit',
    tag: 'CLI',
    badge: 'CLI & API',
    badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40',
    title: 'CLI & Gateway Toolkit',
    desc: 'Generatori di comandi CLI, configurazioni API Bearer Token e automazioni per pipeline CI/CD.'
  }
]
</script>

<template>
  <div class="bg-dkp-bg text-dkp-text font-display min-h-screen bg-grid-pattern relative">
    <DkpHomeTelemetry />

    <!-- HERO SECTION VETRINA + 4 CARD + 3 METRICHE KPI -->
    <section class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-4 text-center">
      <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-dkp-card border border-dkp-border font-mono text-xs text-dkp-accent font-bold mb-6 card-glow">
        <span>DEVKERNELPULSE PRO V2.6 | BEMYAGENT.md | PURE SQL &amp; SHA-256 VAULT</span>
      </div>

      <h1 class="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight m-0 mb-5">
        <span class="text-white">Strumenti Operativi per </span>
        <span class="bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
          Sviluppatori &amp; Sentinel AI
        </span>
      </h1>

      <p class="text-slate-300 text-base sm:text-lg max-w-3xl mx-auto leading-relaxed mb-10">
        Tutti gli strumenti nativi di DevKernelPulse a pagina intera: notarizzazione SHA-256, scanner AI, console diagnostica e utility per il workflow quotidiano.
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
            <span class="font-mono text-xs font-extrabold text-cyan-300">{{ card.tag }}</span>
            <span :class="['font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-md border uppercase', card.badgeClass]">
              {{ card.badge }}
            </span>
          </div>
          <div>
            <h2 class="text-base font-bold text-white group-hover:text-dkp-accent transition-colors flex items-center justify-between m-0 mb-1.5">
              <span>{{ card.title }}</span>
              <span class="text-slate-400 group-hover:text-dkp-accent transition-transform group-hover:translate-x-1">-&gt;</span>
            </h2>
            <p class="text-xs text-slate-300 leading-relaxed m-0">{{ card.desc }}</p>
          </div>
        </NuxtLink>
      </div>

      <!-- 3 METRICHE KPI -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
        <div class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-5 flex items-center gap-4 card-glow">
          <div class="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-400/35 flex items-center justify-center font-mono text-xs font-extrabold text-cyan-300 shrink-0">
            SHA
          </div>
          <div>
            <div class="text-2xl sm:text-3xl font-extrabold text-white font-mono">1.2M+</div>
            <div class="text-[11px] font-mono text-slate-300 uppercase tracking-wider">LINEE CODICE NOTARIZZATE</div>
          </div>
        </div>

        <div class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-5 flex items-center gap-4 card-glow">
          <div class="w-12 h-12 rounded-xl bg-violet-500/15 border border-violet-400/35 flex items-center justify-center font-mono text-xs font-extrabold text-violet-300 shrink-0">
            XP
          </div>
          <div>
            <div class="text-2xl sm:text-3xl font-extrabold text-white font-mono">48K+</div>
            <div class="text-[11px] font-mono text-slate-300 uppercase tracking-wider">BOUNTIES RISOLTE ($PULSE)</div>
          </div>
        </div>

        <div class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-5 flex items-center gap-4 card-glow">
          <div class="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-400/35 flex items-center justify-center font-mono text-xs font-extrabold text-emerald-300 shrink-0">
            AI
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

    <!-- LAYOUT CON SIDEBAR + CATALOGO TOOLS + WIDGET SPAZIO -->
    <DkpLayout :hide-section-header="true" :show-sidebar-ads="true">
      <!-- CATALOGO DEDICATO DEVELOPER TOOLS -->
      <section class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-6 sm:p-8 card-glow space-y-5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h2 class="text-xl sm:text-2xl font-extrabold text-white m-0">
              Suite Developer Tools
            </h2>
            <p class="text-xs sm:text-sm text-slate-400 mt-1 mb-0 font-mono">
              Apri qualsiasi strumento a pagina intera con SEO dinamico e navigazione unificata.
            </p>
          </div>
          <span class="px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-400/40 font-mono text-xs font-bold self-start sm:self-auto">
            {{ developerToolsCatalog.length }} Tool Disponibili
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <NuxtLink
            v-for="tool in developerToolsCatalog"
            :key="tool.to"
            :to="tool.to"
            class="bg-[#050914] border border-slate-800 hover:border-cyan-400/60 rounded-2xl p-5 no-underline transition-all group flex flex-col justify-between gap-4"
          >
            <div class="flex items-center justify-between gap-2">
              <span class="font-mono text-xs font-extrabold text-emerald-300">{{ tool.tag }}</span>
              <span :class="['font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-md border uppercase', tool.badgeClass]">
                {{ tool.badge }}
              </span>
            </div>
            <div>
              <h3 class="text-base font-extrabold text-white group-hover:text-cyan-300 transition-colors flex items-center justify-between m-0 mb-1.5">
                <span>{{ tool.title }}</span>
                <span class="text-slate-400 group-hover:text-cyan-300 transition-transform group-hover:translate-x-1">-&gt;</span>
              </h3>
              <p class="text-xs text-slate-300 leading-relaxed m-0">{{ tool.desc }}</p>
            </div>
          </NuxtLink>
        </div>
      </section>

      <!-- SOLO WIDGET SPAZIO -->
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