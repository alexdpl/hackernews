<!-- app/pages/guidelines.vue -->
<script setup lang="ts">
useDkpSeo({
  title: 'Linee Guida della Community & Code of Conduct — DevKernelPulse v2.6-PURE-SQL',
  description: 'Linee guida, codice di condotta, regole di pubblicazione editoriale e utilizzo responsabile degli strumenti AI per la community di DevKernelPulse v2.6-PURE-SQL.'
})
</script>

<template>
  <div class="min-h-screen bg-[#020420] text-slate-100 px-4 sm:px-6 py-10 pb-20 font-sans">
    <div class="max-w-5xl mx-auto flex flex-col gap-8">

      <!-- BARRA 4 PILASTRI ECOSISTEMA DKP v2.6 -->
      <nav aria-label="Navigazione Ecosistema DKP" class="flex flex-wrap gap-2.5 justify-center font-mono bg-[#090d16] border border-slate-800 p-3 rounded-2xl shadow-lg">
        <NuxtLink
          to="/news"
          class="px-4 py-2 bg-[#020420] border border-slate-700 hover:border-emerald-400 text-emerald-400 font-extrabold text-xs rounded-xl transition-all"
        >
          🌍 DKP Tech Feed
        </NuxtLink>

        <NuxtLink
          to="/nodes"
          class="px-4 py-2 bg-[#020420] border border-slate-700 hover:border-purple-400 text-purple-400 font-extrabold text-xs rounded-xl transition-all"
        >
          💬 DKP Talks Hub
        </NuxtLink>

        <NuxtLink
          to="/tools"
          class="px-4 py-2 bg-[#020420] border border-slate-700 hover:border-sky-400 text-sky-400 font-extrabold text-xs rounded-xl transition-all"
        >
          🛠️ Developer Tools
        </NuxtLink>

        <NuxtLink
          to="/blog"
          class="px-4 py-2 bg-[#020420] border border-slate-700 hover:border-emerald-400 text-emerald-300 font-extrabold text-xs rounded-xl transition-all"
        >
          ✍️ DKP Editorial Hub
        </NuxtLink>
      </nav>

      <!-- MAIN INSTITUTIONAL CARD -->
      <article class="bg-[#090d16]/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        <div class="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 blur-[120px] rounded-full pointer-events-none"></div>

        <!-- HEADER TOP: ICONA E BADGE -->
        <div class="flex items-center gap-3.5 mb-5 flex-wrap">
          <div class="flex items-center justify-center w-10 h-10 bg-purple-500/15 text-purple-400 border border-purple-500/35 rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div class="inline-flex items-center gap-2 bg-emerald-500/15 text-emerald-400 border border-emerald-500/35 text-xs font-mono font-extrabold tracking-wider px-3.5 py-1.5 rounded-full uppercase">
            <span>COMMUNITY &amp; CODE OF CONDUCT</span>
            <span class="text-slate-500">•</span>
            <span>v2.6-PURE-SQL</span>
          </div>
        </div>

        <!-- TITOLO E METADATI -->
        <h1 class="text-3xl sm:text-5xl font-black text-white mb-3 tracking-tight leading-tight">
          Linee Guida della <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-purple-400">Community</span>
        </h1>
        <p class="text-xs sm:text-sm font-mono text-slate-400 mb-6">
          Regole d'oro per mantenere DevKernelPulse un hub tecnico ad alto valore aggiunto | Ecosistema v2.6-PURE-SQL
        </p>

        <hr class="border-slate-800 my-7" />

        <!-- INTRODUZIONE -->
        <p class="text-sm sm:text-base leading-relaxed text-slate-200 mb-8">
          Per mantenere <strong class="text-white">DevKernelPulse (DKP)</strong> uno spazio stimolante, pulito e ricco di contenuti tecnici di alto livello tra Tech Feed, Talks Hub ed Editorial Hub, chiediamo a tutti i membri di seguire poche e semplici regole d'oro.
        </p>

        <!-- SEZIONE 1: QUALITÀ E PERTINENZA -->
        <section class="mb-9">
          <h2 class="text-lg sm:text-xl font-extrabold text-sky-400 mb-3 flex items-center gap-2">
            <span>01.</span>
            <span>Qualità e Pertinenza Tecnica</span>
          </h2>
          <p class="text-sm sm:text-base leading-relaxed text-slate-300 mb-3">
            Condividi articoli nel <strong class="text-white">DKP Editorial Hub</strong>, nodi nel <strong class="text-white">Talks Hub</strong>, domande (<em class="text-emerald-300">Ask DKP</em>) e progetti (<em class="text-emerald-300">Show DKP</em>) che apportino valore reale a sviluppatori, sistemisti, devops, data scientist e architetti cloud:
          </p>
          <ul class="flex flex-col gap-2.5 my-3 p-0 list-none">
            <li class="relative pl-6 text-sm text-slate-300 leading-relaxed">
              <span class="absolute left-0 text-emerald-400 font-bold">▹</span>
              <strong class="text-white">Contenuti ammessi:</strong> Architetture software, benchmark SQL/Cloud, analisi del codice, novità open source, post-mortem di incidenti tecnici e guide approfondite.
            </li>
            <li class="relative pl-6 text-sm text-slate-300 leading-relaxed">
              <span class="absolute left-0 text-emerald-400 font-bold">▹</span>
              <strong class="text-white">Contenuti vietati:</strong> Marketing aggressivo, link affiliate, promozioni commerciali superficiali, contenuti generati automaticamente privi di revisione tecnica o clickbait.
            </li>
          </ul>
        </section>

        <!-- SEZIONE 2: DISCUSSIONI COSTRUTTIVE -->
        <section class="mb-9">
          <h2 class="text-lg sm:text-xl font-extrabold text-sky-400 mb-3 flex items-center gap-2">
            <span>02.</span>
            <span>Discussioni Costruttive e Rigore</span>
          </h2>
          <p class="text-sm sm:text-base leading-relaxed text-slate-300 mb-3">
            Nei commenti e nelle discussioni dei Nodi, punta sempre all'eccellenza e alla precisione. L'argomentazione logica e il rispetto reciproco sono il pilastro della nostra crescita collettiva:
          </p>
          <ul class="flex flex-col gap-2.5 my-3 p-0 list-none">
            <li class="relative pl-6 text-sm text-slate-300 leading-relaxed">
              <span class="absolute left-0 text-emerald-400 font-bold">▹</span>
              <strong class="text-white">Discuti le idee, non le persone:</strong> Il dibattito acceso sulle scelte architetturali, sugli ORM vs Pure SQL o sui linguaggi è benvenuto; gli attacchi personali (<em class="text-slate-400">ad hominem</em>) non sono tollerati.
            </li>
            <li class="relative pl-6 text-sm text-slate-300 leading-relaxed">
              <span class="absolute left-0 text-emerald-400 font-bold">▹</span>
              <strong class="text-white">Apporta evidenze:</strong> Se esprimi un disaccordo tecnico, spiega il <em class="text-slate-200">perché</em> fornendo esempi di codice, benchmark, documentazione ufficiale o casi d'uso reali.
            </li>
          </ul>
        </section>

        <!-- SEZIONE 3: TRASPARENZA JOB E SHOW DKP -->
        <section class="mb-9">
          <h2 class="text-lg sm:text-xl font-extrabold text-sky-400 mb-3 flex items-center gap-2">
            <span>03.</span>
            <span>Trasparenza nei Job, Show DKP &amp; Vault</span>
          </h2>
          <div class="bg-[#020420] border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 mt-3">
            <div class="flex flex-col gap-1">
              <strong class="text-sm text-emerald-400 font-extrabold">💼 Offerte di Lavoro (Job Board):</strong>
              <span class="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Includi sempre lo stack tecnologico richiesto, il range salariale o di compensation trasparente e la modalità operativa (Full Remote, Hybrid, Onsite).
              </span>
            </div>
            <div class="flex flex-col gap-1 pt-3 border-t border-slate-800/80">
              <strong class="text-sm text-emerald-400 font-extrabold">🚀 Show DKP &amp; Proof of Code Vault:</strong>
              <span class="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Quando presenti una libreria open source o un'architettura notarizzata nel Vault, condividi dettagli tecnici riproducibili e resta aperto al peer-review della community.
              </span>
            </div>
          </div>
        </section>

        <!-- SEZIONE 4: USO RESPONSABILE DI AI & DKP TOOLS -->
        <section>
          <h2 class="text-lg sm:text-xl font-extrabold text-sky-400 mb-3 flex items-center gap-2">
            <span>04.</span>
            <span>Uso Responsabile di DKP Tools, API &amp; Sentinel AI</span>
          </h2>
          <p class="text-sm sm:text-base leading-relaxed text-slate-300 mb-3">
            L'ecosistema <strong class="text-emerald-400 font-mono">v2.6-PURE-SQL</strong> mette a disposizione strumenti avanzati (OpenUI Studio, Neural Playground, SDK, CLI e REST API). Tutti i flussi sono protetti in tempo reale da <strong class="text-white">Pulse Sentinel AI</strong>:
          </p>
          <ul class="flex flex-col gap-2.5 my-3 p-0 list-none">
            <li class="relative pl-6 text-sm text-slate-300 leading-relaxed">
              <span class="absolute left-0 text-emerald-400 font-bold">▹</span>
              <strong class="text-white">No Spam, Scraping o Abuso XP:</strong> È vietato aggirare i rate-limit, automatizzare farm di XP o tentare Prompt Injection / SQL Injection sugli endpoint pubblici e privati.
            </li>
            <li class="relative pl-6 text-sm text-slate-300 leading-relaxed">
              <span class="absolute left-0 text-emerald-400 font-bold">▹</span>
              <strong class="text-white">Igiene delle Credenziali:</strong> Non incollare mai chiavi API private (<code class="text-sky-400 font-mono text-xs">dkp_live_...</code>), token di produzione o codice proprietario coperto da NDA nei post pubblici o negli strumenti di scansione condivisi.
            </li>
          </ul>
        </section>

      </article>

      <!-- FOOTER NAVIGATION -->
      <div class="flex flex-wrap justify-between items-center gap-4 pt-4 border-t border-slate-800 font-mono text-xs">
        <NuxtLink to="/about" class="text-sky-400 hover:text-emerald-400 font-bold transition-colors">
          ← Torna a Chi Siamo (About DKP)
        </NuxtLink>
        <NuxtLink to="/nodes" class="text-purple-400 hover:text-emerald-400 font-bold transition-colors">
          Partecipa nel DKP Talks Hub →
        </NuxtLink>
      </div>

    </div>
  </div>
</template>