<!-- app/pages/features.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import DkpAdsWidget from '~/components/ads/DkpAdsWidget.vue'

useDkpSeo({
  title: 'Servizi SaaS & Developer Tools — DevKernelPulse v2.6-PURE-SQL',
  description:
    'Esplora tutti i servizi SaaS e gli strumenti gratuiti di DevKernelPulse v2.6: OpenUI Studio AI, Sentinel Scan SAST & Vault Audit, DKP Shop, Bounty Board XP, Proof of Code, AI Repo Scanner e SDK.',
  type: 'website',
  canonicalPath: '/features'
})

interface ServiceItem {
  id: string
  category: 'saas' | 'free'
  icon: string
  badge: string
  tierLabel: 'SAAS' | 'SHOP' | 'PRO' | 'FREE'
  title: string
  description: string
  primaryTo: string
  primaryLabel: string
  secondaryTo?: string
  secondaryLabel?: string
  tone: 'emerald' | 'cyan' | 'violet' | 'amber'
}

const activeFilter = ref<'all' | 'saas' | 'free'>('all')

const servicesList: ServiceItem[] = [
  // === 1. SERVIZI SAAS, SHOP, BOUNTIES & ECONOMIA DEVELOPER ===
  {
    id: 'openui-studio',
    category: 'saas',
    icon: '🎨',
    badge: 'OPENUI STUDIO AI',
    tierLabel: 'SAAS',
    title: 'OpenUI Studio AI',
    description:
      'Generatore neurale di interfacce moderne e componenti Tailwind/Vue con streaming in tempo reale (DKP Trinity), preview live e codice pronto per la produzione.',
    primaryTo: '/tools/openui-studio',
    primaryLabel: 'Apri OpenUI Studio',
    secondaryTo: '/docs/api',
    secondaryLabel: 'API Streaming',
    tone: 'violet'
  },
  {
    id: 'sentinel-scan',
    category: 'saas',
    icon: '🛡️',
    badge: 'SAST & VAULT AUDIT',
    tierLabel: 'SAAS',
    title: 'Sentinel Scan (SAST & Vault Audit)',
    description:
      'Audit statico di sicurezza CWE, rilevamento vulnerabilità SQL/XSS e segreti esposti con rilascio di certificati Proof of Safety SHA-256 notarizzati su Neon PostgreSQL.',
    primaryTo: '/tools/sentinel-scan',
    primaryLabel: 'Avvia Sentinel Scan',
    secondaryTo: '/nodes/n/blockchain-vault',
    secondaryLabel: 'Vault Ledger',
    tone: 'violet'
  },
  {
    id: 'dkp-shop',
    category: 'saas',
    icon: '💳',
    badge: 'API KEYS & PIANI',
    tierLabel: 'SHOP',
    title: 'DKP Shop & SaaS Plans',
    description:
      'Attiva piani Free, Pro ed Enterprise, genera chiavi API dkp_live_... con metering atomico Pure SQL (usage_count) e sblocca quote dedicate per tutti i servizi Gateway.',
    primaryTo: '/shop',
    primaryLabel: 'Vai allo Shop SaaS',
    secondaryTo: '/user/dashboard?tab=api',
    secondaryLabel: 'API Console',
    tone: 'amber'
  },
  {
    id: 'bounty-xp',
    category: 'saas',
    icon: '🎯',
    badge: 'BOUNTIES & $PULSE',
    tierLabel: 'PRO',
    title: 'Bounty Board & Sistema XP',
    description:
      'Partecipa a sfide tecniche reali, risolvi issue e audit per guadagnare ricompense in $PULSE, accumula XP verificabili (+150 blog, +100 vault, +50 thread) e scala i tier VIP.',
    primaryTo: '/bounties',
    primaryLabel: 'Apri Bounty Board',
    secondaryTo: '/user/dashboard',
    secondaryLabel: 'Dashboard XP',
    tone: 'amber'
  },
  {
    id: 'dkp-ads',
    category: 'saas',
    icon: '📢',
    badge: 'ADS NETWORK',
    tierLabel: 'PRO',
    title: 'DKP Ads Network',
    description:
      'Promuovi librerie open-source, dev tools e micro-SaaS direttamente a sviluppatori e maker su Tech Feed, Node Talks Hub e Blog Editorial con telemetria trasparente.',
    primaryTo: '/user/ads',
    primaryLabel: 'Gestione Campagne Ads',
    secondaryTo: '/shop',
    secondaryLabel: 'Pacchetti Ads',
    tone: 'amber'
  },
  {
    id: 'dkp-sdk',
    category: 'saas',
    icon: '⚙️',
    badge: 'SDK v1.1.0 & REST',
    tierLabel: 'SAAS',
    title: '@devkernelpulse/sdk & API Gateway v2.6',
    description:
      'Integra dkp.sentinel, dkp.openui, dkp.vault, dkp.ai e dkp.blog nelle tue app TypeScript, Python o Go con autenticazione Bearer SHA-256 a latenza sub-10ms.',
    primaryTo: '/docs/sdk',
    primaryLabel: 'Guida SDK v1.1.0',
    secondaryTo: '/docs/api',
    secondaryLabel: 'Docs API v2.6',
    tone: 'cyan'
  },

  // === 2. DEVELOPER TOOLS GRATUITI & ECOSISTEMA COMMUNITY ===
  {
    id: 'proof-of-code',
    category: 'free',
    icon: '🔐',
    badge: 'VAULT MAINNET • +100 XP',
    tierLabel: 'FREE',
    title: 'Proof of Code (Blockchain Vault)',
    description:
      'Calcola l’hash crittografico SHA-256 concatenato su Neon PostgreSQL per certificare la paternità temporale di codice, smart contract e specifiche tecniche.',
    primaryTo: '/tools/proof-of-code',
    primaryLabel: 'Notarizza Codice',
    secondaryTo: '/nodes/n/blockchain-vault',
    secondaryLabel: 'Verifica Hash',
    tone: 'emerald'
  },
  {
    id: 'ai-repo-scanner',
    category: 'free',
    icon: '🤖',
    badge: 'GITHUB AI AUDIT',
    tierLabel: 'FREE',
    title: 'AI Repo Scanner',
    description:
      'Analizza repository GitHub pubblici per estrarre mappa architetturale, stack tecnologico, criticità delle dipendenze e suggerimenti di refactoring.',
    primaryTo: '/tools/ai-repo-scanner',
    primaryLabel: 'Analizza Repository',
    secondaryTo: '/tools',
    secondaryLabel: 'Tutti i Tools',
    tone: 'cyan'
  },
  {
    id: 'ai-code-scanner',
    category: 'free',
    icon: '🔍',
    badge: 'QUICK CODE AUDIT',
    tierLabel: 'FREE',
    title: 'AI Code Scanner',
    description:
      'Incolla snippet TypeScript, SQL, Python, Rust, Go o Solidity per individuare istantaneamente bug logici, query non parametrate e rischi di sicurezza.',
    primaryTo: '/tools/ai-scanner',
    primaryLabel: 'Scansiona Snippet',
    secondaryTo: '/tools/sentinel-scan',
    secondaryLabel: 'Audit Pro SAST',
    tone: 'cyan'
  },
  {
    id: 'terminal-shell',
    category: 'free',
    icon: '💻',
    badge: 'IN-BROWSER CLI',
    tierLabel: 'FREE',
    title: 'Terminal Web Shell',
    description:
      'Interfaccia di comando interattiva integrata nel browser per ispezionare lo stato del kernel, lanciare diagnostiche rapide e navigare l’ecosistema.',
    primaryTo: '/tools/terminal',
    primaryLabel: 'Apri Web Shell',
    secondaryTo: '/status',
    secondaryLabel: 'Kernel Status',
    tone: 'emerald'
  },
  {
    id: 'cli-toolkit',
    category: 'free',
    icon: '⚡',
    badge: 'CI/CD & AUTOMATION',
    tierLabel: 'FREE',
    title: 'DKP CLI Toolkit & Local Automation',
    description:
      'Strumenti da riga di comando e workflow locali per automatizzare controlli di qualità, verifica hash e sincronizzazione nei tuoi repository.',
    primaryTo: '/tools/cli-toolkit',
    primaryLabel: 'Esplora CLI Toolkit',
    secondaryTo: '/docs/cli-automation',
    secondaryLabel: 'Docs CLI',
    tone: 'cyan'
  },
  {
    id: 'nodes-ecosystem',
    category: 'free',
    icon: '🌳',
    badge: '10 MACRO-NODI & 9 LINGUE',
    tierLabel: 'FREE',
    title: 'Node Talks Hub, Sentinel & Translator',
    description:
      'Forum gerarchico a 10 Macro-Nodi (inclusi 16 sub-nodi linguaggi), agenti autonomi Sentinel ArchGuard/DocKeeper, protocollo BEMYAGENT.md e traduzione in 9 lingue.',
    primaryTo: '/nodes',
    primaryLabel: 'Esplora i 10 Macro-Nodi',
    secondaryTo: '/docs/ecosystem',
    secondaryLabel: 'Docs Ecosistema',
    tone: 'violet'
  }
]

const saasServices = computed(() => servicesList.filter((s) => s.category === 'saas'))
const freeTools = computed(() => servicesList.filter((s) => s.category === 'free'))
</script>

<template>
  <DkpLayout
    title="Servizi SaaS & Developer Tools"
    subtitle="Suite completa v2.6-PURE-SQL: OpenUI Studio, Sentinel SAST, Shop, Bounties & Tools Gratuiti"
    :show-sidebar-ads="false"
  >
    <div class="max-w-7xl mx-auto py-8 pb-24 px-4 sm:px-6 flex flex-col gap-10">
      <!-- HERO HEADER & FILTRI RAPIDI -->
      <section class="bg-[#080e1e] border border-cyan-500/30 rounded-3xl p-6 sm:p-10 text-center relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.65)]">
        <div class="flex flex-wrap items-center justify-center gap-2 mb-4">
          <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 font-mono text-xs font-extrabold uppercase tracking-wider">
            <span>⚡</span> DKP Kernel v2.6-PURE-SQL
          </span>
          <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/15 border border-violet-500/35 text-violet-300 font-mono text-xs font-extrabold uppercase tracking-wider">
            <span>🛡️</span> Sentinel Network&copy;
          </span>
        </div>

        <h1 class="text-2xl sm:text-4xl font-black text-white tracking-tight m-0">
          Servizi SaaS, Shop &amp; <span class="text-cyan-300">Developer Tools Gratuiti</span>
        </h1>

        <p class="text-slate-300 text-sm sm:text-base max-w-3xl mx-auto mt-3 mb-7 leading-relaxed">
          Dalla prototipazione neurale con <strong class="text-violet-300">OpenUI Studio AI</strong> e gli audit di sicurezza
          <strong class="text-emerald-400">Sentinel Scan SAST</strong> fino allo <strong class="text-amber-300">Shop API</strong>, alla
          <strong class="text-amber-300">Bounty Board XP</strong> e alla suite gratuita per developer &amp; maker.
        </p>

        <!-- BARRA FILTRI & LINK RECIPROCI RAPIDI -->
        <div class="flex flex-wrap items-center justify-center gap-2.5 font-mono">
          <button
            type="button"
            @click="activeFilter = 'all'"
            :class="[
              'px-4 py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer',
              activeFilter === 'all'
                ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400 shadow-[0_0_16px_rgba(34,211,238,0.2)]'
                : 'bg-[#020617] text-slate-300 border-slate-800 hover:border-cyan-500/40'
            ]"
          >
            Tutti i Servizi ({{ servicesList.length }})
          </button>

          <button
            type="button"
            @click="activeFilter = 'saas'"
            :class="[
              'px-4 py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer',
              activeFilter === 'saas'
                ? 'bg-violet-500/20 text-violet-200 border-violet-400 shadow-[0_0_16px_rgba(139,92,246,0.2)]'
                : 'bg-[#020617] text-slate-300 border-slate-800 hover:border-violet-500/40'
            ]"
          >
            SaaS, Shop &amp; Bounties ({{ saasServices.length }})
          </button>

          <button
            type="button"
            @click="activeFilter = 'free'"
            :class="[
              'px-4 py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer',
              activeFilter === 'free'
                ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.2)]'
                : 'bg-[#020617] text-slate-300 border-slate-800 hover:border-emerald-500/40'
            ]"
          >
            Tools Gratuiti &amp; Hub ({{ freeTools.length }})
          </button>

          <span class="hidden sm:inline text-slate-700 mx-1">|</span>

          <NuxtLink
            to="/shop"
            class="px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-extrabold no-underline transition-all"
          >
            💳 Apri Shop &amp; Piani
          </NuxtLink>

          <NuxtLink
            to="/tools"
            class="px-4 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-extrabold no-underline transition-all"
          >
            🛠️ Suite DKP Tools
          </NuxtLink>
        </div>
      </section>

      <!-- SEZIONE 1: SERVIZI SAAS, SHOP & BOUNTIES -->
      <section v-if="activeFilter === 'all' || activeFilter === 'saas'" class="flex flex-col gap-5">
        <div class="flex flex-wrap items-center justify-between gap-2 px-1">
          <div class="flex items-center gap-2.5">
            <span class="w-2.5 h-2.5 rounded-full bg-violet-400"></span>
            <h2 class="text-lg sm:text-xl font-black text-white m-0">
              Servizi SaaS, Shop API &amp; Bounty Board
            </h2>
          </div>
          <span class="text-xs font-mono text-amber-300 font-bold">
            OpenUI &bull; Sentinel SAST &bull; Shop &bull; Bounties XP
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
          <article
            v-for="item in saasServices"
            :key="item.id"
            class="h-full flex flex-col justify-between bg-[#080e1e] rounded-2xl p-6 border transition-all duration-200 hover:-translate-y-1 shadow-[0_14px_34px_rgba(0,0,0,0.48)]"
            :class="{
              'border-emerald-500/35 hover:border-emerald-400': item.tone === 'emerald',
              'border-cyan-500/35 hover:border-cyan-400': item.tone === 'cyan',
              'border-violet-500/35 hover:border-violet-400': item.tone === 'violet',
              'border-amber-500/35 hover:border-amber-400': item.tone === 'amber'
            }"
          >
            <div class="flex flex-col gap-3">
              <div class="flex items-center justify-between gap-2">
                <span class="text-2xl">{{ item.icon }}</span>
                <div class="flex items-center gap-1.5">
                  <span
                    class="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-md border"
                    :class="{
                      'bg-emerald-500/15 text-emerald-300 border-emerald-500/35': item.tone === 'emerald',
                      'bg-cyan-500/15 text-cyan-300 border-cyan-500/35': item.tone === 'cyan',
                      'bg-violet-500/15 text-violet-300 border-violet-500/35': item.tone === 'violet',
                      'bg-amber-500/15 text-amber-300 border-amber-500/35': item.tone === 'amber'
                    }"
                  >
                    {{ item.badge }}
                  </span>
                  <span class="text-[10px] font-mono font-black px-2 py-0.5 rounded-md bg-slate-900 text-amber-300 border border-amber-500/30">
                    {{ item.tierLabel }}
                  </span>
                </div>
              </div>

              <h3
                class="text-lg font-extrabold m-0"
                :class="{
                  'text-emerald-300': item.tone === 'emerald',
                  'text-cyan-300': item.tone === 'cyan',
                  'text-violet-300': item.tone === 'violet',
                  'text-amber-300': item.tone === 'amber'
                }"
              >
                {{ item.title }}
              </h3>

              <p class="text-slate-300 text-xs sm:text-sm leading-relaxed m-0">
                {{ item.description }}
              </p>
            </div>

            <!-- LINK RECIPROCI -->
            <div class="pt-4 mt-5 border-t border-slate-800/80 flex items-center justify-between gap-2 font-mono text-xs">
              <NuxtLink
                :to="item.primaryTo"
                class="inline-flex items-center gap-1.5 font-extrabold no-underline transition-colors"
                :class="{
                  'text-emerald-400 hover:text-emerald-300': item.tone === 'emerald',
                  'text-cyan-400 hover:text-cyan-300': item.tone === 'cyan',
                  'text-violet-400 hover:text-violet-300': item.tone === 'violet',
                  'text-amber-400 hover:text-amber-300': item.tone === 'amber'
                }"
              >
                <span>{{ item.primaryLabel }}</span>
                <span>&rarr;</span>
              </NuxtLink>

              <NuxtLink
                v-if="item.secondaryTo && item.secondaryLabel"
                :to="item.secondaryTo"
                class="px-2.5 py-1 rounded-lg bg-[#020617] border border-slate-800 hover:border-slate-600 text-[11px] text-slate-300 hover:text-white font-bold no-underline transition-colors"
              >
                {{ item.secondaryLabel }}
              </NuxtLink>
            </div>
          </article>
        </div>
      </section>

      <!-- SEZIONE 2: DEVELOPER TOOLS GRATUITI & ECOSISTEMA -->
      <section v-if="activeFilter === 'all' || activeFilter === 'free'" class="flex flex-col gap-5">
        <div class="flex flex-wrap items-center justify-between gap-2 px-1">
          <div class="flex items-center gap-2.5">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <h2 class="text-lg sm:text-xl font-black text-white m-0">
              Developer Tools Gratuiti &amp; Ecosistema Community
            </h2>
          </div>
          <span class="text-xs font-mono text-emerald-400 font-bold">
            100% Accessibili &bull; Pure SQL &amp; SHA-256 Vault
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
          <article
            v-for="item in freeTools"
            :key="item.id"
            class="h-full flex flex-col justify-between bg-[#080e1e] rounded-2xl p-6 border transition-all duration-200 hover:-translate-y-1 shadow-[0_14px_34px_rgba(0,0,0,0.48)]"
            :class="{
              'border-emerald-500/35 hover:border-emerald-400': item.tone === 'emerald',
              'border-cyan-500/35 hover:border-cyan-400': item.tone === 'cyan',
              'border-violet-500/35 hover:border-violet-400': item.tone === 'violet',
              'border-amber-500/35 hover:border-amber-400': item.tone === 'amber'
            }"
          >
            <div class="flex flex-col gap-3">
              <div class="flex items-center justify-between gap-2">
                <span class="text-2xl">{{ item.icon }}</span>
                <div class="flex items-center gap-1.5">
                  <span
                    class="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-md border"
                    :class="{
                      'bg-emerald-500/15 text-emerald-300 border-emerald-500/35': item.tone === 'emerald',
                      'bg-cyan-500/15 text-cyan-300 border-cyan-500/35': item.tone === 'cyan',
                      'bg-violet-500/15 text-violet-300 border-violet-500/35': item.tone === 'violet',
                      'bg-amber-500/15 text-amber-300 border-amber-500/35': item.tone === 'amber'
                    }"
                  >
                    {{ item.badge }}
                  </span>
                  <span class="text-[10px] font-mono font-black px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                    {{ item.tierLabel }}
                  </span>
                </div>
              </div>

              <h3
                class="text-lg font-extrabold m-0"
                :class="{
                  'text-emerald-300': item.tone === 'emerald',
                  'text-cyan-300': item.tone === 'cyan',
                  'text-violet-300': item.tone === 'violet',
                  'text-amber-300': item.tone === 'amber'
                }"
              >
                {{ item.title }}
              </h3>

              <p class="text-slate-300 text-xs sm:text-sm leading-relaxed m-0">
                {{ item.description }}
              </p>
            </div>

            <!-- LINK RECIPROCI -->
            <div class="pt-4 mt-5 border-t border-slate-800/80 flex items-center justify-between gap-2 font-mono text-xs">
              <NuxtLink
                :to="item.primaryTo"
                class="inline-flex items-center gap-1.5 font-extrabold no-underline transition-colors"
                :class="{
                  'text-emerald-400 hover:text-emerald-300': item.tone === 'emerald',
                  'text-cyan-400 hover:text-cyan-300': item.tone === 'cyan',
                  'text-violet-400 hover:text-violet-300': item.tone === 'violet',
                  'text-amber-400 hover:text-amber-300': item.tone === 'amber'
                }"
              >
                <span>{{ item.primaryLabel }}</span>
                <span>&rarr;</span>
              </NuxtLink>

              <NuxtLink
                v-if="item.secondaryTo && item.secondaryLabel"
                :to="item.secondaryTo"
                class="px-2.5 py-1 rounded-lg bg-[#020617] border border-slate-800 hover:border-slate-600 text-[11px] text-slate-300 hover:text-white font-bold no-underline transition-colors"
              >
                {{ item.secondaryLabel }}
              </NuxtLink>
            </div>
          </article>
        </div>
      </section>

      <!-- BARRA NAVIGAZIONE RECIPROCA ECOSISTEMA -->
      <nav
        aria-label="Collegamenti rapidi ecosistema"
        class="bg-[#080e1e] border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3 font-mono text-xs"
      >
        <div class="flex flex-wrap items-center gap-2">
          <NuxtLink to="/tools" class="px-3 py-1.5 rounded-xl bg-[#020617] border border-emerald-500/35 text-emerald-300 font-bold no-underline hover:border-emerald-400">
            Panoramica DKP Tools
          </NuxtLink>
          <NuxtLink to="/shop" class="px-3 py-1.5 rounded-xl bg-[#020617] border border-amber-500/35 text-amber-300 font-bold no-underline hover:border-amber-400">
            Shop &amp; Piani SaaS
          </NuxtLink>
          <NuxtLink to="/bounties" class="px-3 py-1.5 rounded-xl bg-[#020617] border border-violet-500/35 text-violet-300 font-bold no-underline hover:border-violet-400">
            Bounty Board &amp; $PULSE
          </NuxtLink>
          <NuxtLink to="/docs/api" class="px-3 py-1.5 rounded-xl bg-[#020617] border border-cyan-500/35 text-cyan-300 font-bold no-underline hover:border-cyan-400">
            Docs API v2.6
          </NuxtLink>
        </div>

        <NuxtLink to="/docs/ecosystem" class="text-cyan-300 hover:text-emerald-300 font-extrabold no-underline">
          Docs Ecosistema &amp; BEMYAGENT.md &rarr;
        </NuxtLink>
      </nav>
<DkpAdsWidget
      placement="feedInline"
      layout="horizontal"
      :limit="3"
      :show-advertise-link="true"
    />
    </div>
  </DkpLayout>
</template>