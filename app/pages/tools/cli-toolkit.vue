<!-- app/pages/tools/cli-toolkit.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'

const { isAuthenticated, currentUser } = useAuthCore()

useHead({
  title: 'DKP CLI Toolkit v2.4-GOLD — DKP Tools',
  meta: [
    { name: 'description', content: 'Interfaccia a riga di comando ufficiale per developer: scansioni AI, notarizzazione Vault e gestione API dal terminale.' }
  ]
})

const activeInstallTab = ref<'npm' | 'pnpm' | 'yarn'>('npm')
const commandInput = ref('')
const isCopied = ref(false)

// Terminal Emulator State
const terminalLogs = ref<Array<{ type: 'input' | 'output' | 'error' | 'success'; text: string }>>([
  { type: 'output', text: 'DevKernelPulse CLI Toolkit [v2.4-GOLD]' },
  { type: 'output', text: 'Digita "dkp help" per la lista dei comandi disponibili.\n' }
])

const installCommand = computed(() => {
  switch (activeInstallTab.value) {
    case 'pnpm': return 'pnpm add -g @alexdpl/cli'
    case 'yarn': return 'yarn global add @alexdpl/cli'
    default: return 'npm install -g @alexdpl/cli'
  }
})

function copyInstallCmd() {
  navigator.clipboard.writeText(installCommand.value)
  isCopied.value = true
  setTimeout(() => { isCopied.value = false }, 2000)
}

function handleCommand() {
  const raw = commandInput.value.trim()
  if (!raw) return

  const cmd = raw.toLowerCase()
  terminalLogs.value.push({ type: 'input', text: `dkp@local:~$ ${raw}` })
  commandInput.value = ''

  if (cmd === 'clear') {
    terminalLogs.value = []
    return
  }

  if (cmd === 'dkp help' || cmd === 'help') {
    terminalLogs.value.push({
      type: 'output',
      text: `Comandi DKP CLI v2.4-GOLD disponibili:
  dkp auth login --key <API_KEY>    Autenticazione con chiave API Hub
  dkp ai scan <path>                Scansione vulnerabilità AI con Sentinel
  dkp vault notarize <path>         Notarizzazione e marcatura SHA-256
  dkp news feed                     Fetch ultime notizie Kernel
  dkp status                        Stato dei servizi API e latenza
  clear                             Pulisce lo schermo`
    })
    return
  }

  if (cmd.startsWith('dkp auth login')) {
    terminalLogs.value.push({
      type: 'success',
      text: `✔ Autenticazione completata con successo! Utente collegato: @${currentUser.value?.username || 'alexdpl'}`
    })
    return
  }

  if (cmd.startsWith('dkp ai scan')) {
    terminalLogs.value.push({
      type: 'output',
      text: `🔍 [Pulse Sentinel AI v2.4] Analisi codice in corso...`
    })
    setTimeout(() => {
      terminalLogs.value.push({
        type: 'success',
        text: `✔ Scansione completata: Risk Score [LOW] - 0 Vulnerabilità rilevate.`
      })
    }, 600)
    return
  }

  if (cmd.startsWith('dkp vault notarize')) {
    terminalLogs.value.push({
      type: 'output',
      text: `🛡️ Calcolo hash SHA-256 e notarizzazione Vault...`
    })
    setTimeout(() => {
      terminalLogs.value.push({
        type: 'success',
        text: `✔ Certificato generato! Hash: 8f9a2b4... Certificate ID: #DKP-VAULT-2026-X9`
      })
    }, 600)
    return
  }

  if (cmd === 'dkp news feed') {
    terminalLogs.value.push({
      type: 'output',
      text: `📰 DKP Tech News Feed:
  [1] DKP v2.4-GOLD Ecosystem Released
  [2] Pulse Sentinel AI Scanner Upgrade
  [3] API Authentication Hub Documentation`
    })
    return
  }

  if (cmd === 'dkp status') {
    terminalLogs.value.push({
      type: 'success',
      text: `⚡ DKP API Gateway: ONLINE | Latenza: 14ms | Vault: OPERATIVE`
    })
    return
  }

  terminalLogs.value.push({
    type: 'error',
    text: `Command not found: "${raw}". Digita "dkp help" per la guida.`
  })
}
</script>

<template>
  <div class="tool-page">
    <!-- HERO HEADER -->
    <header class="tool-header">
      <div class="title-group">
        <h1>⚡ DKP CLI Toolkit</h1>
        <span class="version-badge gold">v2.4-GOLD</span>
      </div>
      <p class="subtitle">
        L'interfaccia a riga di comando nativa per sviluppatori. Lancia scansioni AI, notarizza codice sul Vault e interagisci con le API direttamente dal tuo terminale.
      </p>
    </header>

    <!-- INSTALLATION BANNER -->
    <section class="install-card">
      <div class="card-header">
        <h2>📦 Installazione Rapida CLI</h2>
        <div class="pm-tabs">
          <button @click="activeInstallTab = 'npm'" :class="{ active: activeInstallTab === 'npm' }">npm</button>
          <button @click="activeInstallTab = 'pnpm'" :class="{ active: activeInstallTab === 'pnpm' }">pnpm</button>
          <button @click="activeInstallTab = 'yarn'" :class="{ active: activeInstallTab === 'yarn' }">yarn</button>
        </div>
      </div>

      <div class="code-copy-row">
        <code>{{ installCommand }}</code>
        <button @click="copyInstallCmd" class="copy-btn">
          {{ isCopied ? '✔ Copiato!' : '📋 Copia' }}
        </button>
      </div>
    </section>

    <!-- INTERACTIVE TERMINAL EMULATOR -->
    <section class="terminal-section">
      <div class="term-window">
        <div class="term-bar">
          <div class="window-controls">
            <span class="dot red"></span>
            <span class="dot yellow"></span>
            <span class="dot green"></span>
          </div>
          <span class="term-title">interactive emulator — dkp-cli v2.4-GOLD</span>
        </div>

        <div class="term-body">
          <div v-for="(log, idx) in terminalLogs" :key="idx" :class="['log-line', log.type]">
            <pre>{{ log.text }}</pre>
          </div>

          <div class="input-line">
            <span class="prompt">dkp@local:~$</span>
            <input 
              v-model="commandInput" 
              @keyup.enter="handleCommand"
              type="text" 
              placeholder="Prova ad esempio: dkp help, dkp ai scan src/index.ts, dkp status"
              class="cmd-input"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- CHEAT SHEET TABLE -->
    <section class="cheatsheet-section">
      <h2>📜 Cheat Sheet Comandi CLI</h2>
      <div class="table-wrapper">
        <table class="cmd-table">
          <thead>
            <tr>
              <th>Comando</th>
              <th>Descrizione</th>
              <th>Esempio Uso</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>dkp auth login</code></td>
              <td>Autentica la CLI con la chiave API dell'Hub</td>
              <td><code>dkp auth login --key dkp_live_xxx</code></td>
            </tr>
            <tr>
              <td><code>dkp ai scan</code></td>
              <td>Lancia l'audit di sicurezza con Pulse Sentinel AI</td>
              <td><code>dkp ai scan ./server/auth.ts</code></td>
            </tr>
            <tr>
              <td><code>dkp vault notarize</code></td>
              <td>Genera l'hash SHA-256 e notifica il Vault</td>
              <td><code>dkp vault notarize ./dist/bundle.js</code></td>
            </tr>
            <tr>
              <td><code>dkp news feed</code></td>
              <td>Legge le ultime notizie e note di release</td>
              <td><code>dkp news feed --limit 5</code></td>
            </tr>
            <tr>
              <td><code>dkp status</code></td>
              <td>Verifica lo stato e la latenza dei servizi DKP</td>
              <td><code>dkp status</code></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<style scoped>
.tool-page { max-width: 1080px; margin: 0 auto; padding: 2rem 1.5rem 5rem; color: #cbd5e1; display: flex; flex-direction: column; gap: 2.5rem; }
.tool-header .title-group { display: flex; align-items: center; gap: 0.75rem; }
.tool-header h1 { font-size: 2.2rem; color: #fff; margin: 0; font-weight: 900; }
.version-badge.gold { background: rgba(0, 220, 130, 0.15); color: #00dc82; border: 1px solid #00dc82; font-size: 0.75rem; font-weight: 800; padding: 0.25rem 0.65rem; border-radius: 4px; }
.subtitle { color: #94a3b8; font-size: 1.05rem; margin-top: 0.6rem; line-height: 1.6; }

/* INSTALL CARD */
.install-card { background: #090d16; border: 1px solid #1e293b; border-radius: 12px; padding: 1.5rem; }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.75rem; }
.card-header h2 { color: #fff; font-size: 1.2rem; margin: 0; }
.pm-tabs { display: flex; gap: 0.4rem; }
.pm-tabs button { background: #020420; border: 1px solid #1e293b; color: #94a3b8; padding: 0.35rem 0.75rem; border-radius: 6px; font-weight: 700; font-size: 0.82rem; cursor: pointer; }
.pm-tabs button.active { color: #00dc82; border-color: #00dc82; }

.code-copy-row { background: #020420; border: 1px solid #1e293b; padding: 0.85rem 1.25rem; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; font-family: monospace; color: #38bdf8; }
.copy-btn { background: #00dc82; color: #020420; border: none; font-weight: 800; padding: 0.45rem 0.9rem; border-radius: 6px; cursor: pointer; }

/* TERMINAL */
.term-window { background: #030712; border: 1px solid #1e293b; border-radius: 10px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
.term-bar { background: #0f172a; padding: 0.65rem 1rem; display: flex; align-items: center; justify-content: space-between; }
.window-controls { display: flex; gap: 0.4rem; }
.dot { width: 10px; height: 10px; border-radius: 50%; }
.dot.red { background: #ef4444; }
.dot.yellow { background: #f59e0b; }
.dot.green { background: #10b981; }
.term-title { color: #64748b; font-size: 0.78rem; font-family: monospace; }

.term-body { padding: 1.25rem; min-height: 300px; max-height: 420px; overflow-y: auto; font-family: 'Fira Code', monospace; font-size: 0.88rem; display: flex; flex-direction: column; gap: 0.5rem; }
.log-line pre { margin: 0; white-space: pre-wrap; word-break: break-all; }
.log-line.output { color: #cbd5e1; }
.log-line.input { color: #38bdf8; }
.log-line.success { color: #00dc82; }
.log-line.error { color: #f87171; }

.input-line { display: flex; gap: 0.6rem; align-items: center; margin-top: 0.5rem; }
.prompt { color: #00dc82; font-weight: 700; }
.cmd-input { background: transparent; border: none; outline: none; color: #fff; width: 100%; font-family: inherit; font-size: 0.88rem; }

/* CHEATSHEET */
.cheatsheet-section h2 { color: #fff; font-size: 1.3rem; margin-bottom: 1rem; }
.table-wrapper { overflow-x: auto; border: 1px solid #1e293b; border-radius: 10px; background: #090d16; }
.cmd-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.88rem; }
.cmd-table th, .cmd-table td { padding: 0.85rem 1.2rem; border-bottom: 1px solid #1e293b; }
.cmd-table th { background: #020420; color: #94a3b8; font-weight: 700; }
.cmd-table code { color: #38bdf8; font-family: monospace; background: #020420; padding: 0.2rem 0.4rem; border-radius: 4px; }
</style>