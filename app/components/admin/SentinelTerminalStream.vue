<!-- app/components/admin/SentinelTerminalStream.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

interface ThreatLog {
  id: string
  timestamp: string
  ip: string
  countryCode: string
  countryFlag: string
  countryName: string
  attackType: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  action: string
  endpoint: string
}

const logs = ref<ThreatLog[]>([])
const isConnected = ref(false)
const isPaused = ref(false)
const terminalContainer = ref<HTMLElement | null>(null)
const autoScroll = ref(true)

// Contatori Telemetria Live
const stats = ref({
  totalBlocked: 1420,
  criticalAttacks: 48,
  activeBans: 12
})

let eventSource: EventSource | null = null

function connectStream() {
  if (import.meta.server) return

  eventSource = new EventSource('/api/admin/sentinel/stream')

  eventSource.addEventListener('connected', () => {
    isConnected.value = true
  })

  eventSource.addEventListener('threat', (e: MessageEvent) => {
    if (isPaused.value) return

    try {
      const data: ThreatLog = JSON.parse(e.data)
      logs.value.push(data)
      stats.value.totalBlocked++
      if (data.severity === 'CRITICAL') stats.value.criticalAttacks++
      if (data.action === 'IP_BANNED') stats.value.activeBans++

      // Mantiene al massimo 200 log in memoria per non appesantire la DOM
      if (logs.value.length > 200) {
        logs.value.shift()
      }

      if (autoScroll.value) {
        nextTick(() => scrollToBottom())
      }
    } catch (err) {
      console.error('Error parsing threat stream:', err)
    }
  })

  eventSource.onerror = () => {
    isConnected.value = false
  }
}

function scrollToBottom() {
  if (terminalContainer.value) {
    terminalContainer.value.scrollTop = terminalContainer.value.scrollHeight
  }
}

function togglePause() {
  isPaused.value = !isPaused.value
}

function clearLogs() {
  logs.value = []
}

onMounted(() => {
  connectStream()
})

onUnmounted(() => {
  if (eventSource) {
    eventSource.close()
  }
})
</script>

<template>
  <div class="sentinel-terminal-wrapper">
    <!-- STATS TOP BAR -->
    <div class="sentinel-stats-bar">
      <div class="stat-card border-green">
        <span class="stat-label">Stato Engine</span>
        <div class="stat-value text-green">
          <span :class="['status-dot', isConnected ? 'online' : 'offline']"></span>
          {{ isConnected ? 'ACTIVE STREAM' : 'DISCONNECTED' }}
        </div>
      </div>

      <div class="stat-card border-cyan">
        <span class="stat-label">Minacce Bloccate</span>
        <div class="stat-value text-cyan">{{ stats.totalBlocked.toLocaleString() }}</div>
      </div>

      <div class="stat-card border-red">
        <span class="stat-label">Attacchi Critici</span>
        <div class="stat-value text-red">{{ stats.criticalAttacks }}</div>
      </div>

      <div class="stat-card border-purple">
        <span class="stat-label">IP in Ban-List</span>
        <div class="stat-value text-purple">{{ stats.activeBans }}</div>
      </div>
    </div>

    <!-- TERMINAL HEADER ACTION BAR -->
    <div class="terminal-header">
      <div class="window-buttons">
        <span class="btn-dot red"></span>
        <span class="btn-dot yellow"></span>
        <span class="btn-dot green"></span>
        <span class="terminal-title">root@sentinel-v2.4-gold:~# stream --live-threats</span>
      </div>

      <div class="terminal-controls">
        <label class="autoscroll-check">
          <input type="checkbox" v-model="autoScroll" /> Auto-scroll
        </label>
        <button @click="togglePause" :class="['ctrl-btn', isPaused ? 'resume' : 'pause']">
          {{ isPaused ? '▶ Riprendi' : '⏸ Pausa' }}
        </button>
        <button @click="clearLogs" class="ctrl-btn clear">🗑️ Pulisci</button>
      </div>
    </div>

    <!-- TERMINAL LOG DISPLAY -->
    <div ref="terminalContainer" class="terminal-body">
      <div v-if="logs.length === 0" class="empty-stream">
        <span class="blink-cursor">&gt; In attesa di pacchetti bloccati dal Firewall Sentinel...</span>
      </div>

      <div v-for="log in logs" :key="log.id" class="terminal-line">
        <span class="log-time">[{{ log.timestamp }}]</span>
        <span class="log-flag" :title="log.countryName">{{ log.countryFlag }} {{ log.countryCode }}</span>
        <span class="log-ip">{{ log.ip }}</span>
        <span :class="['severity-badge', log.severity]">{{ log.severity }}</span>
        <span class="log-type">{{ log.attackType }}</span>
        <span class="log-target">→ {{ log.endpoint }}</span>
        <span :class="['action-tag', log.action]">{{ log.action }}</span>
      </div>

      <div class="terminal-prompt">
        <span class="prompt-user">sentinel@dkp-vault:~$</span>
        <span class="blink-cursor">█</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sentinel-terminal-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

/* STATS BAR */
.sentinel-stats-bar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: rgba(9, 13, 22, 0.8);
  border: 1px solid #1e293b;
  border-radius: 8px;
  padding: 0.9rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-card.border-green { border-left: 3px solid #00dc82; }
.stat-card.border-cyan { border-left: 3px solid #38bdf8; }
.stat-card.border-red { border-left: 3px solid #ef4444; }
.stat-card.border-purple { border-left: 3px solid #a855f7; }

.stat-label { font-size: 0.72rem; color: #64748b; text-transform: uppercase; font-weight: 700; }
.stat-value { font-size: 1.4rem; font-weight: 900; display: flex; align-items: center; gap: 0.5rem; }

.text-green { color: #00dc82; }
.text-cyan { color: #38bdf8; }
.text-red { color: #ef4444; }
.text-purple { color: #a855f7; }

.status-dot { width: 8px; height: 8px; border-radius: 50%; }
.status-dot.online { background: #00dc82; box-shadow: 0 0 8px #00dc82; }
.status-dot.offline { background: #ef4444; }

/* TERMINAL HEADER */
.terminal-header {
  background: #0d1322;
  border: 1px solid #1e293b;
  border-bottom: none;
  border-radius: 10px 10px 0 0;
  padding: 0.65rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.window-buttons { display: flex; align-items: center; gap: 0.5rem; }
.btn-dot { width: 10px; height: 10px; border-radius: 50%; }
.btn-dot.red { background: #ff5f56; }
.btn-dot.yellow { background: #ffbd2e; }
.btn-dot.green { background: #27c93f; }
.terminal-title { color: #94a3b8; font-size: 0.78rem; font-weight: 700; margin-left: 0.5rem; }

.terminal-controls { display: flex; align-items: center; gap: 0.75rem; font-size: 0.75rem; color: #cbd5e1; }
.autoscroll-check { display: flex; align-items: center; gap: 0.3rem; cursor: pointer; }
.ctrl-btn { background: #1e293b; color: #38bdf8; border: none; padding: 0.3rem 0.65rem; border-radius: 4px; font-weight: 700; cursor: pointer; font-size: 0.72rem; }
.ctrl-btn.pause { background: rgba(234, 179, 8, 0.15); color: #eab308; }
.ctrl-btn.resume { background: rgba(0, 220, 130, 0.15); color: #00dc82; }
.ctrl-btn.clear { background: rgba(239, 68, 68, 0.15); color: #ef4444; }

/* TERMINAL BODY */
.terminal-body {
  background: #020412;
  border: 1px solid #1e293b;
  border-radius: 0 0 10px 10px;
  padding: 1rem;
  height: 420px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.8);
}

.empty-stream { color: #64748b; font-size: 0.85rem; padding: 1rem 0; }

.terminal-line {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  font-size: 0.8rem;
  line-height: 1.4;
  padding: 0.15rem 0.3rem;
  border-radius: 4px;
  transition: background 0.15s ease;
}

.terminal-line:hover { background: rgba(30, 41, 59, 0.4); }

.log-time { color: #64748b; font-size: 0.75rem; }
.log-flag { color: #f8fafc; font-weight: bold; }
.log-ip { color: #38bdf8; min-width: 110px; }

.severity-badge { font-size: 0.68rem; font-weight: 800; padding: 0.05rem 0.4rem; border-radius: 3px; }
.severity-badge.LOW { background: rgba(56, 189, 248, 0.15); color: #38bdf8; }
.severity-badge.MEDIUM { background: rgba(234, 179, 8, 0.15); color: #eab308; }
.severity-badge.HIGH { background: rgba(249, 115, 22, 0.2); color: #f97316; }
.severity-badge.CRITICAL { background: rgba(239, 68, 68, 0.25); color: #ef4444; border: 1px solid #ef4444; }

.log-type { color: #f1f5f9; font-weight: 600; flex: 1; }
.log-target { color: #64748b; font-size: 0.75rem; }

.action-tag { font-size: 0.68rem; font-weight: 800; padding: 0.05rem 0.4rem; border-radius: 3px; font-family: monospace; }
.action-tag.BLOCKED_403 { color: #f59e0b; background: rgba(245, 158, 11, 0.1); }
.action-tag.RATE_LIMITED_429 { color: #38bdf8; background: rgba(56, 189, 248, 0.1); }
.action-tag.IP_BANNED { color: #ef4444; background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.4); }

.terminal-prompt { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem; font-size: 0.8rem; }
.prompt-user { color: #00dc82; font-weight: 700; }
.blink-cursor { color: #00dc82; animation: blink 1s infinite; }

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
</style>