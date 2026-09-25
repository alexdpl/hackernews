<!-- app/pages/jobs.vue -->
<script setup lang="ts">
useSeoMeta({
  title: 'Job Hub - Offerte Lavoro Developer',
  description: 'Trova le migliori opportunità di lavoro tech verificate con Proof of Code.'
})

const jobs = ref([
  { id: 1, title: 'Senior Nuxt 4 & Vue Architect', company: 'DevKernelPulse Core', location: 'Remoto (EU)', salary: '€65,000 - €85,000', tags: ['Nuxt 4', 'TypeScript', 'Tailwind'] },
  { id: 2, title: 'Fullstack Rust & Postgres Engineer', company: 'Neural Tech Labs', location: 'Milano / Hybrid', salary: '€50,000 - €70,000', tags: ['Rust', 'Postgres', 'WebAssembly'] }
])
</script>

<template>
  <div class="jobs-public-container">
    <div class="hero-section">
      <span class="badge">DKP PROOF OF CODE JOBS</span>
      <h1>Opportunità Tech <span class="highlight">Meritocratiche</span></h1>
      <p class="subtitle">Offerte di lavoro verificate per sviluppatori con curriculum basato sui repository GitHub reali.</p>
    </div>

    <div class="jobs-list">
      <div v-for="job in jobs" :key="job.id" class="job-card">
        <div class="job-main">
          <h2>{{ job.title }}</h2>
          <div class="company-info">
            <span>🏢 {{ job.company }}</span>
            <span>📍 {{ job.location }}</span>
            <span class="salary">💰 {{ job.salary }}</span>
          </div>
          <div class="tags">
            <span v-for="tag in job.tags" :key="tag" class="tag">#{{ tag }}</span>
          </div>
        </div>
        <button class="apply-btn">Candidati con Proof of Code ⚡</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.jobs-public-container { max-width: 1000px; margin: 0 auto; padding: 3rem 1rem; color: #f8fafc; }
.hero-section { text-align: center; margin-bottom: 3rem; }
.badge { background: rgba(0, 220, 130, 0.15); color: #00dc82; font-weight: 800; font-size: 0.8rem; padding: 0.3rem 0.8rem; border-radius: 6px; border: 1px solid rgba(0, 220, 130, 0.3); }
.hero-section h1 { font-size: 2.2rem; font-weight: 800; margin-top: 0.8rem; }
.highlight { color: #00dc82; }
.subtitle { color: #94a3b8; font-size: 1rem; margin-top: 0.5rem; }
.jobs-list { display: flex; flex-direction: column; gap: 1.25rem; }
.job-card { background: #090d16; border: 1px solid #1e293b; border-radius: 12px; padding: 1.5rem; display: flex; align-items: center; justify-content: space-between; transition: transform 0.2s, border-color 0.2s; }
.job-card:hover { border-color: #00dc82; transform: translateY(-2px); }
.job-main h2 { font-size: 1.25rem; margin: 0 0 0.5rem 0; color: #ffffff; }
.company-info { display: flex; gap: 1.25rem; font-size: 0.88rem; color: #94a3b8; margin-bottom: 0.8rem; }
.salary { color: #00dc82; font-weight: 700; }
.tags { display: flex; gap: 0.5rem; }
.tag { background: #020420; color: #38bdf8; border: 1px solid #1e293b; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 700; }
.apply-btn { background: #00dc82; color: #020420; font-weight: 800; border: none; padding: 0.75rem 1.25rem; border-radius: 8px; cursor: pointer; transition: background 0.2s; }
.apply-btn:hover { background: #00bf71; }
</style>
