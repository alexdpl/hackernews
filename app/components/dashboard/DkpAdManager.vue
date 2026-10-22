<!-- app/components/dashboard/DkpAdManager.vue -->
<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits(['campaign-created'])

const isLoading = ref(false)
const message = ref<{ text: string; type: 'success' | 'error' } | null>(null)

const form = ref({
  advertiserEmail: '', 
  title: '',
  snippet: '',
  targetUrl: '',
  budgetCredits: 100
})

async function submitAdCampaign() {
  if (!form.value.title || !form.value.targetUrl || !form.value.advertiserEmail) {
    message.value = { text: 'Compila tutti i campi obbligatori.', type: 'error' }
    return
  }

  isLoading.value = true
  message.value = null

  try {
    await $fetch('/api/v2.5/ads', {
      method: 'POST',
      body: form.value
    })

    message.value = { 
      text: '🚀 Campagna creata! È in rotazione nel network.', 
      type: 'success' 
    }
    
    // Reset del form
    form.value = { advertiserEmail: '', title: '', snippet: '', targetUrl: '', budgetCredits: 100 }
    
    // Avvisa la pagina madre di aggiornare la lista a destra!
    emit('campaign-created')
    
  } catch (err: any) {
    message.value = { 
      text: err.data?.statusMessage || 'Errore durante la creazione.', 
      type: 'error' 
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="ad-manager-card">
    <div class="card-header">
      <h3 class="card-title">📡 Lancio Campagna</h3>
      <span class="badge">PRO</span>
    </div>
    
    <p class="card-desc">
      Acquista crediti e metti il tuo prodotto in rotazione in tutto l'ecosistema DevKernelPulse.
    </p>

    <form @submit.prevent="submitAdCampaign" class="ad-form">
      <div class="form-group">
        <label>Email Inserzionista *</label>
        <input v-model="form.advertiserEmail" type="email" placeholder="es. info@tuostartup.com" required />
      </div>

      <div class="form-group">
        <label>Titolo Annuncio (Max 120 car.) *</label>
        <input v-model="form.title" type="text" maxlength="120" placeholder="es. Lancia il tuo SaaS..." required />
      </div>

      <div class="form-group">
        <label>Snippet Descrittivo (Opzionale)</label>
        <textarea v-model="form.snippet" rows="3" maxlength="255" placeholder="Descrivi brevemente la tua offerta..."></textarea>
      </div>

      <div class="form-group">
        <label>URL di Destinazione (Link Affiliato) *</label>
        <input v-model="form.targetUrl" type="url" placeholder="es. https://amazon.it/..." required />
      </div>

      <div class="form-summary">
        <div class="summary-item">
          <span>Pacchetto Selezionato:</span>
          <span class="highlight">Base ({{ form.budgetCredits }} Click)</span>
        </div>
        <div class="summary-item">
          <span>Costo stimato:</span>
          <span class="highlight">Gratuito (Fase Beta)</span>
        </div>
      </div>

      <div v-if="message" :class="['alert-message', message.type]">
        {{ message.text }}
      </div>

      <button type="submit" :disabled="isLoading" class="submit-btn">
        <span v-if="isLoading">⏳ Generazione nel Vault...</span>
        <span v-else>🚀 Lancia Campagna</span>
      </button>
    </form>
  </div>
</template>

<style scoped>
.ad-manager-card {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 2rem;
  width: 100%; /* Si adatta alla colonna della griglia! */
  color: #f8fafc;
  font-family: system-ui, sans-serif;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid #1e293b;
  padding-bottom: 1rem;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 800;
  margin: 0;
  color: #fff;
}

.badge {
  background: rgba(0, 220, 130, 0.1);
  color: #00dc82;
  border: 1px solid rgba(0, 220, 130, 0.3);
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 800;
}

.card-desc { color: #94a3b8; font-size: 0.85rem; line-height: 1.5; margin-bottom: 2rem; }
.ad-form { display: flex; flex-direction: column; gap: 1.25rem; }
.form-group { display: flex; flex-direction: column; gap: 0.4rem; }
label { font-size: 0.75rem; font-weight: 800; color: #cbd5e1; text-transform: uppercase; }

input, textarea {
  background: #020420;
  border: 1px solid #1e293b;
  color: #fff;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s;
}

input:focus, textarea:focus { border-color: #00dc82; }

.form-summary {
  background: rgba(15, 23, 42, 0.5);
  border: 1px dashed #334155;
  padding: 1rem;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.85rem;
  margin-top: 0.5rem;
}
.summary-item { display: flex; justify-content: space-between; color: #94a3b8; }
.highlight { color: #00dc82; font-weight: 800; }

.alert-message { padding: 0.8rem; border-radius: 8px; font-size: 0.85rem; font-weight: 700; text-align: center; }
.success { background: rgba(0, 220, 130, 0.1); color: #00dc82; border: 1px solid rgba(0, 220, 130, 0.3); }
.error { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }

.submit-btn {
  background: #00dc82; color: #020420; border: none; padding: 0.9rem; border-radius: 8px; font-size: 1rem; font-weight: 800; cursor: pointer; transition: all 0.2s ease;
}
.submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0, 220, 130, 0.2); }
.submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }
</style>