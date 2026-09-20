<script setup>
import { ref } from 'vue'

const title = ref('')
const company = ref('')
const url = ref('')
const adminSecret = ref('') // Protezione FASE 3

const isSubmitting = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

async function handleJobSubmit() {
  if (!title.value.trim() || isSubmitting.value) return

  isSubmitting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    // Chiamata all'endpoint dedicato ai lavori (FASE 3)
    await $fetch('/api/admin/jobs', {
      method: 'POST',
      body: {
        title: title.value.trim(),
        company: company.value.trim() || null,
        url: url.value.trim() || null,
        secret: adminSecret.value // Inviato per superare il check NUXT_ADMIN_SECRET
      }
    })

    successMessage.value = 'Annuncio di lavoro inserito con successo nella sezione Jobs!'
    // Pulisce i campi
    title.value = ''
    company.value = ''
    url.value = ''
  } catch (error) {
    console.error('Errore durante l\'inserimento del Job:', error)
    errorMessage.value = error.data?.statusMessage || 'Segreto amministratore errato o errore del database.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="admin-jobs-container">
    <h1 class="admin-title">Pannello Inserimento Offerte di Lavoro (Jobs)</h1>
    
    <form @submit.prevent="handleJobSubmit" class="admin-form">
      <div v-if="successMessage" class="success-banner">{{ successMessage }}</div>
      <div v-if="errorMessage" class="error-banner">{{ errorMessage }}</div>

      <!-- Chiave di Sicurezza Admin -->
      <div class="form-group">
        <label for="secret">Chiave Segreta Admin (NUXT_ADMIN_SECRET)</label>
        <input id="secret" v-model="adminSecret" type="password" required placeholder="Inserisci la password di amministrazione..." :disabled="isSubmitting" />
      </div>

      <!-- Titolo Offerta -->
      <div class="form-group">
        <label for="title">Titolo della Posizione</label>
        <input id="title" v-model="title" type="text" required placeholder="Es. Senior Full-Stack Engineer (m/f)" :disabled="isSubmitting" />
      </div>

      <!-- Azienda -->
      <div class="form-group">
        <label for="company">Nome Azienda</label>
        <input id="company" v-model="company" type="text" placeholder="Es. Acme Corp" :disabled="isSubmitting" />
      </div>

      <!-- Link Candidatura -->
      <div class="form-group">
        <label for="url">URL dell'Annuncio / Candidatura</label>
        <input id="url" v-model="url" type="url" placeholder="https://acme.com" :disabled="isSubmitting" />
      </div>

      <button type="submit" class="submit-job-btn" :disabled="isSubmitting">
        {{ isSubmitting ? 'Pubblicazione in corso...' : 'Pubblica Annuncio Lavoro' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.admin-jobs-container { max-width: 600px; margin: 2rem auto; padding: 1.5rem; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; font-family: ui-sans-serif, system-ui, sans-serif; }
.admin-title { font-size: 1.3rem; font-weight: bold; margin-bottom: 1.5rem; color: #0f172a; }
.admin-form { display: flex; flex-direction: column; gap: 1.2rem; }
.form-group { display: flex; flex-direction: column; gap: 0.4rem; }
label { font-size: 0.85rem; font-weight: 600; color: #475569; }
input { padding: 0.6rem; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.9rem; background-color: #ffffff; color: #000; }
input:focus { outline: 2px solid #047857; }
.success-banner { background-color: #d1fae5; border: 1px solid #34d399; color: #065f46; padding: 0.8rem; font-size: 0.85rem; border-radius: 4px; }
.error-banner { background-color: #fee2e2; border: 1px solid #f87171; color: #991b1b; padding: 0.8rem; font-size: 0.85rem; border-radius: 4px; }
.submit-job-btn { background-color: #047857; color: white; border: none; padding: 0.7rem 1.4rem; font-weight: bold; cursor: pointer; border-radius: 4px; align-self: flex-start; transition: background 0.2s; }
.submit-job-btn:disabled { background-color: #cbd5e1; cursor: not-allowed; }
.submit-job-btn:hover:not(:disabled) { background-color: #065f46; }
</style>