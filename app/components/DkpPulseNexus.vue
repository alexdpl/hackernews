<!-- components/DkpPulseNexus.vue -->
<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'

const { messages, isTyping, sendMessage, clearChat } = usePulseNexus()
const inputQuery = ref('')
const chatBody = ref<HTMLElement | null>(null)
const isOpen = ref(false) // Stato apertura/chiusura popup

const emit = defineEmits(['xp-earned'])

async function handleSend() {
  const text = inputQuery.value
  inputQuery.value = ''
  await sendMessage(text, (xp) => {
    emit('xp-earned', xp)
  })
  scrollToBottom()
}

function scrollToBottom() {
  nextTick(() => {
    if (chatBody.value) {
      chatBody.value.scrollTop = chatBody.value.scrollHeight
    }
  })
}

watch(messages, scrollToBottom, { deep: true })
watch(isOpen, (val) => {
  if (val) scrollToBottom()
})
</script>

<template>
  <div class="nexus-widget-wrapper">
    <!-- CHAT POPUP WINDOW -->
    <Transition name="nexus-pop">
      <div v-if="isOpen" class="nexus-chat-card">
        <!-- HEADER CHAT -->
        <div class="nexus-header">
          <div class="nexus-title-box">
            <span class="nexus-status-dot"></span>
            <div>
              <h3 class="nexus-title">DKP Pulse Nexus <span class="badge-v">v2.4-Gold</span></h3>
              <p class="nexus-subtitle">Assistente AI & Code Companion</p>
            </div>
          </div>
          <div class="nexus-actions">
            <button type="button" @click="clearChat" class="btn-action" title="Reset Conversazione">🧹</button>
            <button type="button" @click="isOpen = false" class="btn-action btn-close" title="Riduci a icona">✕</button>
          </div>
        </div>

        <!-- FEED MESSAGGI -->
        <div class="nexus-body" ref="chatBody">
          <div 
            v-for="msg in messages" 
            :key="msg.id" 
            class="msg-wrapper" 
            :class="msg.sender === 'user' ? 'user' : 'nexus'"
          >
            <div class="msg-bubble">
              <div class="msg-sender-tag">{{ msg.sender === 'user' ? 'Tu' : '⚡ Pulse Nexus' }}</div>
              <div class="msg-text">{{ msg.text }}</div>
              <div class="msg-time">{{ msg.time }}</div>
            </div>
          </div>

          <div v-if="isTyping" class="msg-wrapper nexus typing">
            <div class="msg-bubble">
              <span class="typing-dots">⚡ Nexus sta elaborando la risposta...</span>
            </div>
          </div>
        </div>

        <!-- FORM DI INVIO -->
        <form @submit.prevent="handleSend" class="nexus-footer">
          <input 
            v-model="inputQuery" 
            type="text" 
            placeholder="Fai una domanda all'AI Nexus (+5 XP)..." 
            :disabled="isTyping"
            class="nexus-input"
          />
          <button type="submit" class="nexus-send-btn" :disabled="!inputQuery.trim() || isTyping">
            Invia 🚀
          </button>
        </form>
      </div>
    </Transition>

    <!-- FLOATING LAUNCHER BUTTON (IN BASSO A DESTRA) -->
    <button 
      type="button" 
      @click="isOpen = !isOpen" 
      class="nexus-launcher-btn"
      :class="{ 'is-active': isOpen }"
      title="Apri DKP Pulse Nexus AI"
    >
      <span class="launcher-pulse-dot"></span>
      <span class="launcher-icon">⚡</span>
      <span class="launcher-text">Nexus <span class="launcher-badge">v2.4</span></span>
    </button>
  </div>
</template>

<style scoped>
/* WRAPPER FIXATO IN BASSO A DESTRA */
.nexus-widget-wrapper {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 9999;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* FLOATING LAUNCHER BUTTON */
.nexus-launcher-btn {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: #090d16;
  border: 1px solid rgba(0, 220, 130, 0.4);
  color: #fff;
  padding: 0.75rem 1.25rem;
  border-radius: 50px;
  cursor: pointer;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.6), 0 0 15px rgba(0, 220, 130, 0.2);
  transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.nexus-launcher-btn:hover {
  transform: translateY(-3px) scale(1.03);
  border-color: #00dc82;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.8), 0 0 25px rgba(0, 220, 130, 0.4);
}

.nexus-launcher-btn.is-active {
  background: #020420;
  border-color: #00dc82;
}

.launcher-pulse-dot {
  width: 8px;
  height: 8px;
  background: #00dc82;
  border-radius: 50%;
  box-shadow: 0 0 8px #00dc82;
  animation: pulse-glow 2s infinite;
}

.launcher-icon { font-size: 1.1rem; }
.launcher-text { font-weight: 800; font-size: 0.88rem; color: #f8fafc; }
.launcher-badge {
  background: rgba(0, 220, 130, 0.2);
  color: #00dc82;
  font-size: 0.65rem;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  margin-left: 0.2rem;
}

/* CHAT POPUP WINDOW */
.nexus-chat-card {
  position: absolute;
  bottom: 4rem;
  right: 0;
  width: 380px;
  max-width: calc(100vw - 2rem);
  height: 520px;
  max-height: calc(100vh - 6rem);
  background: rgba(9, 13, 22, 0.96);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(30, 41, 59, 0.8);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 220, 130, 0.15);
  overflow: hidden;
}

/* HEADER */
.nexus-header {
  padding: 0.85rem 1rem;
  background: rgba(2, 4, 32, 0.9);
  border-bottom: 1px solid #1e293b;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nexus-title-box { display: flex; align-items: center; gap: 0.6rem; }
.nexus-status-dot { width: 8px; height: 8px; background: #00dc82; border-radius: 50%; box-shadow: 0 0 8px #00dc82; }
.nexus-title { margin: 0; font-size: 0.95rem; color: #fff; font-weight: 800; }
.badge-v { background: rgba(0, 220, 130, 0.15); color: #00dc82; font-size: 0.65rem; padding: 0.1rem 0.35rem; border-radius: 4px; }
.nexus-subtitle { margin: 0; font-size: 0.72rem; color: #94a3b8; }

.nexus-actions { display: flex; gap: 0.4rem; }
.btn-action {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.82rem;
  transition: all 0.2s;
}
.btn-action:hover { background: rgba(255, 255, 255, 0.15); color: #fff; }
.btn-close:hover { background: rgba(239, 68, 68, 0.2); color: #f87171; border-color: rgba(239, 68, 68, 0.4); }

/* MESSAGES BODY */
.nexus-body {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  background: #020420;
}

.msg-wrapper { display: flex; flex-direction: column; max-width: 85%; }
.msg-wrapper.user { align-self: flex-end; }
.msg-wrapper.nexus { align-self: flex-start; }

.msg-bubble { padding: 0.65rem 0.85rem; border-radius: 10px; font-size: 0.85rem; line-height: 1.45; word-break: break-word; }
.user .msg-bubble { background: #00dc82; color: #020420; font-weight: 600; border-bottom-right-radius: 2px; }
.nexus .msg-bubble { background: #090d16; border: 1px solid #1e293b; color: #f8fafc; border-bottom-left-radius: 2px; }

.msg-sender-tag { font-size: 0.65rem; opacity: 0.75; margin-bottom: 0.2rem; font-weight: 800; text-transform: uppercase; }
.msg-time { font-size: 0.62rem; opacity: 0.6; text-align: right; margin-top: 0.25rem; }

.typing-dots { color: #00dc82; font-style: italic; font-size: 0.8rem; }

/* FOOTER INPUT */
.nexus-footer { padding: 0.75rem; background: rgba(2, 4, 32, 0.95); border-top: 1px solid #1e293b; display: flex; gap: 0.5rem; }
.nexus-input { flex: 1; background: #090d16; border: 1px solid #1e293b; color: #fff; padding: 0.6rem 0.85rem; border-radius: 8px; font-size: 0.83rem; outline: none; }
.nexus-input:focus { border-color: #00dc82; }
.nexus-send-btn { background: #00dc82; color: #020420; font-weight: 800; border: none; padding: 0.6rem 1rem; border-radius: 8px; cursor: pointer; font-size: 0.83rem; transition: background 0.2s; }
.nexus-send-btn:hover:not(:disabled) { background: #00bf71; }
.nexus-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* ANIMAZIONI APERTURA POPUP */
.nexus-pop-enter-active,
.nexus-pop-leave-active {
  transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.nexus-pop-enter-from,
.nexus-pop-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.92);
}

@keyframes pulse-glow {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
}
</style>