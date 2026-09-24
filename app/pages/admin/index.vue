<!-- app/pages/admin/index.vue -->
<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})

const { currentUser, isAdmin, fetchSession } = useAuthCore()

onMounted(async () => {
  await fetchSession()
})

const stats = ref({
  totalNews: 142,
  totalJobs: 18,
  activeUsers: 89,
  kernelStatus: 'ONLINE (GCP)'
})
</script>

<template>
  <div class="admin-dashboard">
    <!-- Se non è ancora riconosciuto come admin -->
    <div v-if="!isAdmin" class="unauthorized-box">
      <h2>🔒 Accesso Riservato agli Amministratori DKP</h2>
      <p>Devi effettuare il login con un account amministratore per accedere al Kernel Control Panel.</p>
      <NuxtLink to="/login" class="login-btn">Accedi con il tuo Account Admin</NuxtLink>
    </div>

    <!-- Dashboard Admin completa quando loggato -->
    <div v-else class="dashboard-content">
      <div class="dashboard-header">
        <h1>⚙️ DKP Admin Control Panel</h1>
        <p class="subtitle">Benvenuto @{{ currentUser?.username || 'alexdpl' }}. Gestione globale dell'ecosistema DevKernelPulse.</p>
      </div>

      <!-- Griglia Metriche Admin -->
      <div class="metrics-grid">
        <div class="metric-card">
          <span class="metric-label">Notizie Pubblicate</span>
          <span class="metric-value green">{{ stats.totalNews }}</span>
        </div>
        <div class="metric-card">
          <span class="metric-label">Offerte Job Attive</span>
          <span class="metric-value blue">{{ stats.totalJobs }}</span>
        </div>
        <div class="metric-card">
          <span class="metric-label">Utenti Registrati</span>
          <span class="metric-value yellow">{{ stats.activeUsers }}</span>
        </div>
        <div class="metric-card">
          <span class="metric-label">Stato Kernel</span>
          <span class="metric-value green-badge">{{ stats.kernelStatus }}</span>
        </div>
      </div>

      <!-- Sezioni di Gestione Rapida -->
      <div class="admin-sections-grid">
        <NuxtLink to="/admin/settings" class="section-card">
          <h3>⚙️ Kernel & Plugin Settings</h3>
          <p>Configura lo Shop, le Feature Flags e i moduli dei DKP Tools.</p>
          <span class="card-arrow">Gestisci ↗</span>
        </NuxtLink>

        <NuxtLink to="/admin/jobs" class="section-card">
          <h3>💼 Gestione Job Board</h3>
          <p>Aggiungi, modifica o approva le offerte di lavoro della community.</p>
          <span class="card-arrow">Gestisci ↗</span>
        </NuxtLink>

        <NuxtLink to="/admin/health" class="section-card">
          <h3>⚡ System Health Check</h3>
          <p>Monitora lo stato di Neon PostgreSQL, PM2 e delle API GCP.</p>
          <span class="card-arrow">Ispeziona ↗</span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  font-family: ui-sans-serif, system-ui, sans-serif;
}

.unauthorized-box {
  background: #020420;
  border: 1px solid #ef4444;
  border-radius: 12px;
  padding: 3rem 2rem;
  text-align: center;
  margin: 3rem auto;
  max-width: 600px;
}

.unauthorized-box h2 { color: #ef4444; font-size: 1.4rem; margin-bottom: 1rem; }
.unauthorized-box p { color: #94a3b8; margin-bottom: 2rem; font-size: 0.95rem; }

.login-btn {
  background: #00dc82;
  color: #020420;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 800;
  font-size: 0.95rem;
}

.dashboard-header { margin-bottom: 2rem; }
.dashboard-header h1 { font-size: 2rem; color: #00dc82; font-weight: 800; }
.subtitle { color: #94a3b8; font-size: 0.95rem; margin-top: 0.4rem; }

.metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; margin-bottom: 2.5rem; }
.metric-card { background: #020420; border: 1px solid #1e293b; padding: 1.5rem; border-radius: 10px; text-align: center; }
.metric-label { display: block; font-size: 0.75rem; color: #64748b; text-transform: uppercase; font-weight: 700; margin-bottom: 0.5rem; }
.metric-value { font-size: 1.8rem; font-weight: 800; }
.metric-value.green { color: #00dc82; }
.metric-value.blue { color: #38bdf8; }
.metric-value.yellow { color: #f59e0b; }
.metric-value.green-badge { font-size: 1rem; color: #00dc82; background: rgba(0, 220, 130, 0.1); padding: 0.3rem 0.6rem; border-radius: 6px; border: 1px solid rgba(0, 220, 130, 0.3); }

.admin-sections-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; }
.section-card { background: #020420; border: 1px solid #1e293b; padding: 1.75rem; border-radius: 12px; text-decoration: none; color: #ffffff; transition: all 0.2s; display: flex; flex-direction: column; }
.section-card:hover { border-color: #00dc82; transform: translateY(-3px); }
.section-card h3 { font-size: 1.1rem; color: #00dc82; margin-bottom: 0.5rem; }
.section-card p { font-size: 0.85rem; color: #94a3b8; line-height: 1.5; flex: 1; }
.card-arrow { margin-top: 1rem; color: #38bdf8; font-size: 0.85rem; font-weight: 700; }
</style>