<!-- app/pages/ask.vue -->
<template>
  <div class="ask-page-container">
    
    <!-- HEADER DELLA SEZIONE -->
    <div class="ask-header">
      <div class="header-text">
        <div class="ask-badge">
          COMMUNITY Q&A & TECHNICAL DISCUSSIONS
        </div>
        <h1 class="ask-title">
          Ask <span class="highlight-text">DKP</span>
        </h1>
        <p class="ask-subtitle">
          Fai domande sull'architettura software, chiedi code review, o apri un dibattito tecnico con la community di sviluppatori.
        </p>
      </div>

      <div class="header-action">
        <NuxtLink to="/submit?type=ask" class="submit-ask-btn">
          💬 Fai una Domanda (+15 XP)
        </NuxtLink>
      </div>
    </div>

    <!-- FEED DELLE DOMANDE -->
    <div v-if="pending" class="loading-state">
      <span class="spinner">⚡</span> Caricamento discussioni dal Neon Kernel DB...
    </div>

    <div v-else-if="cleanAskPosts && cleanAskPosts.length > 0" class="ask-feed-list">
      <article 
        v-for="(post, index) in cleanAskPosts" 
        :key="post.id || index" 
        class="ask-card"
      >
        <!-- BOTTONE VOTAZIONE / UPVOTE -->
        <button 
          @click="votePost(post)" 
          class="vote-btn" 
          :class="{ voted: post.voted }"
          :disabled="post.voting"
          title="Vota questa domanda (+5 XP)"
        >
          <span class="vote-icon">▲</span>
          <span class="vote-count">{{ post.points || 0 }}</span>
        </button>

        <!-- CONTENUTO DOMANDA -->
        <div class="ask-content">
          <div class="ask-main">
            <span class="ask-index">{{ index + 1 }}.</span>
            
            <NuxtLink :to="`/item/${post.id}`" class="post-title-link">
              {{ post.title }}
            </NuxtLink>
          </div>

          <!-- METADATI (Autore, tempo formattato, conteggio commenti) -->
          <div class="ask-meta">
            <span>Inviata da <strong class="author-tag">@{{ post.author || 'alexdpl' }}</strong></span>
            <span class="meta-dot">•</span>
            <span class="time-tag">⏱️ {{ post.timeAgo || 'di recente' }}</span>
            <span class="meta-dot">•</span>
            <NuxtLink :to="`/item/${post.id}`" class="comments-link">
              💬 {{ post.comments_count || post.commentsCount || 0 }} commenti
            </NuxtLink>
            <span class="meta-dot">•</span>
            <span class="xp-pill">+15 XP Riconosciuti</span>
          </div>
        </div>
      </article>
    </div>

    <!-- EMPTY STATE FALLBACK -->
    <div v-else class="empty-state">
      <p>Nessuna domanda presente al momento su Ask DKP.</p>
      <NuxtLink to="/submit?type=ask" class="submit-inline-link">Fai la prima domanda alla community!</NuxtLink>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

useHead({
  title: 'Ask DKP - Q&A e Discussioni Tecniche',
  meta: [
    { name: 'description', content: 'Apri discussioni tecniche, fai domande sull architettura software o richiedi code review alla community DKP.' }
  ]
})

// Fetch post specifici della sezione Ask
const { data: rawPosts, pending } = await useFetch('/api/posts', {
  query: { type: 'ask' },
  lazy: true,
  default: () => [
    {
      id: 201,
      title: 'Ask DKP: Come ottimizzare il connection pooling di Neon PostgreSQL su serverless SSR Nuxt 4?',
      author: 'alexdpl',
      points: 18,
      comments_count: 5,
      timeAgo: '2 ore fa',
      voted: false
    },
    {
      id: 202,
      title: 'Ask DKP: Quali pattern utilizzate per gestire l autenticazione HttpOnly resiliente in GCP Compute Engine?',
      author: 'marco_dev',
      points: 24,
      comments_count: 12,
      timeAgo: '5 ore fa',
      voted: false
    },
    {
      id: 203,
      title: 'Ask DKP: Micro-Frontend o Monolito Modulare per SaaS con elevato traffico nel 2026?',
      author: 'kernel_admin',
      points: 31,
      comments_count: 8,
      timeAgo: '1 giorno fa',
      voted: false
    }
  ]
})

// De-duplicazione automatica dei post per ID e sanificazione date
const cleanAskPosts = computed(() => {
  const postsArray = Array.isArray(rawPosts.value) ? rawPosts.value : (rawPosts.value as any)?.data || []
  
  // Rimuove eventuali doppioni per ID o Titolo
  const seen = new Set()
  return postsArray.filter((item: any) => {
    const duplicateKey = item.id || item.title
    if (seen.has(duplicateKey)) return false
    seen.add(duplicateKey)
    return true
  }).map((post: any) => ({
    ...post,
    // Correzione automatica di "Invalid Date"
    timeAgo: post.timeAgo || post.time_ago || (post.createdAt ? new Date(post.createdAt).toLocaleDateString('it-IT') : 'di recente')
  }))
})

// Logica di voto
const votePost = (post: any) => {
  if (post.voted) {
    post.points--
    post.voted = false
  } else {
    post.points++
    post.voted = true
  }
}
</script>

<style scoped>
.ask-page-container {
  max-width: 1000px;
  margin: 1.5rem auto;
  padding: 0 1rem;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #f8fafc;
}

/* HEADER */
.ask-header {
  background: rgba(9, 13, 22, 0.85);
  backdrop-filter: blur(16px);
  border: 1px solid #1e293b;
  border-radius: 16px;
  padding: 1.75rem 2rem;
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1.25rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.ask-badge {
  display: inline-block;
  background: rgba(0, 220, 130, 0.12);
  color: #00dc82;
  border: 1px solid rgba(0, 220, 130, 0.3);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  margin-bottom: 0.6rem;
}

.ask-title {
  font-size: 2rem;
  font-weight: 900;
  margin: 0 0 0.4rem 0;
  color: #ffffff;
}

.highlight-text {
  color: #00dc82;
}

.ask-subtitle {
  font-size: 0.88rem;
  color: #94a3b8;
  margin: 0;
  max-width: 650px;
  line-height: 1.5;
}

.submit-ask-btn {
  background: #00dc82;
  color: #020420;
  font-weight: 900;
  font-size: 0.85rem;
  padding: 0.7rem 1.2rem;
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.submit-ask-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 20px rgba(0, 220, 130, 0.4);
}

/* LISTA CARD */
.ask-feed-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.ask-card {
  background: rgba(9, 13, 22, 0.85);
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1rem 1.2rem;
  display: flex;
  align-items: center;
  gap: 1.1rem;
  transition: border-color 0.2s ease;
}

.ask-card:hover {
  border-color: rgba(0, 220, 130, 0.35);
}

/* VOTE BUTTON */
.vote-btn {
  background: #020420;
  border: 1px solid #1e293b;
  color: #94a3b8;
  border-radius: 8px;
  padding: 0.45rem 0.65rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  min-width: 46px;
  transition: all 0.2s ease;
}

.vote-btn:hover {
  border-color: #00dc82;
  color: #00dc82;
}

.vote-btn.voted {
  background: rgba(0, 220, 130, 0.15);
  border-color: #00dc82;
  color: #00dc82;
}

.vote-icon {
  font-size: 0.7rem;
}

.vote-count {
  font-size: 0.85rem;
  font-weight: 800;
}

/* POST CONTENT */
.ask-content {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex: 1;
}

.ask-main {
  display: flex;
  align-items: baseline;
  gap: 0.45rem;
}

.ask-index {
  font-size: 0.88rem;
  color: #64748b;
  font-weight: 700;
}

.post-title-link {
  color: #f8fafc;
  font-size: 0.98rem;
  font-weight: 700;
  text-decoration: none;
  line-height: 1.4;
}

.post-title-link:hover {
  color: #00dc82;
  text-decoration: underline;
}

/* METADATA */
.ask-meta {
  font-size: 0.78rem;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.author-tag {
  color: #00dc82;
}

.meta-dot {
  color: #334155;
}

.comments-link {
  color: #38bdf8;
  text-decoration: none;
}

.comments-link:hover {
  text-decoration: underline;
}

.xp-pill {
  background: #020420;
  color: #00dc82;
  border: 1px solid rgba(0, 220, 130, 0.2);
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 700;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #94a3b8;
}

.submit-inline-link {
  color: #00dc82;
  text-decoration: underline;
  margin-top: 0.5rem;
  display: inline-block;
}

@media (max-width: 640px) {
  .ask-header {
    padding: 1.25rem;
  }
  .ask-title {
    font-size: 1.6rem;
  }
}
</style>