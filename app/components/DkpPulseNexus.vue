<!-- app/components/PulseNexusChat.vue -->
<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from 'vue'

// 🔥 INTEGRAZIONE AUTH REALE: Prendiamo l'utente dal tuo AuthCore
const { user } = useAuthCore()

// Proprietà calcolate per rendere reattiva l'interfaccia
const isLogged = computed(() => !!user.value)
const userName = computed(() => user.value?.username || 'Ospite')
const userXp = computed(() => user.value?.xp || 0)

const isOpen = ref(false)
const inputQuery = ref('')
const isTyping = ref(false)
const chatBody = ref<HTMLElement | null>(null)

interface Message {
  id: number
  text: string
  sender: 'user' | 'nexus'
  time: string
  isSystem?: boolean
}

const messages = ref<Message[]>([])

// Messaggio di benvenuto dinamico all'avvio
onMounted(() => {
  messages.value.push({
    id: Date.now(),
    text: `Benvenuto su DKP Pulse Nexus v2.5-GOLD, ${userName.value}! Come posso assisterti oggi?`,
    sender: 'nexus',
    time: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
    isSystem: true
  })
})

const scrollToBottom = async () => {
  await nextTick()
  if (chatBody.value) {
    chatBody.value.scrollTop = chatBody.value.scrollHeight
  }
}

const handleSend = async () => {
  if (!inputQuery.value.trim() || isTyping.value) return

  const userText = inputQuery.value.trim()
  const now = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })

  // 1. Aggiungi messaggio utente in UI
  messages.value.push({
    id: Date.now(),
    text: userText,
    sender: 'user',
    time: now
  })

  inputQuery.value = ''
  isTyping.value = true
  scrollToBottom()

  // 2. 🔥 VERA CHIAMATA API ALL'INTELLIGENZA ARTIFICIALE
  // 2. 🔥 VERA CHIAMATA API ALL'INTELLIGENZA ARTIFICIALE
  try {
    // Chiamiamo il VERO endpoint /api/nexus/send che abbiamo appena aggiornato!
    const res: any = await $fetch('/api/nexus/send', {
      method: 'POST',
      body: { 
        message: userText,
        userId: user.value?.id 
      }
    })

    // Leggiamo la risposta dalla struttura corretta restituita da send.post.ts
    const aiResponse = res?.message?.text || "Non riesco a connettermi al Kernel neurale in questo momento. Riprova più tardi."
    
    messages.value.push({
      id: Date.now(),
      text: aiResponse,
      sender: 'nexus',
      time: res?.message?.timestamp || new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
    })

    // 3. Sistema di Gamification: Mostra popup XP se il server ha assegnato punti
    if (isLogged.value && res?.message?.xpEarned > 0) {
      messages.value.push({
        id: Date.now() + 1,
        text: `✨ Hai guadagnato +${res.message.xpEarned} DKP XP! Sei al livello ${res.level || 1}. (Totale: ${res.totalXp} XP)`,
        sender: 'nexus',
        time: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
        isSystem: true
      })
    }

  } catch (error) {
    // Fallback in caso di errore Server
    messages.value.push({
      id: Date.now(),
      text: "⚠️ Errore di connessione al DKP Nexus. Riprova tra poco.",
      sender: 'nexus',
      time: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
      isSystem: true
    })
  } finally {
    isTyping.value = false
    scrollToBottom()
  }

const clearChat = () => {
  messages.value = []
  messages.value.push({
    id: Date.now(),
    text: `Chat riavviata. Sono di nuovo pronto, ${userName.value}!`,
    sender: 'nexus',
    time: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
    isSystem: true
  })
}
</script>

<template>
  <div class="nexus-widget-wrapper">
    <!-- CHAT POPUP WINDOW -->
    <Transition name="nexus-pop">
      <div v-if="isOpen" class="nexus-chat-card glass-panel">
        
        <!-- HEADER CHAT (Cyberpunk Style) -->
        <div class="nexus-header">
          <div class="nexus-title-box">
            <span class="nexus-status-dot"></span>
            <div>
              <h3 class="nexus-title">DKP Pulse Nexus <span class="badge-v">v2.5-GOLD</span></h3>
              <p class="nexus-subtitle text-sky-400">Assistente AI & Code Companion</p>
            </div>
          </div>
          <div class="nexus-actions">
            <!-- 🔥 Mostra i veri XP dell'utente se loggato -->
            <span v-if="isLogged" class="xp-badge mr-2" title="I tuoi XP">⚡ {{ userXp }} XP</span>
            <button type="button" @click="clearChat" class="btn-action" title="Reset Conversazione">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
            <button type="button" @click="isOpen = false" class="btn-action btn-close" title="Riduci a icona">✕</button>
          </div>
        </div>

        <!-- FEED MESSAGGI -->
        <div class="nexus-body" ref="chatBody">
          <div 
            v-for="msg in messages" 
            :key="msg.id" 
            class="msg-wrapper" 
            :class="[msg.sender === 'user' ? 'user' : 'nexus', { 'system-msg': msg.isSystem }]"
          >
            <div class="msg-bubble shadow-lg">
              <div class="msg-sender-tag flex items-center justify-between">
                <span>{{ msg.sender === 'user' ? userName : '⚡ Pulse Nexus' }}</span>
                <span v-if="msg.sender === 'user'" class="text-[0.55rem] text-emerald-950 bg-emerald-500/50 px-1 rounded">USR</span>
                <span v-else class="text-[0.55rem] text-sky-400 border border-sky-500/30 px-1 rounded">AI</span>
              </div>
              <div class="msg-text text-[0.87rem]">{{ msg.text }}</div>
              <div class="msg-time">{{ msg.time }}</div>
            </div>
          </div>

          <div v-if="isTyping" class="msg-wrapper nexus typing">
            <div class="msg-bubble flex items-center gap-2">
              <span class="relative flex h-2 w-2"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
              <span class="typing-dots font-mono text-emerald-400 text-xs">Nexus sta elaborando...</span>
            </div>
          </div>
        </div>

        <!-- FORM DI INVIO -->
        <form @submit.prevent="handleSend" class="nexus-footer relative">
          <div class="absolute inset-0 bg-emerald-500/5 blur-xl pointer-events-none transition-opacity duration-300" :class="inputQuery ? 'opacity-100' : 'opacity-0'"></div>
          
          <input 
            v-model="inputQuery" 
            type="text" 
            :placeholder="isLogged ? 'Fai una domanda (Costa 2 XP)...' : 'Fai il login per interagire con Nexus...'" 
            :disabled="isTyping || !isLogged"
            class="nexus-input relative z-10"
          />
          <button type="submit" class="nexus-send-btn relative z-10" :disabled="!inputQuery.trim() || isTyping || !isLogged">
            <svg class="w-4 h-4 transform rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
          </button>
        </form>
      </div>
    </Transition>

    <!-- FLOATING LAUNCHER BUTTON -->
    <button 
      type="button" 
      @click="isOpen = !isOpen" 
      class="nexus-launcher-btn group"
      :class="{ 'is-active': isOpen }"
      title="Apri DKP Pulse Nexus AI"
    >
      <div class="absolute inset-0 bg-emerald-500/20 rounded-full blur group-hover:bg-emerald-500/40 transition-all"></div>
      <span class="launcher-pulse-dot relative z-10"></span>
      <span class="launcher-icon relative z-10">🤖</span>
      <span class="launcher-text relative z-10 flex items-center gap-1.5">
        Nexus <span class="launcher-badge">v2.5</span>
      </span>
    </button>
  </div>
</template>

<style scoped>
/* Lascia qui tutti i CSS che ti avevo inviato nel blocco precedente! Sono identici e perfetti. */
/* WRAPPER FIXATO IN BASSO A DESTRA */
.nexus-widget-wrapper {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 9999;
  font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
}

/* FLOATING LAUNCHER BUTTON v2.5 */
.nexus-launcher-btn {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: rgba(9, 13, 22, 0.85);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 220, 130, 0.5);
  color: #fff;
  padding: 0.8rem 1.4rem;
  border-radius: 50px;
  cursor: pointer;
  position: relative;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5), 0 0 15px rgba(0, 220, 130, 0.15);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.nexus-launcher-btn:hover {
  transform: translateY(-4px) scale(1.02);
  border-color: #00dc82;
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.7), 0 0 25px rgba(0, 220, 130, 0.3);
}

.nexus-launcher-btn.is-active {
  background: rgba(2, 4, 32, 0.95);
  border-color: #00dc82;
  transform: scale(0.95);
}

.launcher-pulse-dot {
  width: 8px;
  height: 8px;
  background: #00dc82;
  border-radius: 50%;
  box-shadow: 0 0 10px #00dc82;
  animation: pulse-glow 2s infinite;
}

.launcher-text { font-weight: 800; font-size: 0.9rem; color: #f8fafc; letter-spacing: 0.5px; }
.launcher-badge {
  background: rgba(0, 220, 130, 0.15);
  color: #00dc82;
  font-size: 0.65rem;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  border: 1px solid rgba(0, 220, 130, 0.3);
}

/* CHAT POPUP WINDOW (Glassmorphism) */
.glass-panel {
  background: rgba(9, 13, 22, 0.7);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.nexus-chat-card {
  position: absolute;
  bottom: 5rem;
  right: 0;
  width: 380px;
  max-width: calc(100vw - 3rem);
  height: 550px;
  max-height: calc(100vh - 7rem);
  border: 1px solid rgba(30, 41, 59, 0.9);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(0, 220, 130, 0.1);
  overflow: hidden;
  transform-origin: bottom right;
}

/* HEADER */
.nexus-header {
  padding: 1rem 1.2rem;
  background: rgba(2, 4, 32, 0.85);
  border-bottom: 1px solid rgba(30, 41, 59, 0.8);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nexus-title-box { display: flex; align-items: center; gap: 0.7rem; }
.nexus-status-dot { width: 10px; height: 10px; background: #00dc82; border-radius: 50%; box-shadow: 0 0 10px #00dc82; }
.nexus-title { margin: 0; font-size: 1rem; color: #fff; font-weight: 800; }
.badge-v { background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); font-size: 0.65rem; padding: 0.1rem 0.35rem; border-radius: 4px; margin-left: 0.2rem;}
.nexus-subtitle { margin: 0; font-size: 0.75rem; font-family: monospace; }

.nexus-actions { display: flex; align-items: center; gap: 0.4rem; }
.xp-badge { font-size: 0.7rem; font-weight: 800; color: #00dc82; font-family: monospace; border-right: 1px solid #1e293b; padding-right: 0.5rem;}
.btn-action {
  background: transparent;
  color: #64748b;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.btn-action:hover { background: rgba(255, 255, 255, 0.05); color: #00dc82; }
.btn-close:hover { background: rgba(239, 68, 68, 0.1); color: #f87171; }

/* MESSAGES BODY */
.nexus-body {
  flex: 1;
  padding: 1.2rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: rgba(2, 4, 32, 0.4);
}

.nexus-body::-webkit-scrollbar { width: 6px; }
.nexus-body::-webkit-scrollbar-track { background: transparent; }
.nexus-body::-webkit-scrollbar-thumb { background: rgba(30, 41, 59, 0.8); border-radius: 3px; }

.msg-wrapper { display: flex; flex-direction: column; max-width: 88%; }
.msg-wrapper.user { align-self: flex-end; }
.msg-wrapper.nexus { align-self: flex-start; }

.msg-bubble { padding: 0.75rem 1rem; border-radius: 12px; line-height: 1.5; word-break: break-word; }
.user .msg-bubble { background: linear-gradient(135deg, #00dc82 0%, #00a863 100%); color: #020420; font-weight: 500; border-bottom-right-radius: 2px; }
.nexus .msg-bubble { background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(56, 189, 248, 0.2); color: #e2e8f0; border-bottom-left-radius: 2px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }

.msg-wrapper.system-msg .msg-bubble { background: rgba(0, 220, 130, 0.1); border: 1px dashed rgba(0, 220, 130, 0.4); color: #00dc82; font-family: monospace; font-size: 0.75rem; text-align: center; border-radius: 8px;}
.msg-wrapper.system-msg .msg-sender-tag { display: none; }

.msg-sender-tag { font-size: 0.65rem; opacity: 0.8; margin-bottom: 0.3rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;}
.user .msg-sender-tag { color: #020420; }
.msg-time { font-size: 0.6rem; opacity: 0.5; text-align: right; margin-top: 0.4rem; font-family: monospace; }

/* FOOTER INPUT */
.nexus-footer { padding: 1rem; background: rgba(2, 4, 32, 0.95); border-top: 1px solid rgba(30, 41, 59, 0.8); display: flex; gap: 0.5rem; align-items: center;}
.nexus-input { 
  flex: 1; 
  background: rgba(15, 23, 42, 0.8); 
  border: 1px solid rgba(56, 189, 248, 0.3); 
  color: #fff; 
  padding: 0.75rem 1rem; 
  border-radius: 10px; 
  font-size: 0.9rem; 
  outline: none; 
  transition: all 0.3s;
}
.nexus-input:focus { border-color: #00dc82; box-shadow: 0 0 10px rgba(0, 220, 130, 0.2); background: rgba(15, 23, 42, 0.95);}
.nexus-input::placeholder { color: #475569; }

.nexus-send-btn { 
  background: #00dc82; 
  color: #020420; 
  border: none; 
  width: 42px;
  height: 42px;
  border-radius: 10px; 
  cursor: pointer; 
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s; 
  box-shadow: 0 4px 10px rgba(0, 220, 130, 0.3);
}
.nexus-send-btn:hover:not(:disabled) { transform: scale(1.05); box-shadow: 0 6px 15px rgba(0, 220, 130, 0.4); }
.nexus-send-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; background: #334155;}

/* ANIMAZIONI APERTURA POPUP */
.nexus-pop-enter-active,
.nexus-pop-leave-active {
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.nexus-pop-enter-from,
.nexus-pop-leave-to {
  opacity: 0;
  transform: translateY(30px) scale(0.9) rotate(2deg);
}

@keyframes pulse-glow {
  0%, 100% { transform: scale(1); opacity: 1;}
  50% { transform: scale(1.3); opacity: 0.6; box-shadow: 0 0 15px #00dc82;}
}
</style>