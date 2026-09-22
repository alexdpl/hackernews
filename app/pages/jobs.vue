<!-- app/pages/jobs.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'

const searchQuery = ref('')
const selectedTech = ref('All')
const selectedType = ref('All')

const jobs = ref([
  {
    id: 1,
    title: 'Senior Vue 3 / Nuxt Engineer',
    company: 'KernelTech Milano',
    location: 'Milano (Hybrid / Remote)',
    type: 'Full-time',
    salary: '€55k - €75k',
    tech: ['Vue 3', 'Nuxt', 'TypeScript', 'Tailwind'],
    description: 'Cerchiamo un Senior Frontend Engineer appassionato di architetture moderne e performance estreme per guidare lo sviluppo della nostra piattaforma SaaS.',
    posted: '2 ore fa'
  },
  {
    id: 2,
    title: 'Backend Rust / Go Developer',
    company: 'Roma Cloud Systems',
    location: 'Roma / Remote',
    type: 'Full-time',
    salary: '€60k - €85k',
    tech: ['Rust', 'Go', 'Kubernetes', 'Docker'],
    description: 'Unisciti al team core infrastructure per scalare i nostri microservizi ad alta concorrenza orientati al mondo enterprise.',
    posted: 'Ieri'
  },
  {
    id: 3,
    title: 'Full Stack AI Integrator',
    company: 'Torino Code Lab',
    location: 'Torino (Remote)',
    type: 'Contract',
    salary: '€45k - €65k',
    tech: ['Python', 'TypeScript', 'OpenAI API', 'Nuxt'],
    description: 'Sviluppo di agenti intelligenti e integrazione di flussi LLM avanzati per automazioni industriali.',
    posted: '3 giorni fa'
  }
])

const filteredJobs = computed(() => {
  return jobs.value.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                          job.company.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesTech = selectedTech.value === 'All' || job.tech.includes(selectedTech.value)
    const matchesType = selectedType.value === 'All' || job.type === selectedType.value
    return matchesSearch && matchesTech && matchesType
  })
})

const activeModalJob = ref<any>(null)
const applicantName = ref('')
const applicantEmail = ref('')
const appliedSuccess = ref(false)

function applyForJob() {
  if (!applicantName.value || !applicantEmail.value) return
  appliedSuccess.value = true
  setTimeout(() => {
    activeModalJob.value = null
    appliedSuccess.value = false
    applicantName.value = ''
    applicantEmail.value = ''
  }, 2000)
}

useSeoMeta({
  title: 'Bacheca Jobs Tech - DevKernelPulse',
  description: 'Le migliori opportunità lavorative per sviluppatori in Italia. Trova lavoro su Nuxt, Vue, Rust, Go e AI.'
})
</script>

<template>
  <div class="jobs-page">
    <div class="jobs-hero">
      <span class="badge-jobs">💼 DKP Career Hub</span>
      <h1>Opportunità Lavorative Tech in Italia</h1>
      <p>Le migliori posizioni per sviluppatori, ingegneri e architetti software selezionate dalla community.</p>

      <div class="filter-bar">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Cerca per titolo o azienda..." 
          class="search-input"
        />
        <select v-model="selectedTech" class="filter-select">
          <option value="All">Tutte le tecnologie</option>
          <option value="Vue 3">Vue 3 / Nuxt</option>
          <option value="Rust">Rust</option>
          <option value="Go">Go</option>
          <option value="Python">Python</option>
        </select>
        <select v-model="selectedType" class="filter-select">
          <option value="All">Tutti i contratti</option>
          <option value="Full-time">Full-time</option>
          <option value="Contract">Contract</option>
        </select>
      </div>
    </div>

    <div class="jobs-list">
      <div v-if="filteredJobs.length === 0" class="no-jobs">
        Nessuna offerta trovata con i filtri selezionati.
      </div>
      <div v-for="job in filteredJobs" :key="job.id" class="job-card">
        <div class="job-header">
          <div>
            <span class="job-company">{{ job.company }}</span>
            <h3>{{ job.title }}</h3>
            <div class="job-meta">
              <span>📍 {{ job.location }}</span> • 
              <span>⏱️ {{ job.type }}</span> • 
              <span class="salary">💰 {{ job.salary }}</span>
            </div>
          </div>
          <button @click="activeModalJob = job" class="apply-btn">Candidati Ora 🚀</button>
        </div>
        <p class="job-desc">{{ job.description }}</p>
        <div class="job-footer">
          <div class="tech-tags">
            <span v-for="t in job.tech" :key="t" class="tech-tag">{{ t }}</span>
          </div>
          <span class="job-posted">Pubblicato {{ job.posted }}</span>
        </div>
      </div>
    </div>

    <!-- Modale Candidatura -->
    <div v-if="activeModalJob" class="modal-overlay" @click.self="activeModalJob = null">
      <div class="modal-content">
        <h3>Candidati per: {{ activeModalJob.title }}</h3>
        <p class="modal-sub">presso <strong>{{ activeModalJob.company }}</strong></p>

        <div v-if="appliedSuccess" class="success-alert">
          🎉 Candidatura inviata con successo! L'azienda ti contatterà presto.
        </div>

        <div v-else class="form-group">
          <label>Nome e Cognome</label>
          <input v-model="applicantName" type="text" placeholder="Es. Mario Rossi" class="form-input" />

          <label>Email o Profilo GitHub/LinkedIn</label>
          <input v-model="applicantEmail" type="text" placeholder="mario.rossi@example.com o github.com/mariorossi" class="form-input" />

          <div class="modal-actions">
            <button @click="activeModalJob = null" class="cancel-btn">Annulla</button>
            <button @click="applyForJob" class="submit-app-btn">Invia Candidatura ⚡</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.jobs-page {
  max-width: 900px;
  margin: 2.5rem auto;
  padding: 0 1rem;
  font-family: ui-sans-serif, system-ui, sans-serif;
  color: #020420;
}
.jobs-hero {
  background: #020420;
  color: #ffffff;
  padding: 3rem 2rem;
  border-radius: 12px;
  text-align: center;
  margin-bottom: 2rem;
}
.badge-jobs {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 700;
  border: 1px solid rgba(56, 189, 248, 0.3);
}
.jobs-hero h1 {
  font-size: 2rem;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}
.jobs-hero p {
  color: #94a3b8;
  max-width: 600px;
  margin: 0 auto 2rem auto;
  font-size: 0.95rem;
}
.filter-bar {
  display: flex;
  gap: 0.75rem;
  max-width: 750px;
  margin: 0 auto;
  flex-wrap: wrap;
  justify-content: center;
}
.search-input, .filter-select {
  padding: 0.7rem 1rem;
  border-radius: 6px;
  border: 1px solid #334155;
  background: #0f172a;
  color: #ffffff;
  font-size: 0.9rem;
}
.search-input { flex: 2; min-width: 240px; }
.filter-select { flex: 1; min-width: 150px; }
.search-input:focus, .filter-select:focus {
  outline: none;
  border-color: #00dc82;
}
.jobs-list {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}
.no-jobs {
  text-align: center;
  padding: 3rem;
  color: #64748b;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}
.job-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
}
.job-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);
  border-color: #cbd5e1;
}
.job-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 0.8rem;
}
.job-company {
  font-size: 0.8rem;
  font-weight: 700;
  color: #00dc82;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.job-header h3 {
  font-size: 1.2rem;
  color: #020420;
  margin: 0.2rem 0;
}
.job-meta {
  font-size: 0.85rem;
  color: #64748b;
}
.salary {
  color: #059669;
  font-weight: 600;
}
.apply-btn {
  background: #00dc82;
  color: #020420;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.2s;
}
.apply-btn:hover { opacity: 0.9; }
.job-desc {
  color: #334155;
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 1rem;
}
.job-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #f1f5f9;
  padding-top: 0.8rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.tech-tags {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}
.tech-tag {
  background: #f1f5f9;
  color: #334155;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}
.job-posted {
  font-size: 0.8rem;
  color: #94a3b8;
}
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(2, 4, 32, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
  padding: 1rem;
}
.modal-content {
  background: #ffffff;
  padding: 2rem;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2);
}
.modal-content h3 {
  margin-bottom: 0.2rem;
  color: #020420;
}
.modal-sub {
  font-size: 0.9rem;
  color: #64748b;
  margin-bottom: 1.5rem;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
.form-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
}
.form-input {
  padding: 0.7rem 1rem;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  font-size: 0.95rem;
}
.form-input:focus {
  outline: none;
  border-color: #00dc82;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.8rem;
  margin-top: 1rem;
}
.cancel-btn {
  background: transparent;
  border: 1px solid #cbd5e1;
  color: #64748b;
  padding: 0.6rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}
.submit-app-btn {
  background: #00dc82;
  color: #020420;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  font-weight: 700;
  cursor: pointer;
}
.success-alert {
  background: #ecfdf5;
  color: #047857;
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid #a7f3d0;
  text-align: center;
  font-weight: 600;
}
</style>