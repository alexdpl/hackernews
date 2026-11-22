<script setup lang="ts">
import DkpLayout from '~/components/DkpLayout.vue'
import DkpVaultLedgerView from '~/components/vault/DkpVaultLedgerView.vue'

useDkpSeo({
  title: 'Blockchain Vault Ledger — DevKernelPulse v2.6-PURE-SQL',
  description: 'Registro pubblico unificato di notarizzazione crittografica SHA-256 per Editorial Blog, Forum/Thread e Tool Ecosystem su DevKernelPulse.'
})
</script>

<template>
  <DkpLayout
    title="Blockchain Vault Ledger"
    subtitle="Registro Pubblico Immutabile SHA-256 | Blog, Forum/Thread & Tool Ecosystem"
    seo-title="Blockchain Vault Ledger — DevKernelPulse v2.6-PURE-SQL"
    seo-description="Registro pubblico unificato di notarizzazione crittografica SHA-256 per Editorial Blog, Forum/Thread e Tool Ecosystem su DevKernelPulse."
    :show-sidebar-ads="true"
  >
    <DkpVaultLedgerView />
  </DkpLayout>
</template>