<!-- app/pages/show.vue -->
<template>
  <div class="show-page-container">
    
    <!-- HEADER DELLA SEZIONE -->
    <div class="show-header">
      <div class="header-text">
        <div class="show-badge">
          PROJECT SHOWCASE & OPEN SOURCE
        </div>
        <h1 class="show-title">
          Show <span class="highlight-text">DKP</span>
        </h1>
        <p class="show-subtitle">
          Presenta i tuoi progetti Open Source, librerie, SaaS e strumenti innovativi. Ricevi feedback dagli sviluppatori e accumula XP.
        </p>
      </div>

      <div class="header-action">
        <NuxtLink to="/submit?type=show" class="submit-show-btn">
          🚀 Presenta un Progetto (+15 XP)
        </NuxtLink>
      </div>
    </div>

    <!-- FEED DEI PROGETTI SHOWCASE -->
    <div v-if="pending" class="loading-state">
      <span class="spinner">⚡</span> Caricamento progetti dal Neon Kernel DB...
    </div>

    <div v-else-if="cleanShowPosts && cleanShowPosts.length > 0" class="show-feed-list">
      <article 
        v-for="(post, index) in cleanShowPosts" 
        :key="post.id || index" 
        class="show-card"
      >
        <!-- BOTTONE VOTAZIONE / UPVOTE -->
        <button 
          @click="votePost(post)" 
          class="vote-btn" 
          :class="{ voted: post.voted }"
          :disabled="post.voting"
          title="Vota questo progetto (+5 XP)"
        >
          <span class="vote-icon">▲</span>
          <span class="vote-count">{{ post.points || 0 }}</span>
        </button>

        <!-- CONTENUTO PROGETTO -->
        <div class="show-content">
          <div class="show-main">
            <span class="show-index">{{ index + 1 }}.</span>
            
            <a v-if="post.url" :href="post.url" target="_blank" rel="noopener" class="post-title-link">
              {{ post.title }}
            </a>
            <NuxtLink v-else :to="`/item/${post.id}`" class="post-title-link">
              {{ post.title }}
            </NuxtLink>

            <a v-if="post.domain" :href="post.url || '#'" target="_blank" rel="noopener" class="domain-tag">
              ({{ post.domain }}) ↗
            </a>
          </div>

          <!-- METADATI (Autore, tempo, commenti, veridicità) -->
          <div class="show-meta">
            <span>Showcase di <strong class="author-tag">@{{ post.author || 'alexdpl' }}</strong></span>
            <span class="meta-dot">•</span>
            <span class="time-tag">⏱️ {{ post.timeAgo || 'di recente' }}</span>
            <span class="meta-dot">•</span>
            <NuxtLink :to="`/item/${post.id}`" class="comments-link">
              💬 {{ post.comments_count || post.commentsCount || 0 }} commenti
            </NuxtLink>
            <span class="meta-dot">•</span>
            <span class="xp-pill">Show DKP Verified</span>
          </div>
        </div>
      </article>
    </div>

    <!-- EMPTY STATE FALLBACK -->
    <div v-else class="empty-state">
      <p>Nessun progetto showcase pubblicato al momento.</p>
      <NuxtLink to="/submit?type=show" class="submit-inline-link">Sii il primo a mostrare il tuo progetto!</NuxtLink>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

useHead({
  title: 'Show DKP - Vetrina Progetti Open Source e SaaS',
  meta: [
    { name: 'description', content: 'Mostra i tuoi progetti, librerie open source e SaaS alla community di DevKernelPulse v2.3.' }
  ]
})

// Fetch dei post di tipo Show
const { data: rawPosts, pending } = await useFetch('/api/posts', {
  query: { type: 'show' },
  lazy: true,
  default: () => [
    {
      id: 301,
      title: 'Show DKP: Ollaya – Ollama for open-source, Jev-style decision models',
      domain: 'ollaya.dev',
      url: 'https://ollaya.dev',
      author: 'alexdpl',
      points: 18,
      comments_count: 4,
      timeAgo: '22h fa',
      voted: false
    },
    {
      id: 302,
      title: 'Show DKP: Doom or Bloom, map your AI worldview with Jev',
      domain: 'doom-or-bloom.com',
      url: 'https://doom-or-bloom.com',
      author: 'alexdpl',
      points: 17,
      comments_count: 6,
      timeAgo: '1g fa',
      voted: false
    },
    {
      id: 303,
      title: 'Show DKP: DKP Tools v2.3 – In-Browser Web Shell, AI Code Scanner & Proof of Code Vault',
      domain: 'devkernelpulse.org',
      url: 'https://devkernelpulse.org',
      author: 'alexdpl',
      points: 142,
      comments_count: 28,
      timeAgo: '2g fa',
      voted: false
    }
  ]
})

// De-duplicazione automatica per ID/Titolo e sanificazione delle date "Invalid Date"
const cleanShowPosts = computed(() => {
  const postsArray = Array.isArray(rawPosts.value) ? rawPosts.value : (rawPosts.value as any)?.data || []
  
  const seen = new Set()
  return postsArray.filter((item: any) => {
    const key = item.id || item.title
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).map((post: any) => ({
    ...post,
    timeAgo: post.timeAgo || post.time_ago || (post.createdAt ? new Date(post.createdAt).toLocaleDateString('it-IT') : 'di recente')
  }))
})

// Logica Votazione
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
.show-page-container {
  max-width: 1000px;
  margin: 1.5rem auto;
  padding: 0 1rem;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #f8fafc;
}

/* HEADER */
.show-header {
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

.show-badge {
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

.show-title {
  font-size: 2rem;
  font-weight: 900;
  margin: 0 0 0.4rem 0;
  color: #ffffff;
}

.highlight-text {
  color: #00dc82;
}

.show-subtitle {
  font-size: 0.88rem;
  color: #94a3b8;
  margin: 0;
  max-width: 650px;
  line-height: 1.5;
}

.submit-show-btn {
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

.submit-show-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 20px rgba(0, 220, 130, 0.4);
}

/* LISTA CARD */
.show-feed-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.show-card {
  background: rgba(9, 13, 22, 0.85);
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1rem 1.2rem;
  display: flex;
  align-items: center;
  gap: 1.1rem;
  transition: border-color 0.2s ease;
}

.show-card:hover {
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
.show-content {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex: 1;
}

.show-main {
  display: flex;
  align-items: baseline;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.show-index {
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

.domain-tag {
  font-size: 0.78rem;
  color: #38bdf8;
  text-decoration: none;
}

.domain-tag:hover {
  text-decoration: underline;
}

/* METADATA */
.show-meta {
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
  .show-header {
    padding: 1.25rem;
  }
  .show-title {
    font-size: 1.6rem;
  }
}
</style>