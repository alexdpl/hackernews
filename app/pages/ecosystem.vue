<script setup lang="ts">
useDkpSeo({
  title: 'Ecosistema DevKernelPulse - Architettura e Moduli v2.6',
  description: 'Esplora l ecosistema completo di DevKernelPulse: News Crawler AI, Talks Hub, Editorial Blog, Tools SHA-256 e Dashboard.',
  type: 'website',
  canonicalPath: '/ecosystem'
})
</script>

<template>
  <DkpLayout
    title="Ecosistema DevKernelPulse"
    subtitle="Mappa integrata di Feed, Nodi, Blog, Developer Tools e Sentinel AI"
    :show-sidebar-ads="true"
  >
<div class="bg-dkp-card border border-dkp-border rounded-lg p-6 card-glow space-y-6">
      <h2 class="text-2xl font-bold text-dkp-text m-0">Un unico ecosistema tecnico unificato</h2>
      <p class="text-dkp-muted text-sm leading-relaxed">
        DevKernelPulse unisce aggregazione tech in tempo reale (Feed HN), discussioni verticali nei Nodi, articoli tecnici approfonditi e notarizzazione crittografica SHA-256 su infrastruttura serverless Google Cloud Run.
      </p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
        <div class="bg-dkp-bg border border-dkp-border p-4 rounded-lg">
          <h4 class="text-dkp-accent text-sm font-bold m-0 mb-2">BEMYAGENT.md</h4>
          <p class="text-xs text-dkp-muted m-0">Contratto comportamentale che garantisce memoria contestuale, audit AST del codice e zero falsi positivi nella moderazione.</p>
        </div>
        <div class="bg-dkp-bg border border-dkp-border p-4 rounded-lg">
          <h4 class="text-dkp-pass text-sm font-bold m-0 mb-2">Ôøô´©Å Proof of Code Vault</h4>
          <p class="text-xs text-dkp-muted m-0">Ogni snippet, articolo e azione delle sentinelle viene sigillato con impronta SHA-256 verificabile pubblicamente.</p>
        </div>
      </div>
    </div>
  </DkpLayout>
</template>