<!-- app/pages/admin/jobs.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({
  layout: 'admin'
})

useSeoMeta({
  title: 'Gestione Jobs - Admin'
})

const adminSecret = ref('admin')
const jobs = ref<any[]>([])
const loading = ref(false)
const errorMessage = ref('')

// Form Nuova Offerta
const newTitle = ref('')
const newUrl = ref('')
const newText = ref('')
const newAuthor = ref('Admin')

async function fetchJobs() {
  if (!adminSecret.value) {
    errorMessage.value = 'Inserisci la chiave segreta Admin.'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const res: any = await $fetch('/api/admin/jobs', {
      method: 'POST',
      headers: { 'x-admin-secret': adminSecret.value },
      body: { action: 'list' }
    })

    const rawData = res?.data || res
    jobs.value = Array.isArray(rawData) ? rawData : (rawData?.data || [])

    if (import.meta.client) {
      sessionStorage.setItem('dkp_admin_secret', adminSecret.value)
    }
  } catch (err: any) {
    jobs.value = []
    errorMessage.value = err.data?.statusMessage || err.statusMessage || 'Errore nel caricamento delle offerte.'
  } finally {
    loading.value = false
  }
}

async function createJob() {
  if (!newTitle.value) return
  loading.value = true

  try {
    await $fetch('/api/admin/jobs', {
      method: 'POST',
      headers: { 'x-admin-secret': adminSecret.value },
      body: {
        action: 'create',
        title: newTitle.value,
        url: newUrl.value,
        text: newText.value,
        author: newAuthor.value
      }
    })

    newTitle.value = ''
    newUrl.value = ''
    newText.value = ''
    fetchJobs()
  } catch (err: any) {
    errorMessage.value = err.data?.statusMessage || 'Errore durante la creazione del job.'
  } finally {
    loading.value = false
  }
}

async function deleteJob(id: number) {
  if (!confirm('Vuoi davvero eliminare questa offerta?')) return

  try {
    await $fetch('/api/admin/jobs', {
      method: 'POST',
      headers: { 'x-admin-secret': adminSecret.value },
      body: { action: 'delete', id }
    })
    fetchJobs()
  } catch (err: any) {
    alert(err.data?.statusMessage || 'Errore nell\'eliminazione.')
  }
}

onMounted(() => {
  if (import.meta.client) {
    const saved = sessionStorage.getItem('dkp_admin_secret')
    if (saved) {
      adminSecret.value = saved
    }
    fetchJobs()
  }
})
</script>

<template>
  <div class="admin-page">
    <div class="card">
      <h2>Pannello Gestione Offerte di Lavoro (Jobs)</h2>
      
      <form @submit.prevent="fetchJobs" class="auth-bar">
        <label for="key-input">Chiave Segreta Admin (NUXT_ADMIN_SECRET)</label>
        <div class="input-group">
          <input id="key-input" v-model="adminSecret" type="password" placeholder="Password Admin..." required />
          <button type="submit" :disabled="loading" class="btn-dark">Carica Jobs</button>
        </div>
      </form>

      <p v-if="errorMessage" class="error-box">{{ errorMessage }}</p>

      <!-- Form Aggiunta Job -->
      <div class="form-card" v-if="adminSecret">
        <h3>Aggiungi Nuova Offerta di Lavoro</h3>
        <form @submit.prevent="createJob" class="create-form">
          <input v-model="newTitle" placeholder="Titolo offerta (es. Senior Nuxt Developer)" required />
          <input v-model="newUrl" placeholder="URL candidatura (opzionale)" />
          <input v-model="newAuthor" placeholder="Azienda / Autore" />
          <textarea v-model="newText" placeholder="Descrizione del ruolo..."></textarea>
          <button type="submit" :disabled="loading" class="btn-primary">+ Pubblica Job</button>
        </form>
      </div>

      <!-- Elenco Job Esistenti -->
      <div v-if="jobs.length > 0" class="jobs-list">
        <h3>Offerte Attive ({{ jobs.length }})</h3>
        <div v-for="job in jobs" :key="job.id" class="job-item">
          <div class="job-info">
            <strong>{{ job.title }}</strong>
            <span class="job-meta">da {{ job.author }} • {{ new Date(job.createdAt).toLocaleDateString('it-IT') }}</span>
          </div>
          <button @click="deleteJob(job.id)" class="btn-delete">Elimina</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-page { max-width: 900px; margin: 1rem auto; font-family: ui-sans-serif, system-ui, sans-serif; }
.card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.5rem; }
h2 { color: #020420; margin-top: 0; font-size: 1.4rem; }
.auth-bar { margin-bottom: 1.5rem; }
.auth-bar label { display: block; font-size: 0.85rem; font-weight: 600; color: #475569; margin-bottom: 0.4rem; }
.input-group { display: flex; gap: 0.5rem; }
.input-group input { flex: 1; padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 6px; }
.btn-dark { background: #020420; color: #00dc82; border: none; padding: 0.5rem 1rem; border-radius: 6px; font-weight: 600; cursor: pointer; }
.error-box { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 0.75rem; border-radius: 6px; font-size: 0.9rem; margin-bottom: 1rem; }
.form-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 1rem; margin-bottom: 1.5rem; }
.create-form { display: flex; flex-direction: column; gap: 0.75rem; }
.create-form input, .create-form textarea { padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.9rem; }
.btn-primary { background: #020420; color: #00dc82; border: none; padding: 0.6rem; border-radius: 4px; font-weight: 700; cursor: pointer; }
.jobs-list { display: flex; flex-direction: column; gap: 0.5rem; }
.job-item { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 6px; }
.job-info { display: flex; flex-direction: column; }
.job-meta { font-size: 0.8rem; color: #64748b; }
.btn-delete { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; padding: 0.3rem 0.6rem; border-radius: 4px; cursor: pointer; font-size: 0.8rem; }
</style>