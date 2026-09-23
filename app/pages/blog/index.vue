<!-- app/pages/blog/index.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBlog } from '~/composables/useBlog'

const { posts, categories } = useBlog()
const selectedCategory = ref('all')

const filteredPosts = computed(() => {
  if (selectedCategory.value === 'all') return posts.value
  return posts.value.filter(p => p.category === selectedCategory.value)
})
</script>

<template>
  <div class="blog-container">
    <div class="blog-hero">
      <span class="badge-tag">DKP Official Newsroom</span>
      <h1>DKP Native Blog</h1>
      <p>Aggiornamenti di sistema, rilasci di kernel, annunci strategici e approfondimenti tecnologici direttamente dagli sviluppatori.</p>
      
      <!-- Filtro Categorie -->
      <div class="categories-bar">
        <button 
          @click="selectedCategory = 'all'" 
          :class="{ active: selectedCategory === 'all' }"
          class="cat-btn"
        >
          🔥 Tutti
        </button>
        <button 
          v-for="cat in categories" 
          :key="cat.id"
          @click="selectedCategory = cat.name"
          :class="{ active: selectedCategory === cat.name }"
          class="cat-btn"
        >
          {{ cat.name }}
        </button>
      </div>
    </div>

    <!-- Lista Articoli -->
    <div class="posts-grid">
      <div v-for="post in filteredPosts" :key="post.id" class="post-card">
        <div class="post-meta">
          <span class="post-cat">{{ post.category }}</span>
          <span class="post-date">📅 {{ post.date }}</span>
        </div>
        <h2>{{ post.title }}</h2>
        <p>{{ post.excerpt }}</p>
        <div class="post-footer">
          <span class="post-author">👤 {{ post.author }}</span>
          <NuxtLink :to="`/blog/${post.id}`" class="read-more-btn">Leggi Articolo ↗</NuxtLink>
        </div>
      </div>
      <div v-if="filteredPosts.length === 0" class="no-posts">
        Nessun articolo trovato in questa categoria.
      </div>
    </div>
  </div>
</template>

<style scoped>
.blog-container {
  max-width: 1000px;
  margin: 2.5rem auto;
  padding: 0 1.5rem;
}

.blog-hero {
  text-align: center;
  margin-bottom: 3rem;
}

.badge-tag {
  background: rgba(0, 220, 130, 0.15);
  color: #00a862;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  border: 1px solid rgba(0, 220, 130, 0.3);
}

.blog-hero h1 {
  font-size: 2.2rem;
  color: #020420;
  font-weight: 800;
  margin-top: 1rem;
}

.blog-hero p {
  color: #64748b;
  font-size: 1rem;
  max-width: 600px;
  margin: 0.5rem auto 1.5rem;
}

.categories-bar {
  display: flex;
  justify-content: center;
  gap: 0.6rem;
  flex-wrap: wrap;
  margin-top: 1.5rem;
}

.cat-btn {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #334155;
  padding: 0.4rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.cat-btn:hover, .cat-btn.active {
  background: #020420;
  color: #00dc82;
  border-color: #020420;
}

.posts-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.post-card {
  background: #020420;
  border: 1px solid #1e293b;
  border-radius: 10px;
  padding: 2rem;
  color: #ffffff;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  transition: border-color 0.2s;
}

.post-card:hover {
  border-color: #00dc82;
}

.post-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  margin-bottom: 0.75rem;
}

.post-cat {
  color: #38bdf8;
  font-weight: 700;
  background: rgba(56, 189, 248, 0.1);
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
}

.post-date {
  color: #94a3b8;
}

.post-card h2 {
  font-size: 1.4rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.75rem;
}

.post-card p {
  color: #94a3b8;
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 1.5rem;
}

.post-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #1e293b;
  padding-top: 1rem;
}

.post-author {
  color: #cbd5e1;
  font-size: 0.85rem;
  font-weight: 600;
}

.read-more-btn {
  color: #00dc82;
  text-decoration: none;
  font-weight: 700;
  font-size: 0.9rem;
}

.read-more-btn:hover {
  text-decoration: underline;
}

.no-posts {
  text-align: center;
  color: #64748b;
  padding: 3rem;
  font-style: italic;
}
</style>