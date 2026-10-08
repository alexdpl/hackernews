<!-- app/components/blog/SocialShare.vue -->
<template>
  <div class="social-share-container">
    <span class="share-label">⚡ Condividi nel Network DKP</span>
    
    <div class="share-buttons-grid">
      <!-- X / Twitter -->
      <button 
        @click="shareTo('twitter')" 
        class="share-btn twitter" 
        title="Condividi su X (Twitter)"
        type="button"
      >
        <span>𝕏</span> X
      </button>

      <!-- LinkedIn -->
      <button 
        @click="shareTo('linkedin')" 
        class="share-btn linkedin" 
        title="Condividi su LinkedIn"
        type="button"
      >
        <span>💼</span> LinkedIn
      </button>

      <!-- Facebook -->
      <button 
        @click="shareTo('facebook')" 
        class="share-btn facebook" 
        title="Condividi su Facebook"
        type="button"
      >
        <span>📘</span> Facebook
      </button>

      <!-- WhatsApp -->
      <button 
        @click="shareTo('whatsapp')" 
        class="share-btn whatsapp" 
        title="Condividi su WhatsApp"
        type="button"
      >
        <span>💬</span> WhatsApp
      </button>

      <!-- Telegram -->
      <button 
        @click="shareTo('telegram')" 
        class="share-btn telegram" 
        title="Condividi su Telegram"
        type="button"
      >
        <span>✈️</span> Telegram
      </button>

      <!-- Copy Link con Feedback Visivo -->
      <button 
        @click="copyLink" 
        class="share-btn copy" 
        :class="{ 'copied': isCopied }"
        title="Copia link negli appunti"
        type="button"
      >
        <span>{{ isCopied ? '✅' : '🔗' }}</span> 
        {{ isCopied ? 'Copiato!' : 'Copia Link' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  title: string
  url?: string
  excerpt?: string
}>()

const isCopied = ref(false)

// Prende l'URL corrente se non viene passato come prop
const currentUrl = computed(() => {
  if (typeof window !== 'undefined') {
    return props.url || window.location.href
  }
  return props.url || ''
})

// Funzione di condivisione per i vari social
const shareTo = (platform: string) => {
  const text = encodeURIComponent(props.title)
  const url = encodeURIComponent(currentUrl.value)
  let shareUrl = ''

  switch (platform) {
    case 'twitter':
      shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`
      break
    case 'linkedin':
      shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`
      break
    case 'facebook':
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`
      break
    case 'whatsapp':
      shareUrl = `https://api.whatsapp.com/send?text=${text}%20-%20${url}`
      break
    case 'telegram':
      shareUrl = `https://t.me/share/url?url=${url}&text=${text}`
      break
  }

  if (shareUrl) {
    window.open(shareUrl, '_blank', 'width=600,height=400')
  }
}

// Funzione Copia Link con feedback visivo temporaneo
const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(currentUrl.value)
    isCopied.value = true
    setTimeout(() => {
      isCopied.value = false
    }, 2500)
  } catch (err) {
    console.error('Impossibile copiare il link', err)
  }
}
</script>

<style scoped>
.social-share-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.25rem;
  background: rgba(15, 23, 42, 0.75);
  border: 1px solid rgba(0, 220, 130, 0.2);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  margin: 2rem 0;
}

.share-label {
  font-size: 0.75rem;
  font-weight: 800;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.share-buttons-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.share-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.85rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(30, 41, 59, 0.6);
  color: #f8fafc;
  transition: all 0.2s ease;
}

.share-btn:hover {
  transform: translateY(-2px);
  border-color: rgba(0, 220, 130, 0.4);
  background: rgba(30, 41, 59, 0.9);
}

/* Stili specifici interattivi */
.share-btn.twitter:hover { border-color: #38bdf8; color: #38bdf8; }
.share-btn.linkedin:hover { border-color: #0a66c2; color: #38bdf8; }
.share-btn.facebook:hover { border-color: #1877f2; color: #60a5fa; }
.share-btn.whatsapp:hover { border-color: #25d366; color: #4ade80; }
.share-btn.telegram:hover { border-color: #229ed9; color: #38bdf8; }

.share-btn.copy.copied {
  background: rgba(0, 220, 130, 0.2);
  border-color: #00dc82;
  color: #00dc82;
}
</style>