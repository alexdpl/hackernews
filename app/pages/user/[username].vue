<!-- app/pages/user/[username].vue -->
<script setup lang="ts">
import { ref } from 'vue'

const route = useRoute()
const username = route.params.username as string

const { data: responseData, pending, error, refresh } = await useFetch(`/api/users/${username}`)

const profile = computed(() => responseData.value?.profile || null)
const posts = computed(() => responseData.value?.posts || [])

// Stati per la modifica del profilo
const isEditing = ref(false)
const editBio = ref('')
const editAvatar = ref('')
const saving = ref(false)

function startEditing() {
  if (profile.value) {
    editBio.value = profile.value.bio
    editAvatar.value = profile.value.avatar
    isEditing.value = true
  }
}

async function saveProfile() {
  saving.value = true
  try {
    const res: any = await $fetch('/api/users/update', {
      method: 'POST',
      body: {
        username,
        bio: editBio.value,
        avatar: editAvatar.value
      }
    })
    if (res.success) {
      isEditing.value = false
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

function formatDate(dateStr: string) {
  if (!dateStr) return 'N/D'
  try {
    return new Date(dateStr).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch {
    return dateStr
  }
}

useSeoMeta({
  title: `Profilo: ${username} - DevKernelPulse`,
  description: `Statistiche e storie di ${username} su DevKernelPulse.`
})
</script>

<template>
  <div class="profile-container">
    <div v-if="pending && !profile" class="state-message">
      Caricamento profilo in corso...
    </div>

    <div v-else-if="error || (responseData && !responseData.success)" class="state-message error">
      Impossibile trovare il profilo dell'utente "{{ username }}".
    </div>

    <div v-else-if="profile" class="profile-content">
      <div class="profile-header-card">
        <div class="profile-top-row">
          <div class="avatar-wrapper">
            <img :src="profile.avatar" alt="Avatar utente" class="user-avatar" />
          </div>
          <div class="profile-titles">
            <h2>Profilo: <span class="username-highlight">{{ profile.username }}</span></h2>
            <button v-if="!isEditing" @click="startEditing" class="edit-btn">Modifica Profilo</button>
          </div>
        </div>

        <!-- Vista normale -->
        <div v-if="!isEditing">
          <div class="profile-meta-grid">
            <div class="meta-item">
              <span class="label">Karma Totale</span>
              <span class="value karma-val">{{ profile.karma }}</span>
            </div>
            <div class="meta-item">
              <span class="label">Iscritto dal</span>
              <span class="value">{{ formatDate(profile.joinedAt) }}</span>
            </div>
            <div class="meta-item">
              <span class="label">Storie Sottomesse</span>
              <span class="value">{{ profile.totalSubmissions }}</span>
            </div>
          </div>

          <div class="bio-box">
            <span class="label">Bio</span>
            <p class="bio-text">{{ profile.bio }}</p>
          </div>
        </div>

        <!-- Vista Modifica -->
        <div v-else class="edit-form">
          <div class="form-group">
            <label class="label">URL Avatar Personalizzato (opzionale)</label>
            <input v-model="editAvatar" type="text" class="form-input" placeholder="https://esempio.com/avatar.png" />
          </div>
          <div class="form-group">
            <label class="label">Biografia</label>
            <textarea v-model="editBio" rows="3" class="form-textarea" placeholder="Raccontaci qualcosa di te..."></textarea>
          </div>
          <div class="form-actions">
            <button @click="saveProfile" :disabled="saving" class="save-btn">
              {{ saving ? 'Salvataggio...' : 'Salva Modifiche' }}
            </button>
            <button @click="isEditing = false" class="cancel-btn">Annulla</button>
          </div>
        </div>
      </div>

      <!-- Storie dell'Utente -->
      <div class="user-submissions">
        <h3>Storie pubblicate da {{ profile.username }}</h3>
        
        <div v-if="posts.length > 0" class="stories-list">
          <ol class="story-items">
            <li v-for="item in posts" :key="item.id" class="story-item">
              <Item :item="item" />
            </li>
          </ol>
        </div>
        
        <div v-else class="no-stories">
          Questo utente non ha ancora pubblicato alcuna storia.
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-container {
  max-width: 900px;
  margin: 1.5rem auto;
  padding: 0 1rem;
  font-family: ui-sans-serif, system-ui, sans-serif;
}

.state-message {
  text-align: center;
  padding: 3rem 1rem;
  color: #64748b;
  font-size: 0.95rem;
}

.state-message.error {
  color: #ef4444;
}

.profile-header-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
}

.profile-top-row {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  margin-bottom: 1.25rem;
}

.avatar-wrapper {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  overflow: hidden;
  background: #020420;
  border: 2px solid #00dc82;
  flex-shrink: 0;
}

.user-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-titles {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  flex-wrap: wrap;
  gap: 1rem;
}

.profile-titles h2 {
  font-size: 1.4rem;
  color: #020420;
  margin: 0;
}

.username-highlight {
  color: #00dc82;
  background: #020420;
  padding: 0.1rem 0.5rem;
  border-radius: 4px;
}

.edit-btn {
  background: #020420;
  color: #00dc82;
  border: none;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: opacity 0.2s;
}

.edit-btn:hover {
  opacity: 0.9;
}

.profile-meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.meta-item {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 0.85rem 1rem;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
}

.meta-item .label {
  font-size: 0.75rem;
  color: #64748b;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.05em;
}

.meta-item .value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #020420;
  margin-top: 0.25rem;
}

.meta-item .value.karma-val {
  color: #00dc82;
  background: #020420;
  display: inline-block;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  width: fit-content;
}

.bio-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 1rem;
  border-radius: 6px;
}

.bio-text {
  color: #334155;
  font-size: 0.95rem;
  margin: 0.3rem 0 0 0;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: #f8fafc;
  padding: 1.25rem;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.form-input, .form-textarea {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 0.6rem;
  color: #020420;
  font-size: 0.95rem;
}

.form-input:focus, .form-textarea:focus {
  outline: none;
  border-color: #00dc82;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.save-btn {
  background: #00dc82;
  color: #020420;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 700;
  cursor: pointer;
}

.cancel-btn {
  background: #e2e8f0;
  color: #334155;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

.user-submissions h3 {
  font-size: 1.1rem;
  color: #020420;
  margin-bottom: 1rem;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 0.5rem;
}

.story-items {
  padding-left: 1.5rem;
  margin: 0;
}

.story-item {
  margin-bottom: 0.5rem;
}

.no-stories {
  color: #64748b;
  font-size: 0.9rem;
  font-style: italic;
  padding: 1rem 0;
}
</style>