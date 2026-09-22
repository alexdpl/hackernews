<!-- app/pages/news.vue -->
<script setup lang="ts">
const { data: posts, refresh } = await useFetch('/api/posts')

useSeoMeta({
  title: 'Notizie - DevKernelPulse',
  description: 'Le ultime notizie tech e di programmazione su DevKernelPulse.'
})
</script>

<template>
  <div class="news-container">
    <h1>Notizie Principali</h1>
    
    <div v-if="posts && posts.length > 0" class="posts-list">
      <div v-for="(post, index) in posts" :key="post.id" class="post-item">
        <span class="post-index">{{ index + 1 }}.</span>
        <div class="post-content">
          <a :href="post.url || '#'" target="_blank" rel="noopener" class="post-title">
            {{ post.title }}
          </a>
          <span v-if="post.url" class="post-domain">({{ new URL(post.url).hostname }})</span>
          <div class="post-meta">
            <span>{{ post.points || 1 }} punto</span> • 
            <span>da {{ post.author || 'community' }}</span> • 
            <span>{{ post.date || 'oggi' }}</span>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="empty-state">
      <p>Nessuna notizia trovata al momento.</p>
    </div>
  </div>
</template>

<style scoped>
.news-container {
  max-width: 800px;
  margin: 2rem auto;
  padding: 0 1rem;
  font-family: ui-sans-serif, system-ui, sans-serif;
}
.news-container h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #020420;
  margin-bottom: 1.5rem;
}
.posts-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.post-item {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}
.post-index {
  font-weight: 600;
  color: #64748b;
}
.post-title {
  font-weight: 600;
  color: #020420;
  text-decoration: none;
}
.post-title:hover {
  text-decoration: underline;
}
.post-domain {
  font-size: 0.8rem;
  color: #64748b;
  margin-left: 0.4rem;
}
.post-meta {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 0.2rem;
}
.empty-state {
  color: #64748b;
  text-align: center;
  padding: 2rem;
}
</style>