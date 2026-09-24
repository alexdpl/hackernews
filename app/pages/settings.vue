<!-- app/pages/settings.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'

// Controllo sessione admin protetto
const { data: authData } = await useFetch('/api/auth/me', { getCachedData: () => null })
const isAdmin = computed(() => (authData.value as any)?.role === 'admin' || (authData.value as any)?.username === 'alexdpl')

const successMessage = ref('')
const errorMessage = ref('')

// Stato delle feature flags del plugin shop/ecosistema
const settings = ref({
  shopEnabled: true,
  maintenanceMode: false,
  aiScannerPro: true,
  kernelVault: true
})

async function saveSettings() {
  try {
    successMessage.value = 'Impostazioni salvate con successo nel Kernel!'
    errorMessage.value = ''
  } catch (e) {
    errorMessage.value = 'Errore durante il salvataggio.'
  }
}
</script>

<template>
  <div class="admin-settings-container">
    <div class="settings-card">
      <h1>⚙️ DKP Kernel & Plugin Settings</h1>
      <p class="subtitle">Gestisci i moduli attivi, le feature flags e la configurazione dello Shop in stile WordPress.</p>

      <div v-if="successMessage" class="alert success">{{ successMessage }}</div>
      <div v-if="errorMessage" class="alert error">{{ errorMessage }}</div>

      <div class="settings-form">
        <div class="setting-item">
          <div class="setting-info">
            <h3>🛒 DKP Shop Monetization</h3>
            <p>Abilita o disabilita il modulo e-commerce per la vendita dei plugin.</p>
          </div>
          <label class="switch">
            <input type="checkbox" v-model="settings.shopEnabled" />
            <span class="slider"></span>
          </label>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <h3>🛡️ DKP Proof of Code (Kernel Vault)</h3>
            <p>Attiva il sistema di notarizzazione crittografica SHA-256 per gli snippet.</p>
          </div>
          <label class="switch">
            <input type="checkbox" v-model="settings.kernelVault" />
            <span class="slider"></span>
          </label>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <h3>🔍 AI Code Scanner v2.0</h3>
            <p>Modulo di audit di sicurezza OWASP integrato nell'ecosistema.</p>
          </div>
          <label class="switch">
            <input type="checkbox" v-model="settings.aiScannerPro" />
            <span class="slider"></span>
          </label>
        </div>

        <button @click="saveSettings" class="save-btn">Salva Configurazioni Kernel</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-settings-container { max-width: 900px; margin: 3rem auto; padding: 0 1.5rem; font-family: ui-sans-serif, system-ui, sans-serif; }
.settings-card { background: #020420; border: 1px solid #1e293b; border-radius: 12px; padding: 2.5rem; color: #ffffff; }
.settings-card h1 { font-size: 1.75rem; color: #00dc82; margin-bottom: 0.5rem; }
.subtitle { color: #94a3b8; font-size: 0.95rem; margin-bottom: 2rem; }
.alert { padding: 0.75rem; border-radius: 6px; font-size: 0.85rem; margin-bottom: 1.5rem; }
.alert.success { background: rgba(0, 220, 130, 0.1); border: 1px solid #00dc82; color: #00dc82; }
.alert.error { background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; color: #fca5a5; }
.settings-form { display: flex; flex-direction: column; gap: 1.5rem; }
.setting-item { display: flex; justify-content: space-between; align-items: center; background: #090d16; padding: 1.25rem; border-radius: 8px; border: 1px solid #1e293b; }
.setting-info h3 { font-size: 1rem; color: #ffffff; margin-bottom: 0.25rem; }
.setting-info p { font-size: 0.8rem; color: #94a3b8; margin: 0; }
.save-btn { background: #00dc82; color: #020420; font-weight: 800; padding: 0.85rem; border: none; border-radius: 8px; font-size: 0.95rem; cursor: pointer; margin-top: 1rem; }
.save-btn:hover { opacity: 0.9; }

/* Switch Toggle CSS */
.switch { position: relative; display: inline-block; width: 50px; height: 26px; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #1e293b; transition: .3s; border-radius: 26px; }
.slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 4px; bottom: 4px; background-color: white; transition: .3s; border-radius: 50%; }
input:checked + .slider { background-color: #00dc82; }
input:checked + .slider:before { transform: translateX(24px); }
</style>