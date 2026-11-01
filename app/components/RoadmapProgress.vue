<script setup lang="ts">
const { data: roadmap } = await useFetch('/api/roadmap', {
  default: () => ({ overallCompletion: 0 }),
})

const pct = computed(() => roadmap.value?.overallCompletion ?? 0)
</script>

<template>
  <section class="dkp-progress-widget" aria-label="Avanzamento ecosistema DKP">
    <div class="row">
      <span class="label">🚀 Ecosistema DKP v2.5-GOLD</span>
      <NuxtLink to="/roadmap" class="pct">{{ pct }}%</NuxtLink>
    </div>
    <div class="track" role="progressbar" :aria-valuenow="pct" aria-valuemin="0" aria-valuemax="100">
      <div class="fill" :style="{ width: pct + '%' }"></div>
    </div>
  </section>
</template>

<style scoped>
.dkp-progress-widget {
  max-width: 480px;
  padding: 1rem 1.25rem;
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
}
.row { display: flex; justify-content: space-between; margin-bottom: .5rem; font-size: .85rem; font-weight: 700; color: #cbd5e1; }
.pct { color: #00dc82; text-decoration: none; }
.pct:hover { text-decoration: underline; }
.track { height: 6px; background: #1e293b; border-radius: 999px; overflow: hidden; }
.fill { height: 100%; background: linear-gradient(90deg, #38bdf8, #00dc82); border-radius: 999px; transition: width .6s ease; }
</style>