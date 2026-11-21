<script setup lang="ts">
import { ref } from 'vue'
import DKPAdBanner from '~/components/DKPAdBanner.vue'

const activeSection = ref('architettura')
const sections = [
  { id: 'architettura', title: '01. Architettura Pure SQL' },
  { id: 'ai-nexus', title: '02. DKP Ai Nexus© & Sentinelle' },
  { id: 'mail-nexus', title: '03. DKP Mail Nexus© 2.6' },
  { id: 'blockchain-vault', title: '04. DKP Blockchain Vault©' },
  { id: 'moduli', title: '05. 10 Macro-Nodi & Moduli' },
  { id: 'cli-toolkit', title: '06. DKP CLI & Pulsebot' },
  { id: 'gamification', title: '07. Gamification & XP System' }
]

function scrollToSection(id: string) {
  activeSection.value = id
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

useDkpSeo({
  title: 'Ecosystem Docs v2.6-PURE-SQL - DevKernelPulse',
  description: 'Documentazione tecnica completa sull ecosistema DevKernelPulse v2.6-PURE-SQL: DKP Ai Nexus©, Mail Nexus©, Pulsebot (BEMYAGENT.md) e Blockchain Vault.',
  type: 'website',
  canonicalPath: '/docs/ecosystem'
})
</script>

<template>
  <DkpLayout
    title="Docs - Ecosistema & BEMYAGENT"
    subtitle="Standard v2.6-PURE-SQL, DKP Ai Nexus©, Mail Nexus© e notarizzazione"
    :show-sidebar-ads="true"
  >
    <div class="min-h-screen bg-[#020420] text-slate-100 px-4 py-8 font-sans rounded-2xl">
      <div class="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">

        <!-- SIDEBAR NAVIGAZIONE DOCS -->
        <aside class="lg:sticky lg:top-20 h-fit bg-[#090d16] border border-slate-800 rounded-2xl p-5 flex flex-col gap-5 shadow-xl">
          <div>
            <span class="bg-emerald-500/15 text-emerald-400 text-[10px] font-mono font-extrabold px-2 py-0.5 rounded border border-emerald-500/30">
              DKP DOCS
            </span>
            <h3 class="text-white font-bold text-lg mt-2 font-sans">Ecosistema v2.6-PURE-SQL</h3>
          </div>

          <nav class="flex flex-col gap-1 font-mono text-xs">
            <button
              v-for="item in sections"
              :key="item.id"
              @click="scrollToSection(item.id)"
              :class="[
                'text-left px-3 py-2.5 rounded-xl font-bold transition-all cursor-pointer',
                activeSection === item.id
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              ]"
            >
              {{ item.title }}
            </button>
          </nav>

          <div class="pt-3 border-t border-slate-800 flex flex-col gap-2">
            <NuxtLink
              to="/nodes/n/blockchain-vault"
              class="block text-center bg-[#020420] hover:border-emerald-400 text-emerald-400 border border-emerald-500/40 font-mono font-extrabold text-xs py-2.5 px-3 rounded-xl transition-all no-underline"
            >
              Apri Nodo Vault &rarr;
            </NuxtLink>
            <NuxtLink
              to="/docs/api"
              class="block text-center bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-extrabold text-xs py-2.5 px-3 rounded-xl transition-all shadow-md no-underline"
            >
              Documentazione API &rarr;
            </NuxtLink>
          </div>
          <DKPAdBanner />
        </aside>

        <!-- CONTENUTO PRINCIPALE -->
        <main class="flex flex-col gap-8">

          <!-- HERO DOCS -->
          <header class="bg-[#090d16] border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col gap-3 shadow-xl">
            <div class="text-xs font-mono font-semibold text-sky-400">
              Docs / Ecosistema, DKP Ai Nexus©, Mail Nexus© &amp; Architettura v2.6-PURE-SQL
            </div>
            <h1 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-sans m-0">
              DevKernelPulse Knowledge Base
            </h1>
            <p class="text-xs sm:text-sm text-slate-400 leading-relaxed font-sans m-0">
              Guida architetturale completa a <strong class="text-white">DKP Kernel v2.6-PURE-SQL</strong>: design system unificato (<strong class="text-emerald-400">DKP Sentinel Style</strong>), <strong class="text-purple-400">DKP Ai Nexus©</strong> con Sentinella Passiva, <strong class="text-sky-400">DKP Mail Nexus©</strong> (Resend + Brevo), Sentinelle <code class="text-emerald-400 font-mono">BEMYAGENT.md</code> e <strong class="text-emerald-400">DKP Blockchain Vault©</strong>.
            </p>
          </header>

          <!-- SEZIONE 1: ARCHITETTURA -->
          <section id="architettura" class="bg-[#090d16] border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col gap-5 shadow-xl">
            <h2 class="text-xl font-bold text-white pb-3 border-b border-slate-800 font-sans m-0">
              01. Architettura di Sistema DKP v2.6-PURE-SQL
            </h2>
            <p class="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans m-0">
              <strong class="text-white">DevKernelPulse (DKP)</strong> opera su un motore reattivo Pure SQL ad alte prestazioni alimentato da <strong class="text-emerald-400">Nuxt / Vue 3 + Nitro</strong>, database serverless <strong class="text-sky-400">Neon PostgreSQL</strong> con Drizzle ORM e container stateless su <strong class="text-white">GCP Cloud Run</strong> presidiati da suite E2E Playwright.
            </p>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="bg-[#020420] border border-slate-800 rounded-xl p-4 flex flex-col gap-1.5">
                <h4 class="text-sm font-bold text-emerald-400 font-sans m-0">DKP Sentinel Style (UX Unificata)</h4>
                <p class="text-xs text-slate-400 leading-relaxed font-sans m-0">
                  Template visivo condiviso tra Feed, Nodes, Blog e Tools con modalità Dark Cyberpunk e White Sepia e syntax highlighting dinamico via <code class="text-sky-400 font-mono">Prism.js</code>.
                </p>
              </div>
              <div class="bg-[#020420] border border-slate-800 rounded-xl p-4 flex flex-col gap-1.5">
                <h4 class="text-sm font-bold text-emerald-400 font-sans m-0">Edge Processing &amp; Zero-Trust Auth</h4>
                <p class="text-xs text-slate-400 leading-relaxed font-sans m-0">
                  Gateway Nitro H3 con verifica SHA-256 in-flight, rate-limiting atomico e gestione difensiva delle rotte dinamiche SSR.
                </p>
              </div>
            </div>
          </section>

          <!-- SEZIONE 2: DKP AI NEXUS & SENTINELLE -->
          <section id="ai-nexus" class="bg-[#090d16] border border-purple-500/35 rounded-2xl p-6 sm:p-8 flex flex-col gap-5 shadow-xl">
            <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <h2 class="text-xl font-bold text-white font-sans m-0">
                02. DKP Ai Nexus© &amp; Sentinelle (BEMYAGENT.md)
              </h2>
              <span class="bg-purple-500/15 text-purple-300 border border-purple-500/40 font-mono text-[10px] font-black px-2.5 py-1 rounded-full">
                BEMYAGENT.md PROTOCOL
              </span>
            </div>

            <p class="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans m-0">
              Il <strong class="text-purple-300">DKP Ai Nexus©</strong> sostituisce i vecchi assistenti frammentati e porta l'intelligenza contestuale direttamente nel flusso di lavoro dello sviluppatore:
            </p>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="bg-[#020420] border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
                <div class="text-xs font-mono font-black text-purple-300">Sentinella Passiva Grammarly-Style</div>
                <p class="text-xs text-slate-400 leading-relaxed font-sans m-0">
                  Analizza in tempo reale i post nell'editor (Blog e Nodes) rilevando la lingua (IT/EN), segnalando ripetizioni, punteggiatura, blocchi codice non chiusi e offrendo correzioni 1-click.
                </p>
              </div>

              <div class="bg-[#020420] border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
                <div class="text-xs font-mono font-black text-emerald-400">Peer Review nei Commenti</div>
                <p class="text-xs text-slate-400 leading-relaxed font-sans m-0">
                  Le Sentinelle valutano il contesto tecnico delle discussioni, suggeriscono miglioramenti agli snippet e filtrano spam e rumore senza generare falsi positivi sul codice.
                </p>
              </div>

              <div class="bg-[#020420] border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
                <div class="text-xs font-mono font-black text-sky-400">Pulsebot (Ecosystem Guardian)</div>
                <p class="text-xs text-slate-400 leading-relaxed font-sans m-0">
                  Sentinella guardiana abbinata a <code class="text-sky-400 font-mono">BEMYAGENT.md</code> che verifica build warning, sicurezza segreti, integrità endpoint Pure SQL e dipendenze.
                </p>
              </div>
            </div>
          </section>

          <!-- SEZIONE 3: DKP MAIL NEXUS 2.6 -->
          <section id="mail-nexus" class="bg-[#090d16] border border-sky-500/35 rounded-2xl p-6 sm:p-8 flex flex-col gap-5 shadow-xl">
            <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <h2 class="text-xl font-bold text-white font-sans m-0">
                03. DKP Mail Nexus© 2.6 (Resend + Brevo Dual-Provider)
              </h2>
              <span class="bg-sky-500/15 text-sky-300 border border-sky-500/40 font-mono text-[10px] font-black px-2.5 py-1 rounded-full">
                ASYNC FAILOVER ENGINE
              </span>
            </div>

            <p class="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans m-0">
              Il sottosistema <code class="text-sky-400 font-mono">server/utils/mailNexus.ts</code> separa in modo netto i carichi operativi massimizzando deliverability e quote gratuite:
            </p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-[#020420] border border-slate-800 rounded-xl p-4 flex flex-col gap-1.5">
                <h4 class="text-sm font-bold text-emerald-400 font-sans m-0">Canale Resend (Sentinel &amp; Kernel)</h4>
                <p class="text-xs text-slate-400 leading-relaxed font-sans m-0">
                  Gestisce notifiche del <strong>Sentinel Network</strong>, alert di sicurezza, notifiche della <strong>Chat Pulse Nexus</strong> e transazionali critiche, fungendo anche da failover per Brevo.
                </p>
              </div>
              <div class="bg-[#020420] border border-slate-800 rounded-xl p-4 flex flex-col gap-1.5">
                <h4 class="text-sm font-bold text-sky-400 font-sans m-0">Canale Brevo (Newsletter &amp; Community)</h4>
                <p class="text-xs text-slate-400 leading-relaxed font-sans m-0">
                  Gestisce Newsletter con <strong>Double Opt-In</strong>, autoresponder e comunicazioni ordinarie, sincronizzando <code class="text-sky-400 font-mono">hard_bounce</code> e <code class="text-sky-400 font-mono">unsubscribed</code> tramite webhook idempotenti su Neon DB.
                </p>
              </div>
            </div>
          </section>

          <!-- SEZIONE 4: BLOCKCHAIN VAULT -->
          <section id="blockchain-vault" class="bg-[#090d16] border border-emerald-500/35 rounded-2xl p-6 sm:p-8 flex flex-col gap-5 shadow-xl">
            <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <h2 class="text-xl font-bold text-white font-sans m-0">
                04. DKP Blockchain Vault© &amp; Contenuti On-Chain
              </h2>
              <span class="bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 font-mono text-[10px] font-black px-2.5 py-1 rounded-full">
                DKP-VAULT-MAINNET-v2.6
              </span>
            </div>

            <p class="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans m-0">
              Sia le discussioni dei Nodi sia gli articoli del Blog sono sigillati nel ledger <code class="text-sky-400 font-mono">dkp_vault_ledger</code> con hash SHA-256 concatenato (<code class="text-emerald-400 font-mono">Block #N</code>, <code class="text-emerald-400 font-mono">previous_hash</code>, <code class="text-emerald-400 font-mono">merkle_root</code>) verificabile pubblicamente su <NuxtLink to="/nodes/n/blockchain-vault" class="text-emerald-400 underline">n/blockchain-vault</NuxtLink>.
            </p>
          </section>

          <!-- SEZIONE 5: 10 MACRO-NODI -->
          <section id="moduli" class="bg-[#090d16] border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col gap-4 shadow-xl">
            <h2 class="text-xl font-bold text-white pb-3 border-b border-slate-800 font-sans m-0">
              05. Struttura Gerarchica a 10 Macro-Nodi Semantici
            </h2>
            <p class="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans m-0">
              La tassonomia dei forum è stata riordinata su 10 macro-categorie bilanciate per evitare dispersione: <strong>DKP Ecosystem &amp; Core</strong>, <strong>Community &amp; Social</strong>, <strong>Dev, Tech &amp; Architecture</strong>, <strong>AI, LLM &amp; Neural Agents</strong>, <strong>Security, Cyber &amp; Vault</strong>, <strong>Cloud, Infra &amp; Databases</strong>, <strong>Tools, CLI &amp; Analytics</strong>, <strong>Blockchain, Web3 &amp; DeFi</strong>, <strong>Mobile &amp; Cross-Platform</strong> e <strong>Programming Languages &amp; Systems</strong>.
            </p>
          </section>

          <!-- SEZIONE 6: CLI & PULSEBOT -->
          <section id="cli-toolkit" class="bg-[#090d16] border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col gap-4 shadow-xl">
            <h2 class="text-xl font-bold text-white pb-3 border-b border-slate-800 font-sans m-0">
              06. DKP CLI Toolkit &amp; Audit Ecosystem
            </h2>
            <p class="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans m-0">
              Tramite gli script di audit dell'ecosistema (<code class="text-sky-400 font-mono">scripts/audit-ecosystem.mjs</code>) e la suite E2E Playwright, ogni build viene validata prima del rollout su Google Cloud Run verificando SSR, sitemap dinamica e integrità degli endpoint.
            </p>
          </section>

          <!-- SEZIONE 7: GAMIFICATION -->
          <section id="gamification" class="bg-[#090d16] border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col gap-4 shadow-xl">
            <h2 class="text-xl font-bold text-white pb-3 border-b border-slate-800 font-sans m-0">
              07. Gamification, XP &amp; Reputation Tier
            </h2>
            <p class="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans m-0">
              Pubblicare articoli verificati (+150 XP), notarizzare codice nel Vault (+100 XP), aprire discussioni nei Nodi (+50 XP) e contribuire con commenti tecnici (+10 XP) aumenta il livello pubblico, sblocca badge (<em>Top Debater</em>, <em>Kernel Admin</em>) ed espande le quote API.
            </p>
          </section>

        </main>
      </div>
    </div>
  </DkpLayout>
</template>