<!-- app/components/DkpBlogRelatedWithAds.vue -->
<script setup lang="ts">
import DkpAdUnit from '~/components/DkpAdUnit.vue'

defineProps({
  relatedPosts: {
    type: Array,
    default: () => []
  }
})
</script>

<template>
  <section class="blog-related-section">
    <h3 class="section-title">🔗 Articoli Correlati & Sponsor DKP</h3>
    
    <div class="related-grid">
      <!-- Articoli correlati normali del Blog -->
      <div v-for="post in relatedPosts" :key="post.id" class="related-card">
        <span class="post-cat">{{ post.category }}</span>
        <h4>{{ post.title }}</h4>
        <NuxtLink :href="post.url" class="read-more">Leggi articolo →</NuxtLink>
      </div>

      <!-- Inserimento nativo del circuito DKP Ads nel flusso dei correlati -->
      <div class="ad-slot-wrapper">
        <DkpAdUnit categoryTag="DKP ADS SPONSOR" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.blog-related-section {
  margin-top: 3rem;
  border-top: 1px solid #1e293b;
  padding-top: 2rem;
  font-family: system-ui, sans-serif;
}
.section-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: #fff;
  margin-bottom: 1.5rem;
}
.related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.2rem;
  align-items: start;
}
.related-card {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 1.2rem;
  transition: border-color 0.2s;
}
.related-card:hover {
  border-color: #38bdf8;
}
.post-cat {
  font-size: 0.65rem;
  font-weight: 800;
  color: #38bdf8;
  text-transform: uppercase;
}
.related-card h4 {
  font-size: 0.95rem;
  color: #fff;
  margin: 0.5rem 0 1rem 0;
  line-height: 1.4;
}
.read-more {
  font-size: 0.8rem;
  color: #00dc82;
  text-decoration: none;
  font-weight: 700;
}
.read-more:hover {
  text-decoration: underline;
}
.ad-slot-wrapper {
  grid-column: span 1;
}
</style>