<script setup lang="ts">
useDkpSeo({
  title: 'Documentazione - DevKernelPulse Kernel v2.6',
  description: 'Documentazione ufficiale di DevKernelPulse: API Gateway, CLI Automation, SDK, Ecosistema e FAQ.',
  type: 'website',
  canonicalPath: '/docs'
})
</script>

<template>
  <DkpLayout
    title="Documentazione Tecnica"
    subtitle="Indice completo guide, API, SDK, CLI ed ecosistema"
    :show-sidebar-ads="true"
  >
    <div class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-6 sm:p-8 space-y-6 card-glow">
      <h2 class="text-2xl font-extrabold text-white m-0">Indice della Documentazione</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NuxtLink to="/docs/api" class="bg-[#050914] border border-slate-800 hover:border-cyan-400/60 rounded-xl p-4 no-underline">
          <div class="font-bold text-white mb-1">API &amp; Gateway</div>
          <p class="text-xs text-slate-300 m-0">Endpoint REST/Nitro, autenticazione e formati di risposta.</p>
        </NuxtLink>
        <NuxtLink to="/docs/cli-automation" class="bg-[#050914] border border-slate-800 hover:border-cyan-400/60 rounded-xl p-4 no-underline">
          <div class="font-bold text-white mb-1">CLI &amp; Automation</div>
          <p class="text-xs text-slate-300 m-0">Workflow automatizzati, script e integrazione pipeline.</p>
        </NuxtLink>
        <NuxtLink to="/docs/sdk" class="bg-[#050914] border border-slate-800 hover:border-cyan-400/60 rounded-xl p-4 no-underline">
          <div class="font-bold text-white mb-1">SDK &amp; Integrazioni</div>
          <p class="text-xs text-slate-300 m-0">Pattern di integrazione e client per servizi DevKernelPulse.</p>
        </NuxtLink>
        <NuxtLink to="/docs/ecosystem" class="bg-[#050914] border border-slate-800 hover:border-cyan-400/60 rounded-xl p-4 no-underline">
          <div class="font-bold text-white mb-1">Architettura Ecosistema</div>
          <p class="text-xs text-slate-300 m-0">Dettagli su Pure SQL, Sentinel AI e Proof of Code Vault.</p>
        </NuxtLink>
      </div>
    </div>
  </DkpLayout>
</template>