<!-- app/pages/admin/autoresponder/index.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({
  title: 'DKP Autoresponder Manager | DevKernelPulse'
})

// 1. Inizializziamo il runtimeConfig dinamico (localhost vs GCP)
const config = useRuntimeConfig()
const { getMainUrl, getMailUrl, getApiUrl } = useDomain()

interface AutoRule {
  id: number
  name: string
  trigger_address: string
  subject_template: string
  body_template: string
  is_active: boolean
  created_at: string
}

const rules = ref<AutoRule[]>([])
const isLoading = ref(true)
const showModal = ref(false)

const formRule = ref({
  name: '',
  trigger_address: 'noreply@devkernelpulse.org',
  subject_template: 'Ricevuto! Risponderemo a breve.',
  body_template: 'Grazie per averci contattato. Il team DKP ha preso in carico la tua richiesta.',
  is_active: true
})

// Fetch Autoresponder Rules via Mail Service
async function fetchRules() {
  isLoading.value = true
  try {
    const res: any = await $fetch(`${config.public.mailUrl}/api/admin/autoresponder`)
    if (res && res.success) {
      rules.value = res.rules || []
    }
  } catch (err) {
    console.error('[FETCH RULES ERROR]', err)
  } finally {
    isLoading.value = false
  }
}

// Save Autoresponder Rule via Mail Service
async function handleSaveRule() {
  try {
    const res: any = await $fetch(`${config.public.mailUrl}/api/admin/autoresponder`, {
      method: 'POST',
      body: formRule.value
    })
    if (res && res.success) {
      showModal.value = false
      formRule.value = {
        name: '',
        trigger_address: 'noreply@devkernelpulse.org',
        subject_template: 'Ricevuto! Risponderemo a breve.',
        body_template: '',
        is_active: true
      }
      fetchRules()
    }
  } catch (err) {
    console.error('[SAVE RULE ERROR]', err)
  }
}

onMounted(() => {
  fetchRules()
})
</script>

<template>
  <div class="autoresponder-admin-container">
  
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
  
    <header class="header-bar">
      <div>
        <h1 class="page-title">🤖 DKP Autoresponder Rules <span class="badge-v">v2.4</span></h1>
        <p class="page-subtitle">Configurazione risponditori automatici in ingresso per le caselle Cloudflare</p>
      </div>
	  
    </header>

    <div class="rules-card">
      <div v-if="isLoading" class="loading-state">⚡ Caricamento regole dal DB...</div>
      <div v-else-if="rules.length === 0" class="empty-state">📭 Nessuna regola di autorisposta configurata.</div>

      <div v-else class="rules-grid">
        <div v-for="r in rules" :key="r.id" class="rule-box">
          <div class="rule-header">
            <h4>{{ r.name }}</h4>
            <span class="status-pill" :class="{ active: r.is_active }">
              {{ r.is_active ? 'ATTIVA' : 'DISATTIVA' }}
            </span>
          </div>

          <div class="rule-body">
            <p><strong>Casella Trigger:</strong> <code class="neon-text">{{ r.trigger_address }}</code></p>
            <p><strong>Oggetto Template:</strong> {{ r.subject_template }}</p>
            <div class="template-preview">{{ r.body_template }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL -->
    <Transition name="modal-fade">
      <div v-if="showModal" class="modal-backdrop" @click.self="showModal = false">
        <div class="modal-card">
          <div class="modal-header">
            <h3>🤖 Crea Nuova Regola Autorisposta</h3>
            <button @click="showModal = false" class="btn-close">✕</button>
          </div>

          <form @submit.prevent="handleSaveRule" class="modal-form">
            <div class="form-group">
              <label>Nome Identificativo Regola:</label>
              <input v-model="formRule.name" type="text" required placeholder="es. Autorisposta Supporto" class="form-input" />
            </div>

            <div class="form-group">
              <label>Casella Postale Trigger:</label>
              <select v-model="formRule.trigger_address" class="form-input">
			  <option value="admin@devkernelpulse.org">admin@devkernelpulse.org</option>
                <option value="info@devkernelpulse.org">info@devkernelpulse.org</option>
                <option value="support@devkernelpulse.org">support@devkernelpulse.org</option>
                <option value="newsletter@devkernelpulse.org">newsletter@devkernelpulse.org</option>
				<option value="noreply@devkernelpulse.org">noreply@devkernelpulse.org</option>
                <option value="alex@devkernelpulse.org">alex@devkernelpulse.org</option>
				
              </select>
            </div>

            <div class="form-group">
              <label>Oggetto Email Risposta:</label>
              <input v-model="formRule.subject_template" type="text" required class="form-input" />
            </div>

            <div class="form-group">
              <label>Corpo del Messaggio (HTML):</label>
              <textarea v-model="formRule.body_template" rows="6" required class="form-input textarea"></textarea>
            </div>

            <div class="modal-footer">
              <button type="button" @click="showModal = false" class="btn-secondary">Annulla</button>
              <button type="submit" class="btn-primary">Salva Regola</button>
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


.autoresponder-admin-container {
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

.rules-card { background: #090d16; border: 1px solid #1e293b; border-radius: 12px; padding: 1.5rem; }
.rules-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1rem; }

.rule-box { background: #020420; border: 1px solid #1e293b; border-radius: 10px; padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; }
.rule-header { display: flex; justify-content: space-between; align-items: center; }
.rule-header h4 { margin: 0; font-size: 1rem; color: #fff; }

.status-pill { font-size: 0.68rem; font-weight: 800; padding: 0.15rem 0.45rem; border-radius: 4px; background: rgba(239, 68, 68, 0.2); color: #f87171; }
.status-pill.active { background: rgba(0, 220, 130, 0.2); color: #00dc82; }

.rule-body { font-size: 0.82rem; color: #94a3b8; display: flex; flex-direction: column; gap: 0.4rem; }
.neon-text { color: #00dc82; font-weight: bold; }
.template-preview { background: #090d16; padding: 0.65rem; border-radius: 6px; border: 1px solid #1e293b; font-size: 0.78rem; line-height: 1.4; color: #cbd5e1; }

.btn-primary { background: #00dc82; color: #020420; font-weight: 800; border: none; padding: 0.65rem 1.2rem; border-radius: 8px; cursor: pointer; text-decoration: none; }
.btn-secondary { background: #1e293b; color: #f8fafc; font-weight: 600; border: 1px solid #334155; padding: 0.65rem 1rem; border-radius: 8px; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; }

/* MODAL */
.modal-backdrop { position: fixed; inset: 0; background: rgba(2, 4, 32, 0.85); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 10000; }
.modal-card { background: #090d16; border: 1px solid #1e293b; border-radius: 14px; width: 520px; max-width: 90vw; }
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
</style>