<!-- app/pages/tools/terminal.vue -->
<script setup lang="ts">
import { ref, nextTick } from 'vue'

const { isAuthenticated, currentUser } = useAuthCore()

const inputCommand = ref('')
const terminalOutput = ref<Array<{ type: 'input' | 'output' | 'error' | 'success'; text: string }>>([
  { type: 'output', text: 'DevKernelPulse Web Terminal v2.0.0 (x86_64-dkp-linux-gnu)' },
  { type: 'output', text: 'Type "help" to see available ecosystem commands.' },
  { type: 'success', text: 'Kernel secure sandbox initialized successfully.' }
])

const terminalBody = ref<HTMLElement | null>(null)

function scrollToBottom() {
  nextTick(() => {
    if (terminalBody.value) {
      terminalBody.value.scrollTop = terminalBody.value.scrollHeight
    }
  })
}

function handleCommand() {
  const cmd = inputCommand.value.trim()
  if (!cmd) return

  terminalOutput.value.push({ type: 'input', text: `$ ${cmd}` })
  
  const args = cmd.toLowerCase().split(' ')
  const command = args[0]

  switch (command) {
    case 'help':
      terminalOutput.value.push({
        type: 'output',
        text: `Available DKP Commands:\n  - status : Displays kernel & node cluster status\n  - scan   : Quick AI code vulnerability check info\n  - vault  : Information about DKP Proof of Code\n  - auth   : Shows current session & security role\n  - whoami : Prints active developer identity\n  - clear  : Clears the terminal screen\n  - date   : Shows current server time`
      })
      break
    case 'status':
      terminalOutput.value.push({
        type: 'success',
        text: `[DKP KERNEL STATUS] Node: online | Region: GCP europe-west1 | DB: Neon PostgreSQL | Auth Core: active`
      })
      break
    case 'auth':
    case 'whoami':
      terminalOutput.value.push({
        type: 'output',
        text: isAuthenticated.value 
          ? `Authenticated as: @${currentUser.value?.username} (Role: ${currentUser.value?.role})`
          : `Status: Guest (Not logged in. Use /login to unlock full privileges).`
      })
      break
    case 'scan':
      terminalOutput.value.push({
        type: 'output',
        text: `Use the dedicated UI tool at /tools/ai-scanner for deep OWASP code audits.`
      })
      break
    case 'vault':
      terminalOutput.value.push({
        type: 'output',
        text: `DKP Proof of Code (Kernel Vault): Notarizes source code using SHA-256 cryptographic signatures.`
      })
      break
    case 'clear':
      terminalOutput.value = []
      break
    case 'date':
      terminalOutput.value.push({
        type: 'output',
        text: new Date().toUTCString()
      })
      break
    default:
      terminalOutput.value.push({
        type: 'error',
        text: `dkp: command not found: ${cmd}. Type "help" for available commands.`
      })
      break
  }

  inputCommand.value = ''
  scrollToBottom()
}
</script>

<template>
  <div class="tool-page-container">
    <div class="tool-header">
      <div class="header-badge">
        <span class="badge-tag">DKP Core Tool v2.0 Pro</span>
        <NuxtLink to="/" class="back-link">← Torna all'Ecosistema</NuxtLink>
      </div>
      <h1>💻 Interactive Terminal Web Shell</h1>
      <p class="subtitle">
        Emulatore di terminale interattivo per interagire direttamente con i servizi, i comandi e lo stato del Kernel DevKernelPulse.
      </p>
    </div>

    <div class="terminal-window">
      <div class="terminal-top-bar">
        <div class="dots">
          <span class="dot red"></span>
          <span class="dot yellow"></span>
          <span class="dot green"></span>
        </div>
        <div class="terminal-title">dkp-shell@devkernelpulse:~</div>
      </div>

      <div ref="terminalBody" class="terminal-body">
        <div v-for="(line, idx) in terminalOutput" :key="idx" class="terminal-line" :class="line.type">
          <pre>{{ line.text }}</pre>
        </div>
      </div>

      <div class="terminal-input-bar">
        <span class="prompt-symbol">$</span>
        <input 
          v-model="inputCommand" 
          @keyup.enter="handleCommand" 
          type="text" 
          placeholder="Digita un comando (es. help, status, auth)..." 
          autofocus
        />
        <button @click="handleCommand" class="run-cmd-btn">Esegui</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tool-page-container {
  max-width: 1000px;
  margin: 2.5rem auto;
  padding: 0 1.5rem;
  font-family: ui-sans-serif, system-ui, sans-serif;
}

.tool-header {
  margin-bottom: 2rem;
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
  margin-top: 0.5rem;
}

.terminal-window {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
}

.terminal-top-bar {
  background: #020420;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #1e293b;
}

.dots {
  display: flex;
  gap: 6px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.dot.red { background: #ef4444; }
.dot.yellow { background: #f59e0b; }
.dot.green { background: #00dc82; }

.terminal-title {
  margin: 0 auto;
  color: #94a3b8;
  font-size: 0.85rem;
  font-family: monospace;
  font-weight: 600;
}

.terminal-body {
  height: 400px;
  overflow-y: auto;
  padding: 1.25rem;
  font-family: monospace;
  font-size: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.terminal-line pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: inherit;
}

.terminal-line.output { color: #e2e8f0; }
.terminal-line.success { color: #00dc82; }
.terminal-line.error { color: #ef4444; }
.terminal-line.input { color: #38bdf8; font-weight: bold; }

.terminal-input-bar {
  display: flex;
  align-items: center;
  background: #020420;
  border-top: 1px solid #1e293b;
  padding: 0.75rem 1rem;
  gap: 0.75rem;
}

.prompt-symbol {
  color: #00dc82;
  font-weight: bold;
  font-family: monospace;
  font-size: 1.1rem;
}

.terminal-input-bar input {
  flex: 1;
  background: transparent;
  border: none;
  color: #ffffff;
  font-family: monospace;
  font-size: 0.95rem;
  outline: none;
}

.run-cmd-btn {
  background: #00dc82;
  color: #020420;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
}

.run-cmd-btn:hover { opacity: 0.9; }
</style>