<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import DkpLayout from '~/components/DkpLayout.vue'
import DkpRelatedNodesWidget from '~/components/widgets/DkpRelatedNodesWidget.vue'
import DkpRelatedBlogWidget from '~/components/widgets/DkpRelatedBlogWidget.vue'
import DkpAdsWidget from '~/components/ads/DkpAdsWidget.vue'

const route = useRoute()
const slugParam = computed(() => String(route.params.slug || route.params.id || '').trim())

const { data: apiRes, pending } = await useAsyncData(
  () => `dkp-canonical-story-${slugParam.value}`,
  async () => {
    const primary: any = await $fetch(`/api/news/${encodeURIComponent(slugParam.value)}`).catch(() => null)
    const found = primary?.data || primary?.story || primary?.item || (primary?.title ? primary : null)
    if (found) return found

    const fallbackItem: any = await $fetch(`/api/item/${encodeURIComponent(slugParam.value)}`).catch(() => null)
    return fallbackItem?.data || fallbackItem || null
  }
)

const story = computed<any>(() => apiRes.value)
const effectiveSlug = computed(() => String(story.value?.slug || slugParam.value))
const canonicalPath = computed(() => `/news/${effectiveSlug.value}`)

const seoTitle = computed(() =>
  story.value?.title
    ? `${story.value.title} \u2014 DKP Tech Intelligence`
    : 'Segnale Tecnico \u2014 DevKernelPulse'
)
const seoDescription = computed(() =>
  story.value?.summary_it ||
  story.value?.summary ||
  story.value?.content?.slice(0, 160) ||
  'Analisi tecnica e sintesi AI certificata da Trinity AI & Sentinel Crawler su DevKernelPulse.'
)

useDkpSeo({
  title: seoTitle,
  description: seoDescription,
  type: 'article',
  publishedTime: computed(() => story.value?.createdAt || new Date().toISOString()),
  authorName: computed(() => story.value?.author || 'Trinity AI Crawler'),
  section: computed(() => String(story.value?.type || 'NEWS').toUpperCase()),
  canonicalPath
})

const domainLabel = computed(() => {
  const rawUrl = String(story.value?.url || '')
  if (!rawUrl) return 'devkernelpulse.org'
  try {
    return new URL(rawUrl).hostname.replace(/^www\./, '')
  } catch {
    return 'fonte-esterna'
  }
})

const authorName = computed(() => String(story.value?.author || story.value?.by || 'jdns'))
const authorInitial = computed(() => authorName.value.charAt(0).toUpperCase() || 'D')
const authorRank = computed(() => {
  const pts = Number(story.value?.points || story.value?.score || 10)
  if (pts >= 200) return { level: 7, title: 'CODE CRAFTSMAN' }
  if (pts >= 100) return { level: 5, title: 'SYSTEM ARCHITECT' }
  if (pts >= 40) return { level: 3, title: 'KERNEL BUILDER' }
  return { level: 2, title: 'SENTINEL SCOUT' }
})

const formattedDate = computed(() => {
  const raw = story.value?.createdAt
  if (!raw) return new Date().toLocaleDateString('it-IT')
  const d = new Date(raw)
  return isNaN(d.getTime()) ? new Date().toLocaleDateString('it-IT') : d.toLocaleDateString('it-IT')
})

const readMinutes = computed(() => {
  const txt = `${story.value?.summary_it || ''} ${story.value?.content || ''}`.trim()
  const words = txt ? txt.split(/\s+/).length : 80
  return Math.max(1, Math.ceil(words / 180))
})

const storyTags = computed<string[]>(() => {
  if (Array.isArray(story.value?.tags) && story.value.tags.length > 0) {
    return story.value.tags.map((t: any) => String(t).replace(/^#/, ''))
  }
  const ch = String(story.value?.type || 'News')
  return ['HackerNews', 'Tech', ch.charAt(0).toUpperCase() + ch.slice(1)]
})

// Upvote (+5 XP)
const optimisticBonus = ref(0)
const hasUpvoted = ref(false)
const xpBanner = ref('')

const totalPoints = computed(() => Number(story.value?.points || story.value?.score || 1) + optimisticBonus.value)

async function handleUpvote() {
  if (!story.value || hasUpvoted.value) return
  hasUpvoted.value = true
  optimisticBonus.value += 1
  const res: any = await $fetch('/api/news/vote', {
    method: 'POST',
    body: { itemId: story.value.id }
  }).catch(() => null)
  const gained = Number(res?.xpAwarded || 5)
  xpBanner.value = `Upvote registrato! +${gained} XP accreditati al tuo profilo.`
}

// Commenti & Peer Review (+15 XP)
const comments = ref<any[]>([])
const commentText = ref('')
const isLoadingComments = ref(false)
const isSendingComment = ref(false)
const commentError = ref('')

async function loadComments() {
  const slugKey = effectiveSlug.value
  if (!slugKey) return
  isLoadingComments.value = true
  try {
    const res: any = await $fetch(`/api/news/comments?slug=${encodeURIComponent(slugKey)}`).catch(() => null)
    comments.value = res?.comments || res?.data || []
  } finally {
    isLoadingComments.value = false
  }
}

async function submitComment() {
  const text = commentText.value.trim()
  if (!text || !effectiveSlug.value) return
  commentError.value = ''
  isSendingComment.value = true
  try {
    const res: any = await $fetch('/api/news/comments', {
      method: 'POST',
      body: {
        slug: effectiveSlug.value,
        content: text
      }
    })
    if (res?.success) {
      commentText.value = ''
      xpBanner.value = 'Commento pubblicato nella discussione! +15 XP assegnati.'
      await loadComments()
    }
  } catch (err: any) {
    commentError.value = err?.data?.statusMessage || 'Errore durante la pubblicazione del commento.'
  } finally {
    isSendingComment.value = false
  }
}

onMounted(() => {
  loadComments()
})

watch(slugParam, () => {
  optimisticBonus.value = 0
  hasUpvoted.value = false
  xpBanner.value = ''
  loadComments()
})
</script>

<template>
  <DkpLayout
    :hide-section-header="true"
    :show-sidebar-ads="true"
    :seo-title="seoTitle"
    :seo-description="seoDescription"
  >
    <div v-if="pending" class="bg-dkp-card border border-dkp-border rounded-2xl p-10 text-center font-mono text-xs text-cyan-400">
      Caricamento scheda canonica...
    </div>

    <div v-else-if="!story" class="bg-dkp-card border border-dkp-border rounded-2xl p-10 text-center space-y-4">
      <h1 class="text-xl font-bold text-white m-0">Segnale non trovato</h1>
      <p class="text-slate-400 text-sm m-0">L&apos;articolo richiesto non &egrave; disponibile o lo slug &egrave; stato aggiornato.</p>
      <NuxtLink to="/news" class="inline-block px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-mono text-xs font-extrabold no-underline">
        Torna al Tech Feed &rarr;
      </NuxtLink>
    </div>

    <article v-else class="space-y-6">
      <!-- Notifica XP -->
      <div
        v-if="xpBanner"
        class="bg-emerald-500/15 border border-emerald-400/60 text-emerald-300 font-mono text-xs font-bold px-4 py-3 rounded-xl flex items-center justify-between"
      >
        <span> {{ xpBanner }}</span>
        <button type="button" @click="xpBanner = ''" class="text-emerald-200 bg-transparent border-none cursor-pointer font-bold">x</button>
      </div>

      <!-- Card Principale Canonica -->
      <div class="bg-[#050914]/95 border border-slate-800 rounded-2xl p-6 sm:p-8 card-glow space-y-5">
        <!-- Breadcrumb -->
        <nav aria-label="Breadcrumb" class="flex flex-wrap items-center gap-2 font-mono text-xs text-slate-400">
          <NuxtLink to="/news" class="text-slate-300 hover:text-cyan-400 no-underline flex items-center gap-1.5">
            <span></span> Tech Feed
          </NuxtLink>
          <span>/</span>
          <span class="text-cyan-400 font-bold uppercase">{{ story.type || 'NEWS' }}</span>
          <span>/</span>
          <span class="text-slate-200 font-semibold truncate max-w-md">{{ story.title }}</span>
        </nav>

        <!-- Badge Stato & Sentinel -->
        <div class="flex flex-wrap items-center gap-2.5 font-mono text-[11px]">
          <span class="px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 font-extrabold uppercase">
            {{ story.type || 'NEWS' }}
          </span>
          <span class="px-2.5 py-1 rounded-md bg-sky-500/15 text-sky-300 border border-sky-500/40 font-bold">
             PURE-SQL INDEXED
          </span>
          <span class="px-2.5 py-1 rounded-md bg-teal-500/15 text-teal-300 border border-teal-500/40 font-bold">
             TRINITY SENTINEL {{ story.tech_score || 60 }}%
          </span>
        </div>

        <hr class="border-slate-800/90 my-2" />

        <!-- Titolo Principale -->
        <h1 class="text-2xl sm:text-4xl font-extrabold text-white leading-tight tracking-tight m-0">
          {{ story.title }}
        </h1>

        <!-- Box Autore + Bottone Fonte Esterna -->
        <div class="bg-[#030712] border border-slate-800/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-3.5">
            <div class="w-11 h-11 rounded-full bg-sky-500/20 border-2 border-sky-400 flex items-center justify-center text-sky-300 font-extrabold text-base shrink-0">
              {{ authorInitial }}
            </div>
            <div class="space-y-1">
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-white font-bold text-sm">@{{ authorName }}</span>
                <span class="px-2 py-0.5 rounded bg-sky-500/15 border border-sky-500/40 text-sky-300 font-mono text-[10px] font-extrabold">
                   LVL. {{ authorRank.level }} - {{ authorRank.title }}
                </span>
              </div>
              <div class="flex flex-wrap items-center gap-3 font-mono text-xs text-slate-400">
                <span> {{ formattedDate }}</span>
                <span class="text-amber-300 font-bold"> {{ totalPoints }} pts HN</span>
                <span> {{ comments.length }} commenti</span>
                <span> {{ readMinutes }} min lettura</span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              :disabled="hasUpvoted"
              @click="handleUpvote"
              :class="[
                'px-3.5 py-2.5 rounded-xl font-mono text-xs font-extrabold border transition-all cursor-pointer',
                hasUpvoted
                  ? 'bg-amber-500/20 border-amber-400/50 text-amber-300 cursor-default'
                  : 'bg-[#081226] hover:bg-amber-500/15 border-amber-500/40 text-amber-300'
              ]"
            >
               {{ hasUpvoted ? 'Votato' : 'Upvote (+5 XP)' }}
            </button>

            <a
              v-if="story.url"
              :href="story.url"
              target="_blank"
              rel="noopener noreferrer"
              class="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-extrabold no-underline transition-colors"
            >
              Fonte ({{ domainLabel }}) &nearr;
            </a>
          </div>
        </div>

        <!-- Box Sintesi & Analisi Trinity AI -->
        <div class="bg-[#030a14] border border-emerald-500/35 rounded-2xl p-5 space-y-2.5">
          <div class="flex items-center justify-between gap-2 font-mono text-[11px]">
            <div class="flex items-center gap-2 text-emerald-400 font-extrabold uppercase tracking-wider">
              <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>SINTESI &amp; ANALISI TRINITY AI</span>
            </div>
            <span class="px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/35 font-bold">
              PURE SQL INDEXED
            </span>
          </div>

          <p class="text-slate-100 text-sm sm:text-base leading-relaxed m-0">
            {{ story.summary_it || story.summary || `Notizia di tendenza su Hacker News: ${story.title}` }}
          </p>
        </div>

        <!-- Contenuto Esteso -->
        <div v-if="story.content" class="text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-line pt-1">
          {{ story.content }}
        </div>

        <!-- Tag SEO -->
        <div class="flex flex-wrap items-center gap-2 pt-1">
          <NuxtLink
            v-for="tag in storyTags"
            :key="tag"
            :to="`/news?q=${encodeURIComponent(tag)}`"
            class="px-3 py-1 rounded-lg bg-[#081226] border border-slate-700/80 hover:border-cyan-400/60 text-sky-400 font-mono text-xs font-bold no-underline transition-colors"
          >
            #{{ tag }}
          </NuxtLink>
        </div>
      </div>

      <!-- SEZIONE COMMENTI & PEER REVIEW (+15 XP) -->
      <section id="comments" class="bg-[#050914]/95 border border-slate-800 rounded-2xl p-6 sm:p-8 card-glow space-y-5">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div class="flex items-center gap-2.5">
            <span class="text-lg"></span>
            <h2 class="text-base sm:text-lg font-extrabold text-white m-0 font-display">
              Discussione Tecnica &amp; Peer Review ({{ comments.length }})
            </h2>
          </div>
          <span class="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-mono text-[11px] font-extrabold">
            +15 XP PER CONTRIBUTO
          </span>
        </div>

        <form @submit.prevent="submitComment" class="space-y-3">
          <textarea
            v-model="commentText"
            rows="3"
            placeholder="Condividi un'analisi tecnica, un benchmark o un commento su questo segnale..."
            class="w-full bg-[#020617] border border-slate-700 focus:border-cyan-400 text-white p-3.5 rounded-xl font-sans text-sm outline-none box-border"
          ></textarea>

          <div v-if="commentError" class="text-rose-400 font-mono text-xs font-bold">
            {{ commentError }}
          </div>

          <div class="flex flex-wrap items-center justify-between gap-3">
            <span class="font-mono text-[11px] text-slate-400">
              Slug indicizzato: <code class="text-cyan-300">/news/{{ effectiveSlug }}</code>
            </span>
            <button
              type="submit"
              :disabled="isSendingComment || !commentText.trim()"
              class="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-mono text-xs font-extrabold border-none cursor-pointer transition-colors"
            >
              {{ isSendingComment ? 'Pubblicazione...' : 'Pubblica Commento (+15 XP)' }}
            </button>
          </div>
        </form>

        <div v-if="isLoadingComments" class="py-4 text-center font-mono text-xs text-slate-400">
          Caricamento commenti dalla community...
        </div>

        <div v-else-if="comments.length === 0" class="bg-[#020617] border border-slate-800/80 rounded-xl p-6 text-center font-mono text-xs text-slate-400">
          Nessun commento ancora pubblicato. Avvia tu la discussione tecnica e guadagna <strong class="text-emerald-400">+15 XP</strong>!
        </div>

        <div v-else class="space-y-3 pt-2">
          <div
            v-for="c in comments"
            :key="c.id"
            class="bg-[#030712] border border-slate-800 rounded-xl p-4 space-y-1.5"
          >
            <div class="flex items-center justify-between gap-2 font-mono text-xs">
              <div class="flex items-center gap-2">
                <span class="text-cyan-300 font-bold">@{{ c.authorUsername || c.author || 'dev_kernel' }}</span>
                <span class="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  PEER REVIEW
                </span>
              </div>
              <span class="text-slate-500 text-[11px]">
                {{ c.createdAt ? new Date(c.createdAt).toLocaleString('it-IT') : 'Adesso' }}
              </span>
            </div>
            <p class="text-slate-200 text-sm leading-relaxed m-0 whitespace-pre-line">
              {{ c.content }}
            </p>
          </div>
        </div>
      </section>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DkpRelatedBlogWidget />
        <DkpRelatedNodesWidget />
      </div>
      <DkpAdsWidget placement="feedInline" layout="horizontal" :limit="3" />
    </article>
  </DkpLayout>
</template>