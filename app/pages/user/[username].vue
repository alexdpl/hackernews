<!-- app/pages/user/[username].vue -->
<script setup lang="ts">
const route = useRoute()
const username = route.params.username as string

// Fetch dei dati del profilo e dei post dall'endpoint dedicato
const { data: responseData, pending, error } = await useFetch(`/api/users/${username}`)

const profile = computed(() => responseData.value?.profile || null)
const posts = computed(() => responseData.value?.posts || [])

// Formattazione data di registrazione
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
  description: `Visualizza le statistiche, il karma e le storie pubblicate da ${username} su DevKernelPulse.`
})
</script>

<template>
  <div class="profile-container">
    <!-- Loader -->
    <div v-if="pending && !profile" class="state-message">
      Caricamento profilo in corso...
    </div>

    <!-- Errore -->
    <div v-else-if="error || (responseData && !responseData.success)" class="state-message error">
      Impossibile trovare il profilo dell'utente "{{ username }}".
    </div>

    <!-- Dettagli Profilo -->
    <div v-else-if="profile" class="profile-content">
      <div class="profile-header-card">
        <h2>Profilo utente: <span class="username-highlight">{{ profile.username }}</span></h2>
        
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

      <!-- Sezione Storie dell'Utente -->
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

.profile-header-card h2 {
  font-size: 1.4rem;
  color: #020420;
  margin-top: 0;
  margin-bottom: 1.25rem;
}

.username-highlight {
  color: #00dc82;
  background: #020420;
  padding: 0.1rem 0.5rem;
  border-radius: 4px;
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