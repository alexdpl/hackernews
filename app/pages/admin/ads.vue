<script setup lang="ts">
definePageMeta({
  middleware: 'admin-only'
})
await navigateTo('/admin/shop', { replace: true })
</script>

<template>
  <div class="p-8 text-center font-mono text-xs text-slate-400">Reindirizzamento a Shop &amp; ADS...</div>
</template>