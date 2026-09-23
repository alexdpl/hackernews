<!-- app/pages/user/[username].vue -->
<script setup lang="ts">
import { ref } from 'vue'

const route = useRoute()
const username = route.params.username as string

// Stato della sezione Proof of Code
const githubInput = ref('')
const loadingGitHub = ref(false)
const githubData = ref<any>(null)
const errorMessage = ref('')

// Profilo utente unificato
const profile = ref({
  username: username,
  created: '1 giorno fa',
  karma: 4,
  bio: 'Sviluppatore e contributor dell\'ecosistema DevKernelPulse.',
  submissionsCount: 12,
  commentsCount: 34
})

async function verifyGitHubProfile() {
  if (!githubInput.value.trim()) return

  loadingGitHub.value = true
  errorMessage.value = ''

  try {
    const res: any = await $fetch('/api/github-stats', {
      method: 'POST',
      body: { username: githubInput.value.trim() }
    })
    
    githubData.value = res
    profile.value.karma += Math.floor(res.karmaScore / 10)
  } catch (err: any) {
    // Cattura dettagliata dell'errore proveniente dal server Nitro
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
      
      <!-- Intestazione Profilo -->
      <div class="profile-main-header">
        <div class="avatar-glow">
          <img v-if="githubData?.avatarUrl" :src="githubData.avatarUrl" alt="Avatar GitHub" class="github-avatar" />
          <span v-else>{{ username.charAt(0).toUpperCase() }}</span>
        </div>
        <div class="profile-info-block">
          <h1 class="username-heading">User: <span class="highlight-user">@{{ profile.username }}</span></h1>
          <p class="meta-details">Creato: {{ profile.created }} • Karma Totale: <strong class="karma-highlight">{{ profile.karma }}</strong></p>
        </div>
      </div>

      <!-- Bio e Sezione Tradizionale -->
      <div class="profile-content-section">
        <p class="bio-paragraph">{{ profile.bio }}</p>
        <div class="legacy-nav-links">
          <NuxtLink to="#" class="nav-link-item">submissions ({{ profile.submissionsCount }})</NuxtLink> 
          <span class="separator">|</span> 
          <NuxtLink to="#" class="nav-link-item">comments ({{ profile.commentsCount }})</NuxtLink>
        </div>
      </div>

      <!-- SEZIONE SPECIALE: Proof of Code (GitHub Karma) -->
      <div class="proof-of-code-panel">
        <div class="poc-top">
          <div class="poc-title-group">
            <span class="poc-icon">⚡</span>
            <h2>Proof of Code — GitHub Verification</h2>
          </div>
          <span class="poc-tag">Real-World Trust</span>
        </div>
        
        <p class="poc-description">
          Certifica la tua identità open-source. Collega il tuo account GitHub per sbloccare badge di livello basati sui tuoi commit reali.
        </p>

        <!-- Form inserimento username -->
        <div v-if="!githubData" class="poc-input-container">
          <input 
            v-model="githubInput" 
            type="text" 
            placeholder="Username GitHub (es. torvalds)" 
            class="poc-text-input"
            @keyup.enter="verifyGitHubProfile"
          />
          <button @click="verifyGitHubProfile" :disabled="loadingGitHub" class="poc-action-btn">
            {{ loadingGitHub ? 'Verifica in corso...' : 'Collega GitHub' }}
          </button>
        </div>

        <p v-if="errorMessage" class="error-notification">{{ errorMessage }}</p>

        <!-- Card Risultati GitHub & Badge -->
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
            <span class="badge-desc-text">Livello Attivo: <strong class="badge-highlight-pill">{{ githubData.badge }}</strong></span>
            <button @click="disconnectGitHub" class="disconnect-btn">Disconnetti</button>
          </div>
        </div>

      </div>

      <!-- Footer della Card -->
      <div class="profile-footer-actions">
        <NuxtLink to="/" class="return-home-btn">← Torna alla Home</NuxtLink>
      </div>

    </div>
  </div>
</template>

<style scoped>
.dkp-profile-wrapper {
  max-width: 840px;
  margin: 2.5rem auto;
  padding: 0 1rem;
  font-family: system-ui, -apple-system, sans-serif;
  color: #f8fafc;
}

.dkp-profile-card {
  background: #020617;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 2.5rem;
  box-shadow: 0 15px 35px -5px rgba(0, 0, 0, 0.4);
}

.profile-main-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  border-bottom: 1px solid #1e293b;
  padding-bottom: 1.5rem;
  margin-bottom: 1.5rem;
}

.avatar-glow {
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, #00dc82, #38bdf8);
  color: #020617;
  font-size: 2.2rem;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 0 15px rgba(0, 220, 130, 0.3);
}

.github-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.username-heading {
  font-size: 1.75rem;
  margin: 0 0 0.2rem 0;
}

.highlight-user {
  color: #38bdf8;
}

.meta-details {
  color: #94a3b8;
  font-size: 0.95rem;
  margin: 0;
}

.karma-highlight {
  color: #00dc82;
}

.profile-content-section {
  margin-bottom: 2rem;
}

.bio-paragraph {
  color: #cbd5e1;
  font-size: 1.05rem;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.legacy-nav-links {
  font-size: 0.95rem;
}

.nav-link-item {
  color: #38bdf8;
  text-decoration: none;
}

.nav-link-item:hover {
  text-decoration: underline;
}

.separator {
  color: #475569;
  margin: 0 0.5rem;
}

.proof-of-code-panel {
  background: #090d16;
  border: 1px solid #334155;
  border-radius: 10px;
  padding: 1.5rem;
  margin-bottom: 2rem;
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
  font-size: 1.2rem;
  margin: 0;
  color: #ffffff;
}

.poc-icon {
  font-size: 1.2rem;
}

.poc-tag {
  background: #0f172a;
  color: #00dc82;
  border: 1px solid #1e293b;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.poc-description {
  color: #94a3b8;
  font-size: 0.9rem;
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
  background: #020617;
  border: 1px solid #334155;
  color: #fff;
  padding: 0.7rem 1rem;
  border-radius: 6px;
  font-size: 0.95rem;
}

.poc-text-input:focus {
  outline: none;
  border-color: #00dc82;
  box-shadow: 0 0 0 2px rgba(0, 220, 130, 0.2);
}

.poc-action-btn {
  background: #00dc82;
  color: #020617;
  font-weight: 800;
  border: none;
  padding: 0.7rem 1.4rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.poc-action-btn:hover {
  background: #00bf71;
  transform: translateY(-1px);
}

.error-notification {
  color: #ef4444;
  font-size: 0.85rem;
  margin-top: 0.75rem;
}

.github-verified-box {
  margin-top: 1.25rem;
  background: #020617;
  border: 1px solid #1e293b;
  border-radius: 8px;
  padding: 1.25rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  text-align: center;
  margin-bottom: 1.2rem;
  border-bottom: 1px solid #1e293b;
  padding-bottom: 1rem;
}

.stat-title {
  display: block;
  font-size: 0.75rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.2rem;
}

.stat-number {
  font-size: 1.15rem;
  font-weight: 700;
  color: #38bdf8;
}

.badge-awarded-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #090d16;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.badge-desc-text {
  font-size: 0.9rem;
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
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.2s;
}

.disconnect-btn:hover {
  background: rgba(239, 68, 68, 0.1);
}

.profile-footer-actions {
  border-top: 1px solid #1e293b;
  padding-top: 1.25rem;
}

.return-home-btn {
  color: #cbd5e1;
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 500;
}

.return-home-btn:hover {
  color: #00dc82;
}
</style>