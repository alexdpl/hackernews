<script setup lang="ts">
useDkpSeo({
  title: 'Note Legali - DevKernelPulse',
  description: 'Documenti legali di DevKernelPulse: Privacy Policy, Cookie Policy e Termini di Servizio.',
  type: 'website',
  canonicalPath: '/legal'
})
</script>

<template>
  <DkpLayout
    title="Note Legali e Policy"
    subtitle="Privacy Policy, Cookie Policy e Termini di Servizio"
    :show-sidebar-ads="true"
  >
    <div class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-6 sm:p-8 space-y-5 card-glow">
      <h2 class="text-2xl font-extrabold text-white m-0">Documenti Legali</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <NuxtLink to="/legal/privacy" class="bg-[#050914] border border-slate-800 hover:border-cyan-400/60 rounded-xl p-4 no-underline">
          <div class="font-bold text-white mb-1">Privacy Policy</div>
          <p class="text-xs text-slate-300 m-0">Trattamento dati e tutela della privacy.</p>
        </NuxtLink>
        <NuxtLink to="/legal/cookie-policy" class="bg-[#050914] border border-slate-800 hover:border-cyan-400/60 rounded-xl p-4 no-underline">
          <div class="font-bold text-white mb-1">Cookie Policy</div>
          <p class="text-xs text-slate-300 m-0">Uso di cookie tecnici e preferenze locali.</p>
        </NuxtLink>
        <NuxtLink to="/legal/terms" class="bg-[#050914] border border-slate-800 hover:border-cyan-400/60 rounded-xl p-4 no-underline">
          <div class="font-bold text-white mb-1">Termini di Servizio</div>
          <p class="text-xs text-slate-300 m-0">Condizioni di utilizzo della piattaforma.</p>
        </NuxtLink>
      </div>
    </div>
  </DkpLayout>
</template>