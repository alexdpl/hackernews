<!-- app/pages/tools/terminal.vue -->
<script setup lang="ts">
import { ref } from 'vue'

const { user, userToken } = useAuthCore()

useHead({
  title: 'Terminal Web Shell v2.3 — DKP Tools',
  meta: [{ name: 'description', content: 'Shell CLI in-browser e simulazione SDK DKP v2.3' }]
})

const commandInput = ref('')
const history = ref<Array<{ cmd: string; res: string; isErr?: boolean }>>([
  { cmd: 'dkp system info', res: 'DKP Kernel v2.3-GOLD Engine initialized. API status: ONLINE.' }
])

async function executeCommand() {
  const cmd = commandInput.value.trim()
  if (!cmd) return

  if (cmd === 'clear') {
    history.value = []
    commandInput.value = ''
    return
  }

  const currentCmd = cmd
  commandInput.value = ''

  try {
    const res = await $fetch('/api/v2.3/terminal/exec', {
      method: 'POST',
      body: { command: currentCmd, token: userToken.value }
    })
    history.value.push({ cmd: currentCmd, res: res.output || 'OK' })
  } catch (err: any) {
    history.value.push({ 
      cmd: currentCmd, 
      res: err.data?.message || 'Comando non valido o permessi insufficienti.', 
      isErr: true 
    })
  }
}
</script>

<template>
  <div class="tool-page">
    <div class="tool-header">
      <div class="title-group">
        <h1>💻 Terminal Web Shell</h1>
        <span class="version-badge v23">v2.3</span>
      </div>
      <p class="subtitle">Shell CLI interattiva per l'esecuzione rapida di comandi ed esplorazione SDK.</p>
    </div>

    <div class="terminal-container">
      <div class="terminal-bar">
        <span class="dot red"></span>
        <span class="dot yellow"></span>
        <span class="dot green"></span>
        <span class="term-title">dkp-sh — @{{ user?.username || 'guest' }}</span>
      </div>

      <div class="terminal-body">
        <div v-for="(item, idx) in history" :key="idx" class="history-item">
          <div class="prompt-line">
            <span class="user-tag">dkp@kernel:~$</span>
            <span class="cmd-text">{{ item.cmd }}</span>
          </div>
          <div class="res-line" :class="{ 'error-text': item.isErr }">
            {{ item.res }}
          </div>
        </div>

        <div class="input-line">
          <span class="user-tag">dkp@kernel:~$</span>
          <input 
            v-model="commandInput" 
            @keyup.enter="executeCommand" 
            type="text" 
            placeholder="Scrivi 'help', 'dkp info' o 'clear'..."
            class="term-input" 
            autofocus
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tool-page { max-width: 1000px; margin: 0 auto; padding: 2rem 1.5rem; color: #cbd5e1; }
.tool-header { margin-bottom: 1.5rem; }
.title-group { display: flex; align-items: center; gap: 0.75rem; }
.title-group h1 { font-size: 2rem; color: #fff; margin: 0; font-weight: 900; }
.version-badge.v23 { background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid #38bdf8; font-size: 0.75rem; font-weight: 800; padding: 0.2rem 0.6rem; border-radius: 4px; }
.subtitle { color: #94a3b8; margin-top: 0.5rem; }
.terminal-container { background: #050811; border: 1px solid #1e293b; border-radius: 10px; overflow: hidden; font-family: 'Fira Code', monospace; }
.terminal-bar { background: #0f172a; padding: 0.6rem 1rem; display: flex; align-items: center; gap: 0.5rem; }
.dot { width: 10px; height: 10px; border-radius: 50%; }
.dot.red { background: #ef4444; }
.dot.yellow { background: #f59e0b; }
.dot.green { background: #10b981; }
.term-title { color: #64748b; font-size: 0.8rem; margin-left: auto; }
.terminal-body { padding: 1.25rem; min-height: 350px; max-height: 500px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.9rem; }
.prompt-line { display: flex; gap: 0.5rem; color: #fff; }
.user-tag { color: #00dc82; font-weight: 700; }
.res-line { color: #94a3b8; padding-left: 1rem; line-height: 1.4; }
.res-line.error-text { color: #f87171; }
.input-line { display: flex; gap: 0.5rem; align-items: center; }
.term-input { background: transparent; border: none; color: #38bdf8; outline: none; width: 100%; font-family: inherit; font-size: 0.9rem; }
</style