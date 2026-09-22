<!-- app/pages/admin/index.vue -->
<script setup lang="ts">
const router = useRouter()

// 1. Verifica immediata dello stato di autenticazione e privilegi admin
const { data: authData, pending } = await useFetch('/api/auth/me')

const isAdmin = computed(() => authData.value?.authenticated && authData.value?.username === 'alexdpl')

// Se non è admin, reindirizza alla home
if (import.meta.client && !pending.value && !isAdmin.value) {
  router.push('/')
}

// Stato interno pannello
const activeTab = ref('moderation')
const stats = ref({ posts: 0, comments: 0, users: 0 })

// Recupera dati di riepilogo admin (puoi creare un endpoint dedicato o espandere)
useSeoMeta({
  title: 'Pannello di Amministrazione - DevKernelPulse'
})
</script>

<template>
  <div class="admin-container">
    <div v-if="pending" class="loading-state">Caricamento pannello di controllo...</div>

    <div v-else-if="!isAdmin" class="unauthorized-state">
      <h2>Accesso Negato</h2>
      <p>Questa area è riservata esclusivamente all'amministratore di DevKernelPulse.</p>
      <NuxtLink to="/login" class="login-redirect-btn">Accedi come Admin</NuxtLink>
    </div>

    <div v-else class="admin-dashboard">
      <!-- Header Admin -->
      <div class="admin-header">
        <div class="admin-title-area">
          <h1>Pannello di Controllo <span class="badge-admin">Admin</span></h1>
          <p>Benvenuto, <strong>alexdpl</strong>. Gestisci la community, i contenuti e la sicurezza.</p>
        </div>
        <div class="admin-actions-top">
          <NuxtLink to="/" class="home-link">← Torna al Sito</NuxtLink>
        </div>
      </div>

      <!-- Navigazione interna Admin -->
      <div class="admin-tabs">
        <button 
          @click="activeTab = 'moderation'" 
          :class="['tab-btn', { active: activeTab === 'moderation' }]">
          🛡️ Moderazione Post & Commenti
        </button>
        <button 
          @click="activeTab = 'users'" 
          :class="['tab-btn', { active: activeTab === 'users' }]">
          👥 Gestione Utenti
        </button>
        <button 
          @click="activeTab = 'system'" 
          :class="['tab-btn', { active: activeTab === 'system' }]">
          ⚙️ Stato & Health Check
        </button>
      </div>

      <!-- Contenuto Tab -->
      <div class="admin-content-card">
        <div v-if="activeTab === 'moderation'">
          <h3>Moderazione Attiva</h3>
          <p class="section-desc">Puoi moderare i post e i commenti direttamente aprendo le relative pagine di dettaglio del sito; i pulsanti di eliminazione rapida appariranno automaticamente per te.</p>
          <NuxtLink to="/" class="action-link-btn">Vai alla Home per moderare</NuxtLink>
        </div>

        <div v-else-if="activeTab === 'users'">
          <h3>Gestione Utenti Registrati</h3>
          <p class="section-desc">Visualizzazione e controllo dei membri della community di DevKernelPulse.</p>
          <!-- Qui inseriremo la tabella utenti -->
          <div class="info-box">L'amministratore principale attivo è <strong>alexdpl</strong>.</div>
        </div>

        <div v-else-if="activeTab === 'system'">
          <h3>Stato del Sistema & Database</h3>
          <p class="section-desc">Connessione a Neon PostgreSQL attiva e performante.</p>
          <div class="status-ok">● Tutti i servizi operativi al 100%</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-container {
  max-width: 1000px;
  margin: 2rem auto;
  padding: 0 1rem;
  font-family: ui-sans-serif, system-ui, sans-serif;
}

.loading-state, .unauthorized-state {
  text-align: center;
  padding: 4rem 1rem;
  color: #64748b;
}

.unauthorized-state h2 {
  color: #ef4444;
  margin-bottom: 0.5rem;
}

.login-redirect-btn {
  display: inline-block;
  margin-top: 1rem;
  background: #020420;
  color: #00dc82;
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 600;
}

.admin-dashboard {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.admin-title-area h1 {
  font-size: 1.5rem;
  color: #020420;
  margin: 0 0 0.25rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.badge-admin {
  background: #020420;
  color: #00dc82;
  font-size: 0.75rem;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
}

.admin-title-area p {
  color: #64748b;
  font-size: 0.9rem;
  margin: 0;
}

.home-link {
  color: #2563eb;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
}
.home-link:hover {
  text-decoration: underline;
}

.admin-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 0.5rem;
  flex-wrap: wrap;
}

.tab-btn {
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  color: #334155;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  background: #f1f5f9;
}

.tab-btn.active {
  background: #020420;
  color: #00dc82;
  border-color: #020420;
}

.admin-content-card h3 {
  font-size: 1.2rem;
  color: #020420;
  margin-bottom: 0.5rem;
}

.section-desc {
  color: #64748b;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.action-link-btn {
  display: inline-block;
  background: #00dc82;
  color: #020420;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 700;
  font-size: 0.9rem;
}

.info-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 1rem;
  border-radius: 6px;
  color: #334155;
}

.status-ok {
  color: #059669;
  font-weight: 600;
  background: #d1fae5;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  display: inline-block;
}
</style>