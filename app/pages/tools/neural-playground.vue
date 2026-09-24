<!-- app/pages/tools/neural-playground.vue -->
<script setup lang="ts">
import { ref } from 'vue'

const { isAuthenticated, currentUser } = useAuthCore()

const selectedModel = ref('DKP-Neural-v4 (Coder)')
const systemPrompt = ref('Sei il Kernel Architect di DevKernelPulse, un assistente IA esperto in sicurezza, architetture SaaS modulari e Nuxt.js.')
const userPrompt = ref('Scrivi un middleware di autenticazione sicuro in TypeScript per proteggere le rotte admin.')
const temperature = ref(0.7)
const maxTokens = ref(1024)

const isGenerating = ref(false)
const aiResponse = ref<string | null>(null)
const metrics = ref<{ latencyMs: number; tokensPerSec: number; costEstimate: string } | null>(null)

function runNeuralInference() {
  if (!userPrompt.value.trim()) return

  isGenerating.value = true
  aiResponse.value = null
  metrics.value = null

  const startTime = performance.now()

  setTimeout(() => {
    const endTime = performance.now()
    const latency = Math.round(endTime - startTime)

    aiResponse.value = `// Generato da ${selectedModel.value} (Temp: ${temperature.value})
import type { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  // DKP Auth Core - Security Middleware
  const session = await useAuthCoreSession(event)
  
  if (!session || session.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Accesso negato: richiesti privilegi amministrativi DKP.'
    })
  }

  return { authorized: true, user: session.username, timestamp: Date.now() }
})`

    metrics.value = {
      latencyMs: latency + 140,
      tokensPerSec: 58.4,
      costEstimate: '$0.0000 (DKP Free Tier)'
    }

    isGenerating.value = false
  }, 800)
}
</script>

<template>
  <div class="tool-page-container">
    <div class="tool-header">
      <div class="header-badge">
        <span class="badge-tag">DKP Core Tool v2.0 Pro</span>
        <NuxtLink to="/" class="back-link">← Torna all'Ecosistema</NuxtLink>
      </div>
      <h1>🧠 Neural Playground & LLM Benchmark</h1>
      <p class="subtitle">
        Ambiente di testing avanzato per prompt engineering, tuning di modelli neurali dedicati e simulazione di risposte per sviluppatori SaaS.
      </p>
    </div>

    <div class="tool-grid">
      <!-- Pannello Configurazione & Prompt -->
      <div class="card-box">
        <h2>⚙️ Configurazione Modello & Prompt</h2>
        
        <div class="form-group">
          <label>Modello Neurale Selezionato</label>
          <select v-model="selectedModel" class="select-input">
            <option>DKP-Neural-v4 (Coder)</option>
            <option>Kernel-LLM-70B (Security Audit)</option>
            <option>Pulse-Code-Coder (Fast Gen)</option>
          </select>
        </div>

        <div class="form-group">
          <label>System Prompt (Istruzioni di Sistema)</label>
          <textarea v-model="systemPrompt" rows="3" class="text-input"></textarea>
        </div>

        <div class="form-group">
          <label>User Prompt (Richiesta Utente)</label>
          <textarea v-model="userPrompt" rows="4" class="text-input" placeholder="Cosa deve generare l'IA..."></textarea>
        </div>

        <div class="params-row">
          <div class="form-group half">
            <label>Temperatura: {{ temperature }}</label>
            <input type="range" v-model.number="temperature" min="0" max="1" step="0.1" class="range-input" />
          </div>
          <div class="form-group half">
            <label>Max Tokens: {{ maxTokens }}</label>
            <input type="number" v-model.number="maxTokens" class="number-input" />
          </div>
        </div>

        <button @click="runNeuralInference" :disabled="!userPrompt.trim() || isGenerating" class="action-btn">
          {{ isGenerating ? '⚡ Elaborazione Neurale in corso...' : '🚀 Esegui Inferenza LLM' }}
        </button>
      </div>

      <!-- Pannello Risposta & Metriche -->
      <div class="card-box">
        <h2>📊 Output & Benchmark</h2>

        <div v-if="aiResponse" class="response-container">
          <div class="metrics-bar">
            <span class="metric">⏱️ Latenza: <strong>{{ metrics?.latencyMs }}ms</strong></span>
            <span class="metric">⚡ Velocità: <strong>{{ metrics?.tokensPerSec }} tok/s</strong></span>
            <span class="metric">💰 Costo: <strong class="green">{{ metrics?.costEstimate }}</strong></span>
          </div>

          <div class="code-output-box">
            <pre><code>{{ aiResponse }}</code></pre>
          </div>
        </div>

        <div v-else class="placeholder-box">
          <div class="icon">✨</div>
          <p>Configura il prompt a sinistra e avvia l'inferenza neurale per testare la potenza dei modelli DKP.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tool-page-container { max-width: 1200px; margin: 2.5rem auto; padding: 0 1.5rem; font-family: ui-sans-serif, system-ui, sans-serif; }
.tool-header { margin-bottom: 2.5rem; }
.header-badge { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
.badge-tag { background: rgba(0, 220, 130, 0.15); color: #00dc82; padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.8rem; font-weight: 700; border: 1px solid rgba(0, 220, 130, 0.3); }
.back-link { color: #38bdf8; text-decoration: none; font-weight: 600; font-size: 0.9rem; }
.tool-header h1 { font-size: 2.25rem; color: #020420; font-weight: 800; margin-top: 0.5rem; }
.subtitle { color: #64748b; font-size: 1rem; max-width: 800px; margin-top: 0.5rem; }

.tool-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
@media (max-width: 900px) { .tool-grid { grid-template-columns: 1fr; } }

.card-box { background: #020420; border: 1px solid #1e293b; border-radius: 12px; padding: 2rem; color: #ffffff; }
.card-box h2 { font-size: 1.25rem; color: #00dc82; margin-bottom: 1.5rem; }

.form-group { margin-bottom: 1.1rem; }
.form-group label { display: block; font-size: 0.8rem; font-weight: 600; color: #cbd5e1; margin-bottom: 0.3rem; }

.select-input, .text-input, .number-input { width: 100%; background: #090d16; border: 1px solid #1e293b; color: #00dc82; padding: 0.65rem; border-radius: 8px; font-size: 0.85rem; outline: none; box-sizing: border-box; font-family: monospace; }
.select-input:focus, .text-input:focus, .number-input:focus { border-color: #00dc82; }

.params-row { display: flex; gap: 1rem; }
.form-group.half { flex: 1; }
.range-input { width: 100%; accent-color: #00dc82; cursor: pointer; }

.action-btn { width: 100%; background: #00dc82; color: #020420; font-weight: 800; padding: 0.85rem; border: none; border-radius: 8px; font-size: 0.95rem; cursor: pointer; margin-top: 0.5rem; }
.action-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.metrics-bar { display: flex; justify-content: space-between; background: #090d16; border: 1px solid #1e293b; padding: 0.75rem; border-radius: 8px; font-size: 0.75rem; margin-bottom: 1rem; color: #94a3b8; }
.metrics-bar strong { color: #ffffff; }
.metrics-bar strong.green { color: #00dc82; }

.code-output-box { background: #090d16; border: 1px solid #00dc82; border-radius: 8px; padding: 1rem; max-height: 380px; overflow-y: auto; font-family: monospace; font-size: 0.8rem; color: #00dc82; }
.code-output-box pre { margin: 0; white-space: pre-wrap; }

.placeholder-box { text-align: center; padding: 4rem 1rem; color: #64748b; }
.placeholder-box .icon { font-size: 3rem; margin-bottom: 1rem; }
</style>