<!-- app/pages/legal/terms.vue -->
<script setup lang="ts">
useDkpSeo({
  title: 'Termini di Servizio, Copyright & Sicurezza Sentinel — DevKernelPulse v2.6-PURE-SQL',
  description: 'Condizioni generali d\'uso, proprietà intellettuale, licenze API Pass, norme anti-abuso e clausola di sicurezza Pulse Sentinel AI v2.6-PURE-SQL.'
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

      <!-- MAIN LEGAL CARD -->
      <article class="bg-[#090d16]/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        <div class="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none"></div>

        <!-- HEADER -->
        <header class="border-b border-slate-800 pb-6 mb-8">
          <div class="inline-flex items-center gap-2 bg-emerald-500/15 text-emerald-400 border border-emerald-500/35 text-xs font-mono font-extrabold tracking-wider px-3.5 py-1.5 rounded-full mb-4 uppercase">
            <span>⚖️ LEGAL &amp; COMPLIANCE</span>
            <span class="text-slate-500">•</span>
            <span>v2.6-PURE-SQL</span>
          </div>

          <h1 class="text-3xl sm:text-5xl font-black text-white mb-3 tracking-tight leading-tight">
            Termini di Servizio &amp; <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-400">Copyright Proprietario</span>
          </h1>
          <p class="text-xs sm:text-sm font-mono text-slate-400 m-0">
            Ultimo aggiornamento: Novembre 2026 | Versione Ecosistema v2.6-PURE-SQL
          </p>
        </header>

        <!-- BODY -->
        <div class="flex flex-col gap-8 text-slate-300 text-sm sm:text-base leading-relaxed">

          <!-- ART. 1 -->
          <section>
            <h2 class="text-lg sm:text-xl font-extrabold text-sky-400 mb-3">
              Art. 1 — Accettazione dei Termini e Ambito di Applicazione
            </h2>
            <p class="m-0">
              Accedendo e utilizzando la piattaforma <strong class="text-white">DevKernelPulse (DKP)</strong>, inclusi il Tech Feed, il Talks Hub, l'Editorial Hub, la suite <strong class="text-white">DKP Tools v2.6</strong> (OpenUI Studio, Neural Playground, AI Code Scanner, Proof of Code Vault), l'API Gateway, l'SDK <code class="bg-[#020420] text-sky-400 px-1.5 py-0.5 rounded font-mono text-xs">@devkernelpulse/sdk</code> e il sistema <strong class="text-white">DKP Auth Core</strong>, l'utente dichiara di aver letto, compreso e accettato integralmente i presenti Termini di Servizio.
            </p>
          </section>

          <!-- ART. 2 -->
          <section>
            <h2 class="text-lg sm:text-xl font-extrabold text-sky-400 mb-3">
              Art. 2 — Ownership, Copyright &amp; Proprietà Intellettuale DKP
            </h2>
            <p class="mb-3">
              L'architettura proprietaria dell'ecosistema DevKernelPulse — inclusi a titolo esemplificativo ma non esaustivo: il motore Pure SQL, il design system, il marchio DKP, l'orchestratore <em class="text-slate-200">DKP Trinity AI, OpenUI Studio, AI Code Scanner, Proof of Code Vault</em> e i pacchetti digitali distribuiti nello Shop — è protetta dalle leggi nazionali e internazionali sul diritto d'autore e sulla proprietà intellettuale.
            </p>
            <ul class="flex flex-col gap-2.5 p-0 list-none">
              <li class="relative pl-6">
                <span class="absolute left-0 text-emerald-400 font-bold">▹</span>
                È severamente vietata la riproduzione, clonazione commerciale, decompilazione o reverse engineering dei moduli proprietari e delle interfacce protette.
              </li>
              <li class="relative pl-6">
                <span class="absolute left-0 text-emerald-400 font-bold">▹</span>
                È vietata la rivendita o ridistribuzione non autorizzata dei pacchetti digitali (<code class="bg-[#020420] text-emerald-400 px-1.5 py-0.5 rounded font-mono text-xs">.ZIP</code>) e degli API Pass acquistati o riscattati nello Shop DKP.
              </li>
            </ul>
          </section>

          <!-- ART. 3 -->
          <section>
            <h2 class="text-lg sm:text-xl font-extrabold text-sky-400 mb-3">
              Art. 3 — Contenuti Pubblicati dagli Utenti (Editorial Hub &amp; Talks Hub)
            </h2>
            <p class="m-0">
              L'utente conserva la piena titolarità e paternità intellettuale degli articoli tecnici, degli snippet di codice e dei commenti pubblicati nel <strong class="text-white">DKP Editorial Hub</strong> e nel <strong class="text-white">DKP Talks Hub</strong>. Pubblicando tali contenuti, l'utente concede a DevKernelPulse una licenza mondiale, non esclusiva e gratuita per ospitarli, indicizzarli, tradurli e renderli fruibili alla community sulla piattaforma, garantendo di disporre di tutti i diritti necessari e che i contenuti non violino diritti di terzi né contengano codice malevolo.
            </p>
          </section>

          <!-- ART. 4 -->
          <section>
            <h2 class="text-lg sm:text-xl font-extrabold text-sky-400 mb-3">
              Art. 4 — DKP Auth Core, Chiavi API &amp; Piani di Servizio
            </h2>
            <p class="m-0">
              L'autenticazione e l'accesso programmatico sono gestiti tramite <strong class="text-white">DKP Auth Core</strong> e chiavi Bearer crittografate (<code class="bg-[#020420] text-sky-400 px-1.5 py-0.5 rounded font-mono text-xs">dkp_live_...</code>). L'utente è l'unico responsabile della custodia sicura delle proprie credenziali e variabili d'ambiente. Le quote mensili (FREE, PRO, ENTERPRISE e API Pass) sono soggette a metering atomico su Neon PostgreSQL; in caso di compromissione o uso fraudolento, l'utente è tenuto a revocare immediatamente la chiave dalla propria Dashboard.
            </p>
          </section>

          <!-- ART. 5 -->
          <section>
            <h2 class="text-lg sm:text-xl font-extrabold text-sky-400 mb-3">
              Art. 5 — Politica d'Uso Corretto (Fair Use) e Divieti di Abuso
            </h2>
            <p class="mb-3">
              Gli strumenti DKP sono progettati per sviluppo software legittimo, audit difensivo, ricerca e notarizzazione. Sono espressamente vietate le seguenti condotte:
            </p>
            <ul class="flex flex-col gap-2.5 p-0 list-none">
              <li class="relative pl-6">
                <span class="absolute left-0 text-emerald-400 font-bold">▹</span>
                Scraping automatizzato massivo o invocazione degli endpoint senza API Key valida o in violazione dei Rate Limit assegnati.
              </li>
              <li class="relative pl-6">
                <span class="absolute left-0 text-emerald-400 font-bold">▹</span>
                Utilizzo di AI Code Scanner, OpenUI Studio o dei modelli Trinity per generare malware, exploit o esfiltrare dati sensibili.
              </li>
              <li class="relative pl-6">
                <span class="absolute left-0 text-emerald-400 font-bold">▹</span>
                Manipolazione artificiale del sistema di Gamification XP o creazione di account multipli ("Sybil attack").
              </li>
            </ul>
          </section>

          <!-- ART. 6 -->
          <section>
            <h2 class="text-lg sm:text-xl font-extrabold text-sky-400 mb-3">
              Art. 6 — Natura del Proof of Code Vault &amp; Limitazione di Responsabilità
            </h2>
            <p class="m-0">
              I DKP Tools, gli output generati dall'intelligenza artificiale e i certificati crittografici SHA-256 del <strong class="text-white">Proof of Code Vault</strong> sono forniti <em class="text-slate-200">"così come sono" (AS-IS)</em>. I certificati del Vault attestano l'integrità matematica dell'hash registrato a un determinato timestamp nel database DKP, ma non sostituiscono atti notarili pubblici né consulenze legali formali. DevKernelPulse esclude qualsiasi responsabilità per danni diretti o indiretti derivanti dall'impiego in produzione di codice generato dall'IA senza preventiva verifica umana.
            </p>
          </section>

          <!-- ART. 7 / ART. 8 SENTINEL AI -->
          <section class="bg-gradient-to-br from-rose-500/10 via-purple-500/10 to-[#020420] border border-rose-500/50 rounded-2xl p-6 shadow-[0_0_30px_rgba(244,63,94,0.1)]">
            <h2 class="text-base sm:text-lg font-black text-rose-400 mb-2.5 flex items-center gap-2 uppercase tracking-wide">
              <span>🛡️</span>
              <span>Art. 7 — Tutela Infrastrutturale &amp; Pulse Sentinel AI v2.6-PURE-SQL</span>
            </h2>
            <p class="text-xs sm:text-sm text-slate-200 leading-relaxed m-0">
              Per la totale tutela e integrità dell'ecosistema <strong class="text-white">DevKernelPulse©</strong>, ogni richiesta HTTP, query e payload API è sorvegliata in tempo reale dal firewall euristico <strong class="text-purple-300">Pulse Sentinel AI v2.6-PURE-SQL©</strong> integrato con Google Cloud Armor. Qualsiasi tentativo di scansione malevola non autorizzata, abuso dei limiti di frequenza (<strong class="text-white">Rate Limit Abuse</strong>), attacco di <strong class="text-white">Prompt Injection</strong> o invio di payload di tipo <strong class="text-white">Injection (XSS / SQLi)</strong> comporterà l'immediato <strong class="text-rose-400">ban permanente e irrevocabile dell'indirizzo IP</strong> e la revoca istantanea delle chiavi API associate all'account.
            </p>
          </section>

        </div>
      </article>

      <!-- FOOTER NAVIGATION -->
      <div class="flex flex-wrap justify-between items-center gap-4 pt-4 border-t border-slate-800 font-mono text-xs">
        <NuxtLink to="/legal/privacy" class="text-sky-400 hover:text-emerald-400 font-bold transition-colors">
          ← Torna all'Informativa Privacy &amp; Cookie (GDPR)
        </NuxtLink>
        <NuxtLink to="/about" class="text-emerald-400 hover:text-sky-400 font-bold transition-colors">
          Chi Siamo &amp; Missione DKP →
        </NuxtLink>
      </div>

    </div>
  </div>
</template>