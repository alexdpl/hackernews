<!-- app/components/blog/SocialShare.vue -->
<template>
  <div class="social-share-container" :class="{ 'vertical': vertical, 'horizontal': horizontal }">
    <span v-if="!vertical" class="share-label">⚡ Condividi nel Network DKP</span>
    
    <div class="share-buttons-grid" :class="{ 'flex-col': vertical }">
      <!-- X / Twitter -->
      <button @click="shareTo('twitter')" class="share-btn twitter" title="Condividi su X (Twitter)" type="button">
        <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        <span v-if="!vertical" class="text-label">X</span>
      </button>

      <!-- LinkedIn -->
      <button @click="shareTo('linkedin')" class="share-btn linkedin" title="Condividi su LinkedIn" type="button">
        <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
        <span v-if="!vertical" class="text-label">LinkedIn</span>
      </button>

      <!-- Facebook -->
      <button @click="shareTo('facebook')" class="share-btn facebook" title="Condividi su Facebook" type="button">
        <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
        <span v-if="!vertical" class="text-label">Facebook</span>
      </button>
      
      <!-- Reddit -->
      <button @click="shareTo('reddit')" class="share-btn reddit" title="Condividi su Reddit" type="button">
        <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>
        <span v-if="!vertical" class="text-label">Reddit</span>
      </button>

      <!-- Telegram -->
      <button @click="shareTo('telegram')" class="share-btn telegram" title="Condividi su Telegram" type="button">
        <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.892-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
        <span v-if="!vertical" class="text-label">Telegram</span>
      </button>

      <!-- Copy Link -->
      <button @click="copyLink" class="share-btn copy" :class="{ 'copied': isCopied }" title="Copia link" type="button">
        <span class="text-lg">{{ isCopied ? '✅' : '🔗' }}</span> 
        <span v-if="!vertical" class="text-label">{{ isCopied ? 'Copiato!' : 'Copia Link' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{ title: string, url?: string, excerpt?: string, vertical?: boolean, horizontal?: boolean }>()
const isCopied = ref(false)

const currentUrl = computed(() => {
  if (typeof window !== 'undefined') return props.url || window.location.href
  return props.url || ''
})

const shareTo = (platform: string) => {
  const text = encodeURIComponent(props.title)
  const url = encodeURIComponent(currentUrl.value)
  let shareUrl = ''
  switch (platform) {
    case 'twitter': shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`; break;
    case 'linkedin': shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`; break;
    case 'facebook': shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`; break;
    case 'reddit': shareUrl = `https://reddit.com/submit?url=${url}&title=${text}`; break;
    case 'telegram': shareUrl = `https://t.me/share/url?url=${url}&text=${text}`; break;
  }
  if (shareUrl) window.open(shareUrl, '_blank', 'width=600,height=500')
}

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(currentUrl.value)
    isCopied.value = true
    setTimeout(() => { isCopied.value = false }, 2500)
  } catch (err) { console.error(err) }
}
</script>

<style scoped>
.social-share-container { display: flex; flex-direction: column; gap: 0.75rem; }
.social-share-container.horizontal { padding: 1.25rem; background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(0, 220, 130, 0.2); border-radius: 12px; backdrop-filter: blur(10px); margin: 1rem 0; }
.share-label { font-size: 0.75rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
.share-buttons-grid { display: flex; flex-wrap: wrap; gap: 0.6rem; }
.share-buttons-grid.flex-col { flex-direction: column; gap: 0.8rem; }
.share-btn { display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.5rem 0.85rem; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; border: 1px solid rgba(255, 255, 255, 0.1); background: rgba(30, 41, 59, 0.6); color: #f8fafc; transition: all 0.2s ease; }
.share-buttons-grid.flex-col .share-btn { padding: 0; width: 2.75rem; height: 2.75rem; border-radius: 50%; }
.share-btn:hover { transform: translateY(-2px); background: rgba(30, 41, 59, 0.9); }

/* Colori specifici (gli SVG si colorano in automatico tramite currentColor!) */
.share-btn.twitter:hover { border-color: #e2e8f0; color: #e2e8f0; } /* X è bianco/grigio */
.share-btn.linkedin:hover { border-color: #0a66c2; color: #0a66c2; }
.share-btn.facebook:hover { border-color: #1877f2; color: #1877f2; }
.share-btn.reddit:hover { border-color: #ff4500; color: #ff4500; }
.share-btn.telegram:hover { border-color: #229ed9; color: #229ed9; }
.share-btn.copy.copied { background: rgba(0, 220, 130, 0.2); border-color: #00dc82; color: #00dc82; }
</style>