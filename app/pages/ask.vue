<!-- app/pages/ask.vue -->
<script setup>
import { ref, onUnmounted } from 'vue'

const askPage = ref(1)
const askPosts = ref([])
const hasMore = ref(false)
const isLoading = ref(false)

const { data } = await useFetch('/api/posts', {
  query: { page: askPage, limit: 30 }
})

if (data.value?.success) {
  askPosts.value = data.value.data || []
  hasMore.value = data.value.pagination?.hasMore || false
}

async function loadMoreAsk() {
  if (isLoading.value || !hasMore.value) return
  isLoading.value = true
  const nextPage = askPage.value + 1

  try {
    const res = await $fetch('/api/posts', { query: { page: nextPage, limit: 30 } })
    if (res.success && res.data) {
      askPosts.value = [...askPosts.value, ...res.data]
      askPage.value = nextPage
      hasMore.value = res.pagination?.hasMore || false
    }
  } catch (err) {
    console.error(err)
  } finally {
    isLoading.value = false
  }
}

onUnmounted(() => {
  askPosts.value = null
})
</script>

<template>
  <div class="hn-container">
    <ol class="posts-list" :start="1">
      <li v-for="(post, index) in askPosts" :key="post.id" class="post-item">
        <span class="post-number">{{ index + 1 }}.</span>
        <div class="post-content">
          <div>
            <a :href="`/posts/${post.id}`" class="post-title">Ask HN: {{ post.title }}</a>
          </div>
          <div class="post-subtext">{{ post.points || 1 }} punti | inserito il {{ new Date(post.createdAt).toLocaleDateString() }}</div>
        </div>
      </li>
    </ol>
    <div v-if="hasMore" class="more-container">
      <button @click="loadMoreAsk" :disabled="isLoading" class="more-btn">More</button>
    </div>
  </div>
</template>

<style scoped>
.hn-container { background-color: #f6f6ef; padding: 1rem; font-family: Verdana, Geneva, sans-serif; }
.posts-list { list-style-type: none; padding: 0; margin: 0; }
.post-item { display: flex; margin-bottom: 0.5rem; font-size: 0.9rem; }
.post-number { color: #828282; margin-right: 0.3rem; min-width: 1.5rem; text-align: right; }
.post-content { display: flex; flex-direction: column; }
.post-title { color: #000000; text-decoration: none; }
.post-subtext { font-size: 0.7rem; color: #828282; }
.more-container { margin-top: 1.5rem; padding-left: 1.8rem; }
.more-btn { background: none; border: none; font-weight: bold; cursor: pointer; }
</style>