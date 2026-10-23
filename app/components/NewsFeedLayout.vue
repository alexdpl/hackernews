<!-- components/NewsFeedLayout.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import DkpAdStrip from '~/components/DkpAdStrip.vue'

const props = defineProps<{
  section: 'news' | 'ask' | 'show' | 'jobs'
  title: string
  icon: string
}>()

const { currentUser } = useAuthCore()

// Fetch dinamico dal DB Neon per la sezione attiva
const { data: response, refresh } = await useFetch(`/api/pulse/stories?type=${props.section}`)

// Helper di sicurezza per l'estrazione dell'autore
function parseAuthor(authorData: any): string {
  if (!authorData) return 'community'
  if (typeof authorData === 'object') return authorData.username || 'community'
  if (typeof authorData === 'string' && authorData.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(authorData)
      return parsed.username || 'community'
    } catch {
      return authorData
    }
  }
  return authorData
}

// Normalizzazione dati e URL
const postsList = computed(() => {
  const raw = response.value?.stories || response.value?.data || response.value || []
  return raw.map((post: any) => {
    let cleanDomain = post.domain
    if (!cleanDomain && post.url && !post.url.startsWith('/')) {
      try { cleanDomain = new URL(post.url).hostname.replace('www.', '') } catch {}
    }
    
    return {
      ...post,
      authorName: parseAuthor(post.author),
      domain: cleanDomain,
      points: post.points || 1,
      commentsCount: post.comments_count || post.commentsCount || 0
    }
  })
})

// Gestione Upvote con feedback visivo istantaneo
async function handleUpvote(post: any) {
  if (!currentUser.value) {
    alert('Devi essere autenticato per votare e guadagnare XP!')
    return
  }

  try {
    const res = await $fetch<{ success: boolean; message: string }>('/api/pulse/vote', {
      method: 'POST',
      body: {
        storyId: post.id,
        userId: currentUser.value.id
      }
    })

    if (res.success) {
      post.points++
      alert(`⚡ ${res.message}`)
    } else {
      alert(res.message)
    }
  } catch (err: any) {
    console.error('Errore voto:', err)
  }
}
</script>

<template>
  <div class="feed-container">
    <header class="feed-header">
      <div class="title-group">
        <span class="feed-icon">{{ icon }}</span>
        <h1 class="feed-title">{{ title }}</h1>
        <span class="gold-badge">v2.5-GOLD</span>
      </div>
      
      <NuxtLink :to="`/submit?type=${section}`" class="btn-submit-xp">
        ⚡ Invia Post (+15 XP)
      </NuxtLink>
    </header>

    <div v-if="!postsList.length" class="empty-state">
      <p>📭 Nessun elemento trovato nella sezione {{ title }}.</p>
    </div>

    <div v-else class="feed-list">
      <div v-for="(post, index) in postsList" :key="post.id || index" class="feed-card">
        
        <!-- PULSANTE VOTO / GAMIFICATION -->
        <button @click="handleUpvote(post)" class="vote-box" title="Vota per assegnare +5 XP">
          <span class="vote-arrow">▲</span>
          <span class="vote-count">{{ post.points }}</span>
        </button>

        <!-- DETTAGLI CONTENUTO -->
        <div class="post-content">
          <div class="post-title-line">
            <span class="post-number">{{ index + 1 }}.</span>
            
            <!-- Link Esterno se c'è URL, altrimenti Link Interno alla discussione -->
            <a v-if="post.url" :href="post.url" target="_blank" rel="noopener noreferrer" class="post-title">
              {{ post.title }}
            </a>
            <NuxtLink v-else :to="`/item/${post.id}`" class="post-title">
              {{ post.title }}
            </NuxtLink>
            
            <span v-if="post.domain" class="post-domain">({{ post.domain }})</span>
          </div>

          <div class="post-meta">
            <span>da <strong class="author-tag">@{{ post.authorName }}</strong></span>
            <span class="meta-dot">•</span>
            <span>⏱️ {{ new Date(post.createdAt || post.created_at || Date.now()).toLocaleDateString('it-IT') }}</span>
            <span class="meta-dot">•</span>
            <!-- 🟢 LINK ATTIVO AI COMMENTI -->
            <NuxtLink :to="`/item/${post.id}`" class="comments-link">
              💬 {{ post.commentsCount }} commenti
            </NuxtLink>
            <span class="meta-dot">•</span>
            <span class="verified-tag">Verified da DKP Crawler</span>
          </div>
        </div>

      </div>
    </div>

    <!-- BANNER CONTESTUALE ALLA SEZIONE -->
    <DkpAdStrip :categoryTag="`DKP ${section.toUpperCase()} SPONSORED`" class="mt-8" />
  </div>
</template>

<style scoped>
.feed-container { max-width: 1000px; margin: 2rem auto; padding: 0 1rem; color: #f8fafc; font-family: system-ui, -apple-system, sans-serif; }
.feed-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 2rem; border-bottom: 1px solid #1e293b; padding-bottom: 1rem; }
.title-group { display: flex; align-items: center; gap: 0.75rem; }
.feed-title { font-size: 2rem; font-weight: 900; margin: 0; }
.feed-icon { font-size: 1.8rem; }
.gold-badge { font-size: 0.7rem; font-weight: 800; color: #00dc82; background: rgba(0, 220, 130, 0.1); border: 1px solid rgba(0, 220, 130, 0.3); padding: 0.2rem 0.5rem; border-radius: 4px; }
.btn-submit-xp { background: #00dc82; color: #020420; font-weight: 900; font-size: 0.85rem; text-decoration: none; padding: 0.7rem 1.2rem; border-radius: 8px; transition: all 0.2s; white-space: nowrap; }
.btn-submit-xp:hover { box-shadow: 0 0 15px rgba(0, 220, 130, 0.4); transform: translateY(-2px); }

.feed-list { display: flex; flex-direction: column; gap: 0.85rem; margin-bottom: 2.5rem; }
.feed-card { background: rgba(9, 13, 22, 0.85); border: 1px solid #1e293b; border-radius: 12px; padding: 1.1rem 1.3rem; display: flex; align-items: flex-start; gap: 1rem; transition: border-color 0.2s; }
.feed-card:hover { border-color: #00dc82; }

.vote-box { background: #090d16; border: 1px solid #1e293b; border-radius: 8px; min-width: 48px; height: 48px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #f59e0b; cursor: pointer; transition: all 0.2s; flex-shrink: 0; }
.vote-box:hover { border-color: #f59e0b; background: rgba(245, 158, 11, 0.1); }
.vote-arrow { font-size: 0.75rem; }
.vote-count { font-weight: 900; font-size: 0.85rem; }

.post-content { display: flex; flex-direction: column; gap: 0.35rem; width: 100%; }
.post-title-line { display: flex; align-items: baseline; gap: 0.5rem; flex-wrap: wrap; }
.post-number { color: #00dc82; font-weight: 900; font-size: 1rem; }
.post-title { color: #ffffff; font-weight: 800; font-size: 1.05rem; text-decoration: none; }
.post-title:hover { color: #00dc82; text-decoration: underline; }
.post-domain { color: #64748b; font-size: 0.82rem; font-weight: 500; }

.post-meta { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; font-size: 0.78rem; color: #94a3b8; margin-top: 0.2rem; }
.author-tag { color: #a78bfa; font-weight: 600; }
.meta-dot { color: #334155; }
.verified-tag { color: #64748b; font-style: italic; }

.comments-link { color: #38bdf8; text-decoration: none; font-weight: 700; }
.comments-link:hover { color: #00dc82; text-decoration: underline; }

.empty-state { text-align: center; padding: 3rem; background: #060a12; border: 1px solid #1e293b; border-radius: 12px; color: #94a3b8; margin-bottom: 2rem; }
.mt-8 { margin-top: 2rem; }
</style>