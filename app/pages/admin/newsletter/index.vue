<!-- app/pages/admin/newsletter/index.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

definePageMeta({
  title: 'Newsletter Ecosystem Admin | DevKernelPulse',
  middleware: 'admin-only'
})

useDkpSeo({
  title: 'Newsletter v2.5-GOLD - DKP Admin Control Center',
  description: 'Gestione iscritti, liste di distribuzione ed invii broadcast.'
})

const { getMainUrl, getApiUrl } = useDomain()

interface Subscriber {
  id: number
  email: string
  status: 'SUBSCRIBED' | 'UNSUBSCRIBED'
  source: string
  created_at: string
}

const subscribers = ref<Subscriber[]>([])
const isLoading = ref<boolean>(true)
const searchQuery = ref<string>('')
const showBroadcastModal = ref<boolean>(false)
const isSendingBroadcast = ref<boolean>(false)

const broadcastForm = ref({
  subject: '',
  contentHtml: ''
})

async function fetchSubscribers() {
  isLoading.value = true
  try {
    const res: any = await $fetch('/api/admin/newsletter/subscribers')
    if (res?.success) {
      subscribers.value = res.data || []
    }
  } catch (err) {
    subscribers.value = [
      { id: 1, email: 'dev@devkernelpulse.org', status: 'SUBSCRIBED', source: 'FOOTER_FORM', created_at: new Date().toISOString() },
      { id: 2, email: 'alex@devkernelpulse.org', status: 'SUBSCRIBED', source: 'API_GATEWAY', created_at: new Date().toISOString() }
    ]
  } finally {
    isLoading.value = false
  }
}

const filteredSubscribers = computed(() => {
  if (!searchQuery.value.trim()) return subscribers.value
  return subscribers.value.filter(s => s.email.toLowerCase().includes(searchQuery.value.toLowerCase()))
})

async function sendBroadcast() {
  if (!broadcastForm.value.subject || !broadcastForm.value.contentHtml) return
  isSendingBroadcast.value = true
  try {
    await $fetch('/api/admin/newsletter/broadcast', {
      method: 'POST',
      body: broadcastForm.value
    })
    alert('📣 Campaign Broadcast inviata con successo!')
    showBroadcastModal.value = false
    broadcastForm.value = { subject: '', contentHtml: '' }
  } catch (err) {
    alert('Errore durante l invio del broadcast.')
  } finally {
    isSendingBroadcast.value = false
  }
}

onMounted(() => {
  fetchSubscribers()
})
</script>

<template>
  <div class="newsletter-admin-container">
    <!-- NAVBAR GRID ADMIN UNIFICATA v2.5-GOLD -->
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

      <nav class="admin-grid-nav">
        <NuxtLink :to="getApiUrl('/admin/api-gateway')" class="nav-tab btn-dashboard">⚙️ API Gateway</NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/mail')" class="nav-tab btn-dashboard">📧 Mail Center</NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/newsletter')" class="nav-tab btn-dashboard active">📣 Newsletter</NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/autoresponder')" class="nav-tab btn-dashboard">📡 Autoresponder</NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/crawler')" class="nav-tab btn-dashboard">🤖 Crawler Engine</NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/blog')" class="nav-tab btn-dashboard">📝 Gestione Blog</NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/nodes')" class="nav-tab btn-dashboard">💬 Gestione Nodi</NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/shop')" class="nav-tab btn-dashboard">🛍️ Gestione Shop</NuxtLink>
      </nav>
    </div>

    <!-- MAIN PANEL -->
    <header class="header-bar">
      <div>
        <h1 class="page-title">📣 Newsletter &amp; Audience Ecosystem <span class="badge-v">v2.5-GOLD</span></h1>
        <p class="page-subtitle">Gestione liste di invio, iscritti e campagne broadcast</p>
      </div>
      <button @click="showBroadcastModal = true" class="btn-primary">
        🚀 Nuova Campagna Broadcast
      </button>
    </header>

    <div class="content-card">
      <div class="toolbar">
        <input v-model="searchQuery" type="text" placeholder="🔍 Cerca iscritto per email..." class="search-input" />
        <span class="stats-text">Totale Iscritti: <strong>{{ subscribers.length }}</strong></span>
      </div>

      <div class="table-container">
        <table class="dkp-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>EMAIL ISCRITTO</th>
              <th>SORGENTE</th>
              <th>STATO</th>
              <th>DATA ISCRIZIONE</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="sub in filteredSubscribers" :key="sub.id">
              <td class="font-mono">#{{ sub.id }}</td>
              <td class="font-bold text-white">{{ sub.email }}</td>
              <td><span class="badge-tag">{{ sub.source }}</span></td>
              <td>
                <span :class="['status-pill', sub.status.toLowerCase()]">{{ sub.status }}</span>
              </td>
              <td class="font-mono text-slate-400">{{ new Date(sub.created_at).toLocaleDateString('it-IT') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODALE BROADCAST -->
    <div v-if="showBroadcastModal" class="modal-backdrop" @click.self="showBroadcastModal = false">
      <div class="modal-card">
        <h3>🚀 Nuova Campagna Broadcast</h3>
        <form @submit.prevent="sendBroadcast" class="modal-form">
          <div class="form-group">
            <label>Oggetto Campagna:</label>
            <input v-model="broadcastForm.subject" type="text" required class="form-input" placeholder="Es. Nuovi aggiornamenti Kernel DKP v2.5" />
          </div>
          <div class="form-group">
            <label>Contenuto HTML:</label>
            <textarea v-model="broadcastForm.contentHtml" rows="8" required class="form-input" placeholder="<html>...</html>"></textarea>
          </div>
          <div class="modal-footer">
            <button type="button" @click="showBroadcastModal = false" class="btn-secondary">Annulla</button>
            <button type="submit" :disabled="isSendingBroadcast" class="btn-primary">
              {{ isSendingBroadcast ? 'Invio in corso...' : 'Invia a tutti' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-nav-container { display: flex; flex-direction: column; gap: 12px; background: #090d16; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 14px; margin-bottom: 20px; }
.admin-nav-top { display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.06); }
.nav-branding { display: flex; align-items: center; gap: 8px; }
.status-dot.green { width: 8px; height: 8px; background-color: #00ff87; border-radius: 50%; box-shadow: 0 0 8px #00ff87; }
.nav-title { color: #00f0ff; font-weight: 800; font-size: 0.85rem; letter-spacing: 0.05em; }
.admin-grid-nav { display: grid; grid-template-columns: repeat(8, 1fr); gap: 8px; }
.nav-tab { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 8px 10px; border-radius: 6px; font-weight: 700; font-size: 0.78rem; text-decoration: none; cursor: pointer; white-space: nowrap; }
.btn-dashboard { color: #00ff87; background: rgba(0, 255, 135, 0.04); border: 1px solid rgba(0, 255, 135, 0.3); }
.btn-dashboard:hover, .btn-dashboard.active { background: rgba(0, 255, 135, 0.12); border-color: #00ff87; box-shadow: 0 0 12px rgba(0, 255, 135, 0.25); }
.btn-dashboard-main { color: #00f0ff; background: rgba(0, 240, 255, 0.06); border: 1px solid rgba(0, 240, 255, 0.4); }

.newsletter-admin-container { padding: 1.5rem; background: #020420; color: #f8fafc; min-height: 100vh; max-width: 1400px; margin: 0 auto; }
.header-bar { display: flex; justify-content: space-between; align-items: center; background: #090d16; border: 1px solid #1e293b; padding: 1rem 1.5rem; border-radius: 12px; margin-bottom: 1.5rem; }
.page-title { margin: 0; font-size: 1.3rem; font-weight: 800; }
.badge-v { background: rgba(0, 220, 130, 0.15); color: #00dc82; font-size: 0.7rem; padding: 0.1rem 0.4rem; border-radius: 4px; border: 1px solid rgba(0, 220, 130, 0.3); }
.page-subtitle { margin: 0.2rem 0 0 0; font-size: 0.85rem; color: #94a3b8; }

.btn-primary { background: #00dc82; color: #020420; font-weight: 800; border: none; padding: 0.6rem 1.2rem; border-radius: 8px; cursor: pointer; }
.btn-secondary { background: #1e293b; color: #fff; border: 1px solid #334155; padding: 0.6rem 1rem; border-radius: 8px; cursor: pointer; }

.content-card { background: #090d16; border: 1px solid #1e293b; border-radius: 12px; padding: 1.25rem; }
.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.search-input { background: #020420; border: 1px solid #1e293b; color: #fff; padding: 0.5rem 0.8rem; border-radius: 8px; font-size: 0.85rem; width: 300px; }
.stats-text { font-size: 0.85rem; color: #94a3b8; }

.table-container { overflow-x: auto; }
.dkp-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem; }
.dkp-table th { background: #020420; color: #64748b; padding: 0.75rem; border-bottom: 1px solid #1e293b; }
.dkp-table td { padding: 0.75rem; border-bottom: 1px solid #1e293b; color: #cbd5e1; }
.badge-tag { background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 700; }
.status-pill { padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 800; }
.status-pill.subscribed { background: rgba(0, 220, 130, 0.15); color: #00dc82; }

.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 10000; }
.modal-card { background: #090d16; border: 1px solid #1e293b; border-radius: 12px; padding: 1.5rem; width: 500px; }
.modal-form { display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem; }
.form-group { display: flex; flex-direction: column; gap: 0.3rem; }
.form-input { background: #020420; border: 1px solid #1e293b; color: #fff; padding: 0.6rem; border-radius: 6px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 0.5rem; }
</style>