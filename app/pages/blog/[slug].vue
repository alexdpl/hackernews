<!-- app/pages/blog/[slug].vue -->
<script setup lang="ts">
import SocialShare from '~/components/blog/SocialShare.vue'

const route = useRoute()
const slug = route.params.slug as string

// Fetch reattiva del post dal DB tramite lo slug
const { data: res, pending, error } = await useFetch(`/api/blog/${slug}`)
const post = computed(() => (res.value as any)?.data)

useDkpSeo({
  title: post.value ? `${post.value.title} - DevKernelPulse` : 'Articolo DKP',
  description: post.value?.excerpt || 'Approfondimento tecnico dall ecosistema DKP.'
})
</script>

<template>
  <div class="blog-post-container max-w-4xl mx-auto px-4 py-12">
    <div v-if="pending" class="text-center py-20 text-emerald-400">Caricamento Vault in corso...</div>
    <div v-else-if="error || !post" class="text-center py-20 text-red-400">Articolo non trovato o rimosso dal Vault.</div>
    
    <article v-else class="glass-panel p-8 rounded-2xl">
      <h1 class="text-3xl md:text-5xl font-extrabold text-white mb-4">{{ post.title }}</h1>
      <div class="flex items-center gap-4 text-sm text-slate-400 mb-8">
        <span>📅 {{ post.date || new Date(post.createdAt).toLocaleDateString() }}</span>
        <span>👁️ {{ post.views }} visualizzazioni</span>
      </div>

      <div class="prose prose-invert max-w-none text-slate-200 mb-12" v-html="post.content"></div>

      <!-- 🚀 Barra Social integrata -->
      <SocialShare :title="post.title" />
    </article>
  </div>
</template>