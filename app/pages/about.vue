<!-- app/pages/about.vue -->
<script setup lang="ts">
useDkpSeo({
  title: 'Chi Siamo & Visione Architetturale — DevKernelPulse v2.6-PURE-SQL',
  description: 'Scopri la missione, la filosofia e l\'architettura serverless Pure SQL alla base di DevKernelPulse v2.6-PURE-SQL, ecosistema indipendente guidato dall\'IA per sviluppatori.'
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
        <div class="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none"></div>

        <!-- BADGE CATEGORIA -->
        <div class="inline-flex items-center gap-2 bg-emerald-500/15 text-emerald-400 border border-emerald-500/35 text-xs font-mono font-extrabold tracking-wider px-3.5 py-1.5 rounded-full mb-5 uppercase">
          <span>🧬 ECOSYSTEM &amp; MISSION</span>
          <span class="text-slate-500">•</span>
          <span>v2.6-PURE-SQL</span>
        </div>

        <!-- TITOLO E METADATI -->
        <h1 class="text-3xl sm:text-5xl font-black text-white mb-3 tracking-tight leading-tight">
          Chi Siamo • <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-400">DevKernelPulse</span>
        </h1>
        <p class="text-xs sm:text-sm font-mono text-slate-400 mb-6">
          Piattaforma indipendente, fulminea e guidata dall'IA per sviluppatori e maker | Release v2.6-PURE-SQL
        </p>

        <hr class="border-slate-800 my-7" />

        <!-- SEZIONE 1: MISSIONE -->
        <section class="mb-9">
          <h2 class="text-lg sm:text-xl font-extrabold text-sky-400 mb-3 flex items-center gap-2">
            <span>01.</span>
            <span>La Missione DKP</span>
          </h2>
          <p class="text-sm sm:text-base leading-relaxed text-slate-300 m-0">
            <strong class="text-white">DevKernelPulse (DKP)</strong> nasce con una missione audace e cristallina: diventare il punto di incontro definitivo, indipendente e tecnicamente avanzato per la community di sviluppatori, ingegneri software, architetti cloud e maker in Italia e in Europa.
          </p>
        </section>

        <!-- SEZIONE 2: FILOSOFIA -->
        <section class="mb-9">
          <h2 class="text-lg sm:text-xl font-extrabold text-sky-400 mb-3 flex items-center gap-2">
            <span>02.</span>
            <span>La Nostra Filosofia Ingegneristica</span>
          </h2>
          <p class="text-sm sm:text-base leading-relaxed text-slate-300 mb-4">
            Nel panorama tech odierno saturo di rumore digitale, paywall opachi e social network generalisti, DKP recupera il valore autentico del dibattito tecnico e della trasparenza architetturale:
          </p>
          <ul class="flex flex-col gap-2.5 my-4 p-0 list-none">
            <li class="relative pl-6 text-sm text-slate-300 leading-relaxed">
              <span class="absolute left-0 text-emerald-400 font-bold">▹</span>
              <strong class="text-white">Qualità del Codice &amp; Zero-Bloat:</strong> Focus su best practice, pattern architetturali puliti e query Pure SQL ad altissima efficienza.
            </li>
            <li class="relative pl-6 text-sm text-slate-300 leading-relaxed">
              <span class="absolute left-0 text-emerald-400 font-bold">▹</span>
              <strong class="text-white">Architetture Serverless &amp; Edge:</strong> Approfondimenti concreti su microservizi Nitro, PostgreSQL serverless, sicurezza applicativa e intelligenza artificiale.
            </li>
            <li class="relative pl-6 text-sm text-slate-300 leading-relaxed">
              <span class="absolute left-0 text-emerald-400 font-bold">▹</span>
              <strong class="text-white">Open Source &amp; Meritocrazia (XP):</strong> Valorizzazione dei progetti indipendenti attraverso gamification reale che premia i contributi tecnici con quote API e badge verificati.
            </li>
          </ul>
          <p class="text-sm sm:text-base leading-relaxed text-slate-300 m-0">
            Niente metriche di vanità: solo contenuti, tool e infrastrutture ad alto valore che fanno pulsare il cuore del kernel tecnologico.
          </p>
        </section>

        <!-- SEZIONE 3: ECOSISTEMA V2.6-PURE-SQL -->
        <section class="mb-9">
          <h2 class="text-lg sm:text-xl font-extrabold text-sky-400 mb-3 flex items-center gap-2">
            <span>03.</span>
            <span>L'Architettura v2.6-PURE-SQL</span>
          </h2>
          <p class="text-sm sm:text-base leading-relaxed text-slate-300 mb-5">
            La release <strong class="text-emerald-400 font-mono">v2.6-PURE-SQL</strong> elimina ogni strato intermedio superfluo, combinando Nuxt 4 Nitro con query SQL native parametrizzate su Neon PostgreSQL per garantire reattività estrema e latenza sub-10ms:
          </p>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-[#020420] border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-5 flex items-start gap-4 transition-colors">
              <div class="text-2xl shrink-0">🗄️</div>
              <div class="flex flex-col gap-1">
                <strong class="text-sm sm:text-base text-white font-extrabold">Neon Pure SQL Kernel</strong>
                <span class="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Accesso diretto e parametrizzato a PostgreSQL serverless senza overhead ORM, con indicizzazione istantanea per Tech Feed, Talks Hub ed Editorial Hub.
                </span>
              </div>
            </div>

            <div class="bg-[#020420] border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-5 flex items-start gap-4 transition-colors">
              <div class="text-2xl shrink-0">🤖</div>
              <div class="flex flex-col gap-1">
                <strong class="text-sm sm:text-base text-white font-extrabold">DKP Trinity &amp; OpenUI Studio</strong>
                <span class="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Routing dinamico multi-modello (Flash, Coder, Pro) via OpenRouter con streaming nativo, generazione componenti UI e gamification XP in tempo reale.
                </span>
              </div>
            </div>

            <div class="bg-[#020420] border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-5 flex items-start gap-4 transition-colors">
              <div class="text-2xl shrink-0">🛡️</div>
              <div class="flex flex-col gap-1">
                <strong class="text-sm sm:text-base text-white font-extrabold">Pulse Sentinel &amp; Code Vault</strong>
                <span class="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  WAF euristico con analisi SAST/AST, autenticazione Zero-Trust SHA-256 e notarizzazione crittografica immutabile per codice sorgente e articoli.
                </span>
              </div>
            </div>

            <div class="bg-[#020420] border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-5 flex items-start gap-4 transition-colors">
              <div class="text-2xl shrink-0">🛠️</div>
              <div class="flex flex-col gap-1">
                <strong class="text-sm sm:text-base text-white font-extrabold">DKP Tools, SDK &amp; CLI</strong>
                <span class="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Suite completa di utility in-browser, SDK TypeScript/Python/Go e CLI Toolkit per automatizzare audit, pubblicazioni e pipeline CI/CD.
                </span>
              </div>
            </div>
          </div>
        </section>

        <!-- SEZIONE 4: CHI C'È DIETRO IL PROGETTO -->
        <section>
          <h2 class="text-lg sm:text-xl font-extrabold text-sky-400 mb-3 flex items-center gap-2">
            <span>04.</span>
            <span>Chi c'è dietro il progetto</span>
          </h2>
          <div class="bg-[#020420] border border-slate-800 border-l-4 border-l-emerald-400 rounded-2xl p-5 sm:p-6">
            <div class="flex items-center gap-3.5 mb-3">
              <span class="text-3xl">👨‍💻</span>
              <div>
                <strong class="block text-base sm:text-lg text-white font-black">Alessandro De Paola</strong>
                <span class="block text-xs font-mono text-emerald-400 font-bold">Founder Creator &amp; Lead Engineer Architect</span>
              </div>
            </div>
            <p class="text-xs sm:text-sm text-slate-400 m-0 leading-relaxed">
              Creato con passione da <strong class="text-slate-200">Alessandro De Paola</strong> in stretta sinergia con l'intelligenza artificiale avanzata (<strong class="text-slate-200">Gemini AI</strong>), DKP dimostra come la fusione tra visione umana, ingegneria del software Pure SQL e automazione intelligente possa dare vita a un ecosistema moderno, fulmineo e curato nei minimi dettagli.
            </p>
          </div>
        </section>

      </article>

      <!-- FOOTER NAVIGATION -->
      <div class="flex flex-wrap justify-between items-center gap-4 pt-4 border-t border-slate-800 font-mono text-xs">
        <NuxtLink to="/guidelines" class="text-purple-400 hover:text-emerald-400 font-bold transition-colors">
          📜 Leggi le Linee Guida della Community →
        </NuxtLink>
        <NuxtLink to="/docs/faq" class="text-sky-400 hover:text-emerald-400 font-bold transition-colors">
          🧠 Esplora FAQ &amp; Knowledge Base →
        </NuxtLink>
      </div>

    </div>
  </div>
</template>