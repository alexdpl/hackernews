<!-- app/pages/show.vue -->
<script setup lang="ts">
const { data, pending, error } = await useFetch('/api/posts?type=show')

const posts = computed(() => data.value?.data || [])

function getDomain(url?: string | null) {
  if (!url) return null
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return null
  }
}
</script>

<template>
  <div class="page-container">
    <h2 class="page-title">Show HN</h2>

    <div v-if="pending" class="status-msg">Caricamento progetti in corso...</div>
    <div v-else-if="error" class="status-msg error">Impossibile caricare i progetti.</div>
    <div v-else-if="posts.length === 0" class="status-msg">Nessun progetto in mostra al momento.</div>

    <ol v-else class="post-list">
      <li v-for="(post, index) in posts" :key="post.id" class="post-item">
        <span class="post-number">{{ index + 1 }}.</span>
        <div class="post-content">
          <div class="post-heading">
            <a v-if="post.url" :href="post.url" target="_blank" rel="noopener noreferrer" class="post-title">
              {{ post.title }}
            </a>
            <NuxtLink v-else :to="`/item/${post.id}`" class="post-title">
              {{ post.title }}
            </NuxtLink>
            <span v-if="getDomain(post.url)" class="post-domain">({{ getDomain(post.url) }})</span>
          </div>

          <div class="post-meta">
            {{ post.points || 0 }} punti da <strong>{{ post.author || 'Anonimo' }}</strong>
            <span class="dot">•</span>
            {{ new Date(post.createdAt).toLocaleDateString('it-IT') }}
            <span class="dot">•</span>
            <NuxtLink :to="`/item/${post.id}`" class="comments-link">
              {{ post.commentsCount || 0 }} commenti
            </NuxtLink>
          </div>
        </div>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.page-container { max-width: 900px; margin: 1.5rem auto; padding: 1rem; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; }
.page-title { font-size: 1.2rem; font-weight: 700; color: #020420; margin-bottom: 1.2rem; border-bottom: 2px solid #f1f5f9; padding-bottom: 0.5rem; }
.status-msg { padding: 2rem; text-align: center; color: #64748b; font-size: 0.95rem; }
.status-msg.error { color: #dc2626; }
.post-list { list-style: none; padding: 0; margin: 0; }
.post-item { display: flex; align-items: flex-start; gap: 0.6rem; padding: 0.6rem 0; border-bottom: 1px solid #f1f5f9; }
.post-number { font-size: 0.9rem; font-weight: 600; color: #94a3b8; min-width: 24px; text-align: right; }
.post-content { display: flex; flex-direction: column; gap: 0.2rem; }
.post-heading { display: flex; align-items: baseline; flex-wrap: wrap; gap: 0.4rem; }
.post-title { font-size: 0.95rem; font-weight: 600; color: #0f172a; text-decoration: none; }
.post-title:hover { color: #2563eb; text-decoration: underline; }
.post-domain { font-size: 0.8rem; color: #64748b; }
.post-meta { font-size: 0.8rem; color: #64748b; display: flex; align-items: center; gap: 0.3rem; flex-wrap: wrap; }
.comments-link { color: #475569; text-decoration: none; font-weight: 500; }
.comments-link:hover { text-decoration: underline; color: #2563eb; }
.dot { color: #cbd5e1; }
</style>