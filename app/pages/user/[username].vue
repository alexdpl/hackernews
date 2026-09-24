<!-- app/pages/user/[username].vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const route = useRoute()
const usernameParam = computed(() => route.params.username as string)

// Integrazione con DKP Auth Core
const { currentUser, isAuthenticated } = useAuthCore()

// Verifica se la pagina visualizzata è il profilo dell'utente attualmente loggato
const isOwnProfile = computed(() => {
  return isAuthenticated.value && currentUser.value?.username?.toLowerCase() === usernameParam.value?.toLowerCase()
})

// Stato per la verifica Proof of Code / GitHub
const githubInput = ref('')
const loadingGitHub = ref(false)
const githubData = ref<any>(null)
const errorMessage = ref('')

// Dati profilo utente reattivi
const profile = ref({
  username: usernameParam.value,
  created: 'Iscritto a DKP',
  reputation: 120,
  bio: 'Sviluppatore e contributor dell\'ecosistema DevKernelPulse.',
  submissionsCount: 5,
  commentsCount: 14
})

// Mock o fetch profilo pubblico dal server DKP
onMounted(async () => {
  if (isOwnProfile.value && currentUser.value) {
    profile.value.username = currentUser.value.username
    profile.value.bio = currentUser.value.bio || profile.value.bio
  }
})

async function verifyGitHubProfile() {
  const targetUser = githubInput.value.trim() || profile.value.username
  if (!targetUser) return

  loadingGitHub.value = true
  errorMessage.value = ''

  try {
    const res: any = await $fetch('/api/github-stats', {
      method: 'POST',
      body: { username: targetUser }
    })
    
    githubData.value = res
    profile.value.reputation += Math.floor(res.karmaScore / 10)
  } catch (err: any) {
    errorMessage.value = err?.data?.statusMessage || err?.statusMessage || 'Impossibile verificare il profilo GitHub. Riprova.'
    githubData.value = null
  } finally {
    loadingGitHub.value = false
  }
}

function disconnectGitHub() {
  githubData.value = null
  githubInput.value = ''
  errorMessage.value = ''
}
</script>

<template>
  <div class="dkp-profile-wrapper">
    <div class="dkp-profile-card">
      
      <!-- Intestazione Profilo Pubblico -->
      <div class="profile-main-header">
        <div class="avatar-glow">
          <img v-if="githubData?.avatarUrl" :src="githubData.avatarUrl" alt="Avatar GitHub" class="github-avatar" />
          <span v-else>{{ profile.username.charAt(0).toUpperCase() }}</span>
        </div>
        
        <div class="profile-info-block">
          <div class="user-title-row">
            <h1 class="username-heading">@{{ profile.username }}</h1>
            <span v-if="githubData" class="verified-badge">🛡️ PROOF OF CODE VERIFIED</span>
          </div>
          <p class="meta-details">
            Punti Reputazione DKP: <strong class="karma-highlight">{{ profile.reputation }}</strong>
          </p>
        </div>

        <!-- Shortcut per il proprietario del profilo -->
        <div v-if="isOwnProfile" class="own-profile-action">
          <NuxtLink to="/user/dashboard" class="edit-dashboard-btn">
            ⚙️ Gestisci il tuo Profilo
          </NuxtLink>
        </div>
      </div>

      <!-- Bio e Statistiche Community -->
      <div class="profile-content-section">
        <p class="bio-paragraph">{{ profile.bio }}</p>
        <div class="stats-pills-row">
          <span class="stat-pill">📰 <strong>{{ profile.submissionsCount }}</strong> Post Inviati</span>
          <span class="stat-pill">💬 <strong>{{ profile.commentsCount }}</strong> Commenti</span>
        </div>
      </div>

      <!-- SEZIONE: Proof of Code (GitHub Karma & Audit) -->
      <div class="proof-of-code-panel">
        <div class="poc-top">
          <div class="poc-title-group">
            <span class="poc-icon">⚡</span>
            <h2>Proof of Code — GitHub Identity & Trust</h2>
          </div>
          <span class="poc-tag">Open Source Verification</span>
        </div>
        
        <p class="poc-description">
          Certificazione crittografica dell'identità sviluppatore basata sulle metriche reali dei repository e commit GitHub.
        </p>

        <!-- Form inserimento username GitHub (Mostrato se non ancora verificato) -->
        <div v-if="!githubData" class="poc-input-container">
          <input 
            v-model="githubInput" 
            type="text" 
            :placeholder="`Username GitHub (es. ${profile.username})`" 
            class="poc-text-input"
            @keyup.enter="verifyGitHubProfile"
          />
          <button @click="verifyGitHubProfile" :disabled="loadingGitHub" class="poc-action-btn">
            {{ loadingGitHub ? 'Verifica in corso...' : 'Verifica GitHub' }}
          </button>
        </div>

        <p v-if="errorMessage" class="error-notification">{{ errorMessage }}</p>

        <!-- Card Risultati GitHub & Badge Verificato -->
        <div v-if="githubData" class="github-verified-box">
          <div class="stats-grid">
            <div class="stat-card">
              <span class="stat-title">Handle</span>
              <span class="stat-number">@{{ githubData.githubUsername }}</span>
            </div>
            <div class="stat-card">
              <span class="stat-title">Repository</span>
              <span class="stat-number">{{ githubData.publicRepos }}</span>
            </div>
            <div class="stat-card">
              <span class="stat-title">Follower</span>
              <span class="stat-number">{{ githubData.followers }}</span>
            </div>
          </div>

          <div class="badge-awarded-row">
            <span class="badge-desc-text">Livello Certificato: <strong class="badge-highlight-pill">{{ githubData.badge }}</strong></span>
            <button v-if="isOwnProfile" @click="disconnectGitHub" class="disconnect-btn">Scollega Account</button>
          </div>
        </div>

      </div>

      <!-- Footer della Card -->
      <div class="profile-footer-actions">
        <NuxtLink to="/" class="return-home-btn">← Torna alla Newsfeed</NuxtLink>
      </div>

    </div>
  </div>
</template>

<style scoped>
.dkp-profile-wrapper {
  max-width: 860px;
  margin: 2.5rem auto;
  padding: 0 1rem;
  font-family: ui-sans-serif, system-ui, sans-serif;
  color: #f8fafc;
}

.dkp-profile-card {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 15px 35px -5px rgba(0, 0, 0, 0.5);
}

.profile-main-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  border-bottom: 1px solid #1e293b;
  padding-bottom: 1.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.avatar-glow {
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, #00dc82, #38bdf8);
  color: #020420;
  font-size: 2.2rem;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 0 15px rgba(0, 220, 130, 0.2);
}

.github-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-info-block { flex: 1; }

.user-title-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.username-heading {
  font-size: 1.75rem;
  margin: 0;
  color: #ffffff;
  font-weight: 800;
}

.verified-badge {
  background: rgba(0, 220, 130, 0.15);
  color: #00dc82;
  font-size: 0.7rem;
  font-weight: 800;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  border: 1px solid rgba(0, 220, 130, 0.3);
}

.meta-details {
  color: #94a3b8;
  font-size: 0.9rem;
  margin-top: 0.3rem;
}

.karma-highlight {
  color: #00dc82;
  font-size: 1rem;
}

.edit-dashboard-btn {
  background: #020420;
  border: 1px solid #38bdf8;
  color: #38bdf8;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.2s;
}

.edit-dashboard-btn:hover {
  background: #38bdf8;
  color: #020420;
}

.profile-content-section {
  margin-bottom: 1.75rem;
}

.bio-paragraph {
  color: #cbd5e1;
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.stats-pills-row {
  display: flex;
  gap: 0.75rem;
}

.stat-pill {
  background: #020420;
  border: 1px solid #1e293b;
  color: #94a3b8;
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  font-size: 0.85rem;
}

.stat-pill strong { color: #ffffff; }

.proof-of-code-panel {
  background: #020420;
  border: 1px solid #1e293b;
  border-radius: 10px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.poc-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.poc-title-group {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.poc-title-group h2 {
  font-size: 1.1rem;
  margin: 0;
  color: #ffffff;
}

.poc-tag {
  background: rgba(0, 220, 130, 0.1);
  color: #00dc82;
  border: 1px solid rgba(0, 220, 130, 0.2);
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
}

.poc-description {
  color: #94a3b8;
  font-size: 0.85rem;
  line-height: 1.5;
  margin-bottom: 1.2rem;
}

.poc-input-container {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.poc-text-input {
  flex: 1;
  min-width: 240px;
  background: #090d16;
  border: 1px solid #1e293b;
  color: #fff;
  padding: 0.6rem 0.85rem;
  border-radius: 6px;
  font-size: 0.9rem;
}

.poc-text-input:focus {
  outline: none;
  border-color: #00dc82;
}

.poc-action-btn {
  background: #00dc82;
  color: #020420;
  font-weight: 800;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.85rem;
}

.poc-action-btn:hover {
  background: #00bf71;
}

.error-notification {
  color: #ef4444;
  font-size: 0.85rem;
  margin-top: 0.75rem;
}

.github-verified-box {
  margin-top: 1.25rem;
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 8px;
  padding: 1.25rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: 1rem;
  text-align: center;
  margin-bottom: 1rem;
  border-bottom: 1px solid #1e293b;
  padding-bottom: 1rem;
}

.stat-title {
  display: block;
  font-size: 0.7rem;
  color: #64748b;
  text-transform: uppercase;
  font-weight: 700;
  margin-bottom: 0.2rem;
}

.stat-number {
  font-size: 1.1rem;
  font-weight: 800;
  color: #38bdf8;
}

.badge-awarded-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.badge-desc-text {
  font-size: 0.85rem;
  color: #cbd5e1;
}

.badge-highlight-pill {
  color: #00dc82;
  font-weight: 800;
}

.disconnect-btn {
  background: transparent;
  color: #ef4444;
  border: 1px solid #ef4444;
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
}

.profile-footer-actions {
  border-top: 1px solid #1e293b;
  padding-top: 1rem;
}

.return-home-btn {
  color: #94a3b8;
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 600;
}

.return-home-btn:hover {
  color: #00dc82;
}
</style>