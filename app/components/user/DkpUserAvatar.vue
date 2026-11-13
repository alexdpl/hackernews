<!-- app/components/user/DkpUserAvatar.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps({
  username: { type: String, default: 'KernelUser' },
  avatarUrl: { type: String, default: '' },
  level: { type: Number, default: 42 },
  xp: { type: Number, default: 1247890 },
  xpForNextLevel: { type: Number, default: 1700000 },
  isOnline: { type: Boolean, default: true },
  badges: { 
    type: Array as PropType<Array<{ id: string; label: string; color: string; icon: string }>>, 
    default: () => [
      { id: 'kernel', label: 'Kernel Architect', color: 'cyan', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
      { id: 'openui', label: 'OpenUI Expert', color: 'emerald', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
      { id: 'dx', label: 'DX Champion', color: 'amber', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
      { id: 'contributor', label: 'v2.6 Contributor', color: 'muted', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' }
    ]
  },
  showDetails: { type: Boolean, default: true }
})

const avatarError = ref(false)
const userInitial = computed(() => props.username ? props.username.charAt(0).toUpperCase() : 'K')
const progressPercent = computed(() => Math.round((props.xp / props.xpForNextLevel) * 100))
</script>

<template>
  <div class="relative flex flex-col items-center gap-6 font-display text-slate-100">
    <!-- Avatar Stack -->
    <div class="relative group">
      <!-- Ambient Glow -->
      <div class="absolute -inset-4 bg-gradient-to-r from-sky-400/20 via-transparent to-emerald-400/20 rounded-full blur-2xl opacity-80 transition-opacity duration-500"></div>
      
      <!-- Pulse Ring (Online Indicator) -->
      <div v-if="isOnline" class="absolute -inset-1 border border-emerald-400 rounded-full animate-ping opacity-40 pointer-events-none"></div>
      
      <!-- Main Avatar Circle -->
      <div class="relative w-32 h-32 rounded-full overflow-hidden border-2 border-slate-700 bg-slate-900 shadow-[0_0_20px_rgba(0,243,255,0.2)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,136,0.4)] hover:border-emerald-400">
        <div class="w-full h-full flex items-center justify-center relative overflow-hidden bg-slate-950">
          <div class="absolute inset-0 bg-gradient-to-br from-sky-500/20 via-slate-900 to-emerald-500/20"></div>
          
          <span v-if="!avatarUrl || avatarError" class="relative text-5xl font-bold bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent select-none font-mono">
            {{ userInitial }}
          </span>
          <img
            v-else
            :src="avatarUrl"
            :alt="username"
            @error="avatarError = true"
            class="absolute inset-0 w-full h-full object-cover"
          />
          <div class="absolute inset-0 bg-gradient-to-r from-transparent via-sky-400/10 to-transparent animate-[pulse_2s_infinite] pointer-events-none"></div>
        </div>

        <!-- Level Badge on Avatar (top-left) -->
        <div class="absolute -top-1 -left-1">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center border-2 border-slate-950 shadow-lg">
            <span class="text-[10px] font-black text-slate-950 font-mono tracking-tight">LVL</span>
          </div>
        </div>

        <!-- Level Number on Avatar (top-right) -->
        <div class="absolute -top-1 -right-1">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-cyan-600 flex items-center justify-center border-2 border-slate-950 shadow-lg">
            <span class="text-sm font-black text-slate-950 font-mono tabular-nums">{{ level }}</span>
          </div>
        </div>
      </div>

      <!-- Online Status Indicator (Bottom Right) -->
      <div class="absolute bottom-0 right-0">
        <div class="w-7 h-7 rounded-full bg-slate-950 border-2 border-slate-700 flex items-center justify-center relative">
          <div class="w-3.5 h-3.5 rounded-full relative z-10" :class="isOnline ? 'bg-emerald-400 shadow-[0_0_10px_#00ff88]' : 'bg-slate-600'"></div>
        </div>
      </div>
    </div>

    <!-- Info Panel Below Avatar -->
    <div v-if="showDetails" class="text-center space-y-3 w-72 font-mono">
      <div class="flex flex-col items-center gap-1">
        <h2 class="text-xl font-bold text-white tracking-tight font-sans">@{{ username }}</h2>
        <div class="flex items-center gap-2">
          <div class="px-4 py-1.5 bg-slate-900 border border-slate-800 rounded-full flex items-center gap-2 shadow-inner">
            <div class="w-2 h-2 rounded-full" :class="isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'"></div>
            <span class="text-xs font-bold text-sky-400">Level {{ level }}</span>
            <span class="text-[10px] text-slate-400 px-2 py-0.5 bg-slate-950 rounded-full">XP: {{ xp.toLocaleString() }}</span>
          </div>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="w-full">
        <div class="flex justify-between text-[11px] mb-1">
          <span class="text-slate-400">Progress to Level {{ level + 1 }}</span>
          <span class="text-sky-400 font-bold">{{ progressPercent }}%</span>
        </div>
        <div class="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div class="h-full bg-gradient-to-r from-sky-400 to-emerald-400 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,243,255,0.5)]" :style="{ width: `${progressPercent}%` }"></div>
        </div>
      </div>

      <!-- DX Badges Row -->
      <div class="flex flex-wrap justify-center gap-1.5 pt-1">
        <span v-for="b in badges" :key="b.id" class="px-2.5 py-1 bg-slate-900/80 border border-slate-800 rounded-full text-[10px] font-bold text-sky-300 flex items-center gap-1">
          <span>🛡️</span> {{ b.label }}
        </span>
      </div>
    </div>
  </div>
</template>