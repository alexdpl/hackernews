<!-- components/blog/DkpRelatedPosts.vue -->
<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import DkpAdStrip from '~/components/DkpAdStrip.vue'

const props = defineProps({
  currentPostId: {
    type: [String, Number],
    required: false,
    default: ''
  },
  category: {
    type: String,
    default: 'Generale'
  },
  tags: {
    type: Array as () => string[],
    default: () => []
  }
})

interface RelatedPost {
  id: number | string
  title: string
  slug: string
  excerpt?: string
  categoryName?: string
  createdAt?: string
}

const relatedPosts = ref<RelatedPost[]>([])
const isLoading = ref(false)

async function fetchRelated() {
  if (!props.currentPostId) return
  isLoading.value = true
  try {
    const query = new URLSearchParams({
      id: String(props.currentPostId),
      cat: props.category || '',
      tags: props.tags ? props.tags.join(',') : ''
    })

    const res: any = await $fetch(`/api/blog/related?${query.toString()}`)
    relatedPosts.value = res.data || []
  } catch (err) {
    console.warn('Impossibile caricare i post correlati:', err)
    relatedPosts.value = []
  } finally {
    isLoading.value = false
  }
}

watch(() => props.currentPostId, () => {
  fetchRelated()
}, { immediate: true })

onMounted(() => {
  fetchRelated()
})
</script>

<template>
  <div v-if="relatedPosts && relatedPosts.length > 0" class="related-posts-section mt-12 pt-8 border-t border-slate-800">
    <h3 class="text-xl font-bold text-white mb-6 flex items-center gap-2">
      <span>⚡</span> Articoli Correlati
    </h3>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <NuxtLink
        v-for="post in relatedPosts"
        :key="post.id"
        :to="`/blog/${post.slug || post.id}`"
        class="bg-[#020420] border border-slate-800 hover:border-emerald-500/50 p-4 rounded-xl transition-all hover:-translate-y-1 group flex flex-col justify-between"
      >
        <div>
          <span class="text-[10px] font-bold text-sky-400 uppercase tracking-wider bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
            {{ post.categoryName || 'Generale' }}
          </span>
          <h4 class="text-slate-200 font-bold text-sm mt-2 group-hover:text-emerald-400 transition-colors line-clamp-2">
            {{ post.title }}
          </h4>
          <p v-if="post.excerpt" class="text-slate-400 text-xs mt-1 line-clamp-2">
            {{ post.excerpt }}
          </p>
        </div>
        <span class="text-emerald-400 text-xs font-bold mt-4 flex items-center gap-1">
          Leggi articolo <span>→</span>
        </span>
      </NuxtLink>
    </div>
	<!-- Banner orizzontale a 3 slot del DKP Ads Network -->
      <DkpAdStrip />
  </div>
</template>