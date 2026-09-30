<!-- app/pages/tools/proof-of-code.vue -->
<script setup lang="ts">
import { ref } from 'vue'

const { isAuthenticated, consumeQuota } = useAuthCore()

useHead({
  title: 'Proof of Code (Vault) v2.3 — DKP Tools',
  meta: [{ name: 'description', content: 'Notarizzazione e Hash Crittografico di sorgenti software' }]
})

const codeTitle = ref('')
const sourceSnippet = ref('')
const isNotarizing = ref(false)
const notarizationResult = ref<{ sha256: string; timestamp: string; certificateId: string } | null>(null)

async function notarizeCode() {
  if (!isAuthenticated.value) {
    alert('Per favore, effettua il login per registrare il sorgente nel Vault.')
    return
  }

  isNotarizing.value = true
  try {
    const res = await $fetch('/api/v2.3/vault/notarize', {
      method: 'POST',
      body: { title: codeTitle.value, code: sourceSnippet.value }
    })
    notarizationResult.value = res
    consumeQuota(1)
  } catch (err: any) {
    alert(err.data?.message || 'Errore durante la notarizzazione nel Vault.')
  } finally {
    isNotarizing.value = false
  }
}
</script>

<template>
  <div class="tool-page">
    <div class="tool-header">
      <div class="title-group">
        <h1>🛡️ Proof of Code (Vault)</h1>
        <span class="version-badge v23">v2.3</span>
      </div>
      <p class="subtitle">Notarizzazione immutabile di frammenti di codice e calcolo dell'impronta digitale SHA-256.</p>
    </div>

    <div class="tool-card">
      <div class="form-group">
        <label>Titolo del Sorgente / Modulo</label>
        <input v-model="codeTitle" type="text" placeholder="es. Algorithm_JWT_Validator.ts" class="dark-input" />
      </div>

      <div class="form-group">
        <label>Codice Sorgente da Certificare</label>
        <textarea v-model="sourceSnippet" rows="6" class="dark-input code-font" placeholder="// Incolla qui il codice da notarizzare nel Vault..."></textarea>
      </div>

      <button @click="notarizeCode" :disabled="isNotarizing || !sourceSnippet.trim()" class="action-btn">
        <span v-if="isNotarizing">⏳ Generazione Hash & Notarizzazione...</span>
        <span v-else>🔒 Registra nel Vault Crittografico</span>
      </button>

      <div v-if="notarizationResult" class="cert-card">
        <div class="cert-header">
          <span>📜 Certificato di Notarizzazione emesso</span>
          <span class="cert-id">ID: {{ notarizationResult.certificateId }}</span>
        </div>
        <div class="cert-body">
          <p><strong>SHA-256 Hash:</strong> <code>{{ notarizationResult.sha256 }}</code></p>
          <p><strong>Timestamp Marcatura:</strong> {{ notarizationResult.timestamp }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tool-page { max-width: 1000px; margin: 0 auto; padding: 2rem 1.5rem; color: #cbd5e1; }
.title-group { display: flex; align-items: center; gap: 0.75rem; }
.title-group h1 { font-size: 2rem; color: #fff; margin: 0; font-weight: 900; }
.version-badge.v23 { background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid #38bdf8; font-size: 0.75rem; font-weight: 800; padding: 0.2rem 0.6rem; border-radius: 4px; }
.subtitle { color: #94a3b8; margin: 0.5rem 0 1.5rem; }
.tool-card { background: #090d16; border: 1px solid #1e293b; border-radius: 12px; padding: 1.75rem; display: flex; flex-direction: column; gap: 1.25rem; }
.form-group { display: flex; flex-direction: column; gap: 0.5rem; }
.form-group label { font-size: 0.85rem; font-weight: 700; color: #94a3b8; }
.dark-input { background: #020420; border: 1px solid #1e293b; color: #fff; padding: 0.75rem; border-radius: 8px; font-family: inherit; }
.code-font { font-family: monospace; font-size: 0.85rem; color: #38bdf8; }
.action-btn { background: #00dc82; color: #020420; border: none; font-weight: 800; padding: 0.85rem; border-radius: 8px; cursor: pointer; }
.cert-card { background: #020420; border: 1px solid #00dc82; border-radius: 8px; overflow: hidden; margin-top: 1rem; }
.cert-header { background: rgba(0, 220, 130, 0.15); color: #00dc82; padding: 0.6rem 1rem; display: flex; justify-content: space-between; font-weight: 700; font-size: 0.85rem; }
.cert-body { padding: 1rem; font-size: 0.88rem; line-height: 1.6; }
.cert-body code { color: #38bdf8; font-family: monospace; }
</style>