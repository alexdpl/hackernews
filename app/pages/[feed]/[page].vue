<script setup lang="ts">
import FeedIndexPage from '~/pages/[feed]/index.vue'

definePageMeta({
  name: 'feed-dynamic-page',
  path: '/:feed/:page(\\d+)'
})
</script>

<template>
  <FeedIndexPage />
</template>