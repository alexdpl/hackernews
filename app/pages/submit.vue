<!-- app/pages/submit.vue -->
<script setup>
import { ref, computed } from 'vue'

const postType = ref('story') // 'story' | 'ask' | 'show' | 'job'
const title = ref('')
const url = ref('')
const text = ref('')
const company = ref('')
const location = ref('')

const isSubmitting = ref(false)
const errorMessage = ref('')

// Validazione dinamica in base al tipo selezionato
const isValid = computed(() => {
  const hasTitle = title.value.trim().length >= 3
  if (postType.value === 'job') {
    // Per i Job serve un titolo e almeno un URL o Testo descrittivo
    return hasTitle && (url.value.trim().length > 0 || text.value.trim().length > 0)
  }
  // Per Storie, Ask e Show
  return hasTitle && (url.value.trim().length > 0 || text.value.trim().length > 0)
})

async function handleSubmit() {
  if (!isValid.value || isSubmitting.value) return

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    if (postType.value === 'job') {
      // Invia alla tabella JOBS
      await $fetch('/api/jobs', {
        method: 'POST',
        body: {
          title: title.value.trim(),
          url: url.value.trim() || null,
          text: text.value.trim() || null,
          company: company.value.trim() || null,
          location: location.value.trim() || null
        }
      })
      await navigateTo('/jobs')
    } else {
      // Invia alla tabella POSTS (story, ask, show)
      await $fetch('/api/posts', {
        method: 'POST',
        body: {
          title: title.value.trim(),
          url: url.value.trim() || null,
          text: text.value.trim() || null,
          type: postType.value
        }
      })
      
      // Reindirizza alla rotta corretta in base al tipo
      if (postType.value === 'ask') await navigateTo('/ask')
      else if (postType.value === 'show') await navigateTo('/show')
      else await navigateTo('/')
    }
  } catch (error) {
    console.error('Errore di invio:', error)
    errorMessage.value = error.data?.statusMessage || 'Errore durante l\'invio del contenuto.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="submit-container">
    <h1 class="submit-title">Invia un nuovo contenuto</h1>

    <form @submit.prevent="handleSubmit" class="submit-form">
      <div v-if="errorMessage" class="error-banner">
        {{ errorMessage }}
      </div>

      <!-- Selettore Tipo Contenuto -->
      <div class="form-group">
        <label for="postType">Tipo di pubblicazione</label>
        <select id="postType" v-model="postType" class="select-input">
          <option value="story">Notizia / Storia (Story)</option>
          <option value="ask">Domanda alla community (Ask HN)</option>
          <option value="show">Mostra un progetto (Show HN)</option>
          <option value="job">Offerta di Lavoro (Job)</option>
        </select>
      </div>

      <!-- Titolo -->
      <div class="form-group">
        <label for="title">
          {{ postType === 'job' ? 'Titolo dell\'offerta di lavoro' : 'Titolo' }}
        </label>
        <input 
          id="title" 
          v-model="title" 
          type="text" 
          required 
          placeholder="Inserisci il titolo (minimo 3 caratteri)..." 
          :disabled="isSubmitting" 
        />
      </div>

      <!-- Campi specifici per le Offerte di Lavoro -->
      <template v-if="postType === 'job'">
        <div class="form-group">
          <label for="company">Nome Azienda (opzionale)</label>
          <input 
            id="company" 
            v-model="company" 
            type="text" 
            placeholder="Es. Acme Corp" 
            :disabled="isSubmitting" 
          />
        </div>
        <div class="form-group">
          <label for="location">Sede / Remote (opzionale)</label>
          <input 
            id="location" 
            v-model="location" 
            type="text" 
            placeholder="Es. Milano / Full Remote" 
            :disabled="isSubmitting" 
          />
        </div>
      </template>

      <!-- URL -->
      <div class="form-group">
        <label for="url">URL (Link esterno)</label>
        <input 
          id="url" 
          v-model="url" 
          type="url" 
          placeholder="https://example.com" 
          :disabled="isSubmitting" 
        />
      </div>

      <!-- Testo / Descrizione -->
      <div class="form-group">
        <label for="text">
          {{ postType === 'ask' ? 'Dettagli della domanda' : 'Testo / Descrizione' }}
        </label>
        <textarea 
          id="text" 
          v-model="text" 
          rows="5" 
          placeholder="Aggiungi una descrizione o dettagli aggiuntivi..." 
          :disabled="isSubmitting"
        ></textarea>
      </div>

      <button type="submit" class="submit-btn" :disabled="!isValid || isSubmitting">
        {{ isSubmitting ? 'Invia in corso...' : 'Invia Contenuto' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.submit-container { max-width: 650px; margin: 2rem auto; padding: 1.5rem; background-color: #f6f6ef; border: 1px solid #e5e7eb; font-family: sans-serif; }
.submit-title { font-size: 1.3rem; font-weight: bold; margin-bottom: 1.5rem; color: #111827; }
.submit-form { display: flex; flex-direction: column; gap: 1.2rem; }
.form-group { display: flex; flex-direction: column; gap: 0.4rem; }
label { font-size: 0.9rem; font-weight: bold; color: #374151; }
input, textarea, .select-input { padding: 0.6rem; border: 1px solid #d1d5db; border-radius: 4px; font-size: 0.9rem; background-color: #ffffff; color: #000; }
input:focus, textarea:focus, .select-input:focus { outline: 2px solid #10b981; }
.error-banner { background-color: #fee2e2; border: 1px solid #f87171; color: #991b1b; padding: 0.8rem; font-size: 0.85rem; border-radius: 4px; }
.submit-btn { background-color: #10b981; color: white; border: none; padding: 0.68rem 1.4rem; font-weight: bold; cursor: pointer; border-radius: 4px; align-self: flex-start; }
.submit-btn:disabled { background-color: #d1d5db; cursor: not-allowed; }
</style>