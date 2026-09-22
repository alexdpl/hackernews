<!-- app/pages/submit.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import DkpCaptcha from '~/components/DkpCaptcha.vue' // <-- Import esplicito per risolvere il caricamento

const postType = ref('story') // 'story' | 'ask' | 'show' | 'job'
const title = ref('')
const url = ref('')
const text = ref('')
const company = ref('')
const location = ref('')

const isSubmitting = ref(false)
const errorMessage = ref('')
const isCaptchaVerified = ref(false)

// Domini spam vietati per i job
const spamDomains = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly']

// Validazione dinamica, rigorosa e protetta da DKP Captcha
const isValid = computed(() => {
  const hasTitle = title.value.trim().length >= 3
  
  // Il Captcha deve essere superato per qualsiasi tipo di post
  if (!isCaptchaVerified.value) return false
  
  if (postType.value === 'job') {
    const trimmedUrl = url.value.trim()
    const trimmedText = text.value.trim()
    
    // Regole ferree per i Job:
    // 1. Titolo valido
    // 2. URL obbligatorio, in HTTPS e senza shortener
    // 3. Descrizione dettagliata (minimo 50 caratteri)
    if (!hasTitle) return false
    if (!trimmedUrl || !trimmedUrl.startsWith('https://')) return false
    
    const isSpam = spamDomains.some(domain => trimmedUrl.toLowerCase().includes(domain))
    if (isSpam) return false
    
    if (trimmedText.length < 50) return false
    
    return true
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
      await $fetch('/api/jobs', {
        method: 'POST',
        body: {
          title: title.value.trim(),
          url: url.value.trim(),
          text: text.value.trim(),
          company: company.value.trim() || null,
          location: location.value.trim() || null
        }
      })
      await navigateTo('/jobs')
    } else {
      await $fetch('/api/posts', {
        method: 'POST',
        body: {
          title: title.value.trim(),
          url: url.value.trim() || null,
          text: text.value.trim() || null,
          type: postType.value
        }
      })
      
      if (postType.value === 'ask') await navigateTo('/ask')
      else if (postType.value === 'show') await navigateTo('/show')
      else await navigateTo('/')
    }
  } catch (error: any) {
    console.error('Errore di invio:', error)
    errorMessage.value = error.data?.statusMessage || error.data?.message || 'Errore durante l\'invio del contenuto.'
  } finally {
    isSubmitting.value = false
  }
}

useSeoMeta({
  title: 'Invia Contenuto - DevKernelPulse'
})
</script>

<template>
  <div class="submit-container">
    <h1 class="submit-title">Invia un nuovo contenuto a <span class="brand">DevKernelPulse</span></h1>

    <form @submit.prevent="handleSubmit" class="submit-form">
      <div v-if="errorMessage" class="error-banner">
        ⚠️ {{ errorMessage }}
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

      <!-- Box Avviso Anti-Spam specifico per Job -->
      <div v-if="postType === 'job'" class="job-warning-box">
        ℹ️ <strong>Protocollo Anti-Spam Jobs DKP</strong>: Per pubblicare un annuncio di lavoro sono obbligatori un URL aziendale in <strong>HTTPS</strong> valido (senza link accorciati) e una descrizione tecnica approfondita di almeno <strong>50 caratteri</strong> (Tech Stack e requisiti).
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
        <label for="url">
          {{ postType === 'job' ? 'URL Aziendale Ufficiale (HTTPS obbligatorio)' : 'URL (Link esterno)' }}
        </label>
        <input 
          id="url" 
          v-model="url" 
          type="url" 
          :required="postType === 'job'"
          placeholder="https://example.com" 
          :disabled="isSubmitting" 
        />
      </div>

      <!-- Testo / Descrizione -->
      <div class="form-group">
        <label for="text">
          {{ postType === 'job' ? 'Requisiti e Tech Stack (Minimo 50 caratteri)' : (postType === 'ask' ? 'Dettagli della domanda' : 'Testo / Descrizione') }}
        </label>
        <textarea 
          id="text" 
          v-model="text" 
          rows="5" 
          :required="postType === 'job'"
          placeholder="Aggiungi una descrizione dettagliata..." 
          :disabled="isSubmitting"
        ></textarea>
        <span v-if="postType === 'job'" class="char-counter" :class="{ 'valid': text.trim().length >= 50 }">
          Caratteri inseriti: {{ text.trim().length }} / 50 minimi richiesti
        </span>
      </div>

      <!-- DKP Captcha di Sicurezza Nativo -->
      <DkpCaptcha @verify="(status: boolean) => isCaptchaVerified = status" />

      <button type="submit" class="submit-btn" :disabled="!isValid || isSubmitting">
        {{ isSubmitting ? 'Pubblicazione in corso...' : 'Invia Contenuto' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.submit-container { 
  max-width: 700px; 
  margin: 2rem auto; 
  padding: 2rem; 
  background-color: #ffffff; 
  border: 1px solid #e2e8f0; 
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  font-family: ui-sans-serif, system-ui, sans-serif; 
}

.submit-title { 
  font-size: 1.4rem; 
  font-weight: 700; 
  margin-bottom: 1.5rem; 
  color: #020420; 
}

.brand {
  color: #00dc82;
  background: #020420;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
}

.submit-form { 
  display: flex; 
  flex-direction: column; 
  gap: 1.25rem; 
}

.form-group { 
  display: flex; 
  flex-direction: column; 
  gap: 0.4rem; 
}

label { 
  font-size: 0.85rem; 
  font-weight: 600; 
  color: #334155; 
}

input, textarea, .select-input { 
  padding: 0.7rem; 
  border: 1px solid #cbd5e1; 
  border-radius: 6px; 
  font-size: 0.95rem; 
  background-color: #ffffff; 
  color: #020420; 
}

input:focus, textarea:focus, .select-input:focus { 
  outline: none;
  border-color: #00dc82; 
}

.job-warning-box {
  background: #f8fafc;
  border-left: 4px solid #00dc82;
  border: 1px solid #e2e8f0;
  padding: 0.8rem 1rem;
  border-radius: 6px;
  font-size: 0.85rem;
  color: #334155;
  line-height: 1.4;
}

.char-counter {
  font-size: 0.75rem;
  color: #ef4444;
  margin-top: 0.2rem;
}

.char-counter.valid {
  color: #059669;
}

.error-banner { 
  background-color: #fee2e2; 
  border: 1px solid #f87171; 
  color: #991b1b; 
  padding: 0.8rem; 
  font-size: 0.85rem; 
  border-radius: 6px; 
  font-weight: 500;
}

.submit-btn { 
  background-color: #020420; 
  color: #00dc82; 
  border: none; 
  padding: 0.75rem 1.5rem; 
  font-weight: 700; 
  cursor: pointer; 
  border-radius: 6px; 
  align-self: flex-start; 
  transition: opacity 0.2s;
}

.submit-btn:hover {
  opacity: 0.9;
}

.submit-btn:disabled { 
  background-color: #cbd5e1; 
  color: #64748b;
  cursor: not-allowed; 
}
</style>