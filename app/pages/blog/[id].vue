<!-- app/pages/blog/[id].vue -->
<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useBlog } from '~/composables/useBlog'

const route = useRoute()
const { posts } = useBlog()

const postId = route.params.id as string
const post = posts.value.find(p => p.id === postId)
</script>

<template>
  <div class="article-container" v-if="post">
    <div class="article-header">
      <NuxtLink to="/blog" class="back-link">← Torna al DKP Blog</NuxtLink>
      <div class="meta-row">
        <span class="post-cat">{{ post.category }}</span>
        <span class="post-date">📅 {{ post.date }}</span>
      </div>
      <h1>{{ post.title }}</h1>
      <div class="author-box">
        <span>👤 Pubblicato da <strong>{{ post.author }}</strong></span>
      </div>
    </div>

    <div class="article-body">
      <p class="lead">{{ post.excerpt }}</p>
      <div class="content-text">
        {{ post.content }}
      </div>
    </div>
  </div>
  <div v-else class="not-found">
    <h2>Articolo non trovato</h2>
    <p>L'articolo richiesto non esiste o è stato rimosso dal kernel.</p>
    <NuxtLink to="/blog" class="back-link">Torna al Blog</NuxtLink>
  </div>
</template>

<style scoped>
.article-container {
  max-width: 800px;
  margin: 3rem auto;
  padding: 0 1.5rem;
  color: #020420;
}

.article-header {
  margin-bottom: 2.5rem;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 2rem;
}

.back-link {
  color: #00a862;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
  display: inline-block;
  margin-bottom: 1.5rem;
}

.back-link:hover {
  text-decoration: underline;
}

.meta-row {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1rem;
}

.post-cat {
  background: #020420;
  color: #00dc82;
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 700;
}

.post-date {
  color: #64748b;
  font-size: 0.85rem;
}

.article-header h1 {
  font-size: 2.3rem;
  font-weight: 800;
  color: #020420;
  line-height: 1.2;
  margin-bottom: 1rem;
}

.author-box {
  color: #475569;
  font-size: 0.9rem;
}

.article-body {
  font-size: 1.1rem;
  line-height: 1.8;
  color: #334155;
}

.lead {
  font-weight: 600;
  color: #020420;
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
}

.content-text {
  white-space: pre-line;
}

.not-found {
  text-align: center;
  padding: 5rem 1.5rem;
}

.not-found h2 {
  font-size: 1.8rem;
  color: #020420;
  margin-bottom: 0.5rem;
}

.not-found p {
  color: #64748b;
  margin-bottom: 1.5rem;
}
</style>