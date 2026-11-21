<script setup lang="ts">
useDkpSeo({
  title: 'Ecosistema DevKernelPulse - Architettura e Moduli v2.6-PURE-SQL',
  description: 'Esplora l ecosistema completo di DevKernelPulse v2.6: DKP Ai Nexus©, Mail Nexus©, Sentinel Network (BEMYAGENT.md), 10 Macro-Nodi e Proof of Code Vault.',
  type: 'website',
  canonicalPath: '/ecosystem'
})
</script>

<template>
  <DkpLayout
    title="Ecosistema DevKernelPulse v2.6"
    subtitle="Mappa integrata di Feed, 10 Macro-Nodi, Blog, DKP Ai Nexus©, Mail Nexus© e Vault SHA-256"
    :show-sidebar-ads="true"
  >
    <div class="bg-dkp-card border border-dkp-border rounded-xl p-6 card-glow space-y-6">
      <div class="space-y-2">
        <span class="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded">
          ARCHITETTURA UNIFICATA &bull; DKP KERNEL v2.6-PURE-SQL
        </span>
        <h2 class="text-2xl font-extrabold text-dkp-text m-0 pt-2">Un unico ecosistema tecnico unificato</h2>
        <p class="text-dkp-muted text-sm leading-relaxed m-0">
          DevKernelPulse unisce aggregazione tech in tempo reale (Feed HN), discussioni verticali organizzate su <strong>10 Macro-Nodi</strong>, articoli tecnici con <strong>Prism.js</strong> dinamico e notarizzazione crittografica SHA-256 su infrastruttura serverless <strong>Google Cloud Run</strong> e <strong>Neon PostgreSQL</strong>.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
        <div class="bg-dkp-bg border border-dkp-border p-4 rounded-lg space-y-1.5">
          <h4 class="text-purple-300 text-sm font-bold m-0">DKP Ai Nexus© &amp; Sentinella Passiva</h4>
          <p class="text-xs text-dkp-muted m-0 leading-relaxed">
            Assistente editoriale e tecnico integrato in Blog e Nodes con Sentinella Passiva Grammarly-Style in tempo reale, generazione snippet e audit del codice.
          </p>
        </div>

        <div class="bg-dkp-bg border border-dkp-border p-4 rounded-lg space-y-1.5">
          <h4 class="text-sky-300 text-sm font-bold m-0">DKP Mail Nexus© 2.6 (Resend + Brevo)</h4>
          <p class="text-xs text-dkp-muted m-0 leading-relaxed">
            Motore mail asincrono a doppio canale: Resend gestisce Sentinel Network e Chat Nexus; Brevo gestisce Newsletter Double Opt-In e posta ordinaria con failover reciproco.
          </p>
        </div>

        <div class="bg-dkp-bg border border-dkp-border p-4 rounded-lg space-y-1.5">
          <h4 class="text-dkp-accent text-sm font-bold m-0">BEMYAGENT.md &amp; Pulsebot</h4>
          <p class="text-xs text-dkp-muted m-0 leading-relaxed">
            Manifesto comportamentale che dota le Sentinelle di memoria contestuale ed etica, affiancato da Pulsebot per audit build, dipendenze e resilienza SSR.
          </p>
        </div>

        <div class="bg-dkp-bg border border-dkp-border p-4 rounded-lg space-y-1.5">
          <h4 class="text-dkp-pass text-sm font-bold m-0">Proof of Code Vault SHA-256</h4>
          <p class="text-xs text-dkp-muted m-0 leading-relaxed">
            Ogni snippet, articolo del Blog e thread dei Nodi viene sigillato con impronta SHA-256 verificabile pubblicamente su <code>n/blockchain-vault</code>.
          </p>
        </div>
      </div>

      <div class="flex flex-wrap gap-3 pt-2 font-mono text-xs">
        <NuxtLink
          to="/docs/ecosystem"
          class="px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 font-extrabold no-underline hover:bg-emerald-400 transition-colors"
        >
          Approfondisci nella Docs Tecnica &rarr;
        </NuxtLink>
        <NuxtLink
          to="/roadmap"
          class="px-4 py-2 rounded-lg bg-dkp-bg border border-dkp-border text-dkp-text font-bold no-underline hover:border-cyan-400 transition-colors"
        >
          Vedi Roadmap &amp; Changelog v2.6 &rarr;
        </NuxtLink>
      </div>
    </div>
  </DkpLayout>
</template>