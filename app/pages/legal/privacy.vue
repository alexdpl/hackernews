<!-- app/pages/legal/privacy.vue -->
<script setup lang="ts">
useDkpSeo({
  title: 'Privacy Policy & Cookie Session GDPR — DevKernelPulse v2.6-PURE-SQL',
  description: 'Informativa completa ai sensi del GDPR (Reg. UE 2016/679) sul trattamento dei dati personali, gestione cookie dkp_session, cifratura Neon Pure SQL e diritti dell\'utente.'
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
        <div class="absolute top-0 right-0 w-96 h-96 bg-sky-500/5 blur-[120px] rounded-full pointer-events-none"></div>

        <!-- HEADER -->
        <header class="border-b border-slate-800 pb-6 mb-8">
          <div class="inline-flex items-center gap-2 bg-sky-500/15 text-sky-400 border border-sky-500/35 text-xs font-mono font-extrabold tracking-wider px-3.5 py-1.5 rounded-full mb-4 uppercase">
            <span>🛡️ DATA PROTECTION &amp; GDPR</span>
            <span class="text-slate-500">•</span>
            <span>v2.6-PURE-SQL</span>
          </div>

          <h1 class="text-3xl sm:text-5xl font-black text-white mb-3 tracking-tight leading-tight">
            Informativa sulla <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-400">Privacy &amp; Cookie</span>
          </h1>
          <p class="text-xs sm:text-sm font-mono text-slate-400 m-0">
            Conforme al Regolamento (UE) 2016/679 (GDPR) &amp; DKP Zero-Trust Core | Aggiornamento: Novembre 2026 (v2.6-PURE-SQL)
          </p>
        </header>

        <!-- BODY -->
        <div class="flex flex-col gap-8 text-slate-300 text-sm sm:text-base leading-relaxed">

          <!-- SEZIONE 1 -->
          <section>
            <h2 class="text-lg sm:text-xl font-extrabold text-sky-400 mb-3 flex items-center gap-2">
              <span>01.</span>
              <span>Titolare del Trattamento &amp; Principio di Minimizzazione</span>
            </h2>
            <p class="mb-3">
              Il Titolare del trattamento dei dati personali raccolti tramite l'ecosistema <strong class="text-white">DevKernelPulse (DKP)</strong> è il team fondatore del progetto (<strong class="text-white">Alessandro De Paola</strong> — contatto diretto tramite repository ufficiale GitHub o canali di supporto della piattaforma).
            </p>
            <p class="m-0">
              In conformità all'Art. 5 del GDPR, DKP applica il principio di <strong class="text-emerald-400">minimizzazione dei dati</strong>: raccogliamo esclusivamente le informazioni strettamente indispensabili per erogare l'autenticazione, il metering delle API, la gamification XP e la sicurezza dell'infrastruttura.
            </p>
          </section>

          <!-- SEZIONE 2 -->
          <section>
            <h2 class="text-lg sm:text-xl font-extrabold text-sky-400 mb-3 flex items-center gap-2">
              <span>02.</span>
              <span>Tipologia di Dati Trattati e Finalità</span>
            </h2>
            <ul class="flex flex-col gap-3 p-0 list-none">
              <li class="relative pl-6">
                <span class="absolute left-0 text-emerald-400 font-bold">▹</span>
                <strong class="text-white">Dati di Account &amp; Credenziali:</strong> Username, indirizzo email, ruolo (<code class="bg-[#020420] text-emerald-400 px-1.5 py-0.5 rounded font-mono text-xs">USER</code>, <code class="bg-[#020420] text-emerald-400 px-1.5 py-0.5 rounded font-mono text-xs">PRO</code>, <code class="bg-[#020420] text-emerald-400 px-1.5 py-0.5 rounded font-mono text-xs">ADMIN</code>) e hash crittografico della password (mai salvata in chiaro).
              </li>
              <li class="relative pl-6">
                <span class="absolute left-0 text-emerald-400 font-bold">▹</span>
                <strong class="text-white">Dati OAuth Social Login:</strong> Identificativi univoci e indirizzo email pubblico forniti da GitHub, Google, GitLab o LinkedIn esclusivamente su esplicita autorizzazione dell'utente in fase di accesso.
              </li>
              <li class="relative pl-6">
                <span class="absolute left-0 text-emerald-400 font-bold">▹</span>
                <strong class="text-white">Contenuti Pubblici &amp; Proof of Code Vault:</strong> Articoli pubblicati nell'Editorial Hub, nodi/commenti nel Talks Hub e impronte crittografiche (<code class="bg-[#020420] text-sky-400 px-1.5 py-0.5 rounded font-mono text-xs">SHA-256</code>) notarizzate nel Vault.
              </li>
              <li class="relative pl-6">
                <span class="absolute left-0 text-emerald-400 font-bold">▹</span>
                <strong class="text-white">Chiavi API &amp; Telemetria Metering Pure SQL:</strong> Hash crittografico delle chiavi API (<code class="bg-[#020420] text-sky-400 px-1.5 py-0.5 rounded font-mono text-xs">key_hash</code>), conteggio delle richieste mensili e log tecnici di sicurezza elaborati da <strong class="text-white">Pulse Sentinel AI v2.6</strong> per prevenire abusi, DDoS o intrusioni (legittimo interesse ex Art. 6, par. 1, lett. f GDPR).
              </li>
            </ul>
          </section>

          <!-- SEZIONE 3 -->
          <section>
            <h2 class="text-lg sm:text-xl font-extrabold text-sky-400 mb-3 flex items-center gap-2">
              <span>03.</span>
              <span>Gestione Cookie Tecnici &amp; Sessioni (`dkp_session`)</span>
            </h2>
            <p class="mb-4">
              DevKernelPulse <strong class="text-emerald-400">non utilizza cookie di profilazione, pixel pubblicitari o tracker di terze parti</strong>. Per il funzionamento tecnico dell'autenticazione utilizziamo un unico cookie strettamente necessario denominato <code class="bg-[#020420] text-emerald-400 px-2 py-0.5 rounded font-mono text-xs font-bold">dkp_session</code>, esente da consenso preventivo ai sensi delle Linee Guida del Garante Privacy:
            </p>

            <div class="overflow-x-auto bg-[#020420] border border-slate-800 rounded-2xl">
              <table class="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr class="border-b border-slate-800 text-slate-400 bg-slate-900/40">
                    <th class="p-3.5">Nome Cookie</th>
                    <th class="p-3.5">Tipologia</th>
                    <th class="p-3.5">Attributi Sicurezza</th>
                    <th class="p-3.5">Finalità</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/80 text-slate-300">
                  <tr>
                    <td class="p-3.5 text-emerald-400 font-bold">dkp_session</td>
                    <td class="p-3.5">Tecnico / Strettamente Necessario</td>
                    <td class="p-3.5 text-sky-400">HttpOnly; Secure; SameSite=Lax</td>
                    <td class="p-3.5 font-sans">Mantiene la sessione autenticata tra SSR Nitro e client Nuxt 4 proteggendo da attacchi XSS/CSRF.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- SEZIONE 4 -->
          <section>
            <h2 class="text-lg sm:text-xl font-extrabold text-sky-400 mb-3 flex items-center gap-2">
              <span>04.</span>
              <span>Infrastruttura Cloud, Sub-Responsabili &amp; Sicurezza</span>
            </h2>
            <p class="mb-3">
              I dati sono conservati su infrastrutture cloud ad alta affidabilità con cifratura <strong class="text-white">TLS 1.3 in transito</strong> e <strong class="text-white">AES-256 a riposo</strong>:
            </p>
            <ul class="flex flex-col gap-2.5 p-0 list-none">
              <li class="relative pl-6">
                <span class="absolute left-0 text-emerald-400 font-bold">▹</span>
                <strong class="text-white">Neon PostgreSQL (Pure SQL Storage):</strong> Database serverless ad alte prestazioni configurato con query parametrizzate native per prevenire SQL Injection.
              </li>
              <li class="relative pl-6">
                <span class="absolute left-0 text-emerald-400 font-bold">▹</span>
                <strong class="text-white">Google Cloud Platform (`europe-west4` — Paesi Bassi, UE):</strong> Hosting applicativo, bilanciamento del carico e protezione perimetrale Cloud Armor in territorio dell'Unione Europea.
              </li>
              <li class="relative pl-6">
                <span class="absolute left-0 text-emerald-400 font-bold">▹</span>
                <strong class="text-white">OpenRouter / DKP Trinity AI:</strong> I prompt inviati agli strumenti AI vengono instradati esclusivamente verso provider conformi alle policy di non-addestramento sui dati API.
              </li>
            </ul>
          </section>

          <!-- SEZIONE 5 -->
          <section>
            <h2 class="text-lg sm:text-xl font-extrabold text-sky-400 mb-3 flex items-center gap-2">
              <span>05.</span>
              <span>Tempi di Conservazione &amp; Diritti dell'Interessato (Art. 15-22 GDPR)</span>
            </h2>
            <p class="mb-3">
              I dati dell'account restano conservati fino alla richiesta di cancellazione da parte dell'utente. I log di sicurezza perimetrici di Pulse Sentinel AI vengono conservati per il tempo strettamente necessario alla mitigazione delle minacce informatiche.
            </p>
            <div class="bg-[#020420] border border-slate-800 border-l-4 border-l-sky-400 rounded-2xl p-5 text-xs sm:text-sm text-slate-300">
              In qualsiasi momento puoi esercitare i diritti previsti dagli <strong class="text-white">Artt. 15–22 del GDPR</strong> (accesso ai dati, rettifica, cancellazione/diritto all'oblio, limitazione del trattamento e portabilità) direttamente dalle impostazioni della tua <NuxtLink to="/user/dashboard" class="text-emerald-400 underline font-bold">Dashboard Utente</NuxtLink> oppure inviando una richiesta formale ai canali ufficiali del progetto.
            </div>
          </section>

        </div>
      </article>

      <!-- FOOTER NAVIGATION -->
      <div class="flex flex-wrap justify-between items-center gap-4 pt-4 border-t border-slate-800 font-mono text-xs">
        <NuxtLink to="/legal/terms" class="text-emerald-400 hover:text-sky-400 font-bold transition-colors">
          ⚖️ Leggi i Termini di Servizio &amp; Copyright →
        </NuxtLink>
        <NuxtLink to="/guidelines" class="text-purple-400 hover:text-emerald-400 font-bold transition-colors">
          📜 Linee Guida della Community →
        </NuxtLink>
      </div>

    </div>
  </div>
</template>