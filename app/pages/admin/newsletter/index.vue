<!-- app/pages/admin/newsletter/index.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({
  title: 'DKP Newsletter Studio | DevKernelPulse',
})

// 1. Inizializziamo il runtimeConfig dinamico (localhost vs GCP)
const config = useRuntimeConfig()
const { getMainUrl, getMailUrl, getApiUrl } = useDomain()

interface Subscriber {
  id: number
  email: string
  name?: string
  status: 'ACTIVE' | 'UNSUBSCRIBED'
  source: string
  created_at: string
}

const subscribers = ref<Subscriber[]>([])
const stats = ref({ total: 0, active: 0, unsubscribed: 0 })
const isLoading = ref(true)

// Broadcast Modal State
const showCampaignModal = ref(false)
const isSending = ref(false)
const sendSuccessMsg = ref('')
const sendErrorMsg = ref('')

const campaignData = ref({
  sender: 'newsletter@devkernelpulse.org',
  subject: '',
  html: ''
})

// Manual Add State
const showAddModal = ref(false)
const newSub = ref({ email: '', name: '', source: 'ADMIN_MANUAL' })

// Fetch Subscribers from Mail Service
async function fetchSubscribers() {
  isLoading.value = true
  try {
    const res: any = await $fetch(`${config.public.mailUrl}/api/admin/newsletter/subscribers`)
    if (res && res.success) {
      subscribers.value = res.subscribers || []
      stats.value = res.stats || { total: 0, active: 0, unsubscribed: 0 }
    }
  } catch (err) {
    console.error('[FETCH SUBSCRIBERS ERROR]', err)
  } finally {
    isLoading.value = false
  }
}

// Add Subscriber via Mail Service
async function handleAddSubscriber() {
  try {
    const res: any = await $fetch(`${config.public.mailUrl}/api/newsletter/subscribe`, {
      method: 'POST',
      body: newSub.value
    })
    if (res && res.success) {
      showAddModal.value = false
      newSub.value = { email: '', name: '', source: 'ADMIN_MANUAL' }
      fetchSubscribers()
    }
  } catch (err) {
    console.error('[ADD SUBSCRIBER ERROR]', err)
  }
}

// Send Broadcast via Mail Service
async function handleSendBroadcast() {
  sendSuccessMsg.value = ''
  sendErrorMsg.value = ''
  isSending.value = true

  try {
    const res: any = await $fetch(`${config.public.mailUrl}/api/admin/newsletter/broadcast`, {
      method: 'POST',
      body: campaignData.value
    })

    if (res && res.success) {
      sendSuccessMsg.value = `🚀 Campagna inviata! Completati: ${res.sentCount}/${res.totalTarget}`
      setTimeout(() => {
        showCampaignModal.value = false
        sendSuccessMsg.value = ''
        campaignData.value = { sender: 'newsletter@devkernelpulse.org', subject: '', html: '' }
      }, 2000)
    } else {
      sendErrorMsg.value = res.error || 'Errore durante l\'invio massivo.'
    }
  } catch (err: any) {
    sendErrorMsg.value = err.message || 'Errore di connessione al server mail.'
  } finally {
    isSending.value = false
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })
}

onMounted(() => {
  fetchSubscribers()
})
</script>

<template>
  <div class="newsletter-admin-container">
 
 <!-- TOP BAR SUPERIORE: BRANDING & DASHBOARD IN ALTO A DESTRA -->
  <div class="admin-nav-top">
    <div class="nav-branding">
      <span class="status-dot green"></span>
      <span class="nav-title">DKP ADMIN CONTROL CENTER</span>
    </div>

    <NuxtLink :to="getMainUrl('/admin')" external class="nav-tab btn-dashboard-main" exact-active-class="active">
      🏠 Dashboard Main
    </NuxtLink>
  </div>

  <!-- GRID MODULI: 2 RIGHE DA 4 LINK (8 MODULI TOTALI) -->
  <nav class="admin-grid-nav">
    <!-- RIGA 1 (4 LINK) -->
    <NuxtLink :to="getApiUrl('/admin/api-gateway')" external class="nav-tab btn-dashboard" active-class="active">
      ⚙️ API Gateway
    </NuxtLink>
    <NuxtLink :to="getMailUrl('/admin/mail')" external class="nav-tab btn-dashboard" active-class="active">
      📧 Mail Center
    </NuxtLink>
    <NuxtLink :to="getMailUrl('/admin/newsletter')" external class="nav-tab btn-dashboard" active-class="active">
      📣 Newsletter
    </NuxtLink>
    <NuxtLink :to="getMailUrl('/admin/autoresponder')" external class="nav-tab btn-dashboard" active-class="active">
      📡 Autoresponder
    </NuxtLink>

    <!-- RIGA 2 (4 LINK CORRETTI CON getMainUrl) -->
    <NuxtLink :to="getMainUrl('/admin/crawler')" external class="nav-tab btn-dashboard" active-class="active">
      🤖 Crawler Engine
    </NuxtLink>
    <NuxtLink :to="getMainUrl('/admin/blog')" external class="nav-tab btn-dashboard" active-class="active">
      📝 Gestione Blog
    </NuxtLink>
    <NuxtLink :to="getMainUrl('/admin/shop')" external class="nav-tab btn-dashboard" active-class="active">
      🛍️ Gestione Shop
    </NuxtLink>
    <NuxtLink :to="getMainUrl('/admin/jobs')" external class="nav-tab btn-dashboard" active-class="active">
      💼 Gestione Jobs
    </NuxtLink>
  </nav>
</div>

    <!-- HEADER TOOLBAR -->
    <header class="header-bar">
      <div>
        <h1 class="page-title">📡 DKP Newsletter & Contact Studio <span class="badge-v">v2.4</span></h1>
        <p class="page-subtitle">Gestione liste contatti, iscritti e invio campagne massive</p>
      </div>

      <div class="header-actions">
        <button @click="showAddModal = true" class="btn-secondary">
          ➕ Aggiungi Contatto
        </button>
        <button @click="showCampaignModal = true" class="btn-primary">
          🚀 Nuova Campagna Massiva
        </button>
      </div>
    </header>

    <!-- STATS CARDS -->
    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-num text-neon">{{ stats.active }}</span>
        <span class="stat-label">Iscritti Attivi</span>
      </div>
      <div class="stat-card">
        <span class="stat-num">{{ stats.total }}</span>
        <span class="stat-label">Totali Registrati</span>
      </div>
      <div class="stat-card">
        <span class="stat-num text-danger">{{ stats.unsubscribed }}</span>
        <span class="stat-label">Disiscritti</span>
      </div>
    </div>

    <!-- TABLE SUBSCRIBERS -->
    <div class="table-card">
      <div class="table-header">
        <h3>👥 Lista Contatti Iscritti</h3>
        <button @click="fetchSubscribers" class="btn-icon" title="Ricarica Lista">🔄</button>
      </div>

      <div v-if="isLoading" class="loading-state">⚡ Caricamento lista iscritti dal DB...</div>
      <div v-else-if="subscribers.length === 0" class="empty-state">📭 Nessun iscritto presente nel database.</div>

      <table v-else class="custom-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Nome</th>
            <th>Sorgente</th>
            <th>Stato</th>
            <th>Data Iscrizione</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="sub in subscribers" :key="sub.id">
            <td class="font-bold">{{ sub.email }}</td>
            <td>{{ sub.name || '-' }}</td>
            <td><span class="source-tag">{{ sub.source }}</span></td>
            <td>
              <span class="status-badge" :class="sub.status.toLowerCase()">
                {{ sub.status }}
              </span>
            </td>
            <td>{{ formatDate(sub.created_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- MODAL BROADCAST -->
    <Transition name="modal-fade">
      <div v-if="showCampaignModal" class="modal-backdrop" @click.self="showCampaignModal = false">
        <div class="modal-card">
          <div class="modal-header">
            <h3>🚀 Nuova Campagna Broadcast Newsletter</h3>
            <button @click="showCampaignModal = false" class="btn-close">✕</button>
          </div>

          <form @submit.prevent="handleSendBroadcast" class="modal-form">
            <div class="form-group">
              <label>Mittente Campagna:</label>
              <select v-model="campaignData.sender" class="form-input">
                <option value="newsletter@devkernelpulse.org">newsletter@devkernelpulse.org</option>
                <option value="info@devkernelpulse.org">info@devkernelpulse.org</option>
                <option value="alex@devkernelpulse.org">alex@devkernelpulse.org</option>
              </select>
            </div>

            <div class="form-group">
              <label>Oggetto della Newsletter:</label>
              <input v-model="campaignData.subject" type="text" required placeholder="es. ⚡ DKP Weekly #12: Nuove Feature e News AI" class="form-input" />
            </div>

            <div class="form-group">
              <label>Contenuto HTML Newsletter:</label>
              <textarea v-model="campaignData.html" rows="10" required placeholder="Inserisci il codice HTML o il testo della newsletter..." class="form-input textarea"></textarea>
            </div>

            <div v-if="sendSuccessMsg" class="alert success">{{ sendSuccessMsg }}</div>
            <div v-if="sendErrorMsg" class="alert error">{{ sendErrorMsg }}</div>

            <div class="modal-footer">
              <button type="button" @click="showCampaignModal = false" class="btn-secondary">Annulla</button>
              <button type="submit" :disabled="isSending" class="btn-primary">
                {{ isSending ? '⚡ Invio Massivo in corso...' : `📡 Spedisci a ${stats.active} Iscritti` }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <!-- MODAL ADD CONTACT -->
    <Transition name="modal-fade">
      <div v-if="showAddModal" class="modal-backdrop" @click.self="showAddModal = false">
        <div class="modal-card modal-sm">
          <div class="modal-header">
            <h3>➕ Aggiungi Contatto Manualmente</h3>
            <button @click="showAddModal = false" class="btn-close">✕</button>
          </div>

          <form @submit.prevent="handleAddSubscriber" class="modal-form">
            <div class="form-group">
              <label>Email Contatto:</label>
              <input v-model="newSub.email" type="email" required placeholder="utente@dominio.com" class="form-input" />
            </div>

            <div class="form-group">
              <label>Nome (Opzionale):</label>
              <input v-model="newSub.name" type="text" placeholder="Mario Rossi" class="form-input" />
            </div>

            <div class="modal-footer">
              <button type="button" @click="showAddModal = false" class="btn-secondary">Annulla</button>
              <button type="submit" class="btn-primary">Salva Contatto</button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>

/* -------------------------------------------------------------
   🎨 STILI DKP ADMIN NAVBAR v2.4-GOLD
------------------------------------------------------------- */
.admin-nav-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #090d16;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 20px;
}

.admin-nav-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.nav-branding {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot.green {
  width: 8px;
  height: 8px;
  background-color: #00ff87;
  border-radius: 50%;
  box-shadow: 0 0 8px #00ff87;
}

.nav-title {
  color: #00f0ff;
  font-weight: 800;
  font-size: 0.85rem;
  letter-spacing: 0.05em;
  text-shadow: 0 0 10px rgba(0, 240, 255, 0.3);
}

/* GRID MODULI (2 RIGHE X 4 LINK) */
.admin-grid-nav {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.nav-tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.88rem;
  text-decoration: none;
  transition: all 0.2s ease-in-out;
  cursor: pointer;
}

/* 🟢 MODULI STANDARD (VERDE NEON) */
.btn-dashboard {
  color: #00ff87;
  background: rgba(0, 255, 135, 0.04);
  border: 1px solid rgba(0, 255, 135, 0.3);
}

.btn-dashboard:hover,
.btn-dashboard.active {
  background: rgba(0, 255, 135, 0.12);
  border-color: #00ff87;
  box-shadow: 0 0 12px rgba(0, 255, 135, 0.25);
  transform: translateY(-1px);
}

/* 🌐 TASTO MAIN DASHBOARD (CIANO ELECTRIC) */
.btn-dashboard-main {
  color: #00f0ff;
  background: rgba(0, 240, 255, 0.06);
  border: 1px solid rgba(0, 240, 255, 0.4);
}

.btn-dashboard-main:hover,
.btn-dashboard-main.active {
  background: rgba(0, 240, 255, 0.16);
  border-color: #00f0ff;
  box-shadow: 0 0 14px rgba(0, 240, 255, 0.35);
  transform: translateY(-1px);
}

/* ADATTAMENTO PER SCHERMI PICCOLI / TABLET */
@media (max-width: 1024px) {
  .admin-grid-nav {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 580px) {
  .admin-grid-nav {
    grid-template-columns: 1fr;
  }
}

/* ==========================================================================
   FINESTRELLA TOAST NOTIFICATION (FINESTRELLA VERDE)
   ========================================================================== */
.dkp-toast-success {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 999999;
  background: #061811;
  border: 1px solid #00dc82;
  box-shadow: 0 10px 30px rgba(0, 220, 130, 0.35), 0 0 15px rgba(0, 220, 130, 0.2);
  padding: 0.9rem 1.3rem;
  border-radius: 10px;
  backdrop-filter: blur(16px);
  max-width: 420px;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  color: #f8fafc;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.85rem;
  font-weight: 600;
  line-height: 1.4;
}

.toast-icon {
  font-size: 1.15rem;
}

.toast-fade-enter-active, .toast-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-fade-enter-from, .toast-fade-leave-to {
  opacity: 0;
  transform: translateY(-15px) scale(0.95);
}


.newsletter-admin-container {
  padding: 1.5rem;
  background-color: #020420;
  color: #f8fafc;
  min-height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
}

.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #090d16;
  border: 1px solid #1e293b;
  padding: 1.2rem 1.5rem;
  border-radius: 12px;
}

.page-title { margin: 0; font-size: 1.4rem; font-weight: 800; display: flex; align-items: center; gap: 0.5rem; }
.page-subtitle { margin: 0.2rem 0 0 0; font-size: 0.85rem; color: #94a3b8; }
.badge-v { background: rgba(0, 220, 130, 0.15); color: #00dc82; font-size: 0.75rem; padding: 0.15rem 0.5rem; border-radius: 6px; border: 1px solid rgba(0, 220, 130, 0.3); }

.header-actions { display: flex; gap: 0.85rem; }

.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
.stat-card { background: #090d16; border: 1px solid #1e293b; padding: 1.2rem; border-radius: 12px; display: flex; flex-direction: column; align-items: center; gap: 0.3rem; }
.stat-num { font-size: 1.8rem; font-weight: 900; }
.text-neon { color: #00dc82; }
.text-danger { color: #f87171; }
.stat-label { font-size: 0.78rem; color: #94a3b8; font-weight: 600; }

.table-card { background: #090d16; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; }
.table-header { padding: 1rem 1.25rem; border-bottom: 1px solid #1e293b; display: flex; justify-content: space-between; align-items: center; }
.table-header h3 { margin: 0; font-size: 1rem; }

.custom-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.88rem; }
.custom-table th { background: #020420; padding: 0.85rem 1.25rem; color: #64748b; font-weight: 700; border-bottom: 1px solid #1e293b; }
.custom-table td { padding: 0.85rem 1.25rem; border-bottom: 1px solid #1e293b; color: #cbd5e1; }
.font-bold { font-weight: 700; color: #fff; }

.source-tag { background: #1e293b; color: #94a3b8; font-size: 0.72rem; padding: 0.15rem 0.45rem; border-radius: 4px; }
.status-badge { font-size: 0.72rem; font-weight: 800; padding: 0.2rem 0.5rem; border-radius: 6px; text-transform: uppercase; }
.status-badge.active { background: rgba(0, 220, 130, 0.15); color: #00dc82; }
.status-badge.unsubscribed { background: rgba(239, 68, 68, 0.15); color: #f87171; }

.btn-primary { background: #00dc82; color: #020420; font-weight: 800; border: none; padding: 0.65rem 1.2rem; border-radius: 8px; cursor: pointer; }
.btn-secondary { background: #1e293b; color: #f8fafc; font-weight: 600; border: 1px solid #334155; padding: 0.65rem 1rem; border-radius: 8px; cursor: pointer; }
.btn-icon { background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 1.1rem; }

/* MODAL */
.modal-backdrop { position: fixed; inset: 0; background: rgba(2, 4, 32, 0.85); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 10000; }
.modal-card { background: #090d16; border: 1px solid #1e293b; border-radius: 14px; width: 600px; max-width: 90vw; }
.modal-sm { width: 420px; }
.modal-header { padding: 1rem 1.25rem; background: #020420; border-bottom: 1px solid #1e293b; display: flex; justify-content: space-between; align-items: center; }
.modal-header h3 { margin: 0; font-size: 1rem; }
.btn-close { background: none; border: none; color: #94a3b8; cursor: pointer; }

.modal-form { padding: 1.25rem; display: flex; flex-direction: column; gap: 0.85rem; }
.form-group { display: flex; flex-direction: column; gap: 0.3rem; }
.form-group label { font-size: 0.78rem; font-weight: 700; color: #94a3b8; }
.form-input { background: #020420; border: 1px solid #1e293b; color: #fff; padding: 0.6rem 0.85rem; border-radius: 8px; font-size: 0.85rem; outline: none; }
.form-input:focus { border-color: #00dc82; }
.textarea { resize: vertical; font-family: inherit; }

.modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.5rem; }
.loading-state, .empty-state { padding: 2rem; text-align: center; color: #64748b; }
.alert { padding: 0.6rem 0.85rem; border-radius: 8px; font-size: 0.8rem; }
.alert.success { background: rgba(0, 220, 130, 0.15); color: #00dc82; }
.alert.error { background: rgba(239, 68, 68, 0.15); color: #f87171; }
</style>