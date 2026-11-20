<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import DkpRelatedBlogWidget from '~/components/widgets/DkpRelatedBlogWidget.vue'
import DkpRelatedNodesWidget from '~/components/widgets/DkpRelatedNodesWidget.vue'
import DkpAdStrip from '~/components/DkpAdStrip.vue'

interface Props {
  feedType?: 'top' | 'newest' | 'ask' | 'show' | 'jobs'
  pageTitle?: string
  pageSubtitle?: string
  icon?: string
  seoTitle?: string
  seoDescription?: string
}

const props = withDefaults(defineProps<Props>(), {
  feedType: 'top',
  pageTitle: 'Latest Tech Feed',
  pageSubtitle: 'DKP PRO v2.6 \u2022 BEMYAGENT.md \u2022 Real-Time Tech Intelligence',
  icon: '\uD83C\uDF0D',
  seoTitle: 'DevKernelPulse \u2014 Tech Feed',
  seoDescription: 'Aggregatore tecnico in tempo reale filtrato da AI Sentinels e notarizzato su Pure SQL.'
})

const { currentUser } = useAuthCore()
const items = ref<any[]>([])
const votedIds = ref<Set<string>>(new Set())
const isLoading = ref(true)
const page = ref(1)
const limit = 25

// Stato Modale Gamification "+ Invia Link (+25 XP)"
const showSubmitModal = ref(false)
const isSubmitting = ref(false)
const submitTitle = ref('')
const submitUrl = ref('')
const submitChannel = ref<'feed' | 'ask' | 'show' | 'jobs'>('feed')
const gamificationToast = ref<string | null>(null)
const submitError = ref<string | null>(null)

const hnTabs = [
  { key: 'top', to: '/feed', label: 'Top Feed (HN + Reddit)' },
  { key: 'newest', to: '/newest', label: 'Newest (Community)' },
  { key: 'ask', to: '/ask', label: 'Ask DKP (HN + Reddit)' },
  { key: 'show', to: '/show', label: 'Show DKP (GitHub + GitLab)' },
  { key: 'jobs', to: '/jobs', label: 'Tech Jobs (Italia IT)' }
]

const userLevel = computed(() => {
  const xp = Number(currentUser.value?.xp || 0)
  return Math.max(1, Math.floor(xp / 1000) + 1)
})

function openSubmitModal() {
  submitError.value = null
  submitChannel.value = props.feedType === 'newest' ? 'feed' : props.feedType
  showSubmitModal.value = true
}

function showToast(msg: string) {
  gamificationToast.value = msg
  setTimeout(() => {
    gamificationToast.value = null
  }, 4000)
}

async function handleSubmitLink() {
  submitError.value = null
  isSubmitting.value = true
  try {
    const res: any = await $fetch('/api/news/submit', {
      method: 'POST',
      body: {
        title: submitTitle.value,
        url: submitUrl.value,
        channel: submitChannel.value
      }
    })
    if (res?.success) {
      if (currentUser.value) {
        currentUser.value.xp = Number(currentUser.value.xp || 0) + Number(res.xpAwarded || 25)
      }
      submitTitle.value = ''
      submitUrl.value = ''
      showSubmitModal.value = false
      showToast(res.message || 'Link verificato da @sentinel_ai! +25 XP')
      await loadFeed()
    }
  } catch (err: any) {
    submitError.value = err?.data?.statusMessage || 'Errore durante la verifica Sentinel del link.'
  } finally {
    isSubmitting.value = false
  }
}

async function handleUpvote(item: any) {
  const key = String(item.id)
  if (votedIds.value.has(key)) return
  votedIds.value.add(key)
  item.points = Number(item.points || 1) + 1

  const res: any = await $fetch('/api/news/vote', {
    method: 'POST',
    body: { itemId: item.id }
  }).catch(() => null)

  if (res?.xpAwarded && currentUser.value) {
    currentUser.value.xp = Number(currentUser.value.xp || 0) + Number(res.xpAwarded)
    showToast(`Upvote registrato! +${res.xpAwarded} XP`)
  }
}

function getSourceBadge(provider?: string) {
  const p = String(provider || 'HN').toUpperCase()
  if (p === 'REDDIT') return { label: 'REDDIT', cls: 'bg-orange-500/15 text-orange-300 border-orange-500/35' }
  if (p === 'GITHUB') return { label: 'GITHUB', cls: 'bg-slate-200/15 text-white border-slate-400/35' }
  if (p === 'GITLAB') return { label: 'GITLAB', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/35' }
  if (p === 'DATAPIZZA_IT') return { label: 'DATAPIZZA IT', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40' }
  if (p === 'TECHCOMPENSO_IT') return { label: 'TECHCOMPENSO RAL', cls: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40' }
  if (p === 'COMMUNITY_BLOG') return { label: 'BLOG COMMUNITY', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/35' }
  if (p === 'COMMUNITY_NODES') return { label: 'FORUM NODES', cls: 'bg-violet-500/15 text-violet-300 border-violet-500/35' }
  if (p === 'COMMUNITY_LINK') return { label: 'COMMUNITY +25XP', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/35' }
  return { label: 'HACKER NEWS', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' }
}

async function loadFeed() {
  isLoading.value = true
  try {
    const res: any = await $fetch('/api/news', {
      query: { type: props.feedType, page: page.value, limit, _t: Date.now() }
    }).catch(() => null)
    items.value = res?.data || res?.items || (Array.isArray(res) ? res : [])
  } finally {
    isLoading.value = false
  }
}

watch(() => props.feedType, () => {
  page.value = 1
  loadFeed()
})

onMounted(loadFeed)
</script>

<template>
  <DkpLayout
    :title="pageTitle"
    :subtitle="pageSubtitle"
    :icon="icon"
    :seo-title="seoTitle"
    :seo-description="seoDescription"
  >
    <!-- PULSANTI GAMIFICATION NELL'HEADER -->
    <template #header-actions>
      <div
        v-if="currentUser"
        class="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-dkp-bg border border-amber-500/40 text-amber-300 font-bold"
      >
        <span>&#9889; {{ currentUser.xp || 0 }} XP</span>
        <span class="px-1.5 py-0.5 rounded bg-amber-500/20 text-[10px]">LV.{{ userLevel }}</span>
      </div>

      <button
        type="button"
        @click="openSubmitModal"
        class="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold cursor-pointer transition-all shadow-[0_0_16px_rgba(16,185,129,0.3)]"
      >
        + Invia Link (+25 XP)
      </button>

      <button
        type="button"
        @click="loadFeed"
        class="px-3 py-2 rounded-xl bg-dkp-bg border border-emerald-500/40 text-emerald-400 hover:text-cyan-400 hover:border-cyan-400 font-bold cursor-pointer transition-colors"
        title="Aggiorna Stream"
      >
        &#8635;
      </button>
    </template>

    <!-- Toast Gamification -->
    <div
      v-if="gamificationToast"
      class="bg-emerald-500/15 border border-emerald-400 text-emerald-300 font-mono text-xs font-bold px-4 py-3 rounded-xl flex items-center justify-between shadow-lg"
    >
      <span>&#9889; {{ gamificationToast }}</span>
      <button type="button" @click="gamificationToast = null" class="bg-transparent border-none text-emerald-300 cursor-pointer">&#10005;</button>
    </div>

    <!-- Barra Tab Rapidi HN -->
    <div class="bg-dkp-card/95 border border-emerald-500/30 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2 font-mono text-xs card-glow">
      <div class="flex flex-wrap items-center gap-1.5">
        <NuxtLink
          v-for="tab in hnTabs"
          :key="tab.key"
          :to="tab.to"
          :class="[
            'px-3 py-2 rounded-xl font-bold no-underline transition-all border',
            feedType === tab.key
              ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
              : 'bg-dkp-bg/90 text-emerald-400 hover:text-cyan-400 border-dkp-border hover:border-cyan-400/50'
          ]"
        >
          {{ tab.label }}
        </NuxtLink>
      </div>

      <span class="text-[11px] text-slate-300 px-2">
        Sentinel Guard: <strong class="text-emerald-400">ACTIVE</strong>
      </span>
    </div>

    <!-- Lista News con Upvote Gamification (+5 XP) & Badge Sorgente Round-Robin -->
    <div class="bg-dkp-card/95 border border-emerald-500/30 rounded-2xl p-6 card-glow">
      <div v-if="isLoading" class="py-12 text-center font-mono text-xs text-emerald-400 animate-pulse">
        &#9889; Caricamento stream dal database Neon Pure SQL...
      </div>

      <div v-else-if="items.length === 0" class="py-12 text-center font-mono text-xs text-slate-300 space-y-3">
        <p class="m-0">Nessun elemento disponibile in questa sezione al momento.</p>
        <button
          type="button"
          @click="openSubmitModal"
          class="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold cursor-pointer border-none"
        >
          + Pubblica il primo link (+25 XP)
        </button>
      </div>

      <div v-else class="space-y-3.5">
        <article
          v-for="(item, idx) in items"
          :key="item.id || idx"
          class="bg-gradient-to-r from-emerald-500/[0.05] via-dkp-bg/95 to-dkp-bg border border-emerald-500/25 hover:border-cyan-400/60 rounded-xl p-4 transition-all group flex items-start gap-3.5"
        >
          <!-- Pulsante Upvote Gamification (+5 XP) -->
          <button
            type="button"
            @click="handleUpvote(item)"
            :class="[
              'flex flex-col items-center justify-center rounded-lg px-2.5 py-1.5 font-mono shrink-0 min-w-[56px] cursor-pointer transition-all border',
              votedIds.has(String(item.id))
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                : 'bg-dkp-card border-emerald-500/30 text-emerald-400 hover:border-cyan-400 hover:text-cyan-400'
            ]"
            title="Vota (+5 XP)"
          >
            <span class="text-xs font-black">&#9650;</span>
            <span class="text-white text-xs font-bold">{{ item.points || item.score || 1 }}</span>
          </button>

          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-center gap-2 mb-1.5 font-mono text-[11px]">
              <span :class="['px-2 py-0.5 rounded border font-bold', getSourceBadge(item.sourceProvider).cls]">
                {{ getSourceBadge(item.sourceProvider).label }}
              </span>
              <span
                v-if="item.sentinelVerified !== false"
                class="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold"
              >
                &#128737;&#65039; SENTINEL OK
              </span>
              <span class="text-slate-300">by @{{ item.author || item.by || 'sentinel_ai' }}</span>
              <span v-if="item.domain" class="text-slate-400">({{ item.domain }})</span>
            </div>

            <NuxtLink
              v-if="item.url && item.url.startsWith('/')"
              :to="item.url"
              class="text-base sm:text-lg font-bold text-emerald-400 group-hover:text-cyan-400 transition-colors no-underline block mb-2 leading-snug"
            >
              {{ item.title }} &rarr;
            </NuxtLink>
            <a
              v-else-if="item.url"
              :href="item.url"
              target="_blank"
              rel="noopener noreferrer"
              class="text-base sm:text-lg font-bold text-emerald-400 group-hover:text-cyan-400 transition-colors no-underline block mb-2 leading-snug"
            >
              {{ item.title }} &nearr;
            </a>
            <NuxtLink
              v-else
              :to="`/item/${item.id}`"
              class="text-base sm:text-lg font-bold text-emerald-400 group-hover:text-cyan-400 transition-colors no-underline block mb-2 leading-snug"
            >
              {{ item.title }} &rarr;
            </NuxtLink>

            <div class="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-300">
              <NuxtLink :to="`/item/${item.id}`" class="text-emerald-400 hover:text-cyan-400 no-underline font-bold transition-colors">
                &#128172; {{ item.commentsCount || item.descendants || 0 }} commenti
              </NuxtLink>
              <span class="text-slate-400">{{ item.createdAt ? new Date(item.createdAt).toLocaleDateString('it-IT') : 'Oggi' }}</span>
            </div>
          </div>
        </article>
      </div>

      <!-- Paginazione -->
      <div class="mt-6 pt-4 border-t border-dkp-border flex items-center justify-between font-mono text-xs">
        <button
          type="button"
          :disabled="page <= 1"
          @click="page--; loadFeed()"
          class="px-4 py-2 rounded-xl bg-dkp-bg border border-emerald-500/30 text-emerald-400 hover:text-cyan-400 hover:border-cyan-400 disabled:opacity-40 cursor-pointer transition-colors font-bold"
        >
          &larr; Precedente
        </button>
        <span class="text-emerald-400 font-bold">Pagina {{ page }}</span>
        <button
          type="button"
          :disabled="items.length < limit"
          @click="page++; loadFeed()"
          class="px-4 py-2 rounded-xl bg-dkp-bg border border-emerald-500/30 text-emerald-400 hover:text-cyan-400 hover:border-cyan-400 disabled:opacity-40 cursor-pointer transition-colors font-bold"
        >
          Successiva &rarr;
        </button>
      </div>
    </div>

    <!-- Blocco Uniforme alla Home -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <DkpRelatedBlogWidget />
      <DkpRelatedNodesWidget />
    </div>

    <DkpAdStrip
      layout="horizontal"
      category-tag="DKP ADS NETWORK &bull; APPROFONDIMENTI DAL VAULT"
      :topic="`hacker news ${feedType} software engineering`"
      :tags="[feedType, 'ai', 'security', 'architecture']"
    />

    <!-- MODALE GAMIFICATION: INVIA LINK & GUADAGNA +25 XP -->
    <Teleport to="body">
      <div
        v-if="showSubmitModal"
        class="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 font-mono"
        @click.self="showSubmitModal = false"
      >
        <div class="w-full max-w-lg bg-dkp-card border border-emerald-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
          <div class="flex items-center justify-between border-b border-dkp-border pb-3">
            <div>
              <span class="text-[10px] font-extrabold text-emerald-400 uppercase">GAMIFICATION REWARD &bull; +25 XP</span>
              <h3 class="text-lg font-bold text-white font-display m-0 mt-0.5">Invia Risorsa alla Sentinel Network</h3>
            </div>
            <button type="button" @click="showSubmitModal = false" class="text-slate-400 hover:text-white bg-transparent border-none cursor-pointer">&#10005;</button>
          </div>

          <form @submit.prevent="handleSubmitLink" class="space-y-3 text-xs">
            <div>
              <label class="block text-slate-300 mb-1">Titolo Tecnico *</label>
              <input
                v-model="submitTitle"
                required
                placeholder="Es. Show DKP: Motore Pure SQL con Sentinel Guard..."
                class="w-full bg-dkp-bg border border-dkp-border text-white p-3 rounded-xl outline-none focus:border-emerald-400 box-border"
              />
            </div>

            <div>
              <label class="block text-slate-300 mb-1">URL Risorsa / Repository (opzionale per Ask)</label>
              <input
                v-model="submitUrl"
                placeholder="https://github.com/..."
                class="w-full bg-dkp-bg border border-dkp-border text-cyan-400 p-3 rounded-xl outline-none focus:border-emerald-400 box-border"
              />
            </div>

            <div>
              <label class="block text-slate-300 mb-1">Sezione Destinazione</label>
              <select
                v-model="submitChannel"
                class="w-full bg-dkp-bg border border-dkp-border text-emerald-400 font-bold p-3 rounded-xl outline-none focus:border-emerald-400"
              >
                <option value="feed">Top Tech Feed</option>
                <option value="ask">Ask DKP (Domanda Tecnica)</option>
                <option value="show">Show DKP (Progetto Open Source)</option>
                <option value="jobs">Tech Jobs Italia</option>
              </select>
            </div>

            <div v-if="submitError" class="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300">
              {{ submitError }}
            </div>

            <div class="flex justify-end gap-2 pt-2">
              <button type="button" @click="showSubmitModal = false" class="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold border-none cursor-pointer">
                Annulla
              </button>
              <button type="submit" :disabled="isSubmitting" class="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-extrabold border-none cursor-pointer">
                {{ isSubmitting ? 'Verifica Sentinel...' : 'Pubblica (+25 XP)' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </DkpLayout>
</template>