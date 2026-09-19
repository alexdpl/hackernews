<script setup lang="ts">
import { validFeeds } from '~~/utils/api'

// Eseguiamo il reindirizzamento immediato sia lato server che lato client
// Portando l'utente sul primo feed valido (es. /news/1)
await navigateTo(`/${validFeeds[0]}/1`, { redirectCode: 302 })
</script>

<template>
  <!-- In Nuxt 4, un template minimo previene warning di rendering durante il redirect -->
  <div class="flex items-center justify-center min-h-screen">
    <p class="text-sm text-gray-500 animate-pulse">Reindirizzamento in corso...</p>
  </div>
</template>
