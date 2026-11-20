<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import DkpThreadDetailView from '~/components/nodes/DkpThreadDetailView.vue'

const route = useRoute()
const idParam = computed(() => String(route.params.id || route.params.slug || '').trim())
</script>

<template>
  <DkpThreadDetailView :thread-id-or-slug="idParam" route-prefix="thread" />
</template>