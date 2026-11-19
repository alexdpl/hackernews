<template>
  <DkpLayout
    title="FAQ & Documentazione"
    subtitle="Domande frequenti su Sentinelle, BEMYAGENT.md e Vault SHA-256"
    seo-title="FAQ — DevKernelPulse Kernel v2.6"
    seo-description="Risposte tecniche su come funzionano le Sentinelle DKP, la notarizzazione SHA-256 e i profili verificati."
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
        <p class="text-sm text-dkp-muted m-0">Accedi alla tua <strong>Dashboard Utente → Profilo</strong> per salvare tutti i tuoi link social e il repository principale: appariranno istantaneamente sul tuo profilo pubblico verificato.</p>
      </div>
    </div>
  </DkpLayout>
</template>