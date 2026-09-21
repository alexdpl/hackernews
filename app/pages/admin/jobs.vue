<!-- pages/admin/jobs.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'

// Collegamento al layout unificato dell'area riservata
definePageMeta({
  layout: 'admin'
})

interface Job {
  id: string | number
  title: string
  company?: string | null
  url?: string | null
  createdAt?: string | Date
}

// Stato per l'autenticazione e il form
const adminSecret = ref('')
const title = ref('')
const company = ref('')
const url = ref('')

// Elenco annunci e stati di caricamento
const jobs = ref<Job[]>([])
const isFetching = ref(false)
const isSubmitting = ref(false)
const deletingId = ref<string | number | null>(null) // Stato di eliminazione per singolo ID

// Messaggi di stato
const successMessage = ref('')
const errorMessage = ref('')

// Ripristina la chiave segreta salvata in precedenza
onMounted(() => {
  const savedSecret = localStorage.getItem('nuxt_admin_secret')
  if (savedSecret) {
    adminSecret.value = savedSecret
    fetchJobs()
  }
})

// Utility per salvare il secret in localStorage
function persistSecret(secret: string) {
  if (secret.trim()) {
    localStorage.setItem('nuxt_admin_secret', secret.trim())
  }
}

// 1. Carica l'elenco dei job
async function fetchJobs() {
  const cleanSecret = adminSecret.value.trim()
  if (!cleanSecret) {
    errorMessage.value = 'Inserisci la chiave segreta per caricare le offerte di lavoro.'
    return
  }

  persistSecret(cleanSecret)
  isFetching.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const resData = await $fetch<Job[] | { success?: boolean; data?: Job[]; jobs?: Job[] }>('/api/admin/jobs', {
      headers: {
        Authorization: `Bearer ${cleanSecret}`,
        'x-admin-secret': cleanSecret
      }
    })

    if (Array.isArray(resData)) {
      jobs.value = resData
    } else if (resData) {
      jobs.value = resData.data || resData.jobs || []
    }

    if (jobs.value.length === 0) {
      successMessage.value = 'Nessun annuncio di lavoro presente nel database.'
    }
  } catch (error: any) {
    console.error('Errore durante il caricamento dei job:', error)
    errorMessage.value = error?.data?.statusMessage || error?.data?.message || 'Chiave segreta errata o errore di rete.'
  } finally {
    isFetching.value = false
  }
}

// 2. Inserimento di un nuovo job
async function handleJobSubmit() {
  const cleanSecret = adminSecret.value.trim()
  if (!title.value.trim() || !cleanSecret || isSubmitting.value) return

  persistSecret(cleanSecret)
  isSubmitting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await $fetch('/api/admin/jobs', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cleanSecret}`,
        'x-admin-secret': cleanSecret
      },
      body: {
        title: title.value.trim(),
        company: company.value.trim() || null,
        url: url.value.trim() || null,
        secret: cleanSecret
      }
    })

    successMessage.value = 'Annuncio di lavoro inserito con successo!'
    
    // Reset dei campi modulo
    title.value = ''
    company.value = ''
    url.value = ''

    // Ricarica automaticamente la lista aggiornata
    await fetchJobs()
  } catch (error: any) {
    console.error('Errore durante l\'inserimento del Job:', error)
    errorMessage.value = error?.data?.statusMessage || error?.data?.message || 'Segreto amministratore errato o errore del database.'
  } finally {
    isSubmitting.value = false
  }
}

// 3. Eliminazione di un job
async function deleteJob(jobId: string | number) {
  const cleanSecret = adminSecret.value.trim()
  if (!confirm('Sei sicuro di voler eliminare questo annuncio di lavoro?')) return

  deletingId.value = jobId
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await $fetch(`/api/admin/jobs/${jobId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${cleanSecret}`,
        'x-admin-secret': cleanSecret
      },
      body: { secret: cleanSecret }
    })

    jobs.value = jobs.value.filter(j => j.id !== jobId)
    successMessage.value = 'Annuncio eliminato con successo.'
  } catch (error: any) {
    console.error('Errore durante l\'eliminazione:', error)
    errorMessage.value = error?.data?.statusMessage || error?.data?.message || 'Impossibile eliminare l\'annuncio.'
  } finally {
    deletingId.value = null
  }
}
</script>

<template>
  <div class="admin-jobs-container">
    <h1 class="admin-title">Pannello Gestione Offerte di Lavoro (Jobs)</h1>

    <div class="admin-form">
      <!-- Banner Informativi -->
      <div v-if="successMessage" class="success-banner">{{ successMessage }}</div>
      <div v-if="errorMessage" class="error-banner">{{ errorMessage }}</div>

      <!-- Chiave di Sicurezza e Tasto Carica Lista -->
      <div class="form-group">
        <label for="secret">Chiave Segreta Admin (NUXT_ADMIN_SECRET)</label>
        <div class="input-action-group">
          <input
            id="secret"
            v-model="adminSecret"
            type="password"
            required
            placeholder="Inserisci la password di amministrazione..."
            :disabled="isSubmitting || isFetching || deletingId !== null"
            @keyup.enter="fetchJobs"
          />
          <button
            type="button"
            class="action-load-btn"
            :disabled="isFetching || !adminSecret.trim()"
            @click="fetchJobs"
          >
            {{ isFetching ? 'Caricamento...' : 'Carica Jobs' }}
          </button>
        </div>
      </div>

      <hr class="section-divider" />

      <!-- Form Inserimento Nuovo Job -->
      <div class="sub-section">
        <h2 class="section-subtitle">Nuovo Annuncio</h2>
        <form class="sub-form" @submit.prevent="handleJobSubmit">
          <div class="form-group">
            <label for="title">Titolo della Posizione *</label>
            <input
              id="title"
              v-model="title"
              type="text"
              required
              placeholder="Es. Senior Full-Stack Engineer (m/f)"
              :disabled="isSubmitting"
            />
          </div>

          <div class="form-group">
            <label for="company">Nome Azienda</label>
            <input
              id="company"
              v-model="company"
              type="text"
              placeholder="Es. Acme Corp"
              :disabled="isSubmitting"
            />
          </div>

          <div class="form-group">
            <label for="url">URL dell'Annuncio / Candidatura</label>
            <input
              id="url"
              v-model="url"
              type="url"
              placeholder="https://acme.com/jobs/123"
              :disabled="isSubmitting"
            />
          </div>

          <button
            type="submit"
            class="submit-job-btn"
            :disabled="isSubmitting || !title.trim() || !adminSecret.trim()"
          >
            {{ isSubmitting ? 'Pubblicazione in corso...' : 'Pubblica Annuncio Lavoro' }}
          </button>
        </form>
      </div>

      <!-- Elenco Annunci Presenti nel DB -->
      <div v-if="jobs && jobs.length > 0" class="maintenance-section">
        <h2 class="section-subtitle">Annunci Rilevati ({{ jobs.length }})</h2>
        <div class="jobs-list">
          <div v-for="job in jobs" :key="job.id" class="job-item">
            <div class="job-details">
              <span class="job-title">{{ job.title }}</span>
              <span v-if="job.company" class="job-company">Azienda: <strong>{{ job.company }}</strong></span>
              <a v-if="job.url" :href="job.url" target="_blank" rel="noopener noreferrer" class="job-url">
                {{ job.url }}
              </a>
              <span v-if="job.createdAt" class="job-date">
                Inserito il: {{ new Date(job.createdAt).toLocaleDateString('it-IT') }}
              </span>
            </div>
            <button
              type="button"
              class="delete-btn"
              :disabled="deletingId === job.id"
              @click="deleteJob(job.id)"
            >
              {{ deletingId === job.id ? 'Eliminazione...' : 'Elimina' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.admin-jobs-container {
  max-width: 800px;
  margin: 1rem auto;
  padding: 1.5rem;
  background-color: #ffffff;
  border: 1px solid #e4e4e7;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.admin-title {
  font-size: 1.4rem;
  font-weight: 700;
  margin-bottom: 1.2rem;
  color: #020420;
}

.section-subtitle {
  font-size: 1.05rem;
  font-weight: 600;
  margin: 1rem 0 0.8rem;
  color: #334155;
}

.section-divider {
  border: 0;
  height: 1px;
  background-color: #e2e8f0;
  margin: 1rem 0;
}

.admin-form, .sub-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  label {
    font-size: 0.85rem;
    font-weight: 600;
    color: #475569;
  }

  input {
    padding: 0.6rem 0.8rem;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    font-size: 0.9rem;
    color: #020420;

    &:focus {
      outline: 2px solid #00dc82;
      border-color: transparent;
    }
  }
}

.input-action-group {
  display: flex;
  gap: 8px;

  input {
    flex: 1;
  }
}

.action-load-btn {
  background-color: #020420;
  color: #00dc82;
  border: 1px solid #020420;
  padding: 0.6rem 1.2rem;
  font-weight: 600;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background-color: #00dc82;
    color: #020420;
  }

  &:disabled {
    background-color: #cbd5e1;
    border-color: #cbd5e1;
    color: #94a3b8;
    cursor: not-allowed;
  }
}

.submit-job-btn {
  background-color: #020420;
  color: #00dc82;
  border: 1px solid #020420;
  padding: 0.7rem 1.4rem;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  border-radius: 4px;
  align-self: flex-start;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background-color: #00dc82;
    color: #020420;
  }

  &:disabled {
    background-color: #cbd5e1;
    border-color: #cbd5e1;
    color: #94a3b8;
    cursor: not-allowed;
  }
}

.success-banner {
  background-color: #d1fae5;
  border: 1px solid #34d399;
  color: #065f46;
  padding: 0.8rem;
  font-size: 0.85rem;
  border-radius: 4px;
}

.error-banner {
  background-color: #fee2e2;
  border: 1px solid #f87171;
  color: #991b1b;
  padding: 0.8rem;
  font-size: 0.85rem;
  border-radius: 4px;
}

.maintenance-section {
  margin-top: 1rem;
}

.jobs-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.job-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f8fafc;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;

  &:hover {
    border-color: #cbd5e1;
  }
}

.job-details {
  display: flex;
  flex-direction: column;
  gap: 3px;
  max-width: 80%;
}

.job-title {
  font-size: 14px;
  font-weight: 600;
  color: #020420;
}

.job-company {
  font-size: 12px;
  color: #475569;
}

.job-url {
  font-size: 12px;
  color: #2563eb;
  text-decoration: none;
  word-break: break-all;

  &:hover {
    text-decoration: underline;
  }
}

.job-date {
  font-size: 11px;
  color: #64748b;
}

.delete-btn {
  background-color: #ef4444;
  color: #ffffff;
  border: none;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover:not(:disabled) {
    background-color: #dc2626;
  }

  &:disabled {
    background-color: #fca5a5;
    cursor: not-allowed;
  }
}
</style>