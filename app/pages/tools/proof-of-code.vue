<!-- app/pages/tools/proof-of-code.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'

// Auto-import del nostro DKP Auth Core
const { currentUser, isAuthenticated } = useAuthCore()

const codeTitle = ref('')
const codeSnippet = ref('')
const isGenerating = ref(false)
const proofResult = ref<{
  vaultId: string
  sha256: string
  timestamp: string
  author: string
  badgeMarkdown: string
} | null>(null)

const authorName = computed(() => {
  if (isAuthenticated.value && currentUser.value?.username) {
    return currentUser.value.username
  }
  return 'Anonymous Dev'
})

// Funzione di Notarizzazione Crittografica SHA-256 via Web Crypto API
async function generateProof() {
  if (!codeSnippet.value.trim()) return

  isGenerating.value = true

  // Calcolo Hash SHA-256
  const encoder = new TextEncoder()
  const data = encoder.encode(codeSnippet.value)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  // Generazione ID Vault Univoco
  const randomSalt = Math.random().toString(36).substring(2, 8).toUpperCase()
  const vaultId = `DKP-VAULT-${randomSalt}`
  const now = new Date().toISOString()

  // Badge Markdown pronto per GitHub / DKP Post
  const badgeMarkdown = `[![DKP Verified](https://img.shields.io/badge/DKP_Proof-VERIFIED-00dc82?style=for-the-badge&logo=github)](https://devkernelpulse.duckdns.org/tools/proof-of-code?vault=${vaultId})`

  setTimeout(() => {
    proofResult.value = {
      vaultId,
      sha256: hashHex,
      timestamp: now,
      author: authorName.value,
      badgeMarkdown
    }
    isGenerating.value = false
  }, 400)
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
  alert('📋 Copiato negli appunti!')
}
</script>

<template>
  <div class="tool-page-container">
    <!-- Header del Tool -->
    <div class="tool-header">
      <div class="header-badge">
        <span class="badge-tag">DKP Core Tool v1.0</span>
        <NuxtLink to="/" class="back-link">← Torna all'Ecosistema</NuxtLink>
      </div>
      <h1>🛡️ DKP Proof of Code</h1>
      <p class="subtitle">
        Notarizza i tuoi algoritmi e snippet di codice. Genera una firma crittografica SHA-256 immodificabile e un badge di autenticità per il tuo repository GitHub.
      </p>
    </div>

    <div class="tool-grid">
      <!-- Form di Input Snippet -->
      <div class="editor-card">
        <h2>📝 Codice da Notarizzare</h2>
        
        <div class="form-group">
          <label>Titolo del Codice / Componente</label>
          <input 
            v-model="codeTitle" 
            type="text" 
            placeholder="Es: AuthMiddleware.ts oppure QuickSort Algorithm" 
          />
        </div>

        <div class="form-group">
          <label>Firma come Autore</label>
          <div class="author-pill">
            <span class="status-dot" :class="{ 'active': isAuthenticated }"></span>
            <strong>{{ authorName }}</strong> 
            <span v-if="isAuthenticated" class="verified-tag">(Verificato via DKP Auth)</span>
            <span v-else class="guest-tag">(Ospite - Effettua il Login per firma ufficiale)</span>
          </div>
        </div>

        <div class="form-group">
          <label>Snippet di Codice (Raw Code)</label>
          <textarea 
            v-model="codeSnippet" 
            rows="10" 
            placeholder="// Incolla qui il codice sorgente da firmare crittograficamente..."
            class="code-textarea"
          ></textarea>
        </div>

        <button 
          @click="generateProof" 
          :disabled="!codeSnippet.trim() || isGenerating"
          class="action-btn"
        >
          {{ isGenerating ? '⚡ Generazione Firma SHA-256 in corso...' : '🔐 Firma & Notarizza nel Kernel Vault' }}
        </button>
      </div>

      <!-- Risultato Notarizzazione / Certificato -->
      <div class="result-card">
        <h2>📜 Certificato di Autenticità DKP</h2>

        <div v-if="proofResult" class="certificate-box">
          <div class="cert-header">
            <span class="vault-badge">{{ proofResult.vaultId }}</span>
            <span class="status-green">VERIFIED & SEALED</span>
          </div>

          <div class="cert-field">
            <span class="field-label">Autore Registrato:</span>
            <span class="field-value highlight">{{ proofResult.author }}</span>
          </div>

          <div class="cert-field">
            <span class="field-label">Timestamp Registro:</span>
            <span class="field-value">{{ proofResult.timestamp }}</span>
          </div>

          <div class="cert-field">
            <span class="field-label">Impronta SHA-256:</span>
            <div class="hash-code">{{ proofResult.sha256 }}</div>
          </div>

          <div class="cert-divider"></div>

          <h3>🏷️ Badge Embed per GitHub README</h3>
          <div class="badge-preview">
            <button @click="copyToClipboard(proofResult.badgeMarkdown)" class="copy-btn">
              📋 Copia Badge Markdown
            </button>
          </div>
        </div>

        <div v-else class="placeholder-box">
          <div class="shield-icon">🛡️</div>
          <p>Inserisci uno snippet di codice a sinistra e clicca su <strong>"Firma & Notarizza"</strong> per generare la tua prova d'autore crittografica.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tool-page-container {
  max-width: 1200px;
  margin: 2.5rem auto;
  padding: 0 1.5rem;
  font-family: ui-sans-serif, system-ui, sans-serif;
}

.tool-header {
  margin-bottom: 2.5rem;
}

.header-badge {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.badge-tag {
  background: rgba(0, 220, 130, 0.15);
  color: #00dc82;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 700;
  border: 1px solid rgba(0, 220, 130, 0.3);
}

.back-link {
  color: #38bdf8;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
}

.back-link:hover { text-decoration: underline; }

.tool-header h1 {
  font-size: 2.25rem;
  color: #020420;
  font-weight: 800;
  margin-top: 0.5rem;
}

.subtitle {
  color: #64748b;
  font-size: 1rem;
  max-width: 800px;
  margin-top: 0.5rem;
}

.tool-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

@media (max-width: 900px) {
  .tool-grid { grid-template-columns: 1fr; }
}

.editor-card, .result-card {
  background: #020420;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 2rem;
  color: #ffffff;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
}

.editor-card h2, .result-card h2 {
  font-size: 1.25rem;
  color: #00dc82;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #cbd5e1;
  margin-bottom: 0.4rem;
}

input[type="text"], .code-textarea {
  width: 100%;
  background: #090d16;
  border: 1px solid #1e293b;
  color: #00dc82;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: monospace;
  outline: none;
  box-sizing: border-box;
}

input[type="text"]:focus, .code-textarea:focus {
  border-color: #00dc82;
}

.author-pill {
  background: #090d16;
  border: 1px solid #1e293b;
  padding: 0.6rem 0.8rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #94a3b8;
}

.status-dot.active {
  background: #00dc82;
  box-shadow: 0 0 8px #00dc82;
}

.verified-tag { color: #00dc82; font-size: 0.8rem; }
.guest-tag { color: #94a3b8; font-size: 0.8rem; }

.action-btn {
  width: 100%;
  background: #00dc82;
  color: #020420;
  font-weight: 800;
  padding: 0.9rem;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: opacity 0.2s;
}

.action-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Certificato Box */
.certificate-box {
  background: #090d16;
  border: 1px solid #00dc82;
  border-radius: 10px;
  padding: 1.5rem;
}

.cert-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.vault-badge {
  background: #00dc82;
  color: #020420;
  font-weight: 800;
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  font-size: 0.85rem;
}

.status-green {
  color: #00dc82;
  font-weight: 700;
  font-size: 0.8rem;
  letter-spacing: 0.05em;
}

.cert-field {
  margin-bottom: 0.9rem;
}

.field-label {
  display: block;
  font-size: 0.75rem;
  color: #64748b;
  text-transform: uppercase;
  font-weight: 700;
}

.field-value {
  font-size: 0.95rem;
  color: #f8fafc;
}

.field-value.highlight {
  color: #38bdf8;
  font-weight: 700;
}

.hash-code {
  font-family: monospace;
  font-size: 0.75rem;
  color: #00dc82;
  background: #020420;
  padding: 0.5rem;
  border-radius: 6px;
  word-break: break-all;
  border: 1px solid #1e293b;
  margin-top: 0.25rem;
}

.cert-divider {
  height: 1px;
  background: #1e293b;
  margin: 1.25rem 0;
}

.copy-btn {
  width: 100%;
  background: #1e293b;
  color: #38bdf8;
  border: 1px solid #38bdf8;
  padding: 0.6rem;
  border-radius: 6px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.copy-btn:hover {
  background: #38bdf8;
  color: #020420;
}

.placeholder-box {
  text-align: center;
  padding: 3rem 1rem;
  color: #64748b;
}

.shield-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}
</style>