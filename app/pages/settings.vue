<!-- app/pages/settings.vue -->
<script setup lang="ts">
import { ref } from 'vue'
// NOTA: useAdminSettings è auto-importato da Nuxt, zero import manuali!

const { settings, updateSettings } = useAdminSettings()

const form = ref({ ...settings.value })
const successMessage = ref('')

function handleSave() {
  updateSettings(form.value)
  successMessage.value = '⚙️ Configurazioni globali e Feature Flags salvati con successo nel Kernel!'
  setTimeout(() => successMessage.value = '', 4000)
}
</script>

<template>
  <div class="admin-container">
    <div class="admin-header">
      <div class="header-top-row">
        <span class="badge-tag">DKP Core Configs</span>
        <NuxtLink to="/admin" class="back-dashboard-btn">← Torna al Command Center</NuxtLink>
      </div>
      <h1>Global Settings & Parameters</h1>
      <p>Gestione dei Feature Flag di sistema, modalità manutenzione e chiavi pubbliche API.</p>
    </div>

    <div v-if="successMessage" class="success-banner">
      {{ successMessage }}
    </div>

    <div class="settings-grid">
      <!-- Sezione Feature Flags & Moduli -->
      <div class="admin-card">
        <h2>🎚️ Feature Flags Ecosistema</h2>
        <p class="card-desc">Attiva o disattiva i moduli nativi in tempo reale.</p>

        <div class="toggle-group">
          <label class="toggle-label">
            <span>Abilita DKP Native Blog</span>
            <input type="checkbox" v-model="form.enableBlog" />
            <span class="slider"></span>
          </label>
        </div>

        <div class="toggle-group">
          <label class="toggle-label">
            <span>Abilita Sezione Jobs & Carriere</span>
            <input type="checkbox" v-model="form.enableJobs" />
            <span class="slider"></span>
          </label>
        </div>

        <div class="toggle-group">
          <label class="toggle-label">
            <span>Abilita DKP Shop (Prossimamente)</span>
            <input type="checkbox" v-model="form.enableShop" />
            <span class="slider"></span>
          </label>
        </div>

        <div class="toggle-group">
          <label class="toggle-label">
            <span>Modalità Manutenzione (Global Lock)</span>
            <input type="checkbox" v-model="form.maintenanceMode" />
            <span class="slider red-slider"></span>
          </label>
        </div>
      </div>

      <!-- Sezione Parametri e Chiavi -->
      <div class="admin-card span-2">
        <h2>🔑 Parametri Globali & API Keys</h2>
        <p class="card-desc">Configura il titolo del portale, il banner globale e le chiavi di terze parti.</p>

        <div class="form-group">
          <label>Titolo Ufficiale dell'Ecosistema</label>
          <input v-model="form.siteTitle" type="text" />
        </div>

        <div class="form-group">
          <label>Banner Annuncio Globale (Header Ticker)</label>
          <input v-model="form.announcementBanner" type="text" />
        </div>

        <div class="form-row">
          <div class="form-group flex-1">
            <label>Stripe Public Key (Shop)</label>
            <input v-model="form.stripePublicKey" type="text" />
          </div>
          <div class="form-group flex-1">
            <label>GitHub App Client Key (Proof of Code)</label>
            <input v-model="form.githubClientKey" type="text" />
          </div>
        </div>

        <button @click="handleSave" class="action-btn primary-btn">Salva Configurazioni Globali</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-container { max-width: 1100px; margin: 2.5rem auto; padding: 0 1.5rem; }
.admin-header { margin-bottom: 2rem; }
.header-top-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
.back-dashboard-btn { color: #00dc82; text-decoration: none; font-weight: 600; font-size: 0.9rem; }
.back-dashboard-btn:hover { text-decoration: underline; }
.badge-tag { background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.85rem; font-weight: 700; text-transform: uppercase; border: 1px solid rgba(56, 189, 248, 0.3); }
.admin-header h1 { font-size: 2rem; color: #020420; font-weight: 800; margin-top: 0.5rem; }
.admin-header p { color: #64748b; font-size: 0.95rem; }
.success-banner { background: rgba(0, 220, 130, 0.15); border: 1px solid #00dc82; color: #006636; padding: 1rem; border-radius: 8px; font-weight: 600; margin-bottom: 1.5rem; }
.settings-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 1.5rem; }
@media (max-width: 768px) { .settings-grid { grid-template-columns: 1fr; } }
.admin-card { background: #020420; border: 1px solid #1e293b; border-radius: 10px; padding: 2rem; color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
.admin-card h2 { font-size: 1.2rem; font-weight: 700; color: #00dc82; margin-bottom: 0.5rem; }
.card-desc { color: #94a3b8; font-size: 0.85rem; margin-bottom: 1.5rem; }
.form-group { margin-bottom: 1.25rem; }
.form-row { display: flex; gap: 1rem; }
.flex-1 { flex: 1; }
label { display: block; font-size: 0.85rem; font-weight: 600; color: #cbd5e1; margin-bottom: 0.4rem; }
input { width: 100%; background: #090d16; border: 1px solid #1e293b; color: #ffffff; padding: 0.6rem 0.8rem; border-radius: 6px; font-size: 0.9rem; outline: none; }
input:focus { border-color: #00dc82; }

/* Toggle Switches */
.toggle-group { margin-bottom: 1.25rem; border-bottom: 1px solid #1e293b; padding-bottom: 1rem; }
.toggle-label { display: flex; justify-content: space-between; align-items: center; cursor: pointer; color: #cbd5e1; font-weight: 600; font-size: 0.9rem; }
.toggle-label input { width: auto; cursor: pointer; }

.action-btn { width: 100%; padding: 0.75rem; border-radius: 6px; font-weight: 700; font-size: 0.9rem; cursor: pointer; border: none; transition: opacity 0.2s; margin-top: 1rem; }
.primary-btn { background: #00dc82; color: #020420; }
.action-btn:hover { opacity: 0.9; }
</style>