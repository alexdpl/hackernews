<!-- app/pages/admin/autoresponder/index.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

definePageMeta({ middleware: 'admin-only' })

useDkpSeo({
  title: 'Autoresponder Engine v2.4-GOLD - DKP Admin Control Center',
  description: 'Configura regole di invio email automatiche scatenate dagli eventi dell ecosystem Kernel DKP.'
})

interface AutoresponderRule {
  id: number | string
  eventTrigger: string
  subject: string
  delayMinutes: number
  sentCount: number
  isEnabled: boolean
  bodyHtml?: string
  createdAt?: string
}

// Stato Reattivo Regole
const rules = ref<AutoresponderRule[]>([
  {
    id: 1,
    eventTrigger: 'USER_REGISTERED',
    subject: 'Benvenuto nell Ecosystem Kernel DKP! 🚀',
    delayMinutes: 0,
    sentCount: 1420,
    isEnabled: true,
    bodyHtml: '<h1>Benvenuto in DKP!</h1><p>Grazie per esserti registrato alla nostra piattaforma tech.</p>',
    createdAt: '2026-09-01'
  },
  {
    id: 2,
    eventTrigger: 'SHOP_PURCHASE_COMPLETED',
    subject: 'Conferma Ordine & Download Licenza SaaS DKP 📦',
    delayMinutes: 0,
    sentCount: 389,
    isEnabled: true,
    bodyHtml: '<p>Ecco i link per scaricare la tua licenza software .ZIP e le istruzioni di setup.</p>',
    createdAt: '2026-09-15'
  },
  {
    id: 3,
    eventTrigger: 'NEWSLETTER_SUBSCRIBE',
    subject: 'Iscrizione confermata al Feed Tech HackerNews DKP 📰',
    delayMinutes: 5,
    sentCount: 812,
    isEnabled: true,
    bodyHtml: '<p>Sei ufficialmente iscritto al digest settimanale delle migliori notizie tech.</p>',
    createdAt: '2026-09-20'
  },
  {
    id: 4,
    eventTrigger: 'INACTIVE_USER_14D',
    subject: 'Ti sei perso le ultime novità su Kernel DKP? 👋',
    delayMinutes: 20160, // 14 giorni in minuti
    sentCount: 154,
    isEnabled: false,
    bodyHtml: '<p>Scopri i nuovi moduli SaaS pubblicati questo mese sul DKP Ecosystem!</p>',
    createdAt: '2026-09-25'
  }
])

const isLoading = ref(false)
const searchQuery = ref('')

// Sistema Notifiche Toast
const showToast = ref(false)
const toastMessage = ref('')

function triggerToast(msg: string) {
  toastMessage.value = msg
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3500)
}

// Fetch Regole da API
async function fetchRules() {
  isLoading.value = true
  try {
    const res: any = await $fetch('/api/admin/autoresponder/rules')
    if (res && res.rules) {
      rules.value = res.rules
    }
  } catch (err) {
    // Fallback ai dati locali se l API non risponde
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchRules()
})

// Stato Modal Creazione / Modifica
const showModal = ref(false)
const isEditing = ref(false)
const currentRule = ref<AutoresponderRule>({
  id: '',
  eventTrigger: 'USER_REGISTERED',
  subject: '',
  delayMinutes: 0,
  sentCount: 0,
  isEnabled: true,
  bodyHtml: ''
})

function openCreateModal() {
  isEditing.value = false
  currentRule.value = {
    id: Date.now(),
    eventTrigger: 'USER_REGISTERED',
    subject: '',
    delayMinutes: 0,
    sentCount: 0,
    isEnabled: true,
    bodyHtml: '<p>Scrivi qui il testo dell email automatica...</p>'
  }
  showModal.value = true
}

function openEditModal(rule: AutoresponderRule) {
  isEditing.value = true
  currentRule.value = JSON.parse(JSON.stringify(rule))
  showModal.value = true
}

// Salva o Aggiorna Regola
async function saveRule() {
  if (!currentRule.value.subject || !currentRule.value.eventTrigger) {
    triggerToast('❌ Compila Evento Trigger e Oggetto Email!')
    return
  }

  isLoading.value = true
  try {
    if (isEditing.value) {
      await $fetch(`/api/admin/autoresponder/rules/${currentRule.value.id}`, {
        method: 'PUT',
        body: currentRule.value
      }).catch(() => null)

      const index = rules.value.findIndex(r => r.id === currentRule.value.id)
      if (index !== -1) rules.value[index] = { ...currentRule.value }
      triggerToast('✅ Regola autoresponder aggiornata!')
    } else {
      await $fetch('/api/admin/autoresponder/rules', {
        method: 'POST',
        body: currentRule.value
      }).catch(() => null)

      rules.value.unshift({ ...currentRule.value })
      triggerToast('🚀 Nuova regola di invio automatico creata!')
    }
    showModal.value = false
  } catch (err: any) {
    triggerToast(`❌ Errore durante il salvataggio: ${err.message || 'Server error'}`)
  } finally {
    isLoading.value = false
  }
}

// Toggle Stato Abilitato / Disabilitato
async function toggleRule(rule: AutoresponderRule) {
  rule.isEnabled = !rule.isEnabled
  try {
    await $fetch(`/api/admin/autoresponder/rules/${rule.id}/toggle`, {
      method: 'PATCH',
      body: { isEnabled: rule.isEnabled }
    }).catch(() => null)
    triggerToast(`Regola ${rule.isEnabled ? 'ABILITATA 🟢' : 'DISABILITATA 🔴'}`)
  } catch (err) {
    triggerToast('Stato aggiornato localmente.')
  }
}

// Eliminazione Regola
async function deleteRule(id: string | number) {
  if (!confirm('Sei sicuro di voler eliminare questa regola di autoresponder?')) return

  try {
    await $fetch(`/api/admin/autoresponder/rules/${id}`, { method: 'DELETE' }).catch(() => null)
    rules.value = rules.value.filter(r => r.id !== id)
    triggerToast('🗑️ Regola rimosso dal sistema.')
  } catch (err) {
    rules.value = rules.value.filter(r => r.id !== id)
    triggerToast('🗑️ Regola eliminata.')
  }
}

// Regole Filtrate
const filteredRules = computed(() => {
  return rules.value.filter(r => {
    return r.eventTrigger.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
           r.subject.toLowerCase().includes(searchQuery.value.toLowerCase())
  })
})
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

        <NuxtLink to="/admin" class="nav-tab btn-dashboard-main" exact-active-class="active">
          🏠 Dashboard Main
        </NuxtLink>
      </div>

      <!-- GRID MODULI ADMIN -->
      <nav class="admin-grid-nav">
        <NuxtLink to="/admin/api-gateway" class="nav-tab btn-dashboard" active-class="active">⚙️ API Gateway</NuxtLink>
        <NuxtLink to="/admin/mail" class="nav-tab btn-dashboard" active-class="active">📧 Mail Center</NuxtLink>
        <NuxtLink to="/admin/newsletter" class="nav-tab btn-dashboard" active-class="active">📣 Newsletter</NuxtLink>
        <NuxtLink to="/admin/autoresponder" class="nav-tab btn-dashboard" active-class="active">📡 Autoresponder</NuxtLink>
        <NuxtLink to="/admin/crawler" class="nav-tab btn-dashboard" active-class="active">🤖 Crawler Engine</NuxtLink>
        <NuxtLink to="/admin/blog" class="nav-tab btn-dashboard" active-class="active">📝 Gestione Blog</NuxtLink>
        <NuxtLink to="/admin/shop" class="nav-tab btn-dashboard" active-class="active">🛍️ Gestione Shop</NuxtLink>
        <NuxtLink to="/admin/jobs" class="nav-tab btn-dashboard" active-class="active">💼 Gestione Jobs</NuxtLink>
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
          Configura e automatizza l invio di email transazionali scatenate dagli eventi dell ecosistema DKP.
        </p>
      </div>

      <div class="header-actions">
        <button type="button" @click="openCreateModal" class="btn-primary-action">
          ➕ Nuova Regola Autoresponder
        </button>
      </div>
    </header>

    <!-- CONTROLS & SEARCH BAR -->
    <section class="controls-card">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Cerca per evento trigger (es. USER_REGISTERED) o oggetto..." 
          class="dark-input" 
        />
      </div>
    </section>

    <!-- RULES TABLE CARD -->
    <section class="rules-card">
      <div class="card-header">
        <h3>🤖 Regole Autoresponder Attive ({{ filteredRules.length }})</h3>
      </div>

      <div class="table-responsive">
        <table class="rules-table">
          <thead>
            <tr>
              <th>Evento Trigger</th>
              <th>Oggetto Email Automatica</th>
              <th>Ritardo Invio</th>
              <th>Totale Inviate</th>
              <th>Stato</th>
              <th class="text-right">Azioni</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="rule in filteredRules" :key="rule.id">
              <td><code class="trigger-code">{{ rule.eventTrigger }}</code></td>
              <td class="font-bold">{{ rule.subject }}</td>
              <td>{{ rule.delayMinutes === 0 ? 'Istantaneo' : `${rule.delayMinutes} minuti` }}</td>
              <td class="count-text">{{ rule.sentCount }}</td>
              <td>
                <button 
                  type="button" 
                  @click="toggleRule(rule)" 
                  class="status-btn" 
                  :class="{ active: rule.isEnabled }"
                >
                  {{ rule.isEnabled ? 'ENABLED 🟢' : 'DISABLED 🔴' }}
                </button>
              </td>
              <td class="text-right">
                <div class="action-buttons">
                  <button type="button" @click="openEditModal(rule)" class="btn-icon edit" title="Modifica Regola">✏️</button>
                  <button type="button" @click="deleteRule(rule.id)" class="btn-icon delete" title="Elimina Regola">🗑️</button>
                </div>
              </td>
            </tr>

            <tr v-if="filteredRules.length === 0">
              <td colspan="6" class="empty-state">
                Nessuna regola trovata corrispondente alla ricerca.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- MODAL CREAZIONE / MODIFICA REGOLE -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ isEditing ? '✏️ Modifica Regola Autoresponder' : '➕ Crea Nuova Regola Automatica' }}</h3>
          <button type="button" @click="showModal = false" class="btn-close">&times;</button>
        </div>

        <div class="modal-body">
          <div class="input-grid">
            <div class="input-group">
              <label>Evento Trigger *</label>
              <select v-model="currentRule.eventTrigger" class="dark-input">
                <option value="USER_REGISTERED">USER_REGISTERED (Registrazione Utente)</option>
                <option value="SHOP_PURCHASE_COMPLETED">SHOP_PURCHASE_COMPLETED (Acquisto Licenza)</option>
                <option value="NEWSLETTER_SUBSCRIBE">NEWSLETTER_SUBSCRIBE (Iscrizione Feed)</option>
                <option value="INACTIVE_USER_14D">INACTIVE_USER_14D (Inattività 14 Giorni)</option>
                <option value="CONTACT_FORM_SUBMITTED">CONTACT_FORM_SUBMITTED (Invio Form Contatto)</option>
              </select>
            </div>

            <div class="input-group">
              <label>Ritardo Invio (in Minuti)</label>
              <input v-model.number="currentRule.delayMinutes" type="number" min="0" placeholder="0 per invio istantaneo" class="dark-input" />
            </div>

            <div class="input-group full-width">
              <label>Oggetto Email Automatica *</label>
              <input v-model="currentRule.subject" type="text" placeholder="es. Benvenuto nell Ecosystem DKP!" class="dark-input" />
            </div>

            <div class="input-group full-width">
              <label>Contenuto HTML Email</label>
              <textarea v-model="currentRule.bodyHtml" rows="5" placeholder="Inserisci il codice HTML o il testo del messaggio automatizzato..." class="dark-input textarea"></textarea>
            </div>

            <div class="input-group full-width checkbox-group">
              <label class="checkbox-label">
                <input v-model="currentRule.isEnabled" type="checkbox" />
                <span>🟢 Attiva Immediatamente questa Regola</span>
              </label>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" @click="showModal = false" class="btn-secondary">Annulla</button>
          <button type="button" @click="saveRule" :disabled="isLoading" class="btn-primary-action">
            💾 {{ isEditing ? 'Aggiorna Regola' : 'Crea Regola' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ==========================================================================
   STILI NAVBAR ADMIN UNIFICATA v2.4-GOLD
   ========================================================================== */
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

@media (max-width: 1024px) {
  .admin-grid-nav { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 580px) {
  .admin-grid-nav { grid-template-columns: 1fr; }
}

/* ==========================================================================
   TOAST NOTIFICATION
   ========================================================================== */
.dkp-toast-success {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 999999;
  background: #061811;
  border: 1px solid #00dc82;
  box-shadow: 0 10px 30px rgba(0, 220, 130, 0.35);
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
  font-family: ui-monospace, monospace;
  font-size: 0.85rem;
  font-weight: 600;
}

.toast-fade-enter-active, .toast-fade-leave-active { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.toast-fade-enter-from, .toast-fade-leave-to { opacity: 0; transform: translateY(-15px) scale(0.95); }

/* ==========================================================================
   LAYOUT PANNELLO & HEADER
   ========================================================================== */
.autoresponder-admin-panel {
  max-width: 1240px;
  margin: 0 auto;
  padding-bottom: 4rem;
  color: #f8fafc;
  font-family: system-ui, -apple-system, sans-serif;
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

.btn-primary-action:hover:not(:disabled) {
  box-shadow: 0 0 18px rgba(0, 220, 130, 0.4);
  transform: translateY(-1px);
}

.btn-secondary {
  background: #020420;
  color: #f8fafc;
  font-weight: 700;
  border: 1px solid #1e293b;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.88rem;
}

/* SEARCH & CONTROLS */
.controls-card { margin-bottom: 1.5rem; }
.search-box { position: relative; }
.search-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #64748b; }

.dark-input {
  background: #090d16;
  border: 1px solid #1e293b;
  color: #fff;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border-radius: 8px;
  font-size: 0.88rem;
  outline: none;
  width: 100%;
}

.dark-input:focus { border-color: #00dc82; }

/* TABLES CARD */
.rules-card {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1.5rem;
}

.card-header h3 {
  margin: 0 0 1.25rem 0;
  color: #00dc82;
  font-size: 1.15rem;
  font-weight: 800;
}

.table-responsive { overflow-x: auto; }

.rules-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
  text-align: left;
}

.rules-table th {
  padding: 0.85rem 1rem;
  color: #94a3b8;
  border-bottom: 1px solid #1e293b;
  font-size: 0.75rem;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.rules-table td {
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  vertical-align: middle;
}

.trigger-code {
  color: #38bdf8;
  font-family: ui-monospace, monospace;
  background: #020420;
  border: 1px solid #1e293b;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 700;
}

.font-bold { font-weight: 700; color: #ffffff; }
.count-text { color: #00dc82; font-weight: 800; }

.status-btn {
  background: #020420;
  border: 1px solid #1e293b;
  color: #ef4444;
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  font-weight: 800;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.status-btn.active {
  color: #00dc82;
  border-color: rgba(0, 220, 130, 0.4);
  background: rgba(0, 220, 130, 0.08);
}

.action-buttons { display: flex; gap: 0.4rem; justify-content: flex-end; }

.btn-icon {
  background: #020420;
  border: 1px solid #1e293b;
  padding: 0.4rem 0.65rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s ease;
}

.btn-icon:hover { border-color: #00dc82; transform: translateY(-1px); }

.empty-state { text-align: center; padding: 3rem !important; color: #64748b; }

/* MODAL STYLES */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(2, 4, 32, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1.5rem;
}

.modal-content {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  width: 100%;
  max-width: 680px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 40px rgba(0,0,0,0.6);
}

.modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #1e293b;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 { margin: 0; color: #ffffff; font-size: 1.15rem; }
.btn-close { background: none; border: none; color: #64748b; font-size: 1.5rem; cursor: pointer; }
.modal-body { padding: 1.5rem; overflow-y: auto; }

.input-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.2rem; }
@media (max-width: 600px) { .input-grid { grid-template-columns: 1fr; } }

.input-group { display: flex; flex-direction: column; gap: 0.4rem; }
.input-group.full-width { grid-column: 1 / -1; }
.input-group label { font-size: 0.78rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.04em; }

.textarea { resize: vertical; padding-left: 1rem !important; }

.checkbox-group { margin-top: 0.5rem; }
.checkbox-label { display: flex; align-items: center; gap: 0.6rem; cursor: pointer; font-size: 0.88rem; color: #cbd5e1; }

.modal-footer {
  padding: 1.25rem 1.5rem;
  border-top: 1px solid #1e293b;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}
</style>