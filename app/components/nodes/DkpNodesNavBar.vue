<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { buildCategoryNodeTree, cleanNodeLabel } from '~/composables/useDkpNodes'

const props = defineProps<{
  nodes?: any[]
}>()

const emit = defineEmits<{
  (e: 'create-thread'): void
}>()

const route = useRoute()
const internalNodes = ref<any[]>([])
const openDropdownCat = ref<string | null>(null)
const navRef = ref<HTMLElement | null>(null)

const activeSlug = computed(() => String(route.params.slug || '').toLowerCase())

const resolvedNodes = computed(() => {
  const source = props.nodes && props.nodes.length > 0 ? props.nodes : internalNodes.value
  return source.map((n: any) => ({
    ...n,
    id: n.id,
    name: cleanNodeLabel(n.name || n.slug),
    slug: String(n.slug || '').replace(/^(n\/)+/i, '').trim(),
    icon: n.icon || '#',
    color: n.color,
    category: n.category || n.parentName || n.categoryName || 'DKP Ecosystem & Core'
  }))
})

const categoryGroups = computed(() => {
  const tree = buildCategoryNodeTree(resolvedNodes.value)
  if (tree.categories && tree.categories.length > 0) {
    return tree.categories
      .map((cat: any) => {
        const catName = typeof cat === 'string' ? cat : String(cat?.name || '')
        const items = tree.groupedNodes[catName] || []
        return {
          key: catName,
          name: catName,
          items
        }
      })
      .filter((g: any) => g.name && g.items.length > 0)
  }
  return []
})

function toggleCategory(key: string) {
  openDropdownCat.value = openDropdownCat.value === key ? null : key
}

function handleClickOutside(e: MouseEvent) {
  if (navRef.value && !navRef.value.contains(e.target as Node)) {
    openDropdownCat.value = null
  }
}

onMounted(async () => {
  document.addEventListener('click', handleClickOutside)
  if (!props.nodes || props.nodes.length === 0) {
    const res: any = await $fetch('/api/nodes').catch(() => null)
    if (res?.data) internalNodes.value = res.data
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div ref="navRef" class="bg-[#090d16] border border-slate-800/90 rounded-2xl p-3 card-glow font-mono relative z-30">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="flex flex-wrap items-center gap-1.5">
        <NuxtLink
          to="/nodes"
          :class="[
            'px-3 py-2 rounded-xl text-xs font-bold no-underline transition-all flex items-center gap-1.5',
            route.path === '/nodes'
              ? 'bg-emerald-500 text-[#020420]'
              : 'bg-[#020420] text-slate-300 hover:text-white border border-slate-800'
          ]"
        >
          <span>Tutti i Nodi</span>
        </NuxtLink>

        <NuxtLink
          to="/nodes/n/blockchain-vault"
          :class="[
            'px-3 py-2 rounded-xl text-xs font-bold no-underline transition-all flex items-center gap-1.5',
            activeSlug === 'blockchain-vault'
              ? 'bg-emerald-500 text-[#020420]'
              : 'bg-[#020420] text-emerald-400 hover:bg-emerald-500/15 border border-emerald-500/30'
          ]"
        >
          <span>n/blockchain-vault</span>
        </NuxtLink>

        <!-- Menu a Tendina per ciascuno dei 10 Macro-Nodi -->
        <div
          v-for="group in categoryGroups"
          :key="group.key"
          class="relative"
          @mouseenter="openDropdownCat = group.key"
          @mouseleave="openDropdownCat = null"
        >
          <button
            type="button"
            @click.stop="toggleCategory(group.key)"
            :class="[
              'px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border',
              openDropdownCat === group.key || group.items.some((i: any) => i.slug === activeSlug)
                ? 'bg-violet-500/15 border-violet-500/50 text-violet-300'
                : 'bg-[#020420] border-slate-800 text-slate-200 hover:border-slate-600'
            ]"
          >
            <span>{{ group.name }}</span>
            <span class="text-[10px] opacity-75">&#9662;</span>
          </button>

          <div
            v-if="openDropdownCat === group.key"
            class="absolute left-0 top-full mt-1.5 w-64 bg-[#090d16] border border-violet-500/40 rounded-xl shadow-2xl p-2 z-50 space-y-1 max-h-80 overflow-y-auto"
          >
            <div class="px-2.5 py-1 text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1">
              {{ group.name }}
            </div>
            <NuxtLink
              v-for="sub in group.items"
              :key="sub.slug"
              :to="`/nodes/n/${sub.slug}`"
              @click="openDropdownCat = null"
              :class="[
                'flex items-center justify-between px-3 py-2 rounded-lg text-xs no-underline transition-colors',
                activeSlug === sub.slug
                  ? 'bg-emerald-500/20 text-emerald-400 font-bold'
                  : 'text-slate-200 hover:bg-[#020420] hover:text-emerald-400'
              ]"
            >
              <span class="truncate">n/{{ sub.name }}</span>
              <span class="text-[10px] text-slate-500 ml-2">&rarr;</span>
            </NuxtLink>
          </div>
        </div>
      </div>

      <button
        type="button"
        @click="emit('create-thread')"
        class="px-3.5 py-2 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-bold text-xs border-none cursor-pointer transition-colors"
      >
        + Nuovo Thread
      </button>
    </div>
  </div>
</template>