<!-- app/pages/user/[username].vue -->
<script setup lang="ts">
import { computed } from 'vue'

const route = useRoute()
const username = route.params.username as string

// 1. Recupero dati utente e relative statistiche/post
const { data: userData, pending, error } = await useFetch(`/api/users/${username}`)
const profile = computed(() => userData.value?.profile || userData.value)

// 2. Controllo utente loggato corrente
const { data: authData } = await useFetch('/api/auth/me')
const currentLoggedInUser = computed(() => authData.value?.username || null)
const isOwner = computed(() => currentLoggedInUser.value === username)
const isAdmin = computed(() => username === 'alexdpl')

useSeoMeta({
  title: computed(() => profile.value ? `Profilo di ${username} - DevKernelPulse` : 'Utente - DevKernelPulse')
})
</script>

<template>
  <div class="user-profile-container">
    <div v-if="pending" class="state-msg">Caricamento profilo in corso...</div>

    <div v-else-if="error || !profile" class="state-msg error">
      <h2>Utente non trovato</h2>
      <p>L'utente "{{ username }}" non esiste o è stato rimosso.</p>
      <NuxtLink to="/" class="back-link">← Torna alla Home</NuxtLink>
    </div>

    <div v-else class="profile-card">
      <!-- Header Profilo -->
      <div class="profile-header">
        <div class="user-identity">
          <div class="avatar-placeholder">
            {{ username.charAt(0).toUpperCase() }}
          </div>
          <div>
            <h1 class="username-title">
              {{ profile.username }}
              <span v-if="isAdmin" class="badge-admin">Admin</span>
            </h1>
            <p class="joined-date">Membro da {{ profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('it-IT') : 'recentemente' }}</p>
          </div>
        </div>

        <!-- Azioni Proprietario o Admin -->
        <div v-if="isOwner" class="owner-actions">
          <NuxtLink to="/settings" class="edit-profile-btn">⚙️ Modifica Profilo</NuxtLink>
          <NuxtLink v-if="isAdmin" to="/admin" class="admin-panel-btn">🛡️ Pannello Admin</NuxtLink>
        </div>
      </div>

      <!-- Statistiche Karma e Info -->
      <div class="profile-stats-grid">
        <div class="stat-box">
          <span class="stat-value">{{ profile.karma || 4 }}</span>
          <span class="stat-label">Karma</span>
        </div>
        <div class="stat-box">
          <span class="stat-value">{{ profile.submissionsCount || 'Attivo' }}</span>
          <span class="stat-label">Status</span>
        </div>
      </div>

      <!-- Biografia -->
      <div class="bio-section">
        <h3>Biografia</h3>
        <p class="bio-text">
          {{ profile.bio || 'Nessuna biografia inserita da questo utente.' }}
        </p>
      </div>

      <hr class="divider" />

      <!-- Sezioni Submissions & Comments integrate -->
      <div class="user-activity-section">
        <h3>Attività Recenti</h3>
        <div class="activity-links">
          <a :href="`https://news.ycombinator.com/submitted?id=${username}`" target="_blank" rel="noopener noreferrer" class="activity-link">
            Visualizza Submissions Storiche su HN ↗
          </a>
          <span class="dot">•</span>
          <a :href="`https://news.ycombinator.com/threads?id=${username}`" target="_blank" rel="noopener noreferrer" class="activity-link">
            Visualizza Threads & Commenti Storici su HN ↗
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.user-profile-container {
  max-width: 800px;
  margin: 2rem auto;
  padding: 0 1rem;
  font-family: ui-sans-serif, system-ui, sans-serif;
}

.state-msg {
  text-align: center;
  padding: 3rem;
  color: #64748b;
}

.state-msg.error {
  color: #ef4444;
}

.profile-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 1.5rem;
  margin-bottom: 1.5rem;
}

.user-identity {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.avatar-placeholder {
  width: 56px;
  height: 56px;
  background: #020420;
  color: #00dc82;
  font-size: 1.5rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,220,130,0.2);
}

.username-title {
  font-size: 1.5rem;
  color: #020420;
  margin: 0 0 0.2rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.badge-admin {
  background: #00dc82;
  color: #020420;
  font-size: 0.75rem;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  font-weight: 700;
}

.joined-date {
  color: #64748b;
  font-size: 0.85rem;
  margin: 0;
}

.owner-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.edit-profile-btn {
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  color: #020420;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.9rem;
  text-decoration: none;
  transition: background 0.2s;
}

.edit-profile-btn:hover {
  background: #f1f5f9;
}

.admin-panel-btn {
  background: #020420;
  color: #00dc82;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.9rem;
  text-decoration: none;
}

.profile-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 1rem;
  border-radius: 6px;
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 1.25rem;
  font-weight: 700;
  color: #020420;
}

.stat-label {
  font-size: 0.8rem;
  color: #64748b;
}

.bio-section h3, .user-activity-section h3 {
  font-size: 1.1rem;
  color: #020420;
  margin-bottom: 0.5rem;
}

.bio-text {
  color: #334155;
  font-size: 0.95rem;
  line-height: 1.5;
  background: #f8fafc;
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.divider {
  border: 0;
  height: 1px;
  background: #e2e8f0;
  margin: 1.5rem 0;
}

.activity-links {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  font-size: 0.9rem;
}

.activity-link {
  color: #2563eb;
  text-decoration: none;
  font-weight: 500;
}

.activity-link:hover {
  text-decoration: underline;
}

.dot {
  color: #cbd5e1;
}

.back-link {
  color: #2563eb;
  text-decoration: underline;
  font-size: 0.9rem;
}
</style>