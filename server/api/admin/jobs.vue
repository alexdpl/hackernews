<script setup lang="ts">
import { ref } from 'vue'

const title = ref('')
const company = ref('')
const url = ref('')
const text = ref('')
const location = ref('')
const adminSecret = ref('') 

const statusMessage = ref('')
const isSuccess = ref(false)
const isLoading = ref(false)

async function handleSubmit() {
  if (!title.value || !company.value) {
    statusMessage.value = 'Titolo e Azienda sono obbligatori.'
    isSuccess.value = false
    return
  }

  isLoading.value = true
  statusMessage.value = ''

  try {
    await \$fetch('/api/admin/jobs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminSecret.value}`
      },
      body: {
        title: title.value,
        company: company.value,
        url: url.value || undefined,
        text: text.value || undefined,
        location: location.value || undefined
      }
    })

    isSuccess.value = true
    statusMessage.value = 'Annuncio di lavoro creato con successo!'
    
    // Reset del form
    title.value = ''
    company.value = ''
    url.value = ''
    text.value = ''
    location.value = ''
  } catch (error: any) {
    isSuccess.value = false
    statusMessage.value = error.data?.message || 'Errore durante il salvataggio del lavoro.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="admin-dashboard">
    <!-- Navigazione interna admin per non perdersi -->
    <nav class="admin-nav">
      <NuxtLink to="/admin">← Gestione Link (Elimina Doppioni)</NuxtLink>
    </nav>

    <h1>Nuovo Annuncio di Lavoro (Jobs)</h1>
    
    <form @submit.prevent="handleSubmit" class="job-form">
      <div class="form-group">
        <label for="adminSecret">Admin Secret Key:</label>
        <input id="adminSecret" v-model="adminSecret" type="password" required placeholder="Inserisci il secret di autorizzazione" />
      </div>

      <hr class="divider" />

      <div class="form-group">
        <label for="title">Titolo della Posizione *:</label>
        <input id="title" v-model="title" type="text" required placeholder="es. Senior Full-Stack Engineer" />
      </div>

      <div class="form-group">
        <label for="company">Azienda *:</label>
        <input id="company" v-model="company" type="text" required placeholder="es. Acme Corp" />
      </div>

      <div class="form-group">
        <label for="url">URL (Opzionale):</label>
        <input id="url" v-model="url" type="url" placeholder="https://example.com" />
      </div>

      <div class="form-group">
        <label for="location">Location (Opzionale):</label>
        <input id="location" v-model="location" type="text" placeholder="es. Remote (EU) o Milano, IT" />
      </div>

      <div class="form-group">
        <label for="text">Descrizione / Testo aggiuntivo (Opzionale):</label>
        <textarea id="text" v-model="text" rows="5" placeholder="Dettagli sul lavoro..."></textarea>
      </div>

      <button type="submit" :disabled="isLoading">
        {{ isLoading ? 'Invio in corso...' : 'Pubblica Lavoro' }}
      </button>
    </form>

    <p v-if="statusMessage" :class="{ 'text-success': isSuccess, 'text-error': !isSuccess }" class="status-msg">
      {{ statusMessage }}
    </p>
  </div>
</template>

<style scoped>
.admin-dashboard {
  max-width: 600px;
  margin: 20px auto;
  padding: 20px;
  background: #f6f6ef;
  font-family: Verdana, Geneva, sans-serif;
}
.admin-nav {
  margin-bottom: 15px;
  font-size: 9pt;
}
.admin-nav a {
  color: #828282;
  text-decoration: underline;
}
.admin-nav a:hover {
  color: #000;
}
h1 {
  font-size: 14pt;
  color: #ff6600;
  margin-bottom: 20px;
}
.job-form {
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
  font-size: 9pt;
  font-weight: bold;
  color: #333;
}
input, textarea {
  padding: 6px;
  font-size: 10pt;
  border: 1px solid #ccc;
}
.divider {
  border: 0;
  border-top: 1px dashed #ccc;
  margin: 10px 0;
}
button {
  background-color: #ff6600;
  color: white;
  border: none;
  padding: 8px;
  font-weight: bold;
  cursor: pointer;
}
button:disabled {
  background-color: #ccc;
}
.status-msg {
  margin-top: 15px;
  font-size: 10pt;
}
.text-success { color: green; }
.text-error { color: red; }
</style>