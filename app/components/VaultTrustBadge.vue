<!-- app/components/VaultTrustBadge.vue -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    postId?: number | string
    entityId?: number | string
    entityType?: 'forum' | 'blog'
    vaultHash?: string | null
    blockNumber?: number | null
    compact?: boolean
  }>(),
  {
    entityType: 'forum',
    vaultHash: null,
    blockNumber: null,
    compact: false
  }
)

const emit = defineEmits<{
  (e: 'notarized', hash: string, proof?: any): void
}>()

const targetId = computed(() => Number(props.entityId ?? props.postId ?? 0))
const localHash = ref<string | null>(props.vaultHash || null)
const localBlock = ref<number | null>(props.blockNumber ? Number(props.blockNumber) : null)
const isNotarizing = ref(false)
const isVerifying = ref(false)
const showModal = ref(false)
const liveStatus = ref<'VERIFIED' | 'TAMPERED_CONTENT_MISMATCH' | 'NOT_NOTARIZED'>('VERIFIED')
const liveProof = ref<any>(null)
const copied = ref(false)

watch(
  () => props.vaultHash,
  (val) => {
    if (val) localHash.value = val
  }
)

watch(
  () => props.blockNumber,
  (val) => {
    if (val !== null && val !== undefined) localBlock.value = Number(val)
  }
)

const shortHash = computed(() => {
  if (!localHash.value) return ''
  const h = String(localHash.value)
  if (h.length <= 16) return h
  return `${h.slice(0, 8)}…${h.slice(-6)}`
})

async function handleBadgeClick(e: Event) {
  e.preventDefault()
  e.stopPropagation()

  if (!localHash.value) {
    await triggerNotarize()
    return
  }

  showModal.value = true
  if (!targetId.value) return

  isVerifying.value = true
  try {
    const res: any = await $fetch('/api/vault/verify', {
      query: {
        entityType: props.entityType,
        entityId: targetId.value
      }
    })
    if (res?.proof) {
      liveProof.value = res.proof
      liveStatus.value = res.status || 'VERIFIED'
      if (res.proof.blockNumber) localBlock.value = Number(res.proof.blockNumber)
    }
  } catch {
    // Mantiene visualizzazione hash locale
  } finally {
    isVerifying.value = false
  }
}

async function triggerNotarize() {
  if (!targetId.value || isNotarizing.value) return
  isNotarizing.value = true
  try {
    const res: any = await $fetch('/api/vault/notarize', {
      method: 'POST',
      body: {
        entityType: props.entityType,
        entityId: targetId.value
      }
    })
    if (res?.proof?.vaultHash) {
      localHash.value = res.proof.vaultHash
      localBlock.value = res.proof.blockNumber ?? null
      liveProof.value = res.proof
      liveStatus.value = 'VERIFIED'
      emit('notarized', res.proof.vaultHash, res.proof)
    }
  } finally {
    isNotarizing.value = false
  }
}

async function copyHash() {
  if (!localHash.value || typeof navigator === 'undefined') return
  await navigator.clipboard.writeText(localHash.value).catch(() => {})
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 1800)
}
</script>

<template>
  <div class="inline-flex items-center relative font-mono">
    <!-- STATO NOTARIZZATO -->
    <button
      v-if="localHash"
      type="button"
      @click="handleBadgeClick"
      :title="`Verifica certificato SHA-256 su DKP Blockchain Vault${localBlock ? ` (Block #${localBlock})` : ''}`"
      class="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 transition-all cursor-pointer"
      :class="compact ? 'px-2 py-0.5 text-[10px] font-bold' : 'px-3 py-1 text-xs font-bold'"
    >
      <span>⛓️</span>
      <span>SHA-256 {{ shortHash }}</span>
      <span v-if="localBlock" class="text-sky-400">#{{ localBlock }}</span>
    </button>

    <!-- STATO NON ANCORA NOTARIZZATO -->
    <button
      v-else
      type="button"
      @click="handleBadgeClick"
      :disabled="isNotarizing"
      class="inline-flex items-center gap-1 rounded-md border border-slate-700 hover:border-emerald-500/50 bg-[#020420] text-slate-400 hover:text-emerald-300 transition-all cursor-pointer disabled:opacity-50"
      :class="compact ? 'px-2 py-0.5 text-[10px] font-bold' : 'px-3 py-1 text-xs font-bold'"
    >
      <span>{{ isNotarizing ? '⏳' : '🔓' }}</span>
      <span>{{ isNotarizing ? 'Hashing...' : 'Notarizza SHA-256' }}</span>
    </button>

    <!-- POPOVER / MODALE VERIFICA ON-CHAIN -->
    <Teleport to="body">
      <div
        v-if="showModal"
        @click.self="showModal = false"
        class="fixed inset-0 z-[10050] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 font-mono"
      >
        <div class="w-full max-w-lg bg-[#090d16] border border-emerald-500/40 rounded-2xl p-6 shadow-2xl text-slate-100 flex flex-col gap-4">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <div class="flex items-center gap-2">
              <span class="text-lg">⛓️</span>
              <span class="text-sm font-black text-emerald-400 uppercase">DKP Vault Audit Certificate</span>
            </div>
            <button
              type="button"
              @click="showModal = false"
              class="text-slate-400 hover:text-white bg-transparent border-none text-base cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div v-if="isVerifying" class="text-xs text-emerald-400 py-4 text-center animate-pulse">
            ⚡ Ricalcolo impronta SHA-256 sul database Neon...
          </div>

          <div v-else class="flex flex-col gap-3 text-xs">
            <div class="flex items-center justify-between bg-[#020420] border border-slate-800 rounded-xl p-3">
              <span
                class="font-black"
                :class="liveStatus === 'VERIFIED' ? 'text-emerald-400' : 'text-rose-400'"
              >
                {{ liveStatus === 'VERIFIED' ? '✅ INTEGRITÀ VERIFICATA' : '⚠️ CONTENUTO ALTERATO' }}
              </span>
              <span v-if="localBlock" class="text-sky-400 font-bold">Block #{{ localBlock }}</span>
            </div>

            <div class="bg-[#020420] border border-slate-800 rounded-xl p-3">
              <div class="text-[10px] text-slate-500 uppercase mb-1">Vault Block Hash (SHA-256)</div>
              <div class="text-emerald-300 break-all select-all text-[11px]">{{ localHash }}</div>
            </div>

            <div v-if="liveProof?.merkleRoot" class="bg-[#020420] border border-slate-800 rounded-xl p-3">
              <div class="text-[10px] text-slate-500 uppercase mb-1">Merkle Root</div>
              <div class="text-purple-400 break-all text-[11px]">{{ liveProof.merkleRoot }}</div>
            </div>

            <div class="flex items-center justify-between gap-2 pt-2">
              <button
                type="button"
                @click="copyHash"
                class="px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/35 font-bold text-xs cursor-pointer"
              >
                {{ copied ? '✓ Hash Copiato' : '📋 Copia Hash SHA-256' }}
              </button>

              <NuxtLink
                to="/nodes/n/blockchain-vault"
                @click="showModal = false"
                class="px-3.5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs no-underline"
              >
                Apri Nodo Vault →
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>