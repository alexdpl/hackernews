<!-- app/components/DkpRoadmapProgress.vue -->
<script setup lang="ts">
import { computed } from 'vue'

const { data: roadmap } = await useFetch('/api/roadmap', {
  default: () => ({ overallCompletion: 0 }),
})

const pct = computed(() => roadmap.value?.overallCompletion ?? 0)
</script>

<template>
  <section class="dkp-progress-widget font-sans" aria-label="Avanzamento ecosistema DKP v2.6-PURE-SQL">
    <div class="row">
      <span class="label">🚀 Ecosistema DKP <span class="version-tag font-mono">v2.6-PURE-SQL</span></span>
      <NuxtLink to="/roadmap" class="pct font-mono">{{ pct }}%</NuxtLink>
    </div>
    <div 
      class="track" 
      role="progressbar" 
      :aria-valuenow="pct" 
      aria-valuemin="0" 
      aria-valuemax="100"
      :aria-valuetext="`${pct}% completato`"
    >
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
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
}
.row { 
  display: flex; 
  justify-content: space-between; 
  align-items: center;
  margin-bottom: .6rem; 
  font-size: .85rem; 
  font-weight: 700; 
  color: #cbd5e1; 
}
.version-tag {
  font-size: 0.7rem;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.25);
  padding: 0.1rem 0.4rem;
  border-radius: 6px;
  margin-left: 0.25rem;
}
.pct { 
  color: #00dc82; 
  text-decoration: none; 
  font-weight: 800;
}
.pct:hover { 
  text-decoration: underline; 
}
.track { 
  height: 6px; 
  background: #1e293b; 
  border-radius: 999px; 
  overflow: hidden; 
}
.fill { 
  height: 100%; 
  background: linear-gradient(90deg, #38bdf8, #00dc82); 
  border-radius: 999px; 
  transition: width .6s cubic-bezier(0.16, 1, 0.3, 1); 
}
</style>