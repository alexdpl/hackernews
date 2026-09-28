<!-- components/NewsFeedLayout.vue -->
<script setup lang="ts">
const props = defineProps<{
  section: 'news' | 'ask' | 'show' | 'jobs'
  title: string
  icon: string
}>()

const { currentUser } = useAuthCore()

// Fetch dinamico dal DB Neon per la sezione attiva
const { data: response, refresh } = await useFetch(`/api/pulse/stories?type=${props.section}`)
const posts = computed(() => response.value?.stories || response.value || [])

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
        <span class="gold-badge">v2.4-GOLD</span>
      </div>
      
      <NuxtLink to="/submit" class="btn-submit-xp">
        ⚡ Invia Post (+15 XP)
      </NuxtLink>
    </header>

    <div class="feed-list">
      <div v-for="(post, index) in posts" :key="post.id" class="feed-card">
        
        <!-- PULSANTE VOTO / GAMIFICATION -->
        <button @click="handleUpvote(post)" class="vote-box" title="Vota per assegnare +5 XP">
          <span class="vote-arrow">▲</span>
          <span class="vote-count">{{ post.points || 1 }}</span>
        </button>

        <!-- DETTAGLI CONTENUTO -->
        <div class="post-content">
          <div class="post-title-line">
            <span class="post-number">{{ index + 1 }}.</span>
            <a :href="post.url" target="_blank" class="post-title">{{ post.title }}</a>
            <span v-if="post.domain" class="post-domain">({{ post.domain }}) ↗</span>
          </div>

          <div class="post-meta">
            <span>Inviato da <strong class="author-tag">@{{ post.author || 'community' }}</strong></span>
            <span class="meta-dot">•</span>
            <span>💬 {{ post.comments_count || 0 }} commenti</span>
            <span class="meta-dot">•</span>
            <span class="verified-tag">Verified da DKP Crawler v2.4-GOLD</span>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.feed-container { max-width: 1000px; margin: 2rem auto; padding: 0 1rem; color: #f8fafc; }
.feed-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; border-bottom: 1px solid #1e293b; padding-bottom: 1rem; }
.title-group { display: flex; align-items: center; gap: 0.75rem; }
.feed-title { font-size: 2rem; font-weight: 900; margin: 0; }
.gold-badge { font-size: 0.7rem; font-weight: 800; color: #00dc82; background: rgba(0, 220, 130, 0.1); border: 1px solid rgba(0, 220, 130, 0.3); padding: 0.2rem 0.5rem; border-radius: 4px; }
.btn-submit-xp { background: #00dc82; color: #020420; font-weight: 800; text-decoration: none; padding: 0.6rem 1.2rem; border-radius: 8px; transition: all 0.2s; }
.btn-submit-xp:hover { box-shadow: 0 0 15px rgba(0, 220, 130, 0.4); transform: translateY(-1px); }

.feed-list { display: flex; flex-direction: column; gap: 0.85rem; }
.feed-card { background: #060a12; border: 1px solid #1e293b; border-radius: 10px; padding: 1rem; display: flex; align-items: center; gap: 1rem; transition: border-color 0.2s; }
.feed-card:hover { border-color: #00dc82; }

.vote-box { background: #090d16; border: 1px solid #1e293b; border-radius: 8px; width: 48px; height: 48px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #38bdf8; cursor: pointer; transition: all 0.2s; }
.vote-box:hover { border-color: #00dc82; color: #00dc82; background: rgba(0, 220, 130, 0.08); }
.vote-arrow { font-size: 0.75rem; }
.vote-count { font-weight: 800; font-size: 0.85rem; }

.post-content { display: flex; flex-direction: column; gap: 0.35rem; }
.post-title-line { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.post-number { color: #64748b; font-weight: 700; }
.post-title { color: #ffffff; font-weight: 700; font-size: 1.05rem; text-decoration: none; }
.post-title:hover { color: #00dc82; }
.post-domain { color: #38bdf8; font-size: 0.8rem; text-decoration: none; }

.post-meta { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: #64748b; }
.author-tag { color: #00dc82; }
.meta-dot { color: #334155; }
.verified-tag { color: #94a3b8; font-style: italic; }
</style>