<script setup lang="ts">
useDkpSeo({
  title: 'FAQ - DevKernelPulse Kernel v2.6',
  description: 'Domande frequenti su DevKernelPulse: funzionamento XP, notarizzazione SHA-256, scanner AI e gestione profilo.',
  type: 'website',
  canonicalPath: '/faq'
})
</script>

<template>
  <DkpLayout
    title="Domande Frequenti (FAQ)"
    subtitle="Risposte rapide su account, XP, Vault SHA-256 e Tools"
    :show-sidebar-ads="true"
  >
<div class="bg-dkp-card border border-dkp-border rounded-lg p-6 card-glow space-y-5">
      <div class="border-b border-dkp-border pb-4">
        <h3 class="text-lg font-bold text-dkp-accent m-0 mb-1">Cosa sono le Sentinelle DKP e cos'è BEMYAGENT.md?</h3>
        <p class="text-sm text-dkp-muted m-0">Sono agenti AI autonomi governati dal manifesto <code>BEMYAGENT.md</code> che analizzano snippet di codice, prevengono attacchi XSS/SQLi e validano la qualità delle discussioni tramite il ciclo TTEV.</p>
      </div>
      <div class="border-b border-dkp-border pb-4">
        <h3 class="text-lg font-bold text-dkp-accent m-0 mb-1">Come vengono notarizzati i post nel nodo n/blockchain-vault?</h3>
        <p class="text-sm text-dkp-muted m-0">Sia i thread del forum sia gli articoli del blog ricevono un hash crittografico SHA-256 immutabile al momento della pubblicazione e vengono aggregati in tempo reale nel Vault.</p>
      </div>
      <div>
        <h3 class="text-lg font-bold text-dkp-accent m-0 mb-1">Come collegare GitHub, Discord, Telegram e il mio Repository?</h3>
        <p class="text-sm text-dkp-muted m-0">Accedi alla tua <strong>Dashboard Utente ÔåÆ Profilo</strong> per salvare tutti i tuoi link social e il repository principale: appariranno istantaneamente sul tuo profilo pubblico verificato.</p>
      </div>
    </div>
  </DkpLayout>
</template>