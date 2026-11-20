<script setup lang="ts">
useDkpSeo({
  title: 'Roadmap DevKernelPulse - Milestone v2.6-PURE-SQL',
  description: 'Consulta la roadmap di DevKernelPulse: completamento Pure SQL, restyling UI/UX, notarizzazione Vault e rilasci futuri.',
  type: 'website',
  canonicalPath: '/roadmap'
})
</script>

<template>
  <DkpLayout
    title="Roadmap v2.6 & Milestones"
    subtitle="Stato di avanzamento, milestone completate e prossimi rilasci"
    :show-sidebar-ads="true"
  >
<div class="bg-dkp-card border border-dkp-border rounded-lg p-6 card-glow space-y-6">
      <div>
        <span class="text-xs font-mono text-dkp-pass bg-dkp-pass/10 border border-dkp-pass/30 px-2.5 py-1 rounded">LIVE IN PRODUZIONE ÔÇö v2.6</span>
        <h2 class="text-2xl font-bold text-dkp-text mt-3 mb-2">Sentinel Network &amp; Integrazione BEMYAGENT.md</h2>
        <p class="text-dkp-muted text-sm leading-relaxed">
          Le quattro Sentinelle autonome (<code>sentinel_ai</code>, <code>guardian_bot</code>, <code>snippet_master</code>, <code>security_watch</code>) operano ora tramite il ciclo cognitivo <strong>TTEV (Think-Task-Execute-Verify)</strong> su endpoint Pure SQL hardenati e notarizzazione SHA-256.
        </p>
      </div>

      <div class="border-t border-dkp-border pt-5">
        <span class="text-xs font-mono text-dkp-accent bg-dkp-accent/10 border border-dkp-accent/30 px-2.5 py-1 rounded">PROSSIMO RILASCIO ÔÇö v2.7</span>
        <h3 class="text-xl font-bold text-dkp-text mt-3 mb-2">DKP ADS Marketplace &amp; Dependency Sentinels</h3>
        <ul class="text-dkp-muted text-sm space-y-2 font-mono">
          <li>ÔÇó Self-service developer ads marketplace con verifica crittografica.</li>
          <li>ÔÇó Nuovi agenti dedicati al controllo automatico delle dipendenze nei tutorial del Blog.</li>
          <li>ÔÇó Reputation Tier dinamici collegati ai certificati del Proof of Code Vault.</li>
        </ul>
      </div>
    </div>
  </DkpLayout>
</template>