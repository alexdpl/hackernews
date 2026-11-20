<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import DkpLayout from '~/components/DkpLayout.vue'
import DkpRelatedBlogWidget from '~/components/widgets/DkpRelatedBlogWidget.vue'
import DkpHomeWidget from '~/components/DkpHomeWidget.vue'
import DkpAdStrip from '~/components/DkpAdStrip.vue'
import { parseDkpMarkdown, cleanNodeLabel } from '~/composables/useDkpNodes'
import { highlightDomElement, extractLanguagesFromMarkdown, prismRegistryVersion } from '~/composables/useDynamicPrism'

const props = defineProps<{
  threadIdOrSlug: string
  routePrefix: 'thread' | 'post'
}>()

const quickNavLinks = [
  { to: '/news', label: 'Tech Feed (News)', badge: 'LIVE' },
  { to: '/nodes', label: 'Nodes & Talks', badge: 'FORUM' },
  { to: '/blog', label: 'Editorial Blog', badge: 'VAULT' },
  { to: '/tools', label: 'Developer Tools', badge: 'SAST' }
]

const { data: threadRes, pending, refresh } = await useAsyncData(
  () => `dkp-node-thread-${props.routePrefix}-${props.threadIdOrSlug}`,
  async () => {
    const res: any = await $fetch(`/api/nodes/posts/${encodeURIComponent(props.threadIdOrSlug)}`).catch(() => null)
    return res?.post || res?.data || null
  }
)

const thread = computed<any>(() => threadRes.value)
const resolvedId = computed<number>(() => Number(thread.value?.id || (/^\d+$/.test(props.threadIdOrSlug) ? props.threadIdOrSlug : 0)))
const nodeLabel = computed(() => cleanNodeLabel(thread.value?.nodeName || thread.value?.nodeSlug || 'General'))
const nodeSlugClean = computed(() => String(thread.value?.nodeSlug || 'general').replace(/^(n\/)+/i, ''))

const seoTitle = computed(() =>
  thread.value?.title
    ? `${thread.value.title} \u2014 n/${nodeLabel.value} | DevKernelPulse`
    : 'Discussione Tecnica \u2014 DKP Nodes'
)
const seoDescription = computed(() => {
  const raw = String(thread.value?.content || '').replace(/[#*`>|]/g, ' ').replace(/\s+/g, ' ').trim()
  return raw ? raw.slice(0, 160) : `Discussione tecnica nel nodo n/${nodeLabel.value} su DevKernelPulse.`
})

useDkpSeo({
  title: seoTitle,
  description: seoDescription,
  type: 'forum',
  publishedTime: computed(() => thread.value?.createdAt || new Date().toISOString()),
  authorName: computed(() => thread.value?.authorUsername || 'alexdpl'),
  section: computed(() => `n/${nodeLabel.value}`),
  notarizationHash: computed(() => thread.value?.vaultHash || ''),
  canonicalPath: computed(() => `/nodes/${props.routePrefix}/${resolvedId.value || props.threadIdOrSlug}`)
})

const renderedBodyHtml = computed(() => {
  void prismRegistryVersion.value
  const raw = String(thread.value?.content || '')
  if (!raw.trim()) return ''
  extractLanguagesFromMarkdown(raw)
  return parseDkpMarkdown(raw)
})

const bodyContainerRef = ref<HTMLElement | null>(null)

async function applyPrismHighlight() {
  if (!import.meta.client) return
  await nextTick()
  await highlightDomElement(bodyContainerRef.value)
}

watch([renderedBodyHtml, prismRegistryVersion], () => {
  void applyPrismHighlight()
})

// Upvote thread
const bonusKarma = ref(0)
const hasVoted = ref(false)
const displayedKarma = computed(() => Number(thread.value?.karmaScore ?? thread.value?.karma_score ?? 1) + bonusKarma.value)

async function handleVote() {
  if (!resolvedId.value || hasVoted.value) return
  hasVoted.value = true
  bonusKarma.value += 1
  await $fetch(`/api/nodes/posts/${resolvedId.value}/vote`, {
    method: 'POST',
    body: { delta: 1 }
  }).catch(() => null)
}

// Commenti del thread
const comments = ref<any[]>([])
const newCommentText = ref('')
const isLoadingComments = ref(false)
const isPostingComment = ref(false)
const commentFeedback = ref('')

async function loadThreadComments() {
  if (!resolvedId.value) return
  isLoadingComments.value = true
  try {
    const res: any = await $fetch(`/api/nodes/comments?postId=${resolvedId.value}`).catch(() => null)
    comments.value = res?.comments || res?.data || []
  } finally {
    isLoadingComments.value = false
  }
}

async function submitThreadComment() {
  const txt = newCommentText.value.trim()
  if (!txt || !resolvedId.value) return
  isPostingComment.value = true
  commentFeedback.value = ''
  try {
    const res: any = await $fetch('/api/nodes/comments', {
      method: 'POST',
      body: {
        postId: resolvedId.value,
        content: txt
      }
    })
    if (res?.success) {
      newCommentText.value = ''
      commentFeedback.value = 'Risposta pubblicata e sottoposta a Peer Review Sentinella!'
      await loadThreadComments()
    }
  } finally {
    isPostingComment.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadThreadComments(), applyPrismHighlight()])
})

watch(() => props.threadIdOrSlug, async () => {
  bonusKarma.value = 0
  hasVoted.value = false
  commentFeedback.value = ''
  await refresh()
  await Promise.all([loadThreadComments(), applyPrismHighlight()])
})
</script>

<template>
  <DkpLayout
    :hide-section-header="true"
    :show-sidebar-ads="true"
    :seo-title="seoTitle"
    :seo-description="seoDescription"
  >
    <!-- Navigazione Rapida Sezioni Principali -->
    <div class="flex flex-wrap items-center justify-between gap-2 bg-dkp-card/90 border border-dkp-border rounded-2xl px-4 py-3 font-mono text-xs">
      <div class="flex flex-wrap items-center gap-2">
        <NuxtLink
          v-for="nav in quickNavLinks"
          :key="nav.to"
          :to="nav.to"
          :class="[
            'px-3 py-1.5 rounded-xl no-underline font-bold border transition-colors',
            nav.to === '/nodes'
              ? 'bg-violet-500/20 text-violet-200 border-violet-400/60'
              : 'bg-[#020420] text-slate-300 border-slate-800 hover:border-cyan-400/60 hover:text-white'
          ]"
        >
          {{ nav.label }}
        </NuxtLink>
      </div>
      <NuxtLink
        to="/user/dashboard?tab=content&subtab=nodes&new=1"
        class="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold no-underline transition-colors"
      >
        &#10133; Pubblica Thread
      </NuxtLink>
    </div>

    <div v-if="pending" class="bg-dkp-card border border-dkp-border rounded-2xl p-10 text-center font-mono text-xs text-violet-300 animate-pulse">
      &#9889; Sincronizzazione thread dal Vault Pure SQL...
    </div>

    <div v-else-if="!thread" class="bg-dkp-card border border-dkp-border rounded-2xl p-10 text-center space-y-4">
      <h1 class="text-xl font-bold text-white m-0">Discussione non trovata</h1>
      <p class="text-slate-400 text-sm m-0">Il thread richiesto non esiste o lo slug/ID non &egrave; pi&ugrave; attivo.</p>
      <NuxtLink to="/nodes" class="inline-block px-4 py-2 rounded-xl bg-violet-500 text-white font-mono text-xs font-extrabold no-underline">
        Torna a DKP Talks Hub &rarr;
      </NuxtLink>
    </div>

    <article v-else ref="bodyContainerRef" class="space-y-6">
      <!-- Card Principale Thread -->
      <div class="bg-[#050914]/95 border border-slate-800 rounded-2xl p-6 sm:p-8 card-glow space-y-5">
        <!-- Breadcrumb -->
        <nav aria-label="Breadcrumb" class="flex flex-wrap items-center gap-2 font-mono text-xs text-slate-400">
          <NuxtLink to="/nodes" class="text-slate-300 hover:text-violet-300 no-underline">
            &#128172; DKP Talks Hub
          </NuxtLink>
          <span>/</span>
          <NuxtLink :to="`/nodes/${nodeSlugClean}`" class="text-cyan-400 hover:text-cyan-300 no-underline font-bold">
            n/{{ nodeLabel }}
          </NuxtLink>
          <span>/</span>
          <span class="text-slate-200 truncate max-w-md">{{ thread.title }}</span>
        </nav>

        <!-- Badge Stato & SHA-256 Vault -->
        <div class="flex flex-wrap items-center gap-2 font-mono text-[11px]">
          <span class="px-2.5 py-1 rounded-md bg-violet-500/15 text-violet-300 border border-violet-500/40 font-extrabold">
            n/{{ nodeLabel }}
          </span>
          <span class="px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 font-bold">
            &#128737; SHA-256 VAULT VERIFIED
          </span>
          <span v-if="thread.isPinned || thread.is_pinned" class="px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/40 font-bold">
            &#128204; IN EVIDENZA
          </span>
        </div>

        <h1 class="text-2xl sm:text-4xl font-extrabold text-white leading-tight tracking-tight m-0">
          {{ thread.title }}
        </h1>

        <!-- Autore & Azioni -->
        <div class="bg-[#030712] border border-slate-800/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-3 font-mono text-xs">
            <div class="w-10 h-10 rounded-full bg-violet-500/20 border border-violet-400/60 flex items-center justify-center text-violet-300 font-extrabold">
              {{ String(thread.authorUsername || 'A').charAt(0).toUpperCase() }}
            </div>
            <div>
              <div class="text-white font-bold text-sm">@{{ thread.authorUsername || 'alexdpl' }}</div>
              <div class="text-slate-400 flex flex-wrap items-center gap-3 mt-0.5">
                <span>&#128197; {{ thread.createdAt ? new Date(thread.createdAt).toLocaleDateString('it-IT') : 'Oggi' }}</span>
                <span class="text-amber-300 font-bold">&#9650; {{ displayedKarma }} karma</span>
                <span>&#128172; {{ comments.length }} risposte</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            :disabled="hasVoted"
            @click="handleVote"
            class="px-4 py-2 rounded-xl bg-violet-500/20 hover:bg-violet-500/30 border border-violet-400/50 text-violet-200 font-mono text-xs font-extrabold cursor-pointer transition-colors"
          >
            &#9650; {{ hasVoted ? 'Votato' : 'Upvote Thread' }}
          </button>
        </div>

        <!-- Corpo Formattato RichEditor (Markdown + Tabelle + Prism Dinamico) -->
        <div
          class="dkp-markdown-body text-slate-200 text-sm sm:text-base leading-relaxed pt-2"
          v-html="renderedBodyHtml"
        ></div>

        <!-- Hash Vault -->
        <div v-if="thread.vaultHash" class="bg-[#020617] border border-slate-800 rounded-xl px-4 py-2.5 font-mono text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <span>&#128274; Proof of Code SHA-256:</span>
          <code class="text-emerald-400 break-all">{{ thread.vaultHash }}</code>
        </div>
      </div>

      <!-- Discussione & Peer Review -->
      <section class="bg-[#050914]/95 border border-slate-800 rounded-2xl p-6 sm:p-8 card-glow space-y-5">
        <h2 class="text-lg font-extrabold text-white m-0 font-display">
          &#128172; Risposte &amp; Peer Review ({{ comments.length }})
        </h2>

        <div v-if="commentFeedback" class="bg-emerald-500/15 border border-emerald-400/50 text-emerald-300 font-mono text-xs font-bold px-4 py-2.5 rounded-xl">
          &#9889; {{ commentFeedback }}
        </div>

        <form v-if="!(thread.isLocked || thread.is_locked)" @submit.prevent="submitThreadComment" class="space-y-3">
          <textarea
            v-model="newCommentText"
            rows="3"
            placeholder="Scrivi una risposta tecnica, un benchmark o una peer review..."
            class="w-full bg-[#020617] border border-slate-700 focus:border-violet-400 text-white p-3.5 rounded-xl font-sans text-sm outline-none box-border"
          ></textarea>
          <div class="flex justify-end">
            <button
              type="submit"
              :disabled="isPostingComment || !newCommentText.trim()"
              class="px-5 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-400 disabled:opacity-50 text-white font-mono text-xs font-extrabold border-none cursor-pointer transition-colors"
            >
              {{ isPostingComment ? 'Invio...' : 'Pubblica Risposta' }}
            </button>
          </div>
        </form>

        <div v-if="isLoadingComments" class="text-center font-mono text-xs text-slate-400 py-4">
          Caricamento risposte...
        </div>

        <div v-else-if="comments.length === 0" class="text-center font-mono text-xs text-slate-400 py-4">
          Nessuna risposta ancora presente in questo thread.
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="c in comments"
            :key="c.id"
            class="bg-[#030712] border border-slate-800 rounded-xl p-4 space-y-1.5"
          >
            <div class="flex items-center justify-between font-mono text-xs">
              <span class="text-cyan-300 font-bold">@{{ c.authorUsername || c.author || 'dev_kernel' }}</span>
              <span class="text-slate-500 text-[11px]">{{ c.createdAt ? new Date(c.createdAt).toLocaleString('it-IT') : 'Adesso' }}</span>
            </div>
            <p class="text-slate-200 text-sm leading-relaxed m-0 whitespace-pre-line">{{ c.content }}</p>
          </div>
        </div>
      </section>

      <!-- Widget Blog & Ultime News / Crawler AI (come richiesto) -->
      <DkpRelatedBlogWidget />
      <DkpHomeWidget />

      <DkpAdStrip
        layout="horizontal"
        category-tag="DKP ADS NETWORK &bull; APPROFONDIMENTI DAL VAULT"
      />
    </article>
  </DkpLayout>
</template>
<style scoped>
mark,
.dkp-highlight {
  background-color: rgba(16, 185, 129, 0.16) !important;
  color: #6ee7b7 !important;
  border: 1px solid rgba(16, 185, 129, 0.35) !important;
  border-radius: 0.375rem !important;
  padding: 0.08rem 0.38rem !important;
  font-weight: 700 !important;
}

.dkp-inline-code,
:not(pre) > code {
  background-color: rgba(30, 41, 59, 0.85) !important;
  color: #38bdf8 !important;
  border-radius: 0.3rem !important;
}
</style>
