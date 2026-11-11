<!-- app/components/BountiesWidget.vue -->
<script setup lang="ts">
interface BountyItem {
  id: number | string
  title: string
  reward: string
  nodeSlug: string
  status: 'open' | 'in_progress' | 'completed'
}

withDefaults(
  defineProps<{
    bounties?: BountyItem[]
  }>(),
  {
    bounties: () => []
  }
)
</script>

<template>
  <div class="bg-[#080d1a] border border-slate-800/80 rounded-2xl p-5 shadow-xl flex flex-col gap-4 font-mono">
    <div class="flex justify-between items-center border-b border-slate-800/80 pb-3">
      <h3 class="text-white font-bold text-sm flex items-center gap-2">
        <span>🏆 Active Community Bounties</span>
      </h3>
      <span class="text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-black tracking-wider uppercase">
        REWARDS ACTIVE
      </span>
    </div>

    <div v-if="!bounties || !bounties.length" class="text-center py-6 text-slate-500 text-xs">
      Nessuna bounty attiva al momento.
    </div>

    <div v-else class="flex flex-col gap-2.5">
      <div 
        v-for="bounty in bounties" 
        :key="bounty.id"
        class="bg-[#040814] border border-slate-800/80 rounded-xl p-3 flex justify-between items-center text-xs hover:border-slate-700 transition-colors"
      >
        <div class="flex flex-col gap-0.5">
          <span class="text-white font-bold">{{ bounty.title }}</span>
          <span class="text-[10px] text-slate-500">n/{{ bounty.nodeSlug }}</span>
        </div>
        <span class="px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-black text-xs">
          {{ bounty.reward }}
        </span>
      </div>
    </div>
  </div>
</template>