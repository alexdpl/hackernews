<!-- app/pages/admin/autoresponder/index.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({
  title: 'Autoresponder Engine Admin | DevKernelPulse',
  middleware: 'admin-only'
})

useDkpSeo({
  title: 'Autoresponder v2.5-GOLD - DKP Admin Control Center',
  description: 'Gestione euristiche di risposta automatica e trigger SMTP.'
})

const { getMainUrl, getApiUrl } = useDomain()

interface AutoRule {
  id: number
  triggerKeyword: string
  subjectMatch: string
  responseTemplate: string
  isActive: boolean
}

const rules = ref<AutoRule[]>([])
const isLoading = ref<boolean>(true)

async function fetchRules() {
  isLoading.value = true
  try {
    const res: any = await $fetch('/api/admin/autoresponder/rules')
    if (res?.success) rules.value = res.data || []
  } catch (err) {
    rules.value = [
      { id: 1, triggerKeyword: 'API_KEY_HELP', subjectMatch: 'Supporto Licenze', responseTemplate: 'Grazie per aver contattato DKP. La tua richiesta di supporto è in fase di elaborazione...', isActive: true },
      { id: 2, triggerKeyword: 'PARTNERSHIP', subjectMatch: 'Sponsor / Adv', responseTemplate: 'Ricevuto. Il nostro team valutazioni ti risponderà entro 24 ore.', isActive: true }
    ]
  } finally {
    isLoading.value = false
  }
}

async function toggleRule(rule: AutoRule) {
  rule.isActive = !rule.isActive
}

onMounted(() => {
  fetchRules()
})
</script>

<template>
  <div class="autoresponder-admin-container">
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
        <NuxtLink :to="getMainUrl('/admin/newsletter')" class="nav-tab btn-dashboard">📣 Newsletter</NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/autoresponder')" class="nav-tab btn-dashboard active">📡 Autoresponder</NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/crawler')" class="nav-tab btn-dashboard">🤖 Crawler Engine</NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/blog')" class="nav-tab btn-dashboard">📝 Gestione Blog</NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/nodes')" class="nav-tab btn-dashboard">💬 Gestione Nodi</NuxtLink>
        <NuxtLink :to="getMainUrl('/admin/shop')" class="nav-tab btn-dashboard">🛍️ Gestione Shop</NuxtLink>
      </nav>
    </div>

    <header class="header-bar">
      <div>
        <h1 class="page-title">📡 Autoresponder Trigger Rules <span class="badge-v">v2.5-GOLD</span></h1>
        <p class="page-subtitle">Configurazione euristiche di risposta automatica del Mail Server</p>
      </div>
    </header>

    <div class="content-card">
      <div class="table-container">
        <table class="dkp-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>KEYWORD TRIGGER</th>
              <th>MATCH OGGETTO</th>
              <th>TEMPLATE RISPOSTA</th>
              <th>STATO</th>
              <th>AZIONI</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="rule in rules" :key="rule.id">
              <td class="font-mono">#{{ rule.id }}</td>
              <td class="font-bold text-sky-400 font-mono">{{ rule.triggerKeyword }}</td>
              <td>{{ rule.subjectMatch }}</td>
              <td class="text-slate-400 max-w-md truncate">{{ rule.responseTemplate }}</td>
              <td>
                <span :class="['status-pill', rule.isActive ? 'active' : 'disabled']">
                  {{ rule.isActive ? 'ATTIVO' : 'DISATTIVATO' }}
                </span>
              </td>
              <td>
                <button @click="toggleRule(rule)" class="btn-sm">
                  {{ rule.isActive ? 'Disattiva' : 'Attiva' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
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

.autoresponder-admin-container { padding: 1.5rem; background: #020420; color: #f8fafc; min-height: 100vh; max-width: 1400px; margin: 0 auto; }
.header-bar { display: flex; justify-content: space-between; align-items: center; background: #090d16; border: 1px solid #1e293b; padding: 1rem 1.5rem; border-radius: 12px; margin-bottom: 1.5rem; }
.page-title { margin: 0; font-size: 1.3rem; font-weight: 800; }
.badge-v { background: rgba(0, 220, 130, 0.15); color: #00dc82; font-size: 0.7rem; padding: 0.1rem 0.4rem; border-radius: 4px; border: 1px solid rgba(0, 220, 130, 0.3); }

.content-card { background: #090d16; border: 1px solid #1e293b; border-radius: 12px; padding: 1.25rem; }
.dkp-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem; }
.dkp-table th { background: #020420; color: #64748b; padding: 0.75rem; border-bottom: 1px solid #1e293b; }
.dkp-table td { padding: 0.75rem; border-bottom: 1px solid #1e293b; color: #cbd5e1; }
.status-pill { padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 800; }
.status-pill.active { background: rgba(0, 220, 130, 0.15); color: #00dc82; }
.status-pill.disabled { background: rgba(239, 68, 68, 0.15); color: #f87171; }
.btn-sm { background: #1e293b; color: #fff; border: 1px solid #334155; padding: 0.3rem 0.6rem; border-radius: 6px; cursor: pointer; font-size: 0.75rem; }
</style>