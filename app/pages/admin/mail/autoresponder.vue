<script setup lang="ts">
import AutoresponderPage from '~/pages/admin/autoresponder.vue'
definePageMeta({
  middleware: 'admin-only'
})
</script>

<template>
  <AutoresponderPage />
</template>