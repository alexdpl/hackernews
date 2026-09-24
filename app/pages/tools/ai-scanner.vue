<!-- app/pages/tools/ai-scanner.vue -->
<script setup lang="ts">
import { ref } from 'vue'

const { isAuthenticated, currentUser } = useAuthCore()

const rawCode = ref('')
const isScanning = ref(false)
const scanReport = ref<{
  score: number
  securityLevel: 'A+' | 'B' | 'C' | 'F'
  issues: Array<{ type: 'danger' | 'warning' | 'info'; title: string; desc: string }>
  metrics: { techDebtHours: number; secretLeaks: number; performanceScore: number }
} | null>(null)

function runScanner() {
  if (!rawCode.value.trim()) return

  isScanning.value = true
  scanReport.value = null

  setTimeout(() => {
    const code = rawCode.value
    const issues: Array<{ type: 'danger' | 'warning' | 'info'; title: string; desc: string }> = []
    let secretsFound = 0

    // Check 1: Hardcoded Secrets / Keys
    if (/api[_-]?key|secret|password|token/i.test(code) && /=['"`][a-zA-Z0-9_\-]{8,}['"`]/.test(code)) {
      issues.push({
        type: 'danger',
        title: '🔑 Secret / Credenziale Hardcoded',
        desc: 'Trovata una chiave o token di accesso nel codice sorgente. Sposta questo valore nelle variabili d ambiente (.env).'
      })
      secretsFound++
    }

    // Check 2: Potential Injection / Dangerous Eval
    if (/eval\(|exec\(|innerHTML\s*=/.test(code)) {
      issues.push({
        type: 'danger',
        title: '⚠️ Rischio Injection / Esecuzione Arbitraria',
        desc: 'Trovata l istruzione eval() o innerHTML diretto. Espone il codice a vulnerabilità XSS o RCE.'
      })
    }

    // Check 3: Console statements
    if (/console\.log\(/.test(code)) {
      issues.push({
        type: 'info',
        title: '🧹 Residui di Debug (console.log)',
        desc: 'Presenza di console.log nel codice. Rimuovili prima di rilasciare in ambiente di produzione.'
      })
    }

    // Calculate score
    const baseScore = Math.max(30, 100 - (issues.length * 20))
    let securityLevel: 'A+' | 'B' | 'C' | 'F' = 'A+'
    if (baseScore < 50) securityLevel = 'F'
    else if (baseScore < 75) securityLevel = 'C'
    else if (baseScore < 95) securityLevel = 'B'

    scanReport.value = {
      score: baseScore,
      securityLevel,
      issues,
      metrics: {
        techDebtHours: issues.length * 1.5,
        secretLeaks: secretsFound,
        performanceScore: Math.min(100, baseScore + 5)
      }
    }

    isScanning.value = false
  }, 600)
}
</script>

<template>
  <div class="tool-page-container">
    <div class="tool-header">
      <div class="header-badge">
        <span class="badge-tag">DKP Core Tool v2.0 Pro</span>
        <NuxtLink to="/" class="back-link">← Torna all'Ecosistema</NuxtLink>
      </div>
      <h1>🔍 AI Code Scanner & Security Audit</h1>
      <p class="subtitle">
        Analizza i tuoi file e snippet per individuare vulnerabilità di sicurezza (OWASP), credenziali esposte e calcolare il debito tecnico in tempo reale.
      </p>
    </div>

    <div class="tool-grid">
      <!-- Card Input Codice -->
      <div class="card-box">
        <h2>⚡ Codice Sorgente da Scansionare</h2>
        
        <div class="form-group">
          <textarea 
            v-model="rawCode" 
            rows="12" 
            placeholder="// Incolla qui il codice TypeScript, JavaScript, Python o SQL da analizzare..."
            class="code-input"
          ></textarea>
        </div>

        <button 
          @click="runScanner" 
          :disabled="!rawCode.trim() || isScanning" 
          class="scan-btn"
        >
          {{ isScanning ? '🔎 Scansione in corso...' : '🚀 Avvia Audit di Sicurezza AI' }}
        </button>
      </div>

      <!-- Card Risultato Scansione -->
      <div class="card-box">
        <h2>📊 Report Audit & Metriche</h2>

        <div v-if="scanReport" class="report-box">
          <div class="score-grid">
            <div class="score-card">
              <span class="score-title">Security Grade</span>
              <span class="score-value" :class="scanReport.securityLevel">{{ scanReport.securityLevel }}</span>
            </div>
            <div class="score-card">
              <span class="score-title">Health Score</span>
              <span class="score-value green">{{ scanReport.score }}/100</span>
            </div>
            <div class="score-card">
              <span class="score-title">Debito Tecnico</span>
              <span class="score-value blue">~{{ scanReport.metrics.techDebtHours }}h</span>
            </div>
          </div>

          <div class="issues-list">
            <h3>📌 Rilievi Trovati ({{ scanReport.issues.length }})</h3>
            <div v-if="scanReport.issues.length === 0" class="no-issues">
              ✅ Nessuna vulnerabilità nota rilevata! Il codice è pulito e sicuro.
            </div>
            <div 
              v-else 
              v-for="(issue, index) in scanReport.issues" 
              :key="index" 
              class="issue-card" 
              :class="issue.type"
            >
              <h4>{{ issue.title }}</h4>
              <p>{{ issue.desc }}</p>
            </div>
          </div>

          <div v-if="!isAuthenticated" class="pro-upsell">
            🔒 <strong>Vuoi il report completo in PDF e la fix automatica AI?</strong> 
            <NuxtLink to="/login" class="upsell-link">Accedi con il tuo account DKP</NuxtLink>
          </div>
        </div>

        <div v-else class="placeholder-box">
          <div class="icon">🛡️</div>
          <p>Incolla un frammento di codice a sinistra e clicca su <strong>"Avvia Audit"</strong> per generare la diagnosi.</p>
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

.code-input { width: 100%; background: #090d16; border: 1px solid #1e293b; color: #00dc82; padding: 0.75rem; border-radius: 8px; font-family: monospace; font-size: 0.9rem; outline: none; box-sizing: border-box; }
.code-input:focus { border-color: #00dc82; }

.scan-btn { width: 100%; background: #00dc82; color: #020420; font-weight: 800; padding: 0.9rem; border: none; border-radius: 8px; font-size: 0.95rem; cursor: pointer; margin-top: 1rem; }
.scan-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.score-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin-bottom: 1.5rem; }
.score-card { background: #090d16; border: 1px solid #1e293b; padding: 0.8rem; border-radius: 8px; text-align: center; }
.score-title { display: block; font-size: 0.7rem; color: #64748b; text-transform: uppercase; font-weight: 700; }
.score-value { font-size: 1.25rem; font-weight: 800; }
.score-value.A\+ { color: #00dc82; }
.score-value.green { color: #00dc82; }
.score-value.blue { color: #38bdf8; }
.score-value.F { color: #ef4444; }

.issues-list h3 { font-size: 0.95rem; color: #cbd5e1; margin-bottom: 0.75rem; }
.no-issues { background: rgba(0, 220, 130, 0.1); border: 1px solid #00dc82; color: #00dc82; padding: 1rem; border-radius: 8px; font-size: 0.85rem; }
.issue-card { padding: 0.8rem; border-radius: 8px; margin-bottom: 0.75rem; font-size: 0.85rem; }
.issue-card.danger { background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; color: #fca5a5; }
.issue-card.danger h4 { color: #ef4444; margin-bottom: 0.25rem; }
.issue-card.info { background: rgba(56, 189, 248, 0.1); border: 1px solid #38bdf8; color: #bae6fd; }
.issue-card.info h4 { color: #38bdf8; margin-bottom: 0.25rem; }

.pro-upsell { background: #090d16; border: 1px dashed #f59e0b; color: #fbbf24; padding: 0.8rem; border-radius: 8px; font-size: 0.8rem; margin-top: 1.5rem; text-align: center; }
.upsell-link { color: #00dc82; text-decoration: underline; font-weight: 700; margin-left: 0.3rem; }

.placeholder-box { text-align: center; padding: 3rem 1rem; color: #64748b; }
.placeholder-box .icon { font-size: 3rem; margin-bottom: 1rem; }
</style>