<!-- app/pages/submit.vue -->
<script setup>
import { ref } from 'vue'

const title = ref('')
const url = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')

async function handleSubmit() {
  isSubmitting.value = true
  errorMessage.value = ''

  try {
    // Invia i dati inseriti nel form alla nostra API backend (che creeremo tra poco)
    await $fetch('/api/submit', {
      method: 'POST',
      body: {
        title: title.value,
        url: url.value
      }
    })

    // Se l'invio ha successo, reindirizza l'utente alla homepage
    navigateTo('/')
  } catch (error) {
    errorMessage.value = "Errore durante l'invio del link. Riprova."
    console.error(error)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="submit-container">
    <h1>Invia un nuovo Link</h1>
    
    <form @submit.prevent="handleSubmit" class="submit-form">
      <div class="form-group">
        <label for="title">Titolo del link</label>
        <input 
          id="title"
          v-model="title" 
          type="text" 
          placeholder="Inserisci un titolo descrittivo..." 
          required 
        />
      </div>

      <div class="form-group">
        <label for="url">URL (Sito web)</label>
        <input 
          id="url"
          v-model="url" 
          type="url" 
          placeholder="https://example.com" 
          required 
        />
      </div>

      <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>

      <button type="submit" :disabled="isSubmitting">
        {{ isSubmitting ? 'Invio in corso...' : 'Condividi Link' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.submit-container {
  max-width: 500px;
  margin: 40px auto;
  padding: 20px;
  background: #f6f6ef;
  border-radius: 4px;
  font-family: sans-serif;
}

h1 {
  font-size: 1.2rem;
  color: #111;
  margin-bottom: 20px;
}

.submit-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

label {
  font-size: 0.9rem;
  font-weight: bold;
  color: #555;
}

input {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 3px;
  font-size: 1rem;
}

button {
  background-color: #ff6600;
  color: white;
  border: none;
  padding: 10px;
  font-size: 1rem;
  font-weight: bold;
  border-radius: 3px;
  cursor: pointer;
  margin-top: 10px;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.error-msg {
  color: red;
  font-size: 0.85rem;
}
</style>
