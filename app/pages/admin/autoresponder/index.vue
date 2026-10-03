<!-- app/pages/admin/autoresponder/index.vue -->
<script setup lang="ts">
import { ref } from 'vue'

// definePageMeta({ middleware: 'admin-only' })

useDkpSeo({
  title: 'Autoresponder & Email Triggers v2.4-GOLD - DKP Admin',
  description: 'Regole di invio automatico transazionale per eventi di sistema e registrazioni.'
})

const { getMainUrl, getMailUrl, getApiUrl } = useDomain()

interface AutoRule {
  id: number
  eventTrigger: string
  subject: string
  delayMinutes: number
  isEnabled: boolean
  sentCount: number
}

const rules = ref<AutoRule[]>([
  { id: 1, eventTrigger: 'USER_REGISTERED', subject: '🌱 Benvenuto nel Kernel DKP Platform!', delayMinutes: 0, isEnabled: true, sentCount: 142 },
  { id: 2, eventTrigger: 'PROOF_OF_CODE_VAULTED', subject: '🛡️ Notarizzazione Vault Registrata', delayMinutes: 0, isEnabled: true, sentCount: 89 },
  { id: 3, eventTrigger: 'API_KEY_GENERATED', subject: '⚡ Nuova DKP API Key Generata', delayMinutes: 2, isEnabled: false, sentCount: 34 }
])

// Toast Notification
const showToast = ref(false)
const toastMessage = ref('')

function triggerToast(msg: string) {
  toastMessage.value = msg
  showToast.value = true
  setTimeout(() => showToast.value = false, 3500)
}

function toggleRule(rule: AutoRule) {
  rule.isEnabled = !rule.isEnabled
  triggerToast(`Regola '${rule.eventTrigger}' ${rule.isEnabled ? 'ATTIVATA' : 'DISATTIVATA'}.`)
}
</script>

<template>
  <div class="autoresponder-admin-panel">
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

    <!-- HEADER HERO -->
    <header class="panel-header">
      <div class="header-title">
        <div class="hero-badge">
          <span class="badge-status gold">DKP AUTORESPONDER ENGINE v2.4-GOLD</span>
        </div>
        <h2>Control Center <span class="brand-highlight">Email Automatiche</span></h2>
        <p class="sub-lead">
          Configura le regole di invio email automatiche scatenate dagli eventi dell'ecosistema Kernel DKP.
        </p>
      </div>
    </header>

    <!-- RULES TABLE -->
    <section class="rules-card">
      <h3>🤖 Regole Autoresponder Attive ({{ rules.length }})</h3>

      <div class="table-responsive">
        <table class="rules-table">
          <thead>
            <tr>
              <th>Evento Trigger</th>
              <th>Oggetto Email Automatica</th>
              <th>Ritardo Invio</th>
              <th>Totale Inviate</th>
              <th>Stato</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="rule in rules" :key="rule.id">
              <td><code class="trigger-code">{{ rule.eventTrigger }}</code></td>
              <td class="font-bold">{{ rule.subject }}</td>
              <td>{{ rule.delayMinutes === 0 ? 'Istantaneo' : `${rule.delayMinutes} minuti` }}</td>
              <td class="count-text">{{ rule.sentCount }}</td>
              <td>
                <button @click="toggleRule(rule)" class="status-btn" :class="{ active: rule.isEnabled }">
                  {{ rule.isEnabled ? 'ENABLED 🟢' : 'DISABLED 🔴' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
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

.nav-branding { display: flex; align-items: center; gap: 8px; }
.status-dot.green { width: 8px; height: 8px; background-color: #00ff87; border-radius: 50%; box-shadow: 0 0 8px #00ff87; }
.nav-title { color: #00f0ff; font-weight: 800; font-size: 0.85rem; letter-spacing: 0.05em; text-shadow: 0 0 10px rgba(0, 240, 255, 0.3); }

.admin-grid-nav { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.nav-tab { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 14px; border-radius: 6px; font-weight: 700; font-size: 0.88rem; text-decoration: none; transition: all 0.2s ease-in-out; cursor: pointer; }
.btn-dashboard { color: #00ff87; background: rgba(0, 255, 135, 0.04); border: 1px solid rgba(0, 255, 135, 0.3); }
.btn-dashboard:hover, .btn-dashboard.active { background: rgba(0, 255, 135, 0.12); border-color: #00ff87; box-shadow: 0 0 12px rgba(0, 255, 135, 0.25); transform: translateY(-1px); }
.btn-dashboard-main { color: #00f0ff; background: rgba(0, 240, 255, 0.06); border: 1px solid rgba(0, 240, 255, 0.4); }

.autoresponder-admin-panel { max-width: 1240px; margin: 0 auto; padding-bottom: 4rem; color: #f8fafc; }
.panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; background: #090d16; border: 1px solid #1e293b; border-radius: 12px; padding: 1.5rem 2rem; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4); }
.badge-status.gold { background: rgba(0, 220, 130, 0.15); color: #00dc82; border: 1px solid #00dc82; padding: 0.2rem 0.55rem; border-radius: 4px; font-size: 0.72rem; font-weight: 800; }
.panel-header h2 { font-size: 1.8rem; font-weight: 900; margin: 0 0 0.4rem 0; color: #ffffff; }
.brand-highlight { color: #00dc82; }
.sub-lead { color: #94a3b8; font-size: 0.92rem; margin: 0; }

.rules-card { background: #090d16; border: 1px solid #1e293b; border-radius: 12px; padding: 1.5rem; }
.rules-card h3 { margin: 0 0 1.25rem 0; color: #00dc82; font-size: 1.15rem; font-weight: 800; }

.rules-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; text-align: left; }
.rules-table th { padding: 0.85rem; color: #94a3b8; border-bottom: 1px solid #1e293b; font-size: 0.75rem; text-transform: uppercase; }
.rules-table td { padding: 0.85rem; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }

.trigger-code { color: #38bdf8; font-family: ui-monospace, monospace; background: #020420; padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.8rem; }
.count-text { color: #00dc82; font-weight: 800; }

.status-btn { background: #020420; border: 1px solid #1e293b; color: #ef4444; padding: 0.35rem 0.75rem; border-radius: 6px; font-weight: 800; font-size: 0.75rem; cursor: pointer; transition: all 0.2s; }
.status-btn.active { color: #00dc82; border-color: #00dc82; background: rgba(0, 220, 130, 0.08); }
</style>
