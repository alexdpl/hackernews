<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { buildCategoryNodeTree } from '~/composables/useDkpNodes'

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
  const source = (props.nodes && props.nodes.length > 0) ? props.nodes : internalNodes.value
  return source.map((n: any) => ({
    id: n.id,
    name: n.name || n.slug,
    slug: n.slug,
    icon: n.icon || '💬',
    color: n.color,
    category: n.category || n.categoryName || n.category_name || 'Ecosistema DKP',
    categoryId: n.categoryId ?? n.category_id ?? 1,
    categoryName: n.categoryName ?? n.category_name ?? n.category ?? 'Ecosistema DKP'
  }))
})

const categoryGroups = computed(() => {
  const tree = buildCategoryNodeTree(resolvedNodes.value)
  if (tree.categories && tree.categories.length > 0) {
    return tree.categories.map((cat: any) => ({
      key: String(cat.id || cat.name),
      name: cat.name,
      icon: cat.icon || '📂',
      items: tree.groupedNodes[cat.id] || tree.groupedNodes[cat.name] || []
    })).filter((g: any) => g.items.length > 0)
  }

  // Fallback raggruppamento diretto se categoryName è testuale
  const map = new Map<string, any[]>()
  for (const node of resolvedNodes.value) {
    const key = node.categoryName || 'Nodi Tecnici'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(node)
  }
  return Array.from(map.entries()).map(([name, items]) => ({
    key: name,
    name,
    icon: '📂',
    items
  }))
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
      <!-- Link Rapidi + Categorie a Tendina -->
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
          <span>🔥</span> Tutti i Nodi
        </NuxtLink>

        <NuxtLink
          to="/nodes/blockchain-vault"
          :class="[
            'px-3 py-2 rounded-xl text-xs font-bold no-underline transition-all flex items-center gap-1.5',
            activeSlug === 'blockchain-vault'
              ? 'bg-emerald-500 text-[#020420]'
              : 'bg-[#020420] text-emerald-400 hover:bg-emerald-500/15 border border-emerald-500/30'
          ]"
        >
          <span>⛓️</span> n/blockchain-vault
        </NuxtLink>

        <!-- Menu a Tendina per ogni Categoria & Sub-nodi -->
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
                ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400'
                : 'bg-[#020420] border-slate-800 text-slate-200 hover:border-slate-600'
            ]"
          >
            <span>{{ group.icon }}</span>
            <span>{{ group.name }}</span>
            <span class="text-[10px] opacity-75">▼</span>
          </button>

          <!-- Dropdown Sub-nodi -->
          <div
            v-if="openDropdownCat === group.key"
            class="absolute left-0 top-full mt-1.5 w-64 bg-[#090d16] border border-emerald-500/40 rounded-xl shadow-2xl p-2 z-50 space-y-1"
          >
            <div class="px-2.5 py-1 text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1">
              Sub-nodi in {{ group.name }}
            </div>
            <NuxtLink
              v-for="sub in group.items"
              :key="sub.slug"
              :to="`/nodes/${sub.slug}`"
              @click="openDropdownCat = null"
              :class="[
                'flex items-center justify-between px-3 py-2 rounded-lg text-xs no-underline transition-colors',
                activeSlug === sub.slug
                  ? 'bg-emerald-500/20 text-emerald-400 font-bold'
                  : 'text-slate-200 hover:bg-[#020420] hover:text-emerald-400'
              ]"
            >
              <span class="truncate">{{ sub.icon }} n/{{ sub.name }}</span>
              <span class="text-[10px] text-slate-500 ml-2">→</span>
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Pulsante Azione Rapida -->
      <button
        type="button"
        @click="emit('create-thread')"
        class="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#020420] font-extrabold text-xs cursor-pointer transition-all shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.25)]"
      >
        + Nuovo Thread
      </button>
    </div>
  </div>
</template>