<script setup>
import { ref, computed } from 'vue'

const title = ref('')
const url = ref('')
const text = ref('')

const isSubmitting = ref(false)
const errorMessage = ref('')

const isValid = computed(() => {
  const hasTitle = title.value.trim().length > 0
  const hasUrl = url.value.trim().length > 0
  const hasText = text.value.trim().length > 0
  return hasTitle && !(hasUrl && hasText)
})

async function handleSubmit() {
  if (!isValid.value || isSubmitting.value) return

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    // Invia correttamente a /api/posts per popolare la Home
    await $fetch('/api/posts', {
      method: 'POST',
      body: {
        title: title.value.trim(),
        url: url.value.trim() || null,
        text: text.value.trim() || null
      }
    })

    await navigateTo('/')
  } catch (error) {
    console.error('Errore di invio:', error)
    errorMessage.value = error.data?.statusMessage || 'Errore durante l\'invio della storia.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="submit-container">
    <h1 class="submit-title">Invia una nuova storia</h1>
    
    <form @submit.prevent="handleSubmit" class="submit-form">
      <div v-if="errorMessage" class="error-banner">
        {{ errorMessage }}
      </div>

      <div class="form-group">
        <label for="title">Titolo della storia</label>
        <input id="title" v-model="title" type="text" required placeholder="Inserisci il titolo..." :disabled="isSubmitting" />
      </div>

      <div class="form-group">
        <label for="url">URL (opzionale)</label>
        <input id="url" v-model="url" type="url" placeholder="https://example.com" :disabled="isSubmitting" />
        <small v-if="text.trim()" class="warning-text">Nota: Se c'è un testo, lascia vuoto l'URL.</small>
      </div>

      <div class="or-separator">oppure</div>

      <div class="form-group">
        <label for="text">Testo della discussione (opzionale)</label>
        <textarea id="text" v-model="text" rows="5" placeholder="Scrivi qui la tua storia o domanda..." :disabled="isSubmitting"></textarea>
        <small v-if="url.trim()" class="warning-text">Nota: Se c'è un URL, lascia vuoto il testo.</small>
      </div>

      <button type="submit" class="submit-btn" :disabled="!isValid || isSubmitting">
        {{ isSubmitting ? 'Invia in corso...' : 'Invia Storia' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.submit-container { max-width: 600px; margin: 2rem auto; padding: 1rem; background-color: #f6f6ef; font-family: Verdana, Geneva, sans-serif; border: 1px solid #e5e7eb; }
.submit-title { font-size: 1.2rem; font-weight: bold; margin-bottom: 1.5rem; color: #111827; }
.submit-form { display: flex; flex-direction: column; gap: 1.2rem; }
.form-group { display: flex; flex-direction: column; gap: 0.4rem; }
label { font-size: 0.9rem; font-weight: bold; color: #374151; }
input[type="text"], input[type="url"], textarea { padding: 0.6rem; border: 1px solid #d1d5db; border-radius: 4px; font-family: inherit; font-size: 0.9rem; background-color: #ffffff; color: #000; }
input:focus, textarea:focus { outline: 2px solid #10b981; }
.or-separator { text-align: center; font-size: 0.8rem; color: #6b7280; text-transform: uppercase; margin: 0.5rem 0; }
.warning-text { font-size: 0.75rem; color: #ef4444; margin-top: 0.2rem; }
.error-banner { background-color: #fee2e2; border: 1px solid #f87171; color: #991b1b; padding: 0.8rem; font-size: 0.85rem; border-radius: 4px; }
.submit-btn { background-color: #10b981; color: white; border: none; padding: 0.6rem 1.2rem; font-weight: bold; cursor: pointer; border-radius: 4px; align-self: flex-start; transition: background 0.2s; }
.submit-btn:disabled { background-color: #d1d5db; cursor: not-allowed; }
.submit-btn:not(:disabled):hover { background-color: #059669; }
</style>