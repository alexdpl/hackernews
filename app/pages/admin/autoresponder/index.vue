<!-- app/pages/admin/autoresponder/index.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({
  title: 'DKP Autoresponder Manager | DevKernelPulse'
})

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
  trigger_address: 'support@devkernelpulse.org',
  subject_template: 'Ricevuto! Risponderemo a breve.',
  body_template: 'Grazie per averci contattato. Il team DKP ha preso in carico la tua richiesta.',
  is_active: true
})

async function fetchRules() {
  isLoading.value = true
  try {
    const res: any = await $fetch('/api/admin/autoresponder')
    if (res && res.success) {
      rules.value = res.rules || []
    }
  } catch (err) {
    console.error('[FETCH RULES ERROR]', err)
  } finally {
    isLoading.value = false
  }
}

async function handleSaveRule() {
  try {
    const res: any = await $fetch('/api/admin/autoresponder', {
      method: 'POST',
      body: formRule.value
    })
    if (res && res.success) {
      showModal.value = false
      formRule.value = {
        name: '',
        trigger_address: 'support@devkernelpulse.org',
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
    <header class="header-bar">
      <div>
        <h1 class="page-title">🤖 DKP Autoresponder Rules <span class="badge-v">v2.4</span></h1>
        <p class="page-subtitle">Configurazione risponditori automatici in ingresso per le caselle Cloudflare</p>
      </div>

      <div class="header-actions">
        <NuxtLink to="/admin/mail" class="btn-secondary">📧 Torna alla Webmail</NuxtLink>
        <button @click="showModal = true" class="btn-primary">➕ Nuova Regola</button>
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
                <option value="info@devkernelpulse.org">info@devkernelpulse.org</option>
                <option value="support@devkernelpulse.org">support@devkernelpulse.org</option>
                <option value="newsletter@devkernelpulse.org">newsletter@devkernelpulse.org</option>
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