<!-- app/pages/admin/newsletter/index.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({
  title: 'DKP Newsletter Studio | DevKernelPulse',
})

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

async function fetchSubscribers() {
  isLoading.value = true
  try {
    const res: any = await $fetch('/api/admin/newsletter/subscribers')
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

async function handleAddSubscriber() {
  try {
    const res: any = await $fetch('/api/newsletter/subscribe', {
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

async function handleSendBroadcast() {
  sendSuccessMsg.value = ''
  sendErrorMsg.value = ''
  isSending.value = true

  try {
    const res: any = await $fetch('/api/admin/newsletter/broadcast', {
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
  <!-- TOP BAR DI NAVIGAZIONE ADMIN -->
<div class="admin-top-bar">
  <div class="admin-breadcrumb">
    <span class="status-dot green"></span>
    <span class="breadcrumb-text">ADMIN CONTROL CENTER</span>
  </div>

  <NuxtLink to="/admin" class="btn-back-dashboard">
    📊 Torna alla Dashboard
  </NuxtLink>
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

/* ==========================================================================
   TOP BAR NAVIGAZIONE ADMIN (TORNA ALLA DASHBOARD)
   ========================================================================== */
.admin-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 10px;
  padding: 0.6rem 1rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.admin-breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  background: rgba(56, 189, 248, 0.08);
  border: 1px solid rgba(56, 189, 248, 0.25);
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
}

.breadcrumb-text {
  font-size: 0.75rem;
  font-weight: 800;
  color: #38bdf8;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.status-dot.green {
  background: #00dc82;
  box-shadow: 0 0 8px #00dc82;
}

/* BOTTONE NEON TORNA ALLA DASHBOARD */
.btn-back-dashboard {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: #020420;
  border: 1px solid #1e293b;
  color: #cbd5e1;
  padding: 0.45rem 0.9rem;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.btn-back-dashboard:hover {
  border-color: #00dc82;
  color: #00dc82;
  background: rgba(0, 220, 130, 0.08);
  box-shadow: 0 0 12px rgba(0, 220, 130, 0.2);
  transform: translateY(-1px);
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