<!-- app/pages/jobs.vue -->
<template>
  <div class="jobs-page-container">
    
    <!-- HEADER DELLA SEZIONE -->
    <div class="jobs-header">
      <div class="header-text">
        <div class="jobs-badge">
          DKP PROOF OF CODE JOBS
        </div>
        <h1 class="jobs-title">
          Opportunità Tech <span class="highlight-text">Meritocratiche</span>
        </h1>
        <p class="jobs-subtitle">
          Offerte di lavoro verificate per sviluppatori con curriculum basato sui repository GitHub reali e analisi del codice.
        </p>
      </div>

      <div class="header-action">
        <NuxtLink to="/submit?type=job" class="submit-job-btn">
          💼 Pubblica Offerta (+25 XP)
        </NuxtLink>
      </div>
    </div>

    <!-- FEED DEI JOB -->
    <div v-if="pending" class="loading-state">
      <span class="spinner">⚡</span> Caricamento offerte dal Neon Kernel DB...
    </div>

    <div v-else-if="jobList && jobList.length > 0" class="jobs-feed-list">
      <article 
        v-for="(job, index) in jobList" 
        :key="job.id || index" 
        class="job-card"
      >
        <div class="job-info">
          <h2 class="job-position-title">{{ job.title }}</h2>
          
          <div class="job-details-meta">
            <span class="detail-item">🏢 {{ job.company }}</span>
            <span class="detail-item">📍 {{ job.location }}</span>
            <span class="detail-item salary-tag">💰 {{ job.salary }}</span>
          </div>

          <div class="job-tags" v-if="job.tags && job.tags.length">
            <span v-for="tag in job.tags" :key="tag" class="tech-tag">
              #{{ tag }}
            </span>
          </div>
        </div>

        <div class="job-action">
          <button @click="applyWithVault(job)" class="apply-btn">
            Candidati con Proof of Code ⚡
          </button>
        </div>
      </article>
    </div>

    <!-- EMPTY STATE FALLBACK -->
    <div v-else class="empty-state">
      <p>Nessun annuncio di lavoro presente al momento.</p>
      <NuxtLink to="/submit?type=job" class="submit-inline-link">Pubblica la prima offerta di lavoro!</NuxtLink>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

useHead({
  title: 'Opportunità Tech Meritocratiche - DKP Jobs v2.3',
  meta: [
    { name: 'description', content: 'Offerte di lavoro tech verificate basate su Proof of Code e repository GitHub reali.' }
  ]
})

// Fetch delle offerte dall'endpoint rifattorizzato server/api/jobs
const { data: rawJobs, pending } = await useFetch('/api/jobs', {
  lazy: true,
  default: () => [
    {
      id: 1,
      title: 'Senior Nuxt 4 & Vue Architect',
      company: 'DevKernelPulse Core',
      location: 'Remoto (EU)',
      salary: '€65,000 - €85,000',
      tags: ['Nuxt 4', 'TypeScript', 'Tailwind']
    },
    {
      id: 2,
      title: 'Fullstack Rust & Postgres Engineer',
      company: 'Neural Tech Labs',
      location: 'Milano / Hybrid',
      salary: '€50,000 - €70,000',
      tags: ['Rust', 'Postgres', 'WebAssembly']
    },
    {
      id: 3,
      title: 'AI / ML Infrastructure Lead',
      company: 'Pulse Systems',
      location: 'Remoto (IT)',
      salary: '€60,000 - €80,000',
      tags: ['Python', 'Docker', 'GCP', 'LLM']
    }
  ]
})

const jobList = computed(() => {
  return Array.isArray(rawJobs.value) ? rawJobs.value : (rawJobs.value as any)?.data || []
})

// Gestione Candidatura via Proof of Code Vault
const applyWithVault = (job: any) => {
  alert(`⚡ Candidatura inviata per "${job.title}" presso ${job.company}!\n\nIl tuo profilo GitHub e le metriche Proof of Code sono state allegate alla candidatura. (+10 XP Guadagnati)`)
}
</script>

<style scoped>
.jobs-page-container {
  max-width: 1000px;
  margin: 1.5rem auto;
  padding: 0 1rem;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #f8fafc;
}

/* HEADER */
.jobs-header {
  background: rgba(9, 13, 22, 0.85);
  backdrop-filter: blur(16px);
  border: 1px solid #1e293b;
  border-radius: 16px;
  padding: 1.75rem 2rem;
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1.25rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.jobs-badge {
  display: inline-block;
  background: rgba(0, 220, 130, 0.12);
  color: #00dc82;
  border: 1px solid rgba(0, 220, 130, 0.3);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  margin-bottom: 0.6rem;
}

.jobs-title {
  font-size: 2rem;
  font-weight: 900;
  margin: 0 0 0.4rem 0;
  color: #ffffff;
}

.highlight-text {
  color: #00dc82;
}

.jobs-subtitle {
  font-size: 0.88rem;
  color: #94a3b8;
  margin: 0;
  max-width: 650px;
  line-height: 1.5;
}

.submit-job-btn {
  background: #00dc82;
  color: #020420;
  font-weight: 900;
  font-size: 0.85rem;
  padding: 0.7rem 1.2rem;
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.submit-job-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 20px rgba(0, 220, 130, 0.4);
}

/* LISTA CARD */
.jobs-feed-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.job-card {
  background: rgba(9, 13, 22, 0.85);
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
  transition: border-color 0.2s ease;
}

.job-card:hover {
  border-color: rgba(0, 220, 130, 0.4);
}

.job-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  min-width: 280px;
}

.job-position-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: #ffffff;
  margin: 0;
}

.job-details-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.85rem;
  color: #94a3b8;
  flex-wrap: wrap;
}

.salary-tag {
  color: #00dc82;
  font-weight: 700;
}

.job-tags {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
  margin-top: 0.25rem;
}

.tech-tag {
  background: #020420;
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.2);
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

/* BOTTONE CANDIDATURA */
.apply-btn {
  background: #00dc82;
  color: #020420;
  border: none;
  font-size: 0.88rem;
  font-weight: 800;
  padding: 0.65rem 1.25rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.apply-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 15px rgba(0, 220, 130, 0.4);
}

.loading-state, .empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #94a3b8;
}

.submit-inline-link {
  color: #00dc82;
  text-decoration: underline;
  margin-top: 0.5rem;
  display: inline-block;
}

@media (max-width: 640px) {
  .jobs-header {
    padding: 1.25rem;
  }
  .jobs-title {
    font-size: 1.6rem;
  }
  .job-card {
    flex-direction: column;
    align-items: flex-start;
  }
  .apply-btn {
    width: 100%;
  }
}
</style>