<!-- app/pages/user/ads.vue -->
<script setup lang="ts">
import DkpAdManager from '~/components/dashboard/DkpAdManager.vue'

useDkpSeo({ title: 'Gestione Campagne DKP Ads - DevKernelPulse' })
</script>

<template>
  <div class="user-ads-page">
    <header class="page-header mb-8">
      <h1 class="text-3xl font-extrabold text-white mb-2">📢 Gestione Inserzioni</h1>
      <p class="text-slate-400">Crea e monitora le tue campagne sul DKP Ads Network.</p>
    </header>

    <!-- Inseriamo il manager che abbiamo creato prima -->
    <DkpAdManager />
  </div>
</template>

<style scoped>
.user-ads-page {
  padding: 2rem;
  max-width: 1000px;
  margin: 0 auto;
}
</style>