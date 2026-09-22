<!-- app/pages/settings.vue -->
<script setup lang="ts">
import { ref } from 'vue'

const router = useRouter()
const { data: authData } = await useFetch('/api/auth/me')

const username = computed(() => authData.value?.username)
const isAuthenticated = computed(() => authData.value?.authenticated)

// Se non è loggato, reindirizza al login
if (import.meta.client && !isAuthenticated.value) {
  router.push('/login')
}

// Recupera i dati attuali del profilo
const { data: profileData, refresh } = await useFetch(username.value ? `/api/users/${username.value}` : null)
const profile = computed(() => profileData.value?.profile || null)

const bio = ref('')
const avatar = ref('')
const saving = ref(false)
const successMsg = ref('')

// Inizializza i campi quando i dati arrivano
watchEffect(() => {
  if (profile.value) {
    bio.value = profile.value.bio || ''
    avatar.value = profile.value.avatar || ''
  }
})

async function saveSettings() {
  if (!username.value) return
  saving.value = true
  successMsg.value = ''
  try {
    const res: any = await $fetch('/api/users/update', {
      method: 'POST',
      body: {
        username: username.value,
        bio: bio.value,
        avatar: avatar.value
      }
    })
    if (res.success) {
      successMsg.value = 'Profilo aggiornato con successo!'
      await refresh()
    } else {
      alert('Errore durante il salvataggio.')
    }
  } catch (err) {
    console.error(err)
    alert('Errore di connessione.')
  } finally {
    saving.value = false
  }
}

useSeoMeta({
  title: 'Impostazioni Profilo - DevKernelPulse'
})
</script>

<template>
  <div class="settings-container">
    <div class="settings-card">
      <h2>Impostazioni Account</h2>
      <p class="subtitle">Gestisci le informazioni del tuo profilo su <span class="highlight">DevKernelPulse</span>.</p>

      <div v-if="!isAuthenticated" class="not-logged">
        Devi effettuare il <NuxtLink to="/login">Login</NuxtLink> per accedere a questa pagina.
      </div>

      <div v-else-if="profile" class="settings-form">
        <div v-if="successMsg" class="success-banner">{{ successMsg }}</div>

        <div class="form-group">
          <label>Username (Non modificabile)</label>
          <input :value="profile.username" type="text" disabled class="form-input disabled" />
        </div>

        <div class="form-group">
          <label>URL Avatar Personalizzato</label>
          <input v-model="avatar" type="text" class="form-input" placeholder="https://esempio.com/avatar.png" />
          <span class="hint">Lascia vuoto per usare l'avatar automatico basato su Dicebear.</span>
        </div>

        <div class="form-group">
          <label>Biografia / Bio</label>
          <textarea v-model="bio" rows="4" class="form-textarea" placeholder="Raccontaci chi sei e cosa sviluppi..."></textarea>
        </div>

        <div class="form-actions">
          <button @click="saveSettings" :disabled="saving" class="save-btn">
            {{ saving ? 'Salvataggio in corso...' : 'Salva Modifiche' }}
          </button>
          <NuxtLink :to="`/user/${username}`" class="view-profile-btn">Visualizza Profilo ↗</NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-container {
  max-width: 700px;
  margin: 2rem auto;
  padding: 0 1rem;
  font-family: ui-sans-serif, system-ui, sans-serif;
}

.settings-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
}

.settings-card h2 {
  color: #020420;
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
}

.subtitle {
  color: #64748b;
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
}

.highlight {
  color: #00dc82;
  background: #020420;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
}

.form-input, .form-textarea {
  padding: 0.7rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.95rem;
  color: #020420;
}

.form-input.disabled {
  background: #f1f5f9;
  color: #64748b;
  cursor: not-allowed;
}

.form-input:focus, .form-textarea:focus {
  outline: none;
  border-color: #00dc82;
}

.hint {
  font-size: 0.75rem;
  color: #64748b;
}

.success-banner {
  background: #d1fae5;
  color: #065f46;
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
}

.form-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.5rem;
}

.save-btn {
  background: #00dc82;
  color: #020420;
  border: none;
  padding: 0.7rem 1.2rem;
  border-radius: 6px;
  font-weight: 700;
  cursor: pointer;
}

.view-profile-btn {
  color: #020420;
  font-weight: 600;
  text-decoration: none;
  font-size: 0.9rem;
}

.view-profile-btn:hover {
  color: #00dc82;
  text-decoration: underline;
}

.not-logged {
  color: #64748b;
  text-align: center;
  padding: 2rem;
}
</style>