// composables/usePulseNexus.ts
import { ref } from 'vue'

export interface ChatMessage {
  id: string
  sender: 'user' | 'assistant'
  text: string
  time: string
  xpEarned?: number
}

const messages = ref<ChatMessage[]>([
  {
    id: 'welcome',
    sender: 'assistant',
    text: '⚡ **DKP Pulse Nexus v2.3 Online**. Chiedimi qualsiasi cosa su Nuxt 4, Neon DB, DKP Tools o chiedi consigli di codice!',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
])

const isTyping = ref(false)

export const usePulseNexus = () => {
  async function sendMessage(text: string, onXpEarned?: (xp: number) => void) {
    const trimmed = text.trim()
    if (!trimmed || isTyping.value) return

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    messages.value.push({
      id: Date.now().toString(),
      sender: 'user',
      text: trimmed,
      time: now
    })

    isTyping.value = true

    try {
      const res: any = await $fetch('/api/nexus/send', {
        method: 'POST',
        body: { message: trimmed }
      })

      if (res && res.message) {
        messages.value.push({
          id: res.message.id || Date.now().toString(),
          sender: 'assistant',
          text: res.message.text,
          time: res.message.timestamp || now,
          xpEarned: res.message.xpEarned
        })

        if (onXpEarned && res.message.xpEarned) {
          onXpEarned(res.message.xpEarned)
        }
      }
    } catch (err: any) {
      console.error('[NEXUS CLIENT ERROR]', err)
      messages.value.push({
        id: Date.now().toString(),
        sender: 'assistant',
        text: '⚡ Connessione ripristinata dal Kernel Nexus. Puoi continuare a scrivere!',
        time: now
      })
    } finally {
      isTyping.value = false
    }
  }

  function clearChat() {
    messages.value = [
      {
        id: 'welcome-' + Date.now(),
        sender: 'assistant',
        text: '⚡ **DKP Pulse Nexus v2.3 Online**. Conversazione resettata.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]
  }

  return {
    messages,
    isTyping,
    sendMessage,
    clearChat
  }
}