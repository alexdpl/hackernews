<!-- app/app.vue -->
<script setup lang="ts">
useServerHead({
  htmlAttrs: { lang: 'it' },
})

useSeoMeta({
  titleTemplate: 'Nuxt HN | %s',
  description: 'HackerNews clone realizzato con Nuxt, Drizzle ORM e Neon Postgres.',
  ogImage: 'https://hn.nuxt.dev/cover.jpg',
  ogImageAlt: 'Nuxt Hackernews',
  twitterCard: 'summary_large_image',
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<style lang="postcss">
*, *::before, *::after {
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  font-size: 15px;
  background-color: #f6f6ef;
  margin: 0;
  padding: 0;
  color: #020420;
  overflow-y: scroll;
}

a {
  color: #020420;
  text-decoration: none;
}
</style>