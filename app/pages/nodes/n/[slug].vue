<!-- app/pages/nodes/n/[slug].vue -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import VaultTrustBadge from '~/components/VaultTrustBadge.vue'
import DKPnodesRichEditor from '~/components/DKPnodesRichEditor.vue'
import DKPRelatedThreads from '~/components/nodes/DKPRelatedThreads.vue'
import DkpNodesHomeWidget from '~/components/DkpNodesHomeWidget.vue'
import DkpAdsWidget from '~/components/DkpAdsWidget.vue'
import DkpAdStrip from '~/components/DkpAdStrip.vue'
import { buildCategoryNodeTree, cleanNodeLabel, resolveMainCategory } from '~/composables/useDkpNodes'

const route = useRoute()
const nodeSlug = computed(() => String(route.params.slug || '').trim().toLowerCase())

const { currentUser } = useAuthCore()
const isAdmin = computed(() => String(currentUser.value?.role || '').toUpperCase() === 'ADMIN')

function cleanExcerpt(raw: string): string {
  return String(raw || '')
    .replace(/```[\w-]*\s*/g, '')
    .replace(/```/g, '')
    .replace(/\*\*/g, '')
    .replace(/#{1,6}\s+/g, '')
    .trim()
}

const { data: nodesRes, refresh: refreshNodes } = await useFetch<any>('/api/nodes')

const nodeTreeState = computed(() => {
  const rawList = Array.isArray(nodesRes.value?.data)
    ? nodesRes.value.data
    : (Array.isArray(nodesRes.value) ? nodesRes.value : [])
  return buildCategoryNodeTree(rawList)
})

const allNodes = computed(() => nodeTreeState.value.nodes)
const categoryNames = computed(() => nodeTreeState.value.categories)
const groupedNodes = computed(() => nodeTreeState.value.groupedNodes)

const currentNode = computed(() => {
  return allNodes.value.find((n: any) => n.slug === nodeSlug.value) || null
})

const currentNodeCategory = computed(() => {
  return currentNode.value ? resolveMainCategory(currentNode.value, allNodes.value) : (categoryNames.value[0] || '')
})

// Eventuali sotto-nodi figli del nodo corrente (es. casa -> bagno, cucina, camera)
const childNodes = computed(() => {
  if (!currentNode.value) return []
  return allNodes.value.filter((n: any) => Number(n.parentId) === Number(currentNode.value.id))
})

const isVaultNode = computed(() => nodeSlug.value === 'blockchain-vault')

useHead({
  title: computed(() =>
    currentNode.value
      ? `n/${currentNode.value.name} — DKP Talks & Blockchain Vault v2.6`
      : `n/${nodeSlug.value} — DKP Talks Hub`
  )
})

const activeSort = ref<'hot' | 'new' | 'top'>('hot')
const currentPage = ref(1)

const { data: postsRes, pending: loadingPosts, refresh: refreshPosts } = await useFetch<any>('/api/nodes/posts', {
  query: computed(() => ({
    sort: activeSort.value,
    nodeSlug: nodeSlug.value,
    page: currentPage.value
  }))
})

const posts = computed<any[]>(() => {
  const list = Array.isArray(postsRes.value?.posts)
    ? postsRes.value.posts
    : (Array.isArray(postsRes.value?.data) ? postsRes.value.data : [])

  return list.map((p: any) => ({
    ...p,
    nodeName: cleanNodeLabel(p.nodeName || p.nodeSlug || nodeSlug.value),
    vaultHash: p.vaultHash || p.vault_hash || null,
    vaultBlockNumber: p.vaultBlockNumber ?? p.vault_block_number ?? null,
    isPinned: Boolean(p.isPinned || p.is_pinned)
  }))
})

watch([nodeSlug, activeSort], () => {
  currentPage.value = 1
})

function nextPage() {
  currentPage.value++
  if (import.meta.client) window.scrollTo({ top: 0, behavior: 'smooth' })
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--
    if (import.meta.client) window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const verifyInput = ref('')
const isVerifyingHash = ref(false)
const verifyResult = ref<any>(null)
const verifyError = ref('')

async function runOnChainAudit() {
  const raw = verifyInput.value.trim()
  if (!raw) return

  verifyError.value = ''
  verifyResult.value = null
  isVerifyingHash.value = true

  try {
    const isNumericId = /^\d+$/.test(raw)
    const res: any = await $fetch('/api/vault/verify', {
      query: isNumericId ? { postId: Number(raw) } : { hash: raw.toLowerCase() }
    })

    if (res?.proof) {
      verifyResult.value = res
    } else {
      verifyError.value = 'Nessun blocco o impronta SHA-256 corrispondente trovata nel ledger.'
    }
  } catch (err: any) {
    verifyError.value = err?.data?.statusMessage || 'Errore durante la verifica sul nodo Vault.'
  } finally {
    isVerifyingHash.value = false
  }
}

const isComposerOpen = ref(false)
const toastMsg = ref('')

function showNotification(msg: string) {
  toastMsg.value = msg
  setTimeout(() => {
    toastMsg.value = ''
  }, 4000)
}

async function openNodeComposer() {
  if (!currentNode.value) {
    await refreshNodes()
  }
  isComposerOpen.value = true
}

async function onThreadPublished() {
  isComposerOpen.value = false
  showNotification('⛓️ Thread pubblicato e notarizzato SHA-256 con successo! +25 XP')
  await refreshPosts()
}

async function handleVote(post: any, direction: 'up' | 'down') {
  const delta = direction === 'up' ? 1 : -1
  post.karmaScore = (post.karmaScore || 0) + delta
  await $fetch(`/api/nodes/posts/${post.id}/vote`, {
    method: 'POST',
    body: { direction, userId: currentUser.value?.id }
  }).catch(() => null)
}

async function togglePinPostCard(post: any) {
  const nextPin = !post.isPinned
  try {
    await $fetch(`/api/nodes/posts/${post.id}`, {
      method: 'PATCH',
      body: { is_pinned: nextPin, userId: currentUser.value?.id }
    })
    post.isPinned = nextPin
    showNotification(nextPin ? '📌 Thread fissato in alto!' : '📍 Thread rimosso dai pinned.')
    await refreshPosts()
  } catch {
    showNotification('❌ Errore durante l\'aggiornamento del pin.')
  }
}

function copyPostLink(postId: number) {
  if (typeof navigator === 'undefined') return
  navigator.clipboard.writeText(`${window.location.origin}/nodes/thread/${postId}`)
  showNotification('🔗 Link del thread copiato negli appunti!')
}
</script>

<template>
  <div class="min-h-screen bg-[#020420] text-slate-100 font-sans p-4 md:p-8">
    <div
      v-if="toastMsg"
      role="status"
      class="fixed top-6 right-6 z-[10000] bg-[#041a13]/95 border border-emerald-500/50 text-emerald-300 px-4 py-3 rounded-xl shadow-2xl font-mono text-xs font-bold"
    >
      {{ toastMsg }}
    </div>

    <div class="max-w-5xl mx-auto flex flex-col gap-6">
      <nav aria-label="Navigazione DKP" class="flex flex-wrap gap-2.5 justify-center font-mono bg-[#090d16] border border-slate-800 p-3 rounded-2xl shadow-lg">
        <NuxtLink to="/news" class="px-4 py-2 bg-[#020420] border border-slate-700 hover:border-emerald-400 text-emerald-400 font-extrabold text-xs rounded-xl transition-all no-underline">🌍 DKP Tech Feed</NuxtLink>
        <NuxtLink to="/nodes" class="px-4 py-2 bg-purple-500 text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow-[0_0_15px_rgba(168,85,247,0.35)] no-underline">💬 DKP Talks Hub</NuxtLink>
        <NuxtLink to="/nodes/n/blockchain-vault" class="px-4 py-2 bg-[#020420] border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 font-extrabold text-xs rounded-xl transition-all no-underline">⛓️ Blockchain Vault</NuxtLink>
        <NuxtLink to="/blog" class="px-4 py-2 bg-[#020420] border border-slate-700 hover:border-sky-400 text-sky-400 font-extrabold text-xs rounded-xl transition-all no-underline">✍️ Editorial Hub</NuxtLink>
      </nav>

      <!-- NODE HERO HEADER -->
      <section
        class="bg-[#090d16] rounded-2xl p-6 sm:p-8 shadow-2xl border relative overflow-hidden flex flex-col gap-4"
        :class="isVaultNode ? 'border-emerald-500/45' : 'border-slate-800'"
      >
        <div class="flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
          <div class="flex items-center gap-2 text-slate-400 flex-wrap">
            <NuxtLink to="/nodes" class="text-purple-400 hover:underline no-underline font-bold">← Tutti i Nodi</NuxtLink>
            <span>/</span>
            <span class="text-sky-400">{{ currentNodeCategory }}</span>
            <span>/</span>
            <span class="text-slate-200 font-bold">n/{{ nodeSlug }}</span>
          </div>

          <span class="px-3 py-1 rounded-full text-[11px] font-bold border bg-emerald-500/10 text-emerald-400 border-emerald-500/35">
            ⛓️ {{ isVaultNode ? 'PUBLIC BLOCKCHAIN NOTARY NODE' : 'SHA-256 VAULT CONNECTED' }}
          </span>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-start gap-4">
            <div
              class="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border shrink-0 bg-[#020420]"
              :style="{ borderColor: currentNode?.color || '#a855f7' }"
            >
              {{ currentNode?.icon || '#' }}
            </div>
            <div>
              <h1 class="text-2xl sm:text-3xl font-black text-white m-0 tracking-tight">
                n/{{ currentNode?.name || nodeSlug }}
              </h1>
              <p class="text-slate-400 text-xs sm:text-sm mt-1.5 mb-0 max-w-2xl leading-relaxed">
                {{ currentNode?.description || `Discussioni tecniche e notarizzazione crittografica per n/${nodeSlug}.` }}
              </p>
            </div>
          </div>

          <button
            type="button"
            @click="openNodeComposer"
            class="shrink-0 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold font-mono text-xs rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.25)] transition-all cursor-pointer"
          >
            + Nuovo Thread - Rich Editor (+25 XP)
          </button>
        </div>

        <!-- SOTTO-NODI DIRETTI DI QUESTO NODO (es. casa -> bagno, cucina, camera) -->
        <div v-if="childNodes.length > 0" class="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80 font-mono text-xs">
          <span class="text-slate-400 font-bold">↳ Sotto-nodi ({{ childNodes.length }}):</span>
          <NuxtLink
            v-for="sub in childNodes"
            :key="sub.id"
            :to="`/nodes/n/${sub.slug}`"
            class="px-2.5 py-1 rounded-lg bg-[#020420] border border-slate-700 hover:border-purple-400 text-purple-300 no-underline transition-colors"
          >
            {{ sub.icon || '#' }} n/{{ sub.name }}
          </NuxtLink>
        </div>

        <!-- AUDITOR ON-CHAIN SHA-256 -->
        <div
          v-if="isVaultNode"
          class="mt-2 bg-[#020420] border border-emerald-500/35 rounded-xl p-4 flex flex-col gap-3 font-mono"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="text-xs font-black text-emerald-400 uppercase tracking-wider">
              🔍 Verifica Pubblica On-Chain (SHA-256 Hash o Thread ID)
            </span>
            <span class="text-[11px] text-slate-400">Network: DKP-VAULT-MAINNET-v2.6</span>
          </div>

          <form @submit.prevent="runOnChainAudit" class="flex flex-col sm:flex-row gap-2">
            <input
              v-model="verifyInput"
              type="text"
              placeholder="Incolla hash SHA-256 (64 char) oppure ID thread (es. 12)..."
              class="flex-1 bg-[#090d16] border border-slate-700 focus:border-emerald-400 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 outline-none"
            />
            <button
              type="submit"
              :disabled="isVerifyingHash"
              class="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl cursor-pointer disabled:opacity-50"
            >
              {{ isVerifyingHash ? 'Verifica...' : 'Verifica On-Chain' }}
            </button>
          </form>

          <div v-if="verifyError" class="text-xs text-rose-400 font-bold">
            ⚠️ {{ verifyError }}
          </div>

          <div
            v-if="verifyResult?.proof"
            class="p-3.5 rounded-xl bg-[#090d16] border border-emerald-500/40 flex flex-col gap-1.5 text-xs"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="font-black text-emerald-400">
                {{ verifyResult.proof.status === 'VERIFIED' ? '✅ CERTIFICATO VALIDO (SHA-256 MATCH)' : '⚠️ CONTENUTO ALTERATO' }}
              </span>
              <span class="text-sky-400 font-bold">Block #{{ verifyResult.proof.blockNumber }}</span>
            </div>
            <div v-if="verifyResult.postTitle" class="text-slate-200 font-sans font-bold">
              Thread: <NuxtLink :to="`/nodes/thread/${verifyResult.proof.postId}`" class="text-sky-400 hover:underline">{{ verifyResult.postTitle }}</NuxtLink>
            </div>
            <div class="text-[11px] text-emerald-300 break-all">Hash: {{ verifyResult.proof.vaultHash }}</div>
            <div class="text-[11px] text-purple-400 break-all">Merkle Root: {{ verifyResult.proof.merkleRoot }}</div>
          </div>
        </div>
      </section>

      <!-- BARRA ORDINAMENTO -->
      <div class="bg-[#090d16] border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl font-mono text-xs">
        <div class="flex items-center gap-2">
          <span class="text-slate-400">Ordinamento:</span>
          <div class="flex bg-[#020420] p-1 rounded-xl border border-slate-800">
            <button
              v-for="tab in (['hot', 'new', 'top'] as const)"
              :key="tab"
              type="button"
              @click="activeSort = tab"
              class="px-3 py-1 rounded-lg font-bold uppercase transition-all cursor-pointer"
              :class="activeSort === tab ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'text-slate-400 hover:text-slate-200'"
            >
              {{ tab }}
            </button>
          </div>
        </div>

        <span class="text-slate-400">
          {{ posts.length }} thread notarizzati in <strong class="text-emerald-400">n/{{ nodeSlug }}</strong>
        </span>
      </div>

      <!-- LISTA THREAD -->
      <div v-if="loadingPosts" class="p-12 text-center text-emerald-400 font-mono text-xs bg-[#090d16] rounded-2xl border border-slate-800 animate-pulse">
        Caricamento thread e verifica impronte SHA-256...
      </div>

      <div v-else-if="posts.length === 0" class="p-12 text-center text-slate-400 font-mono text-xs bg-[#090d16] rounded-2xl border border-slate-800 flex flex-col items-center gap-3">
        <span>Nessun thread ancora pubblicato in <strong>n/{{ nodeSlug }}</strong>.</span>
        <button
          type="button"
          @click="openNodeComposer"
          class="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs cursor-pointer"
        >
          Pubblica il primo thread con il Rich Editor
        </button>
      </div>

      <div v-else class="flex flex-col gap-4">
        <article
          v-for="post in posts"
          :key="post.id"
          class="bg-[#090d16] border border-slate-800 hover:border-purple-500/40 rounded-2xl p-5 shadow-xl transition-all flex gap-4 group"
        >
          <div class="flex flex-col items-center justify-start bg-[#020420] p-2.5 rounded-xl border border-slate-800 font-mono text-xs h-fit min-w-[44px]">
            <button type="button" @click="handleVote(post, 'up')" class="text-slate-500 hover:text-emerald-400 text-sm font-bold bg-transparent border-none cursor-pointer">▲</button>
            <span class="font-extrabold my-1 text-slate-200">{{ post.karmaScore || 1 }}</span>
            <button type="button" @click="handleVote(post, 'down')" class="text-slate-500 hover:text-rose-400 text-sm font-bold bg-transparent border-none cursor-pointer">▼</button>
          </div>

          <div class="flex-1 flex flex-col gap-2 min-w-0">
            <div class="flex items-center gap-2 font-mono text-[11px] text-slate-400 flex-wrap">
              <span v-if="post.isPinned" class="text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold">📌 PINNED</span>
              <span class="text-slate-300 font-semibold">@{{ post.authorUsername || 'community' }}</span>
              <span>•</span>
              <span>{{ new Date(post.createdAt || Date.now()).toLocaleDateString('it-IT') }}</span>

              <div class="ml-auto">
                <VaultTrustBadge
                  :post-id="post.id"
                  :vault-hash="post.vaultHash"
                  :block-number="post.vaultBlockNumber"
                  :compact="true"
                  @notarized="(h) => { post.vaultHash = h }"
                />
              </div>
            </div>

            <NuxtLink :to="`/nodes/thread/${post.id}`" class="text-base font-bold text-slate-100 group-hover:text-purple-400 transition-colors font-sans leading-snug no-underline">
              {{ post.title }}
            </NuxtLink>

            <p class="text-xs text-slate-400 line-clamp-2 leading-relaxed font-sans m-0">
              {{ cleanExcerpt(post.content) }}
            </p>

            <div class="flex items-center justify-between gap-4 mt-2 pt-2 border-t border-slate-800/80 font-mono text-[11px] text-slate-400 flex-wrap">
              <NuxtLink :to="`/nodes/thread/${post.id}`" class="hover:text-emerald-400 font-bold no-underline text-sky-400">
                {{ post.commentsCount || 0 }} Commenti - Apri Thread -&gt;
              </NuxtLink>

              <div class="flex items-center gap-3">
                <button type="button" @click="copyPostLink(post.id)" class="text-slate-400 hover:text-emerald-400 bg-transparent border-none cursor-pointer">
                  🔗 Condividi
                </button>
                <button
                  v-if="isAdmin"
                  type="button"
                  @click="togglePinPostCard(post)"
                  class="text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded cursor-pointer font-bold"
                >
                  📌 {{ post.isPinned ? 'Unpin' : 'Pinna' }}
                </button>
              </div>
            </div>
          </div>
        </article>
      </div>

      <!-- PAGINAZIONE -->
      <div class="flex items-center justify-between bg-[#090d16] border border-slate-800 rounded-xl p-4 font-mono text-xs shadow-xl">
        <button type="button" @click="prevPage" :disabled="currentPage === 1" class="px-4 py-2 bg-[#020420] border border-slate-700 hover:border-purple-400 text-slate-200 rounded-lg disabled:opacity-40 cursor-pointer">
          ← Pagina Precedente
        </button>
        <span class="text-purple-400 font-bold">Pagina {{ currentPage }}</span>
        <button type="button" @click="nextPage" :disabled="posts.length < 10" class="px-4 py-2 bg-[#020420] border border-slate-700 hover:border-purple-400 text-slate-200 rounded-lg disabled:opacity-40 cursor-pointer">
          Pagina Successiva →
        </button>
      </div>
	 <DkpAdsWidget placement="nodeTalks" />
      <DKPRelatedThreads :currentNodeSlug="nodeSlug" />
      <DkpNodesHomeWidget />
	   <DkpAdStrip :topic="String(route.params.slug || '')" />
    </div>

    <DKPnodesRichEditor
      :is-open="isComposerOpen"
      :categories="categoryNames"
      :grouped-nodes="groupedNodes"
      :initial-category="currentNodeCategory"
      :initial-node-id="currentNode?.id || null"
      :is-admin="isAdmin"
      @close="isComposerOpen = false"
      @published="onThreadPublished"
    />
  </div>
</template>