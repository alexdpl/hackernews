<!-- app/pages/jobs.vue -->
<script setup lang="ts">
const { data, pending, error } = await useFetch('/api/jobs')

const jobs = computed(() => data.value?.data || [])

function getDomain(url?: string | null) {
  if (!url) return null
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return null
  }
}
</script>

<template>
  <div class="page-container">
    <div class="jobs-header">
      <h2 class="page-title">Offerte di Lavoro (Jobs)</h2>
      <p class="jobs-intro">
        Queste offerte provengono direttamente da startup e aziende della community.
      </p>
    </div>

    <div v-if="pending" class="status-msg">Caricamento annunci di lavoro...</div>
    <div v-else-if="error" class="status-msg error">Impossibile caricare gli annunci.</div>
    <div v-else-if="jobs.length === 0" class="status-msg">Nessun annuncio di lavoro al momento.</div>

    <ul v-else class="job-list">
      <li v-for="job in jobs" :key="job.id" class="job-item">
        <div class="job-content">
          <div class="job-heading">
            <a v-if="job.url" :href="job.url" target="_blank" rel="noopener noreferrer" class="job-title">
              {{ job.title }} ↗
            </a>
            <span v-else class="job-title-static">{{ job.title }}</span>
            
            <span v-if="getDomain(job.url)" class="job-domain">({{ getDomain(job.url) }})</span>
          </div>

          <div class="job-details">
            <span v-if="job.company" class="job-badge company">{{ job.company }}</span>
            <span v-if="job.location" class="job-badge location">📍 {{ job.location }}</span>
            <span class="job-date">{{ new Date(job.createdAt).toLocaleDateString('it-IT') }}</span>
          </div>

          <p v-if="job.text" class="job-description">
            {{ job.text }}
          </p>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.page-container { max-width: 900px; margin: 1.5rem auto; padding: 1rem; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; }
.jobs-header { margin-bottom: 1.2rem; border-bottom: 2px solid #f1f5f9; padding-bottom: 0.8rem; }
.page-title { font-size: 1.2rem; font-weight: 700; color: #020420; margin-bottom: 0.3rem; }
.jobs-intro { font-size: 0.85rem; color: #64748b; margin: 0; }
.status-msg { padding: 2rem; text-align: center; color: #64748b; font-size: 0.95rem; }
.status-msg.error { color: #dc2626; }
.job-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.8rem; }
.job-item { padding: 0.8rem 1rem; border: 1px solid #f1f5f9; background: #fafafa; border-radius: 4px; }
.job-content { display: flex; flex-direction: column; gap: 0.4rem; }
.job-heading { display: flex; align-items: baseline; flex-wrap: wrap; gap: 0.4rem; }
.job-title { font-size: 0.95rem; font-weight: 600; color: #020420; text-decoration: none; }
.job-title:hover { color: #2563eb; text-decoration: underline; }
.job-title-static { font-size: 0.95rem; font-weight: 600; color: #020420; }
.job-domain { font-size: 0.8rem; color: #64748b; }
.job-details { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; flex-wrap: wrap; }
.job-badge { padding: 0.15rem 0.4rem; border-radius: 3px; font-weight: 500; }
.job-badge.company { background: #e0f2fe; color: #0369a1; }
.job-badge.location { background: #fef3c7; color: #92400e; }
.job-date { color: #94a3b8; font-size: 0.75rem; margin-left: auto; }
.job-description { font-size: 0.85rem; color: #334155; margin-top: 0.4rem; line-height: 1.4; white-space: pre-wrap; }
</style>