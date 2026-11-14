<!-- app/components/VaultTrustBadge.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  postId: number
  vaultHash?: string | null
  blockNumber?: number | null
  compact?: boolean
}>()

const emit = defineEmits<{
  (e: 'notarized', newHash: string): void
}>()

const localHash = ref<string>(props.vaultHash || '')
const showProofModal = ref(false)
const isVerifying = ref(false)
const copied = ref(false)
const proofData = ref<any>(null)

const displayHash = computed(() => localHash.value || props.vaultHash || '')
const shortHash = computed(() => {
  const h = displayHash.value
  if (!h) return 'NOTARIZE'
  return `${h.slice(0, 8)}…${h.slice(-6)}`
})

async function copyHash() {
  if (!displayHash.value || typeof navigator === 'undefined') return
  await navigator.clipboard.writeText(displayHash.value).catch(() => {})
  copied.value = true
  setTimeout(() => { copied.value = false }, 1800)
}

async function openVerificationModal() {
  showProofModal.value = true
  isVerifying.value = true
  try {
    // Se il post non ha ancora un hash, lo notarizza subito
    if (!displayHash.value) {
      const notarizeRes: any = await $fetch('/api/vault/notarize', {
        method: 'POST',
        body: { postId: props.postId }
      })
      if (notarizeRes?.proof?.vaultHash) {
        localHash.value = notarizeRes.proof.vaultHash
        emit('notarized', notarizeRes.proof.vaultHash)
      }
    }

    const res: any = await $fetch('/api/vault/verify', {
      query: { postId: props.postId }
    })
    proofData.value = res
  } catch {
    proofData.value = null
  } finally {
    isVerifying.value = false
  }
}
</script>

<template>
  <div class="inline-flex items-center gap-1.5" @click.stop>
    <button
      type="button"
      @click="openVerificationModal"
      :title="displayHash ? `Verifica On-Chain SHA-256: ${displayHash}` : 'Notarizza thread su Proof-of-Code Vault'"
      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold transition-all cursor-pointer border"
      :class="displayHash
        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/35 hover:bg-emerald-500/20 hover:border-emerald-400'
        : 'bg-sky-500/10 text-sky-400 border-sky-500/35 hover:bg-sky-500/20'"
    >
      <span>⛓️</span>
      <span v-if="!compact">SHA-256</span>
      <span>{{ shortHash }}</span>
      <span v-if="blockNumber" class="text-[10px] text-emerald-300/80">#{{ blockNumber }}</span>
    </button>

    <button
      v-if="displayHash && !compact"
      type="button"
      @click="copyHash"
      title="Copia hash SHA-256 completo"
      class="px-2 py-1 rounded-lg font-mono text-[10px] bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700 cursor-pointer transition-colors"
    >
      {{ copied ? '✓ Copiato' : '📋' }}
    </button>

    <!-- MODALE CERTIFICATO ON-CHAIN -->
    <Teleport to="body">
      <div
        v-if="showProofModal"
        class="fixed inset-0 bg-[#020420]/85 backdrop-blur-md flex items-center justify-center z-50 p-4"
        @click.self="showProofModal = false"
      >
        <div class="bg-[#090d16] border border-emerald-500/40 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl font-mono">
          <div class="px-5 py-4 bg-[#020420] border-b border-slate-800 flex justify-between items-center">
            <div class="flex items-center gap-2">
              <span class="text-base">⛓️</span>
              <h3 class="text-sm font-black text-emerald-400 m-0 uppercase tracking-wider">
                Proof-of-Code On-Chain Certificate
              </h3>
            </div>
            <button
              type="button"
              @click="showProofModal = false"
              class="text-slate-400 hover:text-white bg-transparent border-none text-base cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div class="p-5 flex flex-col gap-3.5 text-xs">
            <div v-if="isVerifying" class="py-8 text-center text-emerald-400">
              ⚡ Ricalcolo impronta crittografica SHA-256 e verifica blocco...
            </div>

            <template v-else-if="proofData?.proof">
              <div
                class="p-3 rounded-xl border flex items-center justify-between"
                :class="proofData.proof.status === 'VERIFIED'
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                  : 'bg-red-500/15 border-red-500/40 text-red-400'"
              >
                <span class="font-black">
                  {{ proofData.proof.status === 'VERIFIED'
                    ? '✅ INTEGRITÀ VERIFICATA (SHA-256 MATCH)'
                    : '⚠️ ATTENZIONE: CONTENUTO MODIFICATO POST-NOTARIZZAZIONE' }}
                </span>
                <span class="text-[11px] bg-slate-950 px-2 py-0.5 rounded">
                  Block #{{ proofData.proof.blockNumber }}
                </span>
              </div>

              <div class="bg-[#020420] border border-slate-800 rounded-xl p-3.5 flex flex-col gap-2.5">
                <div>
                  <div class="text-[10px] text-slate-500 uppercase">Network &amp; Nodo Pubblico</div>
                  <div class="text-sky-400 font-bold">
                    {{ proofData.proof.chainNetwork }} · n/{{ proofData.vaultNodeSlug }}
                  </div>
                </div>

                <div>
                  <div class="text-[10px] text-slate-500 uppercase">Vault Hash (SHA-256)</div>
                  <div class="text-emerald-400 break-all select-all text-[11px] mt-0.5">
                    {{ proofData.proof.vaultHash }}
                  </div>
                </div>

                <div>
                  <div class="text-[10px] text-slate-500 uppercase">Previous Block Hash</div>
                  <div class="text-slate-400 break-all text-[11px] mt-0.5">
                    {{ proofData.proof.prevHash }}
                  </div>
                </div>

                <div>
                  <div class="text-[10px] text-slate-500 uppercase">Merkle Anchor Root</div>
                  <div class="text-purple-400 break-all text-[11px] mt-0.5">
                    {{ proofData.proof.merkleRoot }}
                  </div>
                </div>

                <div class="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                  <span>Thread ID: #{{ proofData.proof.postId }}</span>
                  <span>{{ new Date(proofData.proof.notarizedAt).toLocaleString('it-IT') }}</span>
                </div>
              </div>

              <div class="flex justify-between items-center pt-1">
                <NuxtLink
                  to="/nodes/blockchain-vault"
                  @click="showProofModal = false"
                  class="text-sky-400 hover:text-sky-300 text-xs font-bold no-underline"
                >
                  Esplora n/blockchain-vault →
                </NuxtLink>
                <button
                  type="button"
                  @click="copyHash"
                  class="bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs px-4 py-2 rounded-xl cursor-pointer"
                >
                  {{ copied ? '✓ Hash Copiato' : '📋 Copia SHA-256' }}
                </button>
              </div>
            </template>

            <div v-else class="py-6 text-center text-slate-400">
              Nessun certificato trovato per questo thread.
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>