<!-- app/pages/tools/neural-playground.vue -->
<script setup lang="ts">
import { ref } from 'vue'

const { isAuthenticated, currentUser } = useAuthCore()

useHead({
  title: 'Neural Playground v2.3 — DKP Tools',
  meta: [{ name: 'description', content: 'Testing Prompt e Modelli IA con DKP Neural Engine v2.3' }]
})

// Stato reattivo originale con DKP-Neural-v4 (Coder) e parametri LLM
const selectedModel = ref('DKP-Neural-v4 (Coder)')
const systemPrompt = ref('Sei il Kernel Architect di DevKernelPulse, un assistente IA esperto in sicurezza, architetture SaaS modulari e Nuxt.js.')
const userPrompt = ref('Scrivi un middleware di autenticazione sicuro in TypeScript per proteggere le rotte admin.')
const temperature = ref(0.7)
const maxTokens = ref(1024)

const isLoading = ref(false)
const responseOutput = ref('')
const errorMessage = ref('')

async function runNeuralTest() {
  errorMessage.value = ''
  
  if (!isAuthenticated.value) {
    errorMessage.value = 'Autenticazione richiesta per accedere al Neural Playground.'
    return
  }

  isLoading.value = true
  responseOutput.value = ''

  try {
    const res = await $fetch('/api/v2.3/neural/execute', {
      method: 'POST',
      body: {
        model: selectedModel.value,
        systemPrompt: systemPrompt.value,
        userPrompt: userPrompt.value,
        temperature: temperature.value,
        maxTokens: maxTokens.value,
        user: currentUser.value?.username || 'guest'
      }
    })

    responseOutput.value = res.result || 'Elaborazione completata con successo.'
  } catch (err: any) {
    errorMessage.value = err.data?.message || 'Errore durante l\'esecuzione del test neurale.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="tool-page">
    <div class="tool-header">
      <div class="title-group">
        <h1>🧠 Neural Playground</h1>
        <span class="version-badge v23">v2.3</span>
      </div>
      <p class="subtitle">Testing interattivo di prompt e modelli IA con parametri avanzati dell'ecosistema DKP.</p>
    </div>

    <div class="tool-card">
      <!-- SELEZIONE MODELLO & PARAMETRI -->
      <div class="grid-2">
        <div class="form-group">
          <label>Seleziona Modello IA</label>
          <select v-model="selectedModel" class="dark-input">
            <option value="DKP-Neural-v4 (Coder)">DKP-Neural-v4 (Coder)</option>
            <option value="DKP-SecAudit-v2">DKP-SecAudit-v2 (Security)</option>
            <option value="DKP-FastKernel-v1">DKP-FastKernel-v1 (Lightweight)</option>
          </select>
        </div>

        <div class="params-group">
          <div class="form-group">
            <label>Temperature: {{ temperature }}</label>
            <input v-model.number="temperature" type="range" min="0" max="1" step="0.1" class="slider" />
          </div>
          <div class="form-group">
            <label>Max Tokens: {{ maxTokens }}</label>
            <input v-model.number="maxTokens" type="number" step="128" min="256" max="4096" class="dark-input" />
          </div>
        </div>
      </div>

      <!-- SYSTEM PROMPT -->
      <div class="form-group">
        <label>System Prompt (Istruzioni di Ruolo)</label>
        <textarea v-model="systemPrompt" rows="2" class="dark-input code-font"></textarea>
      </div>

      <!-- USER PROMPT -->
      <div class="form-group">
        <label>User Prompt / Input Code</label>
        <textarea v-model="userPrompt" rows="4" class="dark-input code-font" placeholder="Inserisci il prompt o il codice da elaborare..."></textarea>
      </div>

      <div v-if="errorMessage" class="error-box">
        ⚠️ {{ errorMessage }}
      </div>

      <button @click="runNeuralTest" :disabled="isLoading || !userPrompt.trim()" class="action-btn">
        <span v-if="isLoading">⚡ Elaborazione con {{ selectedModel }} in corso...</span>
        <span v-else>🚀 Esegui Test Neurale</span>
      </button>

      <!-- OUTPUT -->
      <div v-if="responseOutput" class="output-box">
        <h3>Risultato {{ selectedModel }}:</h3>
        <pre><code>{{ responseOutput }}</code></pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tool-page { max-width: 1000px; margin: 0 auto; padding: 2rem 1.5rem; color: #cbd5e1; }
.tool-header { margin-bottom: 2rem; }
.title-group { display: flex; align-items: center; gap: 0.75rem; }
.title-group h1 { font-size: 2rem; color: #fff; margin: 0; font-weight: 900; }
.version-badge.v23 { background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid #38bdf8; font-size: 0.75rem; font-weight: 800; padding: 0.2rem 0.6rem; border-radius: 4px; }
.subtitle { color: #94a3b8; margin-top: 0.5rem; }
.tool-card { background: #090d16; border: 1px solid #1e293b; border-radius: 12px; padding: 1.75rem; display: flex; flex-direction: column; gap: 1.25rem; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
@media (max-width: 768px) { .grid-2 { grid-template-columns: 1fr; } }
.params-group { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-group { display: flex; flex-direction: column; gap: 0.5rem; }
.form-group label { font-size: 0.85rem; font-weight: 700; color: #94a3b8; }
.dark-input { background: #020420; border: 1px solid #1e293b; color: #fff; padding: 0.75rem; border-radius: 8px; font-family: inherit; font-size: 0.9rem; }
.code-font { font-family: monospace; font-size: 0.85rem; color: #38bdf8; }
.slider { accent-color: #00dc82; height: 8px; margin-top: 0.5rem; }
.action-btn { background: #00dc82; color: #020420; border: none; font-weight: 800; padding: 0.85rem; border-radius: 8px; cursor: pointer; transition: opacity 0.2s; }
.action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.error-box { background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; color: #f87171; padding: 0.75rem; border-radius: 8px; font-size: 0.88rem; }
.output-box { background: #020420; border: 1px solid #1e293b; border-radius: 8px; padding: 1rem; margin-top: 1rem; }
.output-box h3 { color: #00dc82; font-size: 0.95rem; margin-top: 0; }
.output-box pre { color: #38bdf8; font-family: monospace; white-space: pre-wrap; margin: 0; }
</style>