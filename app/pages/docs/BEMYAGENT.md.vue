<script setup lang="ts">
useDkpSeo({
  title: 'BEMYAGENT.md — Protocollo Sentinelle & TTEV | DevKernelPulse',
  description: 'Specifiche del manifesto BEMYAGENT.md per agenti autonomi, Sentinelle Pure SQL, Pulsebot e telemetria TTEV su DevKernelPulse v2.6.',
  canonicalPath: '/docs/BEMYAGENT.md'
})
</script>

<template>
  <DkpLayout title="BEMYAGENT.md" subtitle="Protocollo Sentinelle, Pulsebot &amp; Telemetria TTEV v2.6-PURE-SQL">
    <div class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-6 sm:p-8 space-y-6 font-mono text-xs sm:text-sm text-slate-200">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-dkp-border pb-4">
        <div>
          <span class="px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/35 text-[11px] font-bold">
            CONTRACT: BEMYAGENT.md
          </span>
          <h1 class="text-xl sm:text-2xl font-black text-white mt-2 mb-0 font-sans">
            BEMYAGENT.md &mdash; Governance Agenti &amp; Sentinelle
          </h1>
        </div>
        <NuxtLink
          to="/docs/ecosystem"
          class="px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 font-bold no-underline text-xs"
        >
          Architettura Ecosistema &rarr;
        </NuxtLink>
      </div>

      <p class="text-slate-300 leading-relaxed m-0 font-sans">
        <strong>BEMYAGENT.md</strong> definisce le regole operative, di sicurezza e di tracciabilità per gli agenti AI e le sentinelle automatizzate dell'ecosistema <strong>DevKernelPulse v2.6-PURE-SQL</strong> (inclusi audit statici, peer review tecnica, controllo integrità endpoint e telemetria TTEV).
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-dkp-bg/90 border border-dkp-border rounded-xl p-4 space-y-2">
          <div class="text-emerald-400 font-bold text-xs uppercase">01. Integrita Dati &amp; Pure SQL</div>
          <p class="text-slate-300 text-xs leading-relaxed m-0 font-sans">
            Tutte le scritture e gli aggiornamenti di stato passano da endpoint validati su database PostgreSQL/Neon con notarizzazione SHA-256 ove richiesta.
          </p>
        </div>
        <div class="bg-dkp-bg/90 border border-dkp-border rounded-xl p-4 space-y-2">
          <div class="text-sky-400 font-bold text-xs uppercase">02. Sicurezza &amp; Zero Secret Leak</div>
          <p class="text-slate-300 text-xs leading-relaxed m-0 font-sans">
            Nessun segreto lato server viene esposto nel bundle client; ogni input utente e codice generato è soggetto a controllo anti-injection e rate limiting.
          </p>
        </div>
        <div class="bg-dkp-bg/90 border border-dkp-border rounded-xl p-4 space-y-2">
          <div class="text-purple-400 font-bold text-xs uppercase">03. Pulsebot &amp; Peer Review</div>
          <p class="text-slate-300 text-xs leading-relaxed m-0 font-sans">
            Verifica coerenza tra build, route, componenti e test E2E prima del rilascio, supportando analisi tecnica e suggerimenti puntuali.
          </p>
        </div>
        <div class="bg-dkp-bg/90 border border-dkp-border rounded-xl p-4 space-y-2">
          <div class="text-amber-400 font-bold text-xs uppercase">04. Telemetria TTEV</div>
          <p class="text-slate-300 text-xs leading-relaxed m-0 font-sans">
            Traccia latenza e stato dei flussi in modo non bloccante, evitando errori di rete durante navigazione, cambio rotta o reload.
          </p>
        </div>
      </div>
    </div>
  </DkpLayout>
</template>