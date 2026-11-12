<!-- app/pages/cookie-policy.vue -->
<script setup lang="ts">
useDkpSeo({
  title: 'Cookie Policy & Gestione Dati — DevKernelPulse v2.6-PURE-SQL',
  description: 'Informativa sui cookie tecnici di prima parte (dkp_session), LocalStorage e architettura Zero-Profilazione di DevKernelPulse v2.6-PURE-SQL.'
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
            <span>🍪 COOKIE &amp; STORAGE POLICY</span>
            <span class="text-slate-500">•</span>
            <span>v2.6-PURE-SQL</span>
          </div>

          <h1 class="text-3xl sm:text-5xl font-black text-white mb-3 tracking-tight leading-tight">
            Cookie Policy &amp; <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-400">Gestione Dati</span>
          </h1>
          <p class="text-xs sm:text-sm font-mono text-slate-400 m-0">
            Ultimo aggiornamento: Novembre 2026 | Versione Ecosistema v2.6-PURE-SQL
          </p>
        </header>

        <!-- BODY -->
        <div class="flex flex-col gap-8 text-slate-300 text-sm sm:text-base leading-relaxed">

          <!-- SEZIONE 1 -->
          <section>
            <h2 class="text-lg sm:text-xl font-extrabold text-sky-400 mb-3 flex items-center gap-2">
              <span>01.</span>
              <span>Filosofia Zero-Profilazione</span>
            </h2>
            <p class="m-0">
              La tua privacy è un pilastro strutturale dell'architettura di <strong class="text-white">DevKernelPulse (DKP v2.6-PURE-SQL)</strong>. Raccogliamo ed elaboriamo esclusivamente il minimo indispensabile dei dati tecnici necessari al corretto funzionamento della piattaforma, dell'autenticazione e dei servizi integrati nel <strong class="text-white">DKP Auth Core</strong>.
            </p>
          </section>

          <!-- SEZIONE 2 -->
          <section>
            <h2 class="text-lg sm:text-xl font-extrabold text-sky-400 mb-3 flex items-center gap-2">
              <span>02.</span>
              <span>Cookie Tecnici Strettamente Necessari</span>
            </h2>
            <p class="mb-4">
              Utilizziamo unicamente cookie tecnici di prima parte. Questi cookie sono indispensabili per mantenere attiva la sessione utente SSR/CSR e proteggere l'infrastruttura da accessi non autorizzati (esenti da banner di consenso preventivo ai sensi del GDPR):
            </p>
            
            <div class="overflow-x-auto bg-[#020420] border border-slate-800 rounded-2xl">
              <table class="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr class="bg-slate-900/50 text-slate-400 font-mono text-xs border-b border-slate-800">
                    <th class="py-3.5 px-4 font-bold">Nome Cookie</th>
                    <th class="py-3.5 px-4 font-bold">Tipologia</th>
                    <th class="py-3.5 px-4 font-bold">Scopo &amp; Funzione</th>
                    <th class="py-3.5 px-4 font-bold">Durata</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/80 text-slate-200">
                  <tr>
                    <td class="py-3.5 px-4">
                      <code class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded font-mono text-xs font-bold">dkp_session</code>
                    </td>
                    <td class="py-3.5 px-4 text-sky-400 font-semibold">Tecnico / Essenziale</td>
                    <td class="py-3.5 px-4 text-slate-300">Mantiene lo stato di autenticazione sicuro (<code class="text-xs font-mono text-slate-400">HttpOnly; Secure; SameSite=Lax</code>) nel DKP Auth Core.</td>
                    <td class="py-3.5 px-4 font-mono text-xs text-slate-400">Sessione / 30 Giorni</td>
                  </tr>
                  <tr>
                    <td class="py-3.5 px-4">
                      <code class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded font-mono text-xs font-bold">dkp_lang</code>
                    </td>
                    <td class="py-3.5 px-4 text-purple-400 font-semibold">Preferenza UI</td>
                    <td class="py-3.5 px-4 text-slate-300">Memorizza la lingua selezionata dall'utente per l'interfaccia (es. IT/EN).</td>
                    <td class="py-3.5 px-4 font-mono text-xs text-slate-400">1 Anno</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- SEZIONE 3 -->
          <section>
            <h2 class="text-lg sm:text-xl font-extrabold text-sky-400 mb-3 flex items-center gap-2">
              <span>03.</span>
              <span>Archiviazione Locale &amp; State Persistence</span>
            </h2>
            <p class="mb-3">
              Per ottimizzare le prestazioni e ridurre la latenza di rete verso il database <strong class="text-white">Neon Pure SQL</strong>, utilizziamo lo storage locale del browser (<code class="bg-[#020420] text-sky-400 px-1.5 py-0.5 rounded font-mono text-xs">LocalStorage</code> / <code class="bg-[#020420] text-sky-400 px-1.5 py-0.5 rounded font-mono text-xs">SessionStorage</code>) esclusivamente per memorizzare:
            </p>
            <ul class="flex flex-col gap-2.5 p-0 list-none">
              <li class="relative pl-6">
                <span class="absolute left-0 text-emerald-400 font-bold">▹</span>
                Stato della cache XP, livello Gamification e bozze temporanee dell'editor Markdown.
              </li>
              <li class="relative pl-6">
                <span class="absolute left-0 text-emerald-400 font-bold">▹</span>
                Preferenze di interfaccia di <strong class="text-white">OpenUI Studio</strong>, <strong class="text-white">Pulse Nexus</strong> e del <strong class="text-white">Neural Playground</strong>.
              </li>
              <li class="relative pl-6">
                <span class="absolute left-0 text-emerald-400 font-bold">▹</span>
                Filtri selezionati nel DKP Tech Feed e nel DKP Editorial Hub.
              </li>
            </ul>
          </section>

          <!-- SEZIONE 4 -->
          <section>
            <h2 class="text-lg sm:text-xl font-extrabold text-sky-400 mb-3 flex items-center gap-2">
              <span>04.</span>
              <span>Assenza Totale di Cookie di Terze Parti</span>
            </h2>
            <div class="bg-[#020420] border border-slate-800 border-l-4 border-l-emerald-400 rounded-2xl p-5">
              <p class="m-0 text-slate-200">
                <strong class="text-emerald-400">DevKernelPulse non utilizza cookie di profilazione commerciale, pixel di retargeting né tracciatori pubblicitari di terze parti.</strong> Non vendiamo, cediamo o condividiamo i tuoi dati di navigazione con broker pubblicitari o network esterni.
              </p>
            </div>
          </section>

          <!-- SEZIONE 5 -->
          <section>
            <h2 class="text-lg sm:text-xl font-extrabold text-sky-400 mb-3 flex items-center gap-2">
              <span>05.</span>
              <span>Gestione e Disabilitazione dei Cookie</span>
            </h2>
            <p class="m-0">
              Puoi disabilitare o cancellare i cookie in qualsiasi momento attraverso le impostazioni del tuo browser. Tuttavia, la disattivazione del cookie tecnico essenziale <code class="bg-[#020420] text-emerald-400 px-1.5 py-0.5 rounded font-mono text-xs">dkp_session</code> impedirà l'autenticazione alle aree riservate della Dashboard e ai <strong class="text-white">DKP Tools v2.6</strong>.
            </p>
          </section>

        </div>
      </article>

      <!-- FOOTER NAVIGATION -->
      <div class="flex flex-wrap justify-between items-center gap-4 pt-4 border-t border-slate-800 font-mono text-xs">
        <NuxtLink to="/legal/privacy" class="text-sky-400 hover:text-emerald-400 font-bold transition-colors">
          ← Torna alla Privacy Policy completa (GDPR)
        </NuxtLink>
        <NuxtLink to="/legal/terms" class="text-emerald-400 hover:text-sky-400 font-bold transition-colors">
          Termini di Servizio &amp; Copyright →
        </NuxtLink>
      </div>

    </div>
  </div>
</template>