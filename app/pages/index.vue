<!-- pages/index.vue -->
<template>
  <div class="feed-container">
    
    <!-- HEADER FEED / TAB SELECTION -->
    <div class="feed-header">
      <div class="feed-title-section">
        <h1 class="feed-title">
          Tech Feed <span class="highlight-badge">v2.4</span>
        </h1>
        <p class="feed-subtitle">
          Le migliori notizie, progetti Open Source e discussioni architetturali verificate dal DKP Crawler.
        </p>
      </div>

      <div class="feed-actions">
        <NuxtLink to="/submit" class="submit-btn">
          ⚡ Invia Post (+15 XP)
        </NuxtLink>
      </div>
    </div>

    <!-- LISTA NOTIZIE / STORIES -->
    <div v-if="pending" class="loading-feed">
      <span class="spinner">⚡</span> Caricamento notizie dal Neon Kernel DB...
    </div>

    <div v-else-if="stories && stories.length > 0" class="story-list">
      <article 
        v-for="(story, index) in stories" 
        :key="story.id || index" 
        class="story-card"
      >
        <!-- BOTTONE VOTAZIONE / UPVOTE -->
        <button 
          @click="voteStory(story)" 
          class="vote-btn" 
          :class="{ voted: story.voted }"
          :disabled="story.voting"
          title="Vota questo post (+5 XP)"
        >
          <span class="vote-icon">▲</span>
          <span class="vote-count">{{ story.points || 0 }}</span>
        </button>

        <!-- CONTENUTO NOTIZIA -->
        <div class="story-content">
          <div class="story-main">
            <span class="story-index">{{ index + 1 }}.</span>
            
            <a :href="story.url" target="_blank" rel="noopener" class="story-title">
              {{ story.title }}
            </a>

            <a v-if="story.domain" :href="story.url" target="_blank" rel="noopener" class="story-domain">
              ({{ story.domain }}) ↗
            </a>
          </div>

          <!-- METADATI (Autore, tempo, veridicità) -->
          <div class="story-meta">
            <span>Inviato da <strong class="author-tag">@{{ story.author || 'alexdpl' }}</strong></span>
            <span class="meta-dot">•</span>
            <span class="time-tag">⏱️ {{ story.timeAgo || 'di recente' }}</span>
            <span class="meta-dot">•</span>
            <span class="verify-tag">
              Verified da <strong>DKP Crawler v2.4</strong>
            </span>
          </div>
        </div>
      </article>
    </div>

    <!-- EMPTY STATE FALLBACK -->
    <div v-else class="empty-feed">
      <p>Nessun post trovato nel feed principale.</p>
      <NuxtLink to="/submit" class="submit-btn-inline">Sii il primo a pubblicare un contenuto!</NuxtLink>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

useHead({
  title: 'Tech Feed & Community News',
  meta: [
    { name: 'description', content: 'Notizie tecnologiche, progetti open source e discussioni per developer.' }
  ]
})

// Fetch stories dal backend/DB
const { data: rawStories, pending } = await useFetch('/api/stories', {
  lazy: true,
  default: () => [
    {
      id: 1,
      title: 'Ollaya – Ollama for open-source, Jev-style decision models',
      url: 'https://ollaya.dev',
      domain: 'ollaya.dev',
      points: 18,
      author: 'alexdpl',
      timeAgo: '22h fa',
      voted: false
    },
    {
      id: 2,
      title: 'Yes, Claude can do Nine Loops',
      url: 'https://anthropic.com',
      domain: 'anthropic.com',
      points: 35,
      author: 'alexdpl',
      timeAgo: '23h fa',
      voted: false
    },
    {
      id: 3,
      title: 'Show HN: Doom or Bloom, map your AI worldview with Jev',
      url: 'https://doom-or-bloom.com',
      domain: 'doom-or-bloom.com',
      points: 17,
      author: 'alexdpl',
      timeAgo: '1g fa',
      voted: false
    },
    {
      id: 4,
      title: 'Classified Estimates Show the NSA Is Paying Billions to Test AI Models',
      url: 'https://washingtonsun.com',
      domain: 'washingtonsun.com',
      points: 139,
      author: 'alexdpl',
      timeAgo: '1g fa',
      voted: false
    },
    {
      id: 5,
      title: 'Allow Carriers on Planes',
      url: 'https://jefftk.com',
      domain: 'jefftk.com',
      points: 31,
      author: 'alexdpl',
      timeAgo: '1g fa',
      voted: false
    }
  ]
})

const stories = ref(rawStories)

// Logica Voto
const voteStory = (story: any) => {
  if (story.voted) {
    story.points--
    story.voted = false
  } else {
    story.points++
    story.voted = true
  }
}
</script>

<style scoped>
.feed-container {
  max-width: 1000px;
  margin: 1.5rem auto;
  padding: 0 1rem;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #f8fafc;
}

.feed-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #1e293b;
  flex-wrap: wrap;
  gap: 1rem;
}

.feed-title {
  font-size: 1.75rem;
  font-weight: 900;
  margin: 0;
  color: #ffffff;
}

.highlight-badge {
  font-size: 0.75rem;
  background: rgba(0, 220, 130, 0.15);
  color: #00dc82;
  border: 1px solid rgba(0, 220, 130, 0.3);
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  vertical-align: middle;
}

.feed-subtitle {
  font-size: 0.85rem;
  color: #94a3b8;
  margin: 0.25rem 0 0 0;
}

.submit-btn {
  background: #00dc82;
  color: #020420;
  font-weight: 800;
  font-size: 0.85rem;
  padding: 0.6rem 1.1rem;
  border-radius: 8px;
  text-decoration: none;
  transition: transform 0.2s, box-shadow 0.2s;
  display: inline-block;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 15px rgba(0, 220, 130, 0.4);
  text-decoration: none;
}

/* STORY LIST */
.story-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.story-card {
  background: rgba(9, 13, 22, 0.85);
  border: 1px solid #1e293b;
  border-radius: 10px;
  padding: 0.9rem 1.1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: border-color 0.2s;
}

.story-card:hover {
  border-color: rgba(0, 220, 130, 0.3);
}

.vote-btn {
  background: #020420;
  border: 1px solid #1e293b;
  color: #94a3b8;
  border-radius: 8px;
  padding: 0.4rem 0.6rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  min-width: 44px;
  transition: all 0.2s;
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
  font-size: 0.82rem;
  font-weight: 800;
}

/* STORY CONTENT */
.story-content {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  flex: 1;
}

.story-main {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.story-index {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 700;
}

.story-title {
  color: #f8fafc;
  font-size: 0.95rem;
  font-weight: 700;
  text-decoration: none;
}

.story-title:hover {
  color: #00dc82;
  text-decoration: underline;
}

.story-domain {
  font-size: 0.78rem;
  color: #38bdf8;
  text-decoration: none;
}

.story-domain:hover {
  text-decoration: underline;
}

.story-meta {
  font-size: 0.75rem;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.author-tag {
  color: #00dc82;
}

.meta-dot {
  color: #334155;
}

.verify-tag {
  color: #94a3b8;
}

.loading-feed, .empty-feed {
  text-align: center;
  padding: 3rem 1rem;
  color: #94a3b8;
}

.submit-btn-inline {
  color: #00dc82;
  text-decoration: underline;
  margin-top: 0.5rem;
  display: inline-block;
}
</style>