<!-- app/pages/terminal.vue -->
<script setup lang="ts">
import { ref, nextTick } from 'vue'

const inputCommand = ref('')
const terminalLogs = ref([
  { type: 'system', text: 'DevKernelPulse [CLI Terminal Environment v1.0.4]' },
  { type: 'system', text: 'Digita "help" per visualizzare la lista dei comandi disponibili.' }
])
const terminalContainer = ref<HTMLElement | null>(null)

async function handleCommand() {
  const cmd = inputCommand.value.trim().toLowerCase()
  if (!cmd) return

  // Aggiungi comando utente alla history
  terminalLogs.value.push({ type: 'user', text: `dkp> ${inputCommand.value}` })
  const currentCmd = cmd
  inputCommand.value = ''

  // Esegui comando
  if (currentCmd === 'help') {
    terminalLogs.value.push({
      type: 'system',
      text: 'Comandi disponibili:\n  - news       : Visualizza le ultime notizie tech\n  - scanner    : Reindirizza all\'AI Link Scanner\n  - whoami     : Mostra lo stato utente corrente\n  - clear      : Pulisce la schermata del terminale\n  - about      : Info sul progetto DKP'
    })
  } else if (currentCmd === 'news') {
    terminalLogs.value.push({ type: 'system', text: 'Fetching recent posts from /api/posts...\n1. Nuova release di Nuxt 3.x rilasciata\n2. Come scalare database distribuiti in Italia\n3. L\'ascesa dell\'Open Source italiano' })
  } else if (currentCmd === 'scanner') {
    terminalLogs.value.push({ type: 'system', text: 'Reindirizzamento a /ai-scanner...' })
    navigateTo('/ai-scanner')
  } else if (currentCmd === 'whoami') {
    const userCookie = useCookie('dkp_user').value
    terminalLogs.value.push({ type: 'system', text: userCookie ? `Utente autenticato come: ${userCookie}` : 'Utente non loggato (Visitatore anonimo)' })
  } else if (currentCmd === 'clear') {
    terminalLogs.value = []
  } else if (currentCmd === 'about') {
    terminalLogs.value.push({ type: 'system', text: 'DevKernelPulse è l\'ecosistema definitivo per sviluppatori in Italia, creato da Alessandro De Paola & Gemini AI.' })
  } else {
    terminalLogs.value.push({ type: 'error', text: `Comando non riconosciuto: "${currentCmd}". Digita "help" per l'elenco comandi.` })
  }

  await nextTick()
  if (terminalContainer.value) {
    terminalContainer.value.scrollTop = terminalContainer.value.scrollHeight
  }
}

useSeoMeta({
  title: 'CLI Terminal - DevKernelPulse',
  description: 'Interfaccia a riga di comando per sviluppatori su DevKernelPulse.'
})
</script>

<template>
  <div class="terminal-page">
    <div class="terminal-window" ref="terminalContainer">
      <div class="terminal-header-bar">
        <span class="dot red"></span>
        <span class="dot yellow"></span>
        <span class="dot green"></span>
        <span class="terminal-title">dkp-cli@kernel:~</span>
      </div>

      <div class="terminal-body">
        <div v-for="(log, idx) in terminalLogs" :key="idx" :class="['log-line', log.type]">
          <pre>{{ log.text }}</pre>
        </div>

        <div class="terminal-prompt-row">
          <span class="prompt-symbol">dkp&gt;</span>
          <input 
            v-model="inputCommand" 
            @keyup.enter="handleCommand" 
            type="text" 
            autofocus 
            class="terminal-input"
            placeholder="digita un comando..."
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.terminal-page {
  background-color: #020420;
  min-height: calc(100vh - 140px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1.5rem;
  font-family: 'Courier New', Courier, monospace;
}
.terminal-window {
  width: 100%;
  max-width: 800px;
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 8px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  max-height: 550px;
  display: flex;
  flex-direction: column;
}
.terminal-header-bar {
  background: #0f172a;
  padding: 0.6rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  border-bottom: 1px solid #1e293b;
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.dot.red { background: #ef4444; }
.dot.yellow { background: #f59e0b; }
.dot.green { background: #10b981; }
.terminal-title {
  margin-left: 0.5rem;
  font-size: 0.85rem;
  color: #94a3b8;
}
.terminal-body {
  padding: 1.2rem;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.log-line pre {
  margin: 0;
  font-family: inherit;
  white-space: pre-wrap;
  font-size: 0.9rem;
  line-height: 1.4;
}
.log-line.system pre { color: #00dc82; }
.log-line.user pre { color: #f8fafc; font-weight: bold; }
.log-line.error pre { color: #ef4444; }

.terminal-prompt-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}
.prompt-symbol {
  color: #00dc82;
  font-weight: bold;
}
.terminal-input {
  background: transparent;
  border: none;
  color: #f8fafc;
  font-family: inherit;
  font-size: 0.95rem;
  flex: 1;
  outline: none;
}
</style>