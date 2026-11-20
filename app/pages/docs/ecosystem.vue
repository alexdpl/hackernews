<script setup lang="ts">
import { ref } from 'vue'
import DKPAdBanner from '~/components/DKPAdBanner.vue'

const activeSection = ref('architettura')
const sections = [
  { id: 'architettura', title: 'Architettura DKP', icon: 'ÔÜí' },
  { id: 'blockchain-vault', title: 'Ôøô´©Å DKP Blockchain Vault', icon: '' },
  { id: 'moduli', title: 'Moduli, Nodes & OpenUI', icon: '' },
  { id: 'cli-toolkit', title: 'ÔÜí DKP CLI Toolkit', icon: '' },
  { id: 'gamification', title: 'Gamification & XP System', icon: '' },
  { id: 'best-practices', title: 'Best Practices & Growth', icon: '' }
]

function scrollToSection(id: string) {
  activeSection.value = id
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

useDkpSeo({
  title: 'Ecosystem Docs - DevKernelPulse',
  description: 'Approfondimento tecnico sull ecosistema DevKernelPulse v2.6-PURE-SQL e sul protocollo BEMYAGENT.',
  type: 'website',
  canonicalPath: '/docs/ecosystem'
})
</script>

<template>
  <DkpLayout
    title="Docs - Ecosistema & BEMYAGENT"
    subtitle="Standard v2.6-PURE-SQL, Sentinel AI e notarizzazione"
    :show-sidebar-ads="true"
  >
<div class="min-h-screen bg-[#020420] text-slate-100 px-4 py-12 font-sans">
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
            Ôøô´©Å Apri Nodo Vault Ôåù
          </NuxtLink>
          <NuxtLink
            to="/docs/api"
            class="block text-center bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-extrabold text-xs py-2.5 px-3 rounded-xl transition-all shadow-md no-underline"
          >
            Documentazione API Ôåù
          </NuxtLink>
        </div>
		<DKPAdBanner />
      </aside>

      <!-- CONTENUTO PRINCIPALE -->
      <main class="flex flex-col gap-8">

        <!-- HERO DOCS -->
        <header class="bg-[#090d16] border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col gap-3 shadow-xl">
          <div class="text-xs font-mono font-semibold text-sky-400">
            Docs / Ecosistema, DKP Blockchain Vault &amp; Architettura v2.6-PURE-SQL
          </div>
          <h1 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-sans">
            DevKernelPulse Knowledge Base
          </h1>
          <p class="text-xs sm:text-sm text-slate-400 leading-relaxed font-sans">
            Guida completa all'architettura modulare DKP v2.6-PURE-SQL: dal ledger crittografico <strong class="text-emerald-400">DKP Blockchain Vault</strong> con Forum &amp; Blog On-Chain ai DKP Nodes, la Sentinella SAST con Gemini 2.0 Flash, l'OpenUI Live Engine e il sistema di reputazione XP.
          </p>
        </header>

        <!-- SEZIONE 1: ARCHITETTURA -->
        <section id="architettura" class="bg-[#090d16] border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col gap-5 shadow-xl">
          <h2 class="text-xl font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800 font-sans">
            <span></span> Architettura di Sistema DKP v2.6-PURE-SQL
          </h2>
          <p class="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            <strong class="text-white">DevKernelPulse (DKP)</strong> è costruito secondo un paradigma reattivo Pure-SQL ad alte prestazioni, alimentato da <strong class="text-emerald-400">Nuxt 4 (Vue 3, Nitro Engine)</strong>, database serverless <strong class="text-sky-400">Neon PostgreSQL</strong> con ledger crittografico concatenato e un'infrastruttura AI decentralizzata tramite OpenRouter.
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <div class="bg-[#020420] border border-slate-800 rounded-xl p-4 flex flex-col gap-1.5">
              <h4 class="text-sm font-bold text-emerald-400 font-sans">Ôøô´©Å DKP Blockchain Vault Ledger</h4>
              <p class="text-xs text-slate-400 leading-relaxed font-sans">
                Registro immutabile Pure-SQL (<code class="text-sky-400 bg-slate-900 px-1 py-0.5 rounded font-mono">dkp_vault_ledger</code>) che concatena blocchi SHA-256 con <code class="text-sky-400 bg-slate-900 px-1 py-0.5 rounded font-mono">previous_hash</code> e <code class="text-sky-400 bg-slate-900 px-1 py-0.5 rounded font-mono">merkle_root</code> per ogni thread del Forum e articolo del Blog.
              </p>
            </div>
            <div class="bg-[#020420] border border-slate-800 rounded-xl p-4 flex flex-col gap-1.5">
              <h4 class="text-sm font-bold text-emerald-400 font-sans">Edge Processing &amp; AI Gateway</h4>
              <p class="text-xs text-slate-400 leading-relaxed font-sans">
                Gateway Nitro H3 con crittografia SHA-256 nativa in-flight, gestione dinamica delle API Keys DKP per metering e rate-limiting in tempo reale.
              </p>
            </div>
            <div class="bg-[#020420] border border-slate-800 rounded-xl p-4 flex flex-col gap-1.5">
              <h4 class="text-sm font-bold text-emerald-400 font-sans">Pulse Sentinel &amp; SAST Engine</h4>
              <p class="text-xs text-slate-400 leading-relaxed font-sans">
                Sentinella integrata su <strong class="text-slate-200">Google Gemini 2.0 Flash</strong> per l'analisi statica del codice, la moderazione istantanea dei DKP Nodes e la prevenzione injection.
              </p>
            </div>
            <div class="bg-[#020420] border border-slate-800 rounded-xl p-4 flex flex-col gap-1.5">
              <h4 class="text-sm font-bold text-emerald-400 font-sans">Neon Serverless DB Pure-SQL</h4>
              <p class="text-xs text-slate-400 leading-relaxed font-sans">
                Persistenza dati ultra-veloce con query SQL parametriche pure, gestione atomica di voti/karma, transazioni XP e tabelle <code class="text-sky-400 bg-slate-900 px-1 py-0.5 rounded font-mono">node_posts</code>, <code class="text-sky-400 bg-slate-900 px-1 py-0.5 rounded font-mono">blog_posts</code> e <code class="text-sky-400 bg-slate-900 px-1 py-0.5 rounded font-mono">dkp_vault_ledger</code>.
              </p>
            </div>
          </div>
        </section>
        <!-- SEZIONE 1B: DKP BLOCKCHAIN VAULT & FORUM/BLOG ON-CHAIN -->
        <section id="blockchain-vault" class="bg-[#090d16] border border-emerald-500/35 rounded-2xl p-6 sm:p-8 flex flex-col gap-5 shadow-[0_0_30px_rgba(16,185,129,0.06)]">
          <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <h2 class="text-xl font-bold text-white flex items-center gap-2 font-sans m-0">
              <span>Ôøô´©Å</span> DKP Blockchain Vault &amp; Contenuti On-Chain
            </h2>
            <span class="bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 font-mono text-[10px] font-black px-2.5 py-1 rounded-full">
              DKP-VAULT-MAINNET-v2.6
            </span>
          </div>

          <p class="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            Con la release <strong class="text-white">v2.6-PURE-SQL</strong>, sia le discussioni della community (<strong class="text-purple-400">DKP Talks Hub / Nodes</strong>) sia gli articoli tecnici (<strong class="text-emerald-400">DKP Editorial Hub / Blog</strong>) sono protetti nativamente dal motore <strong class="text-emerald-400">DKP Blockchain Vault</strong>.
          </p>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-[#020420] border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
              <div class="text-xs font-mono font-black text-purple-400">Forum On-Chain (DKP Nodes)</div>
              <p class="text-xs text-slate-400 leading-relaxed font-sans">
                Ogni thread pubblicato su <code class="text-sky-400 font-mono">/nodes</code> viene firmato con hash SHA-256 deterministico, riceve un numero di blocco progressivo (<code class="text-emerald-400 font-mono">Block #N</code>) e mostra il badge <code class="text-emerald-400 font-mono">VaultTrustBadge</code> con verifica live.
              </p>
            </div>

            <div class="bg-[#020420] border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
              <div class="text-xs font-mono font-black text-emerald-400">Ô£ì´©Å Editorial Blog On-Chain</div>
              <p class="text-xs text-slate-400 leading-relaxed font-sans">
                Ogni articolo pubblicato su <code class="text-sky-400 font-mono">/blog</code> viene notarizzato su <code class="text-sky-400 font-mono">dkp_vault_ledger</code> con certificato <code class="text-emerald-400 font-mono">Proof-of-Code On-Chain Vault</code>, Merkle Root e controllo anti-alterazione post-pubblicazione.
              </p>
            </div>

            <div class="bg-[#020420] border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
              <div class="text-xs font-mono font-black text-sky-400">Auditor Pubblico n/blockchain-vault</div>
              <p class="text-xs text-slate-400 leading-relaxed font-sans">
                Il nodo dedicato <NuxtLink to="/nodes/n/blockchain-vault" class="text-emerald-400 underline">n/blockchain-vault</NuxtLink> espone l'explorer dei blocchi notarizzati e consente l'audit istantaneo tramite hash SHA-256 a 64 caratteri o ID entità.
              </p>
            </div>
          </div>

          <div class="bg-[#020420] border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 flex flex-col gap-1.5">
            <div class="text-[11px] text-slate-500 uppercase font-bold">Struttura Crittografica Blocco DKP Vault</div>
            <code class="text-emerald-400 break-all">
              BlockHash = SHA256( blockNumber | previousHash | entityType | entityId | title | content | timestamp )
            </code>
          </div>
        </section>

        <!-- SEZIONE 2: MODULI & STRUMENTI -->
        <section id="moduli" class="bg-[#090d16] border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col gap-5 shadow-xl">
          <h2 class="text-xl font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800 font-sans">
            <span></span> Moduli Proprietari DKP v2.6-PURE-SQL
          </h2>
          <p class="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            La piattaforma offre una suite completa di strumenti integrati per la sicurezza, la notarizzazione on-chain, la produttività dello sviluppatore e il rendering UI in tempo reale:
          </p>

          <div class="flex flex-col gap-4 mt-2">

            <div class="bg-[#020420] border border-slate-800 border-l-4 border-l-emerald-500 rounded-xl p-5 flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <span class="text-base">Ôøô´©Å</span>
                <h3 class="text-sm font-bold text-white font-sans">DKP Blockchain Vault &amp; Multi-Entity Notarization Engine</h3>
              </div>
              <p class="text-xs text-slate-400 leading-relaxed font-sans">
                Motore unificato (<code class="text-sky-400 font-mono">BlockchainService</code>) con endpoint <code class="text-sky-400 font-mono">/api/vault/notarize</code>, <code class="text-sky-400 font-mono">/api/vault/verify</code> e <code class="text-sky-400 font-mono">/api/vault/ledger</code>. Garantisce immutabilità verificabile per thread del forum, articoli editoriali e snippet di codice.
              </p>
            </div>

            <div class="bg-[#020420] border border-slate-800 border-l-4 border-l-blue-500 rounded-xl p-5 flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <span class="text-base"></span>
                <h3 class="text-sm font-bold text-white font-sans">Pulse Sentinel SAST &amp; DKP Nodes Moderation</h3>
              </div>
              <p class="text-xs text-slate-400 leading-relaxed font-sans">
                Sistema di moderazione intelligente alimentato da <strong class="text-slate-200">dots-studio/dots-3-note</strong> (<code class="text-sky-400 font-mono">dots-studio/dots-3-note</code>). Analizza i post della community nei DKP Nodes e scansiona il codice prevenendo vulnerabilità prima della pubblicazione.
              </p>
            </div>

            <div class="bg-[#020420] border border-slate-800 border-l-4 border-l-amber-500 rounded-xl p-5 flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <span class="text-base"></span>
                <h3 class="text-sm font-bold text-white font-sans">API Key Enterprise Management &amp; Paywall</h3>
              </div>
              <p class="text-xs text-slate-400 leading-relaxed font-sans">
                Gestione chiavi crittografate (salvataggio tramite <code class="text-sky-400 font-mono">key_hash</code>). Valida le chiamate, gestisce il metering atomico su Neon DB e applica il Paywall Dinamico tra i tier FREE, PRO e ENTERPRISE.
              </p>
            </div>

            <div class="bg-[#020420] border border-slate-800 rounded-xl p-5 flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <span class="text-base"></span>
                <h3 class="text-sm font-bold text-white font-sans">OpenUI Studio &amp; Live Rendering</h3>
              </div>
              <p class="text-xs text-slate-400 leading-relaxed font-sans">
                Motore visivo reattivo integrato nel Playground. Genera componenti Tailwind CSS, interfacce e layout inviando prompt naturali e li renderizza istantaneamente in un sandbox iframe protetto.
              </p>
            </div>

            <div class="bg-[#020420] border border-slate-800 rounded-xl p-5 flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <span class="text-base"></span>
                <h3 class="text-sm font-bold text-white font-sans">Neural Playground &amp; DKP Trinity Engine</h3>
              </div>
              <p class="text-xs text-slate-400 leading-relaxed font-sans">
                Sandbox interattiva per il testing e la generazione AI in streaming. Alimentata dalla suite di modelli OpenRouter:
              </p>
              <ul class="flex flex-col gap-1.5 mt-2 ml-4 font-mono text-xs text-slate-300 list-disc">
                <li>ÔÜí <strong class="text-white">DKP-Flash:</strong> <code class="text-sky-400">dots-studio/dots-3-note</code> ÔÇö Risposta istantanea e moderazione.</li>
                <li><strong class="text-white">DKP-Coder:</strong> <code class="text-sky-400">cohere/north-mini-code</code> ÔÇö Specializzato in blocchi di codice e componenti OpenUI.</li>
                <li><strong class="text-white">DKP-Pro:</strong> <code class="text-sky-400">nvidia/nemotron-3-ultra-550b</code> ÔÇö Architetture avanzate con varianti multiple.</li>
              </ul>
            </div>

          </div>
        </section>

        <!-- SEZIONE 3: DKP CLI TOOLKIT -->
        <section id="cli-toolkit" class="bg-[#090d16] border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col gap-5 shadow-xl">
          <h2 class="text-xl font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800 font-sans">
            <span>ÔÜí</span> DKP CLI Toolkit v2.6-PURE-SQL
          </h2>
          <p class="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            L'interfaccia a riga di comando nativa per sviluppatori. Consente di interrogare l'ecosistema DKP direttamente dai terminali locali e di interagire con le API di produzione e il Blockchain Vault.
          </p>

          <div class="bg-[#020420] border border-slate-800 rounded-xl overflow-hidden mt-2 font-mono">
            <div class="bg-[#090d16] px-4 py-2 border-b border-slate-800 flex justify-between items-center text-xs text-slate-500">
              <span>Terminal / Bash</span>
              <span class="bg-emerald-500/15 text-emerald-400 font-bold px-2 py-0.5 rounded text-[10px]">
                v2.6-PURE-SQL
              </span>
            </div>
            <pre class="p-4 sm:p-5 text-xs text-emerald-400 leading-relaxed overflow-x-auto"><code><span class="text-slate-500 italic"># Installazione globale tramite NPM</span>
npm install -g @devkernelpulse/cli

<span class="text-slate-500 italic"># Autenticazione con API Key crittografata</span>
dkp auth login --key dkp_live_xxx

<span class="text-slate-500 italic"># Generazione UI da Terminale tramite Trinity (Dots-3 Engine)</span>
dkp ui generate "Dashboard Tailwind Dark"

<span class="text-slate-500 italic"># Notarizzazione istantanea sul DKP Blockchain Vault</span>
dkp vault notarize https://miosito.com

<span class="text-slate-500 italic"># Verifica stato API Gateway &amp; Sentinel</span>
dkp status</code></pre>
          </div>
        </section>

        <!-- SEZIONE 4: GAMIFICATION & XP -->
        <section id="gamification" class="bg-[#090d16] border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col gap-5 shadow-xl">
          <h2 class="text-xl font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800 font-sans">
            <span></span> Gamification &amp; XP Reputation Engine
          </h2>
          <p class="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            Ogni interazione su DevKernelPulse genera <strong class="text-emerald-400">Experience Points (XP)</strong> e Karma registrati in tempo reale su Neon DB Pure-SQL, incrementando il tuo rank sviluppatore.
          </p>

          <div class="overflow-x-auto border border-slate-800 rounded-xl mt-2">
            <table class="w-full text-left font-mono text-xs">
              <thead class="bg-[#020420] text-white border-b border-slate-800">
                <tr>
                  <th class="p-3">Azione Utente</th>
                  <th class="p-3">Guadagno XP / Karma</th>
                  <th class="p-3">Target Backend / Funzione</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800 text-slate-300">
                <tr class="hover:bg-slate-800/30 transition-colors">
                  <td class="p-3"><strong class="text-white">Pubblicazione Articolo Blog On-Chain</strong></td>
                  <td class="p-3"><span class="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold px-2 py-0.5 rounded text-[11px]">+150 XP</span></td>
                  <td class="p-3"><code class="text-sky-400">/api/blog/posts + Vault</code></td>
                </tr>
                <tr class="hover:bg-slate-800/30 transition-colors">
                  <td class="p-3"><strong class="text-white">Notarizzazione DKP Blockchain Vault</strong></td>
                  <td class="p-3"><span class="bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold px-2 py-0.5 rounded text-[11px]">+100 XP</span></td>
                  <td class="p-3"><code class="text-sky-400">/api/vault/notarize</code></td>
                </tr>
                <tr class="hover:bg-slate-800/30 transition-colors">
                  <td class="p-3"><strong class="text-white">Pubblicazione Thread On-Chain (DKP Nodes)</strong></td>
                  <td class="p-3"><span class="bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold px-2 py-0.5 rounded text-[11px]">+50 XP</span></td>
                  <td class="p-3"><code class="text-sky-400">/api/nodes/posts + Sentinel</code></td>
                </tr>
                <tr class="hover:bg-slate-800/30 transition-colors">
                  <td class="p-3"><strong class="text-white">Generazione OpenUI / DKP-Coder</strong></td>
                  <td class="p-3"><span class="bg-sky-500/15 text-sky-400 border border-sky-500/30 font-bold px-2 py-0.5 rounded text-[11px]">+30 XP</span></td>
                  <td class="p-3"><code class="text-sky-400">/api/ai/chat.post.ts</code></td>
                </tr>
                <tr class="hover:bg-slate-800/30 transition-colors">
                  <td class="p-3"><strong class="text-white">Upvote Community Thread (Ôû▓)</strong></td>
                  <td class="p-3"><span class="bg-purple-500/15 text-purple-300 border border-purple-500/30 font-bold px-2 py-0.5 rounded text-[11px]">+1 Karma</span></td>
                  <td class="p-3"><code class="text-sky-400">/api/nodes/posts/[id]/vote</code></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- SEZIONE 5: BEST PRACTICES -->
        <section id="best-practices" class="bg-[#090d16] border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col gap-5 shadow-xl">
          <h2 class="text-xl font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800 font-sans">
            <span></span> Best Practices per gli Sviluppatori
          </h2>

          <div class="flex flex-col gap-4">
            <div class="bg-[#020420] border-l-4 border-l-emerald-400 border border-slate-800 p-4 rounded-r-xl flex flex-col gap-1">
              <h4 class="text-sm font-bold text-white font-sans">Ôøô´©Å Verifica Crittografica e Integrità Anti-Manomissione</h4>
              <p class="text-xs text-slate-400 leading-relaxed font-sans">
                Ogni modifica al titolo o al contenuto di un thread o di un articolo aggiorna automaticamente la catena su <code class="text-sky-400 font-mono">dkp_vault_ledger</code>. Puoi verificare in qualsiasi momento l'integrità tramite <code class="text-sky-400 font-mono">/api/vault/verify</code> o sul nodo <NuxtLink to="/nodes/n/blockchain-vault" class="text-emerald-400 underline">n/blockchain-vault</NuxtLink>.
              </p>
            </div>

            <div class="bg-[#020420] border-l-4 border-l-sky-400 border border-slate-800 p-4 rounded-r-xl flex flex-col gap-1">
              <h4 class="text-sm font-bold text-white font-sans">ÔÜí Model Routing Intelligente</h4>
              <p class="text-xs text-slate-400 leading-relaxed font-sans">
                Usa <strong class="text-slate-200">DKP-Flash</strong> (Gemini 2.0) per query veloci o analisi di testo, <strong class="text-slate-200">DKP-Coder</strong> (Dots-3) per generare componenti Tailwind/Vue in OpenUI, e <strong class="text-slate-200">DKP-Pro</strong> (Nemotron-3) per richiedere 3 varianti di architetture complesse.
              </p>
            </div>

            <div class="bg-[#020420] border-l-4 border-l-purple-500 border border-slate-800 p-4 rounded-r-xl flex flex-col gap-1">
              <h4 class="text-sm font-bold text-white font-sans">Moderazione Nodes &amp; Pulse Sentinel</h4>
              <p class="text-xs text-slate-400 leading-relaxed font-sans">
                Tutti i contributi pubblicati nei DKP Nodes passano automaticamente la scansione della Sentinella Gemini prima di essere notarizzati sul ledger e resi visibili nel feed principale.
              </p>
            </div>
          </div>
        </section>

      </main>
	 
    </div>
  </div>
  </DkpLayout>
</template>