<!-- app/pages/docs/ecosystem.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import DkpAdStrip from '~/components/DkpAdStrip.vue'
import DkpAdsWidget from '~/components/ads/DkpAdsWidget.vue'

const activeSection = ref('architettura')
const sections = [
  { id: 'architettura', title: '01. Architettura Pure SQL' },
  { id: 'ai-nexus', title: '02. Sentinel & Safe-Diff AI' },
  { id: 'mail-nexus', title: '03. DKP Mail Nexus 2.6' },
  { id: 'blockchain-vault', title: '04. Blockchain Vault Ledger' },
  { id: 'moduli', title: '05. Albero Gerarchico Nodi' },
  { id: 'cli-toolkit', title: '06. Admin Control Center & Audit' },
  { id: 'gamification', title: '07. Gamification & XP System' },
  { id: 'sdk-shop', title: '08. SDK v1.1.0, OpenUI & Shop' }
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
  description: 'Documentazione tecnica completa sull\'ecosistema DevKernelPulse v2.6-PURE-SQL: Sentinel DocKeeper, ArchGuard, DKP Ai Nexus Safe-Diff, Blockchain Vault Ledger e Albero Nodi Gerarchico.',
  type: 'website',
  canonicalPath: '/docs/ecosystem'
})
</script>

<template>
  <DkpLayout
    title="Docs - Ecosistema & BEMYAGENT"
    subtitle="Standard v2.6-PURE-SQL, Knowledge Dependabot, Blockchain Vault unificato e Talks Tree"
    :show-sidebar-ads="true"
  >
    <div class="min-h-screen bg-[#020420] text-slate-100 px-4 sm:px-6 py-8 font-sans rounded-2xl">
      <div class="max-w-6xl mx-auto flex flex-col gap-6">

        <!-- BARRA NAVIGAZIONE ORIZZONTALE DOCS (EX SIDEBAR) -->
        <div class="w-full bg-[#090d16] border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-xl">
          <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
            <div class="flex flex-wrap items-center gap-2.5">
              <span class="bg-emerald-500/15 text-emerald-400 text-[10px] font-mono font-extrabold px-2.5 py-1 rounded border border-emerald-500/30">
                DKP DOCS
              </span>
              <h3 class="text-white font-bold text-base sm:text-lg m-0 font-sans">
                Ecosistema v2.6-PURE-SQL
              </h3>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <NuxtLink
                to="/nodes/n/blockchain-vault"
                class="bg-[#020420] hover:border-emerald-400 text-emerald-400 border border-emerald-500/40 font-mono font-extrabold text-xs py-2 px-3.5 rounded-xl transition-all no-underline"
              >
                Apri Vault Ledger &rarr;
              </NuxtLink>
              <NuxtLink
                to="/docs/api"
                class="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-extrabold text-xs py-2 px-3.5 rounded-xl transition-all shadow-md no-underline"
              >
                Documentazione API &rarr;
              </NuxtLink>
            </div>
          </div>

          <nav class="flex flex-wrap items-center gap-2 font-mono text-xs">
            <button
              v-for="item in sections"
              :key="item.id"
              type="button"
              @click="scrollToSection(item.id)"
              :class="[
                'px-3 py-2 rounded-xl font-bold border transition-all cursor-pointer',
                activeSection === item.id
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                  : 'bg-[#020420] text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
              ]"
            >
              {{ item.title }}
            </button>
          </nav>
        </div>

        <!-- CONTENUTO PRINCIPALE FULL-WIDTH -->
        <main class="w-full flex flex-col gap-6">

          <!-- HERO DOCS -->
          <header class="bg-[#090d16] border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col gap-3 shadow-xl">
            <div class="text-xs font-mono font-semibold text-sky-400">
              Docs / Ecosistema, Knowledge Dependabot, Vault Unificato &amp; Architettura v2.6-PURE-SQL
            </div>
            <h1 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-sans m-0">
              DevKernelPulse Knowledge Base
            </h1>
            <p class="text-xs sm:text-sm text-slate-400 leading-relaxed font-sans m-0">
              Guida architetturale completa a <strong class="text-white">DKP Kernel v2.6-PURE-SQL</strong>: design system unificato tra Home, User Dashboard e Admin Control Center, <strong class="text-purple-400">DKP Ai Nexus© Safe-Diff Engine</strong>, <strong class="text-sky-400">Albero Gerarchico Nodi &amp; Sub-Nodi</strong> e <strong class="text-emerald-400">Blockchain Vault Ledger</strong> unificato.
            </p>
          </header>

          <!-- SEZIONE 1: ARCHITETTURA -->
          <section id="architettura" class="bg-[#090d16] border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col gap-5 shadow-xl">
            <h2 class="text-xl font-bold text-white pb-3 border-b border-slate-800 font-sans m-0">
              01. Architettura di Sistema DKP v2.6-PURE-SQL
            </h2>
            <p class="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans m-0">
              <strong class="text-white">DevKernelPulse (DKP)</strong> opera su un motore reattivo Pure SQL ad alte prestazioni alimentato da <strong class="text-emerald-400">Nuxt / Vue 3 + Nitro</strong>, database serverless <strong class="text-sky-400">Neon PostgreSQL</strong> con query SQL parametrizzate e container stateless su <strong class="text-white">GCP Cloud Run</strong>.
            </p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-fr">
              <div class="h-full bg-[#020420] border border-slate-800 rounded-xl p-4 flex flex-col gap-1.5">
                <h4 class="text-sm font-bold text-emerald-400 font-sans m-0">Design System Cosmico Unificato</h4>
                <p class="text-xs text-slate-400 leading-relaxed font-sans m-0">
                  Template visivo condiviso tra Home Page, User Dashboard, Admin Master Control Center, Feed, Nodes, Blog e Tools con palette Cyber-Emerald, Cyan e Violet.
                </p>
              </div>
              <div class="h-full bg-[#020420] border border-slate-800 rounded-xl p-4 flex flex-col gap-1.5">
                <h4 class="text-sm font-bold text-emerald-400 font-sans m-0">Zero-Trust Auth &amp; RBAC Pure SQL</h4>
                <p class="text-xs text-slate-400 leading-relaxed font-sans m-0">
                  Gateway Nitro H3 con verifica SHA-256 in-flight, sessioni firmate HMAC e matrice permessi granulare su Neon PostgreSQL sia per gli utenti sia per gli agenti Sentinel.
                </p>
              </div>
            </div>
          </section>

          <!-- SEZIONE 2: KNOWLEDGE DEPENDABOT & SAFE-DIFF AI -->
          <section id="ai-nexus" class="bg-[#090d16] border border-purple-500/35 rounded-2xl p-6 sm:p-8 flex flex-col gap-5 shadow-xl">
            <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <h2 class="text-xl font-bold text-white font-sans m-0">
                02. Sentinel Network, Knowledge Dependabot &amp; DKP Ai Nexus© Safe-Diff
              </h2>
              <span class="bg-purple-500/15 text-purple-300 border border-purple-500/40 font-mono text-[10px] font-black px-2.5 py-1 rounded-full">
                SAFE-DIFF + RBAC
              </span>
            </div>

            <p class="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans m-0">
              Negli editor editoriali e DKP Talks, <strong class="text-purple-300">DKP Ai Nexus©</strong> utilizza un motore di diffing testuale granulare (<code class="text-sky-400 font-mono">applySafeGrammarDiffPatch</code>) con protezione strutturale su blocchi codice, tabelle, liste e link, affiancato da uno stack <code class="text-emerald-400 font-mono">Ctrl+Z / Ctrl+Y</code> deterministico. Parallelamente, gli agenti autonomi presidiano la qualità dei contenuti:
            </p>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-fr">
              <div class="h-full bg-[#020420] border border-amber-500/30 rounded-xl p-4 flex flex-col gap-2">
                <div class="text-xs font-mono font-black text-amber-300">Sentinel DocKeeper (@sentinel_dockeeper)</div>
                <p class="text-xs text-slate-400 leading-relaxed font-sans m-0">
                  Parser semantico sui code block di Thread Forum e Articoli Blog: rileva dipendenze obsolete (<code class="text-slate-200">moment</code>, <code class="text-slate-200">request</code>, <code class="text-slate-200">node-fetch</code>, <code class="text-slate-200">lodash</code> CJS, Docker EOL) e pubblica automaticamente un commento tecnico con la migrazione moderna.
                </p>
              </div>

              <div class="h-full bg-[#020420] border border-violet-500/30 rounded-xl p-4 flex flex-col gap-2">
                <div class="text-xs font-mono font-black text-violet-300">Sentinel ArchGuard (@sentinel_archguard)</div>
                <p class="text-xs text-slate-400 leading-relaxed font-sans m-0">
                  Verifica pattern architetturali, sicurezza SQL/DOM-XSS, esposizione segreti, I/O bloccante e allineamento alla documentazione ufficiale Nuxt/Nitro/Drizzle pubblicando suggerimenti mirati.
                </p>
              </div>

              <div class="h-full bg-[#020420] border border-emerald-500/30 rounded-xl p-4 flex flex-col gap-2">
                <div class="text-xs font-mono font-black text-emerald-400">Permessi Dedicati nel DB</div>
                <p class="text-xs text-slate-400 leading-relaxed font-sans m-0">
                  Ogni agente dispone di flag granulari su NeonDB (<code class="text-slate-200">can_parse_code_blocks</code>, <code class="text-slate-200">can_auto_comment_threads</code>, <code class="text-slate-200">can_auto_comment_blog</code>) con scrittura sul core DB bloccata (<code class="text-rose-300">can_modify_core_db = FALSE</code>).
                </p>
              </div>
            </div>
          </section>

          <!-- GRIGLIA ORIZZONTALE CARD SEZIONI 03 -> 06 -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-fr">

            <!-- SEZIONE 3: DKP MAIL NEXUS 2.6 -->
            <section id="mail-nexus" class="h-full bg-[#090d16] border border-sky-500/35 rounded-2xl p-6 flex flex-col justify-between gap-4 shadow-xl">
              <div class="flex flex-col gap-4">
                <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <h2 class="text-lg font-bold text-white font-sans m-0">
                    03. DKP Mail Nexus 2.6 (Resend + Brevo)
                  </h2>
                  <span class="bg-sky-500/15 text-sky-300 border border-sky-500/40 font-mono text-[10px] font-black px-2.5 py-1 rounded-full">
                    ASYNC FAILOVER
                  </span>
                </div>
                <p class="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans m-0">
                  Il sottosistema <code class="text-sky-400 font-mono">server/utils/mailNexus.ts</code> separa i carichi operativi tra <strong class="text-emerald-400">Resend</strong> (alert Sentinel Network, sicurezza, transazionali) e <strong class="text-sky-400">Brevo</strong> (Newsletter Double Opt-In e webhook idempotenti su Neon DB).
                </p>
              </div>
            </section>

            <!-- SEZIONE 4: BLOCKCHAIN VAULT UNIFICATO -->
            <section id="blockchain-vault" class="h-full bg-[#090d16] border border-emerald-500/35 rounded-2xl p-6 flex flex-col justify-between gap-4 shadow-xl">
              <div class="flex flex-col gap-4">
                <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <h2 class="text-lg font-bold text-white font-sans m-0">
                    04. DKP Blockchain Vault Ledger Unificato
                  </h2>
                  <span class="bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 font-mono text-[10px] font-black px-2.5 py-1 rounded-full">
                    MAINNET-v2.6
                  </span>
                </div>
                <p class="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans m-0">
                  L'endpoint <code class="text-sky-400 font-mono">/api/vault/ledger</code> e la vista pubblica <NuxtLink to="/nodes/n/blockchain-vault" class="text-emerald-400 underline">n/blockchain-vault</NuxtLink> aggregano in un unico registro immutabile le notarizzazioni SHA-256 di <strong>Editorial Blog</strong>, <strong>Forum Thread (<code class="text-emerald-300">n/</code>)</strong> e <strong>Developer Tools</strong>, completi di numero blocco, catena <code class="text-emerald-400 font-mono">previous_hash</code>, <code class="text-emerald-400 font-mono">merkle_root</code> e verificatore interattivo di impronte a 64 caratteri.
                </p>
              </div>
            </section>

            <!-- SEZIONE 5: ALBERO GERARCHICO DKP TALKS -->
            <section id="moduli" class="h-full bg-[#090d16] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between gap-4 shadow-xl">
              <div class="flex flex-col gap-4">
                <h2 class="text-lg font-bold text-white pb-3 border-b border-slate-800 font-sans m-0">
                  05. Albero Gerarchico DKP Talks
                </h2>
                <p class="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans m-0">
                  L'hub <NuxtLink to="/nodes" class="text-sky-400 underline">/nodes</NuxtLink> e l'API <code class="text-sky-400 font-mono">/api/nodes/tree</code> organizzano le discussioni in un <strong>Albero Gerarchico padre-figlio</strong> sincronizzato in tempo reale con <code class="text-emerald-400 font-mono">/admin/nodes</code>, dotato di controllo anti-ciclo su PostgreSQL, riallineamento semantico automatico su 10 Macro-Domini e accesso diretto a <code class="text-emerald-400 font-mono">n/blockchain-vault</code>.
                </p>
              </div>
            </section>

            <!-- SEZIONE 6: ADMIN CONTROL CENTER -->
            <section id="cli-toolkit" class="h-full bg-[#090d16] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between gap-4 shadow-xl">
              <div class="flex flex-col gap-4">
                <h2 class="text-lg font-bold text-white pb-3 border-b border-slate-800 font-sans m-0">
                  06. Admin Master Control Center &amp; Console Sentinel
                </h2>
                <p class="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans m-0">
                  La dashboard amministrativa (<code class="text-sky-400 font-mono">/admin</code>, <code class="text-sky-400 font-mono">/admin/nodes</code> e <code class="text-sky-400 font-mono">/admin/sentinels</code>) condivide il design system della Home Page e consente di gestire l'albero gerarchico dei nodi via Accordion, monitorare telemetria NeonDB, certificati Vault, permessi RBAC delle Sentinelle ed eseguire audit retroattivi su Blog e Forum.
                </p>
              </div>
            </section>

          </div>

          <!-- GRIGLIA ORIZZONTALE CARD SEZIONI 07 -> 08 -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 auto-rows-fr">

            <!-- SEZIONE 7: GAMIFICATION -->
            <section id="gamification" class="lg:col-span-5 h-full bg-[#090d16] border border-slate-800 rounded-2xl p-6 flex flex-col gap-4 shadow-xl">
              <h2 class="text-lg font-bold text-white pb-3 border-b border-slate-800 font-sans m-0">
                07. Gamification, XP &amp; Reputation Tier
              </h2>
              <p class="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans m-0">
                Pubblicare articoli verificati (+150 XP), notarizzare codice nel Vault (+100 XP), aprire discussioni nei Nodi (+25/+50 XP) e contribuire con commenti tecnici (+10 XP) aumenta il livello pubblico, sblocca badge verificati ed espande le quote API.
              </p>
            </section>

            <!-- SEZIONE 8: SDK v1.1.0, SENTINEL SCAN, OPENUI STUDIO & SHOP -->
            <section id="sdk-shop" class="lg:col-span-7 h-full bg-[#090d16] border border-cyan-500/35 rounded-2xl p-6 flex flex-col gap-4 shadow-xl">
              <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <h2 class="text-lg font-bold text-white font-sans m-0">
                  08. @devkernelpulse/sdk v1.1.0, Sentinel Scan &amp; Shop Stripe
                </h2>
                <span class="bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 font-mono text-[10px] font-black px-2.5 py-1 rounded-full">
                  SDK v1.1.0 + STRIPE v2.6
                </span>
              </div>
              <p class="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans m-0">
                L'ecosistema espone i moduli ufficiali di <code class="text-emerald-400 font-mono">@devkernelpulse/sdk v1.1.0</code> (<code class="text-cyan-300">dkp.sentinel</code>, <code class="text-cyan-300">dkp.openui</code>, <code class="text-cyan-300">dkp.vault</code>, <code class="text-cyan-300">dkp.ai</code>, <code class="text-cyan-300">dkp.blog</code>), la certificazione <strong class="text-white">Proof of Safety SHA-256</strong> su <NuxtLink to="/nodes/n/blockchain-vault" class="text-emerald-400 underline">n/blockchain-vault</NuxtLink> e il gateway <NuxtLink to="/shop" class="text-purple-300 underline">DKP Shop &amp; Stripe</NuxtLink> per chiavi SaaS <code class="text-emerald-400 font-mono">dkp_live_...</code>, pacchetti crediti Vault e campagne Ads (Visualizzazioni, Click, Ibrido).
              </p>
            </section>

          </div>

        </main>
      </div>
    </div>

    <DkpAdsWidget
      placement="feedInline"
      layout="horizontal"
      :limit="3"
      :show-advertise-link="true"
    />
    <DkpAdStrip />
  </DkpLayout>
</template>