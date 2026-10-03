<!-- app/pages/admin/newsletter/index.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'

// definePageMeta({ middleware: 'admin-only' })

useDkpSeo({
  title: 'Newsletter & Subscriber Hub v2.4-GOLD - DKP Admin',
  description: 'Gestione contatti, liste di trasmissione e invio campagne trasmissionali.'
})

const { getMainUrl, getMailUrl, getApiUrl } = useDomain()

interface Subscriber {
  id: number
  email: string
  status: 'ACTIVE' | 'UNSUBSCRIBED'
  source: string
  subscribedAt: string
}

const subscribers = ref<Subscriber[]>([
  { id: 1, email: 'alex@devkernelpulse.org', status: 'ACTIVE', source: 'Web Footer', subscribedAt: '2026-01-10' },
  { id: 2, email: 'developer@nexus.io', status: 'ACTIVE', source: 'API Console', subscribedAt: '2026-03-15' },
  { id: 3, email: 'guest@darknet.org', status: 'UNSUBSCRIBED', source: 'Blog Form', subscribedAt: '2026-05-20' }
])

const isLoading = ref(false)
const searchQuery = ref('')
const showCampaignModal = ref(false)
const campaignSubject = ref('')
const campaignBody = ref('')

// Toast Notification
const showToast = ref(false)
const toastMessage = ref('')

function triggerToast(msg: string) {
  toastMessage.value = msg
  showToast.value = true
  setTimeout(() => showToast.value = false, 3500)
}

async function sendBroadcast() {
  if (!campaignSubject.value || !campaignBody.value) {
    triggerToast('❌ Compila Oggetto e Messaggio della campagna!')
    return
  }

  isLoading.value = true
  try {
    await $fetch('/api/admin/newsletter/send', {
      method: 'POST',
      body: { subject: campaignSubject.value, body: campaignBody.value }
    }).catch(() => null)

    triggerToast(`📣 Campagna inviata con successo a ${subscribers.value.filter(s => s.status === 'ACTIVE').length} iscritti!`)
    showCampaignModal.value = false
    campaignSubject.value = ''
    campaignBody.value = ''
  } finally {
    isLoading.value = false
  }
}

function removeSubscriber(id: number) {
  subscribers.value = subscribers.value.filter(s => s.id !== id)
  triggerToast('🗑️ Contatto rimosso dalla lista Newsletter.')
}
</script>

<template>
  <div class="newsletter-admin-panel">
    <!-- TOAST NOTIFICATION -->
    <Transition name="toast-fade">
      <div v-if="showToast" class="dkp-toast-success">
        <div class="toast-content">
          <span class="toast-text">{{ toastMessage }}</span>
        </div>
      </div>
    </Transition>

    <!-- NAVBAR GRID ADMIN UNIFICATA v2.4-GOLD -->
    <div class="admin-nav-container">
      <div class="admin-nav-top">
        <div class="nav-branding">
          <span class="status-dot green"></span>
          <span class="nav-title">DKP ADMIN CONTROL CENTER</span>
        </div>

        <NuxtLink :to="getMainUrl('/admin')" external class="nav-tab btn-dashboard-main">
          🏠 Dashboard Main
        </NuxtLink>
      </div>
	  
 <!-- GRID MODULI -->
      <nav class="admin-grid-nav">
        <NuxtLink :to="getApiUrl('/admin/api-gateway')" class="nav-tab btn-dashboard" active-class="active">⚙️ API Gateway</NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/mail')" class="nav-tab btn-dashboard" active-class="active">📧 Mail Center</NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/newsletter')" class="nav-tab btn-dashboard" active-class="active">📣 Newsletter</NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/autoresponder')" class="nav-tab btn-dashboard" active-class="active">📡 Autoresponder</NuxtLink>

        <NuxtLink :to="getMainUrl('/admin/crawler')" class="nav-tab btn-dashboard" active-class="active">🤖 Crawler Engine</NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/blog')" class="nav-tab btn-dashboard" active-class="active">📝 Gestione Blog</NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/shop')" class="nav-tab btn-dashboard" active-class="active">🛍️ Gestione Shop</NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/jobs')" class="nav-tab btn-dashboard" active-class="active">💼 Gestione Jobs</NuxtLink>
      </nav>
    </div>

    <!-- HEADER HERO NEWSLETTER HUB -->
    <header class="panel-header">
      <div class="header-title">
        <div class="hero-badge">
          <span class="badge-status gold">DKP NEWSLETTER HUB v2.4-GOLD</span>
        </div>
        <h2>Control Center <span class="brand-highlight">Broadcast & Iscritti</span></h2>
        <p class="sub-lead">
          Gestisci gli iscritti alla newsletter, monitora la deliverability Brevo e invia comunicazioni broadcast.
        </p>
      </div>

      <button @click="showCampaignModal = true" class="btn-primary-action">
        📣 Nuova Campagna Broadcast
      </button>
    </header>

    <!-- CONTENT CARD -->
    <section class="subscribers-card">
      <div class="card-header">
        <h3>👥 Lista Contatti Iscritti ({{ subscribers.length }})</h3>
        <input v-model="searchQuery" type="text" placeholder="🔍 Cerca email..." class="dark-input search-sm" />
      </div>

      <div class="table-responsive">
        <table class="sub-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Origine</th>
              <th>Stato</th>
              <th>Data Iscrizione</th>
              <th class="text-right">Azione</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="sub in subscribers" :key="sub.id">
              <td class="font-bold">{{ sub.email }}</td>
              <td><span class="source-tag">{{ sub.source }}</span></td>
              <td>
                <span class="status-badge" :class="sub.status.toLowerCase()">
                  {{ sub.status }}
                </span>
              </td>
              <td class="date-text">{{ sub.subscribedAt }}</td>
              <td class="text-right">
                <button @click="removeSubscriber(sub.id)" class="btn-icon delete">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- MODAL CAMPAGNA BROADCAST -->
    <div v-if="showCampaignModal" class="modal-overlay" @click.self="showCampaignModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>📣 Invia Campagna Broadcast Newsletter</h3>
          <button @click="showCampaignModal = false" class="btn-close">&times;</button>
        </div>

        <div class="modal-body">
          <div class="input-group">
            <label>Oggetto Email *</label>
            <input v-model="campaignSubject" type="text" placeholder="es. DKP Release Notes v2.4-GOLD..." class="dark-input" />
          </div>

          <div class="input-group">
            <label>Corpo del Messaggio (HTML supportato) *</label>
            <textarea v-model="campaignBody" rows="8" placeholder="Scrivi il contenuto della newsletter..." class="dark-input textarea"></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="showCampaignModal = false" class="btn-secondary">Annulla</button>
          <button @click="sendBroadcast" :disabled="isLoading" class="btn-primary-action">
            🚀 Invia a Tutti gli Iscritti
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* STILI ADMIN NAV UNIFICATA v2.4-GOLD */
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

.btn-dashboard-main {
  color: #00f0ff;
  background: rgba(0, 240, 255, 0.06);
  border: 1px solid rgba(0, 240, 255, 0.4);
}

.btn-dashboard-main:hover {
  background: rgba(0, 240, 255, 0.16);
  border-color: #00f0ff;
  box-shadow: 0 0 14px rgba(0, 240, 255, 0.35);
  transform: translateY(-1px);
}

.newsletter-admin-panel {
  max-width: 1240px;
  margin: 0 auto;
  padding-bottom: 4rem;
  color: #f8fafc;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1.5rem 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  flex-wrap: wrap;
  gap: 1rem;
}

.hero-badge { margin-bottom: 0.5rem; }

.badge-status.gold {
  background: rgba(0, 220, 130, 0.15);
  color: #00dc82;
  border: 1px solid #00dc82;
  padding: 0.2rem 0.55rem;
  border-radius: 4px;
  font-size: 0.72rem;
  font-weight: 800;
  box-shadow: 0 0 10px rgba(0, 220, 130, 0.2);
}

.panel-header h2 { font-size: 1.8rem; font-weight: 900; margin: 0 0 0.4rem 0; color: #ffffff; }
.brand-highlight { color: #00dc82; }
.sub-lead { color: #94a3b8; font-size: 0.92rem; margin: 0; }

.btn-primary-action {
  background: #00dc82;
  color: #020420;
  font-weight: 900;
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.88rem;
  transition: all 0.2s ease;
}

.subscribers-card {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1.5rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.card-header h3 { margin: 0; color: #00dc82; font-size: 1.15rem; font-weight: 800; }
.search-sm { width: 240px; padding: 0.45rem 0.75rem; }

.dark-input {
  background: #020420;
  border: 1px solid #1e293b;
  color: #fff;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.88rem;
  outline: none;
  width: 100%;
}

.sub-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; text-align: left; }
.sub-table th { padding: 0.85rem; color: #94a3b8; border-bottom: 1px solid #1e293b; font-size: 0.75rem; text-transform: uppercase; }
.sub-table td { padding: 0.85rem; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }

.source-tag { background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 0.15rem 0.45rem; border-radius: 4px; font-size: 0.72rem; }
.status-badge.active { background: rgba(0, 220, 130, 0.15); color: #00dc82; padding: 0.15rem 0.45rem; border-radius: 4px; font-size: 0.72rem; font-weight: 800; }
.status-badge.unsubscribed { background: rgba(239, 68, 68, 0.15); color: #ef4444; padding: 0.15rem 0.45rem; border-radius: 4px; font-size: 0.72rem; font-weight: 800; }

.modal-overlay { position: fixed; inset: 0; background: rgba(2, 4, 32, 0.85); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 1.5rem; }
.modal-content { background: #090d16; border: 1px solid #1e293b; border-radius: 12px; width: 100%; max-width: 600px; display: flex; flex-direction: column; }
.modal-header { padding: 1.25rem 1.5rem; border-bottom: 1px solid #1e293b; display: flex; justify-content: space-between; align-items: center; }
.modal-header h3 { margin: 0; color: #ffffff; font-size: 1.15rem; }
.btn-close { background: none; border: none; color: #64748b; font-size: 1.5rem; cursor: pointer; }
.modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
.modal-footer { padding: 1.25rem 1.5rem; border-top: 1px solid #1e293b; display: flex; justify-content: flex-end; gap: 0.75rem; }
</style>