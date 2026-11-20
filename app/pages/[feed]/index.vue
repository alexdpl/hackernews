<!-- app/pages/[feed]/index.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

definePageMeta({
  name: 'dkp-dynamic-feed-hub'
})

const route = useRoute()
const rawFeed = computed(() => String(route.params.feed || 'top').toLowerCase())

const resolvedType = computed<'top' | 'newest' | 'ask' | 'show' | 'jobs'>(() => {
  if (rawFeed.value === 'newest' || rawFeed.value === 'new') return 'newest'
  if (rawFeed.value === 'ask' || rawFeed.value === 'askhn') return 'ask'
  if (rawFeed.value === 'show' || rawFeed.value === 'showhn') return 'show'
  if (rawFeed.value === 'jobs' || rawFeed.value === 'job') return 'jobs'
  return 'top'
})

const titlesMap: Record<string, string> = {
  top: 'Latest Tech Feed',
  newest: 'Newest Submissions',
  ask: 'Ask DKP / Ask HN',
  show: 'Show DKP / Show HN',
  jobs: 'Tech & Engineering Jobs'
}

const currentTitle = computed(() => titlesMap[resolvedType.value] || 'Latest Tech Feed')

useDkpSeo({
  title: `${currentTitle.value} - DevKernelPulse Kernel v2.6-PURE-SQL`,
  description: `${currentTitle.value} su DevKernelPulse: feed tech in tempo reale, discussioni e analisi Sentinel AI.`,
  type: 'website'
})
</script>

<template>
  <DkpLayout :title="currentTitle" :subtitle="`Feed Dinamico DKP v2.6 | ${String(resolvedType.value || 'top').toUpperCase()}`" :show-sidebar-ads="true">
    <DkpHomeWidget :feed-type="resolvedType" />
  </DkpLayout>
</template>