<script setup lang="ts">
definePageMeta({ name: 'feed-root' })
const icon = '\uD83C\uDF0D'
</script>

<template>
  <DkpHnFeedView
    feed-type="top"
    :icon="icon"
    page-title="Latest Tech Feed"
    page-subtitle="Top Stories & AI Curated Stream"
    seo-title="Latest Feed — DevKernelPulse Sentinel Network"
    seo-description="Le migliori notizie di ingegneria del software, AI, Cloud Native e sicurezza selezionate dalla Sentinel Network."
  />
</template>