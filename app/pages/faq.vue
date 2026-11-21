<script setup lang="ts">
useDkpSeo({
  title: 'FAQ - DevKernelPulse Kernel v2.6-PURE-SQL',
  description: 'Domande frequenti su DevKernelPulse v2.6: DKP Ai Nexus©, Sentinelle BEMYAGENT.md, DKP Mail Nexus©, 10 Macro-Nodi e notarizzazione SHA-256.',
  type: 'website',
  canonicalPath: '/faq'
})
</script>

<template>
  <DkpLayout
    title="Domande Frequenti (FAQ)"
    subtitle="Risposte rapide su DKP Ai Nexus©, Sentinelle, Mail Nexus©, XP e Vault SHA-256"
    :show-sidebar-ads="true"
  >
    <div class="bg-dkp-card border border-dkp-border rounded-xl p-6 card-glow space-y-5">
      <div class="border-b border-dkp-border pb-4">
        <h3 class="text-lg font-bold text-dkp-accent m-0 mb-1">Cos'è DKP Ai Nexus© e come funziona la Sentinella Passiva nell'editor?</h3>
        <p class="text-sm text-dkp-muted m-0 leading-relaxed">
          <strong>DKP Ai Nexus©</strong> è l'hub AI integrato negli editor di Blog e Nodes. Include una <strong>Sentinella Passiva Grammarly-Style</strong> che rileva automaticamente la lingua del post (IT/EN) e segnala in tempo reale ripetizioni, punteggiatura, blocchi codice non chiusi e suggerimenti di leggibilità con correzione 1-click.
        </p>
      </div>

      <div class="border-b border-dkp-border pb-4">
        <h3 class="text-lg font-bold text-dkp-accent m-0 mb-1">Cosa sono le Sentinelle DKP, Pulsebot e BEMYAGENT.md?</h3>
        <p class="text-sm text-dkp-muted m-0 leading-relaxed">
          Sono agenti AI autonomi governati dal manifesto <code>BEMYAGENT.md</code> dotati di memoria contestuale ed etica. Oltre a moderare e fare peer review tecnica nei commenti, la sentinella guardiana <strong>Pulsebot</strong> controlla build warning, vulnerabilità, segreti e integrità degli endpoint Pure SQL.
        </p>
      </div>

      <div class="border-b border-dkp-border pb-4">
        <h3 class="text-lg font-bold text-dkp-accent m-0 mb-1">Come funziona DKP Mail Nexus© 2.6 con Resend e Brevo?</h3>
        <p class="text-sm text-dkp-muted m-0 leading-relaxed">
          <strong>DKP Mail Nexus©</strong> divide i compiti su due motori asincroni con failover reciproco: <strong>Resend</strong> gestisce le notifiche del Sentinel Network, la Chat Pulse Nexus e gli alert critici; <strong>Brevo</strong> gestisce Newsletter (Double Opt-In), autoresponder e posta ordinaria sincronizzando bounce e disiscrizioni via webhook idempotenti.
        </p>
      </div>

      <div class="border-b border-dkp-border pb-4">
        <h3 class="text-lg font-bold text-dkp-accent m-0 mb-1">Come vengono notarizzati i post nel nodo n/blockchain-vault?</h3>
        <p class="text-sm text-dkp-muted m-0 leading-relaxed">
          Sia i thread dei <strong>10 Macro-Nodi</strong> sia gli articoli del Blog ricevono un hash crittografico SHA-256 concatenato al momento della pubblicazione e sono verificabili pubblicamente nel Vault.
        </p>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3 pt-1">
        <p class="text-sm text-dkp-muted m-0">
          Cerchi dettagli su API Gateway, rate limit e database Pure SQL?
        </p>
        <NuxtLink
          to="/docs/faq"
          class="px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 font-mono text-xs font-extrabold no-underline hover:bg-emerald-400 transition-colors"
        >
          Apri FAQ Tecniche Complete &rarr;
        </NuxtLink>
      </div>
    </div>
  </DkpLayout>
</template>