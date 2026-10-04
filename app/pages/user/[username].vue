<!-- app/pages/user/[username].vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const username = computed(() => route.params.username as string || 'alexdpl')

const userProfile = ref({
  username: username.value,
  bio: 'Lead Architect & Core Creator of DevKernelPulse',
  avatar: 'https://github.com/alexdpl.png',
  github: 'https://github.com/alexdpl',
  twitter: 'https://x.com/alexdpl',
  linkedin: 'https://linkedin.com/in/alexdpl',
  reddit: 'https://reddit.com/user/alexdpl',
  points: 127,
  rank: 'Developer VIP Member'
})
</script>

<template>
  <div class="public-profile-page">
    <div class="profile-card">
      <div class="profile-header">
        <img :src="userProfile.avatar" alt="Avatar" class="avatar" />
        <div class="meta">
          <h1>@{{ userProfile.username }}</h1>
          <span class="rank">{{ userProfile.rank }}</span>
          <p class="bio">{{ userProfile.bio }}</p>
        </div>
      </div>

      <!-- ICONE SOCIAL CON REDDIT -->
      <div class="social-links">
        <a v-if="userProfile.github" :href="userProfile.github" target="_blank" class="social-btn">🐙 GitHub</a>
        <a v-if="userProfile.twitter" :href="userProfile.twitter" target="_blank" class="social-btn">🐦 Twitter</a>
        <a v-if="userProfile.linkedin" :href="userProfile.linkedin" target="_blank" class="social-btn">💼 LinkedIn</a>
        <a v-if="userProfile.reddit" :href="userProfile.reddit" target="_blank" class="social-btn reddit">🤖 Reddit</a>
      </div>

      <div class="stats-grid">
        <div class="stat-box">
          <span class="stat-title">Punti DKP</span>
          <span class="stat-value">{{ userProfile.points }}</span>
        </div>
        <div class="stat-box">
          <span class="stat-title">Stato Credenziali</span>
          <span class="stat-value verified">Verificato</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.public-profile-page {
  background: #020420;
  min-height: 100vh;
  padding: 3rem 1rem;
  color: #ffffff;
  display: flex;
  justify-content: center;
}

.profile-card {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 16px;
  padding: 2rem;
  max-width: 650px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 2px solid #00dc82;
}

.meta h1 { margin: 0; font-size: 1.5rem; }
.rank { color: #00dc82; font-weight: 700; font-size: 0.85rem; }
.bio { color: #94a3b8; margin: 0.5rem 0 0; font-size: 0.9rem; }

.social-links {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.social-btn {
  background: #020420;
  border: 1px solid #1e293b;
  color: #cbd5e1;
  padding: 0.45rem 0.85rem;
  border-radius: 6px;
  text-decoration: none;
  font-size: 0.8rem;
  font-weight: 700;
}

.social-btn:hover {
  border-color: #38bdf8;
  color: #ffffff;
}

.social-btn.reddit:hover {
  border-color: #ff4500;
  color: #ff4500;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.stat-box {
  background: #020420;
  border: 1px solid #1e293b;
  padding: 1rem;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

/* SINTASSI CSS CORRETTA */
.stat-title {
  font-size: 0.7rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: 800;
  color: #ffffff;
}

.stat-value.verified {
  color: #00dc82;
}
</style>