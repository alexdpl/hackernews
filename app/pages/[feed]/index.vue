<!-- app/pages/[feed].vue -->
<script setup lang="ts">
definePageMeta({
  middleware: 'feed',
})
</script>

<template>
  <div class="dkp-feed-layout">
    <slot />
  </div>
</template>

<style scoped>
.dkp-feed-layout {
  min-height: 100vh;
  background-color: #0d1117;
  color: #c9d1d9;
}
</style>