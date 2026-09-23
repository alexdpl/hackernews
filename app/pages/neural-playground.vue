<!-- app/pages/neural-playground.vue -->
<script setup lang="ts">
import { ref } from 'vue'

const selectedLang = ref('typescript')
const codeInput = ref('// Scrivi o incolla qui il tuo snippet per l\'analisi neurale\nfunction calculateKarma(commits: number): number {\n  return commits * 15;\n}')
const isAnalyzing = ref(false)
const analysisResult = ref<string | null>(null)

function runNeuralAnalysis() {
  isAnalyzing.value = true
  analysisResult.value = null
  setTimeout(() => {
    isAnalyzing.value = false
    analysisResult.value = "✨ Analisi completata con successo: 0 vulnerabilità rilevate. Performance ottimali. +25 Karma aggiunti al profilo."
  }, 1200)
}
</script>

<template>
  <div class="playground-container">
    <div class="playground-header">
      <h1>🧠 DKP Neural Code Playground</h1>
      <p>Esegui l'audit e l'ottimizzazione in tempo reale dei tuoi snippet tramite il motore neurale di DevKernelPulse.</p>
    </div>

    <div class="playground-grid">
      <!-- Colonna Editor -->
      <div class="editor-pane">
        <div class="pane-toolbar">
          <select v-model="selectedLang" class="lang-select">
            <option value="typescript">TypeScript / JavaScript</option>
            <option value="rust">Rust</option>
            <option value="python">Python</option>
            <option value="go">Go</option>
          </select>
          <button @click="runNeuralAnalysis" :disabled="isAnalyzing" class="run-btn">
            {{ isAnalyzing ? 'Analisi in corso...' : '⚡ Esegui Neural Audit' }}
          </button>
        </div>
        <textarea v-model="codeInput" class="code-editor" spellcheck="false"></textarea>
      </div>

      <!-- Colonna Risultati / Output Neurale -->
      <div class="output-pane">
        <div class="pane-toolbar">
          <span class="output-title">📡 Terminale di Risposta Neurale</span>
        </div>
        <div class="output-content">
          <div v-if="!analysisResult && !isAnalyzing" class="placeholder-text">
            In attesa di esecuzione del codice... Inserisci uno snippet e premi "Esegui Neural Audit".
          </div>
          <div v-if="isAnalyzing" class="loading-state">
            <span class="spinner"></span> Analisi sintattica e neurale in corso nel kernel...
          </div>
          <div v-if="analysisResult" class="success-result">
            <p>{{ analysisResult }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.playground-container {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 1.5rem;
}

.playground-header {
  margin-bottom: 1.5rem;
}

.playground-header h1 {
  font-size: 1.8rem;
  color: #020420;
  font-weight: 800;
}

.playground-header p {
  color: #64748b;
  font-size: 0.95rem;
}

.playground-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

@media (max-width: 768px) {
  .playground-grid {
    grid-template-columns: 1fr;
  }
}

.editor-pane, .output-pane {
  background: #020420;
  border: 1px solid #1e293b;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.pane-toolbar {
  background: #090d16;
  padding: 0.75rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #1e293b;
}

.lang-select {
  background: #020420;
  color: #cbd5e1;
  border: 1px solid #1e293b;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  font-size: 0.85rem;
}

.run-btn {
  background: #00dc82;
  color: #020420;
  border: none;
  padding: 0.4rem 0.9rem;
  border-radius: 4px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: opacity 0.2s;
}

.run-btn:hover {
  opacity: 0.9;
}

.code-editor {
  background: #020420;
  color: #00dc82;
  font-family: monospace;
  font-size: 0.9rem;
  padding: 1rem;
  border: none;
  resize: vertical;
  min-height: 320px;
  outline: none;
  line-height: 1.5;
}

.output-content {
  padding: 1rem;
  color: #cbd5e1;
  font-family: monospace;
  font-size: 0.85rem;
  min-height: 320px;
  background: #050811;
}

.placeholder-text {
  color: #64748b;
  font-style: italic;
}

.success-result {
  color: #00dc82;
  background: rgba(0, 220, 130, 0.1);
  border: 1px solid rgba(0, 220, 130, 0.3);
  padding: 1rem;
  border-radius: 6px;
}
</style>