<script setup lang="ts">
import { ref, reactive, computed, onMounted, isRef } from 'vue'

const auth = typeof useAuthCore === 'function' ? useAuthCore() : null
const currentUser = computed(() => {
  if (!auth) return null
  return isRef(auth.currentUser) ? auth.currentUser.value : (auth.currentUser || null)
})

const userPosts = ref<any[]>([])
const telemetry = ref<any>({
  dbLatencyMs: 12,
  userStoriesCount: 0,
  userPointsTotal: 0,
  userXpEarned: 0,
  globalFeedTotal: 0,
  sections: { news: 0, ask: 0, show: 0, jobs: 0 }
})

const isLoading = ref(true)
const isPublishing = ref(false)
const showComposer = ref(true)
const sectionFilter = ref<'all' | 'news' | 'ask' | 'show' | 'jobs'>('all')
const searchQuery = ref('')
const feedbackMsg = ref<{ type: 'ok' | 'err'; text: string } | null>(null)

const sectionOptions = [
  { id: 'news', label: 'Tech Feed', route: '/feed', xp: 15, badgeClass: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/15' },
  { id: 'ask', label: 'Ask DKP', route: '/ask', xp: 20, badgeClass: 'text-amber-300 border-amber-500/40 bg-amber-500/15' },
  { id: 'show', label: 'Show DKP', route: '/show', xp: 30, badgeClass: 'text-cyan-300 border-cyan-500/40 bg-cyan-500/15' },
  { id: 'jobs', label: 'Tech Jobs', route: '/jobs', xp: 25, badgeClass: 'text-violet-300 border-violet-500/40 bg-violet-500/15' }
] as const

const quickForm = reactive({
  type: 'news' as 'news' | 'ask' | 'show' | 'jobs',
  title: '',
  url: '',
  content: '',
  notarize: false
})

const selectedSectionMeta = computed(() => {
  return sectionOptions.find((s) => s.id === quickForm.type) || sectionOptions[0]
})

const estimatedXp = computed(() => {
  return selectedSectionMeta.value.xp + (quickForm.notarize ? 15 : 0)
})

const extractedDomain = computed(() => {
  const raw = quickForm.url.trim()
  if (!raw) return 'devkernelpulse.org'
  try {
    return new URL(raw).hostname.replace(/^www\./, '')
  } catch {
    return 'url-non-valido'
  }
})

const filteredPosts = computed(() => {
  return userPosts.value.filter((item) => {
    const itemType = String(item.type || 'news').toLowerCase()
    const normalizedType = itemType === 'job' ? 'jobs' : itemType
    const matchesSection = sectionFilter.value === 'all' || normalizedType === sectionFilter.value
    const q = searchQuery.value.trim().toLowerCase()
    const matchesQuery =
      !q ||
      String(item.title || '').toLowerCase().includes(q) ||
      String(item.domain || '').toLowerCase().includes(q)
    return matchesSection && matchesQuery
  })
})

async function fetchUserStories() {
  isLoading.value = true
  try {
    const uid = currentUser.value?.id || ''
    const uname = currentUser.value?.username || ''
    const res: any = await $fetch(`/api/pulse/user-stories?userId=${encodeURIComponent(String(uid))}&username=${encodeURIComponent(String(uname))}&_t=${Date.now()}`)
    if (res?.success) {
      userPosts.value = Array.isArray(res.data) ? res.data : []
      if (res.telemetry) telemetry.value = res.telemetry
    }
  } catch (err) {
    console.warn('Errore fetch user-stories HN:', err)
  } finally {
    isLoading.value = false
  }
}

async function publishQuickSignal() {
  feedbackMsg.value = null
  if (!quickForm.title.trim() || quickForm.title.trim().length < 5) {
    feedbackMsg.value = { type: 'err', text: 'Inserisci un titolo di almeno 5 caratteri.' }
    return
  }
  if (quickForm.url.trim() && !/^https?:\/\/.+/i.test(quickForm.url.trim())) {
    feedbackMsg.value = { type: 'err', text: 'L\'URL deve iniziare con http:// o https://' }
    return
  }
  if ((quickForm.type === 'ask' || quickForm.type === 'jobs') && !quickForm.content.trim() && !quickForm.url.trim()) {
    feedbackMsg.value = { type: 'err', text: `Inserisci contesto o dettagli per la sezione ${quickForm.type.toUpperCase()}.` }
    return
  }

  isPublishing.value = true
  try {
    const res: any = await $fetch('/api/pulse/submit', {
      method: 'POST',
      body: {
        type: quickForm.type,
        title: quickForm.title.trim(),
        url: quickForm.url.trim(),
        content: quickForm.content.trim(),
        notarize: quickForm.notarize,
        author: currentUser.value?.username || 'alexdpl',
        authorId: currentUser.value?.id || 1
      }
    })

    if (res?.success) {
      feedbackMsg.value = { type: 'ok', text: res.message || `Pubblicato! +${estimatedXp.value} XP accreditati.` }
      quickForm.title = ''
      quickForm.url = ''
      quickForm.content = ''
      quickForm.notarize = false
      await fetchUserStories()
      if (import.meta.client) {
        window.dispatchEvent(new Event('dkp:xp_updated'))
      }
    } else {
      feedbackMsg.value = { type: 'err', text: res?.message || 'Errore durante la pubblicazione.' }
    }
  } catch (err: any) {
    feedbackMsg.value = {
      type: 'err',
      text: err?.data?.statusMessage || err?.data?.message || err?.message || 'Errore Kernel durante la pubblicazione.'
    }
  } finally {
    isPublishing.value = false
  }
}

async function deletePost(id: number) {
  if (!confirm('Vuoi eliminare definitivamente questo segnale dal feed HN?')) return
  try {
    await $fetch(`/api/pulse/stories/${id}`, { method: 'DELETE' })
    await fetchUserStories()
    feedbackMsg.value = { type: 'ok', text: 'Segnale HN rimosso dal database Pure SQL.' }
  } catch (err: any) {
    feedbackMsg.value = {
      type: 'err',
      text: err?.data?.statusMessage || 'Impossibile eliminare il segnale selezionato.'
    }
  }
}

function getSectionRoute(rawType: string): string {
  const t = String(rawType || 'news').toLowerCase()
  if (t === 'ask') return '/ask'
  if (t === 'show') return '/show'
  if (t === 'job' || t === 'jobs') return '/jobs'
  return '/feed'
}

function getSectionBadgeClass(rawType: string): string {
  const t = String(rawType || 'news').toLowerCase()
  if (t === 'ask') return 'bg-amber-500/15 text-amber-300 border-amber-500/40'
  if (t === 'show') return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
  if (t === 'job' || t === 'jobs') return 'bg-violet-500/15 text-violet-300 border-violet-500/40'
  return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
}

onMounted(fetchUserStories)
</script>

<template>
  <div class="space-y-6 font-mono">
    <!-- 1. TELEMETRIA LIVE KERNEL HN -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-[#050914] border border-emerald-500/30 rounded-2xl p-4 space-y-1">
        <div class="text-[10px] uppercase text-emerald-300 font-bold">Segnali HN Pubblicati</div>
        <div class="text-2xl font-extrabold text-white">{{ telemetry.userStoriesCount }}</div>
        <div class="text-[11px] text-slate-400">
          Feed Globale: <strong class="text-emerald-400">{{ telemetry.globalFeedTotal }}</strong> segnali live
        </div>
      </div>

      <div class="bg-[#050914] border border-cyan-500/30 rounded-2xl p-4 space-y-1">
        <div class="text-[10px] uppercase text-cyan-300 font-bold">Upvotes &amp; Karma HN</div>
        <div class="text-2xl font-extrabold text-cyan-300">&#9650; {{ telemetry.userPointsTotal }}</div>
        <div class="text-[11px] text-slate-400">
          XP Generati dal Feed: <strong class="text-emerald-400">+{{ telemetry.userXpEarned }} XP</strong>
        </div>
      </div>

      <div class="bg-[#050914] border border-violet-500/30 rounded-2xl p-4 space-y-1">
        <div class="text-[10px] uppercase text-violet-300 font-bold">Distribuzione Canali</div>
        <div class="text-xs font-bold text-slate-200 pt-1 leading-relaxed">
          Feed: <span class="text-emerald-400">{{ telemetry.sections?.news || 0 }}</span> &bull;
          Ask: <span class="text-amber-300">{{ telemetry.sections?.ask || 0 }}</span> &bull;
          Show: <span class="text-cyan-300">{{ telemetry.sections?.show || 0 }}</span> &bull;
          Jobs: <span class="text-violet-300">{{ telemetry.sections?.jobs || 0 }}</span>
        </div>
      </div>

      <div class="bg-[#050914] border border-sky-500/30 rounded-2xl p-4 space-y-1">
        <div class="text-[10px] uppercase text-sky-300 font-bold">Stato Kernel Pure SQL</div>
        <div class="flex items-center gap-2 pt-0.5">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span class="text-sm font-extrabold text-emerald-300">ONLINE &bull; {{ telemetry.dbLatencyMs }}ms</span>
        </div>
        <div class="text-[11px] text-slate-400">Sentinel Anti-Spam &amp; Vault Ready</div>
      </div>
    </div>

    <!-- 2. COMPOSITORE RAPIDO HN (FEED / ASK / SHOW / JOBS) -->
    <div class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-6 sm:p-7 card-glow space-y-5">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <h2 class="text-lg sm:text-xl font-extrabold text-white font-display m-0">
              Condividi Segnale su HackerNews DKP
            </h2>
            <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[10px] font-extrabold">
              +{{ estimatedXp }} XP STIMATI
            </span>
          </div>
          <p class="text-xs text-slate-400 mt-1 mb-0 font-sans">
            Pubblica direttamente su <strong class="text-slate-200">Tech Feed, Ask DKP, Show DKP o Tech Jobs</strong> con indicizzazione immediata e notarizzazione opzionale.
          </p>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <button
            type="button"
            @click="showComposer = !showComposer"
            class="px-3.5 py-2 rounded-xl bg-[#030712] hover:bg-slate-900 border border-slate-700 text-cyan-300 text-xs font-bold cursor-pointer"
          >
            {{ showComposer ? 'Comprimi Form' : '+ Apri Compositore' }}
          </button>
          <NuxtLink
            to="/submit"
            class="px-3.5 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/50 text-cyan-200 text-xs font-extrabold no-underline"
          >
            Pagina /submit &rarr;
          </NuxtLink>
        </div>
      </div>

      <div v-if="feedbackMsg" :class="feedbackMsg.type === 'ok' ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300' : 'bg-rose-500/15 border-rose-500/50 text-rose-300'" class="p-3.5 rounded-xl border text-xs font-bold">
        {{ feedbackMsg.text }}
      </div>

      <form v-if="showComposer" @submit.prevent="publishQuickSignal" class="space-y-4">
        <!-- Selettore Sezione HN -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            v-for="sec in sectionOptions"
            :key="sec.id"
            type="button"
            @click="quickForm.type = sec.id"
            :class="quickForm.type === sec.id ? 'border-emerald-400 bg-emerald-500/15 text-white shadow-sm' : 'border-slate-800 bg-[#030712] text-slate-400 hover:text-slate-200'"
            class="p-3 rounded-xl border text-left transition-all cursor-pointer space-y-1"
          >
            <div class="flex items-center justify-between gap-1">
              <span class="text-xs font-extrabold">{{ sec.label }}</span>
              <span class="text-[10px] text-emerald-400 font-bold">+{{ sec.xp }} XP</span>
            </div>
            <div class="text-[10px] text-slate-500">{{ sec.route }}</div>
          </button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label class="block text-[11px] uppercase text-slate-300 font-bold">
              Titolo Segnale *
            </label>
            <input
              v-model="quickForm.title"
              type="text"
              placeholder="Es. Show DKP: Motore di notarizzazione SHA-256 su Edge..."
              class="w-full bg-[#030712] border border-slate-800 focus:border-emerald-400 text-white px-3.5 py-2.5 rounded-xl text-xs font-sans outline-none"
            />
          </div>

          <div class="space-y-1.5">
            <div class="flex items-center justify-between text-[11px]">
              <label class="uppercase text-slate-300 font-bold">Link / Repository URL</label>
              <span class="text-cyan-400 text-[10px]">Dominio: {{ extractedDomain }}</span>
            </div>
            <input
              v-model="quickForm.url"
              type="url"
              placeholder="https://github.com/..."
              class="w-full bg-[#030712] border border-slate-800 focus:border-emerald-400 text-white px-3.5 py-2.5 rounded-xl text-xs font-sans outline-none"
            />
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="block text-[11px] uppercase text-slate-300 font-bold">
            Contesto Tecnico / Dettagli {{ (quickForm.type === 'ask' || quickForm.type === 'jobs') ? '*' : '(Opzionale)' }}
          </label>
          <textarea
            v-model="quickForm.content"
            rows="3"
            placeholder="Descrivi stack, benchmark, dettagli della domanda Ask o requisiti della posizione Tech Job..."
            class="w-full bg-[#030712] border border-slate-800 focus:border-emerald-400 text-white px-3.5 py-2.5 rounded-xl text-xs font-sans outline-none resize-y"
          ></textarea>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <label class="inline-flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
            <input
              v-model="quickForm.notarize"
              type="checkbox"
              class="w-4 h-4 rounded border-slate-700 bg-[#030712] text-emerald-500"
            />
            <span>Firma crittografica <strong class="text-emerald-400">SHA-256 Vault</strong> (+15 XP bonus)</span>
          </label>

          <button
            type="submit"
            :disabled="isPublishing"
            class="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold cursor-pointer transition-colors disabled:opacity-50"
          >
            {{ isPublishing ? 'Pubblicazione Pure SQL...' : `Pubblica su ${selectedSectionMeta.label} (+${estimatedXp} XP)` }}
          </button>
        </div>
      </form>
    </div>

    <!-- 3. ARCHIVIO SEGNALI HN PUBBLICATI -->
    <div class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-6 sm:p-7 card-glow space-y-4">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h3 class="text-base sm:text-lg font-extrabold text-white font-display m-0">
            I Miei Segnali HN ({{ filteredPosts.length }})
          </h3>
          <p class="text-xs text-slate-400 mt-0.5 mb-0 font-sans">
            Gestisci tutti i tuoi contributi pubblicati su Feed, Ask, Show e Jobs.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cerca titolo o dominio..."
            class="bg-[#030712] border border-slate-800 focus:border-cyan-400 text-white px-3 py-2 rounded-xl text-xs font-sans outline-none w-48"
          />
          <select
            v-model="sectionFilter"
            class="bg-[#030712] border border-slate-800 text-cyan-300 px-3 py-2 rounded-xl text-xs font-bold outline-none cursor-pointer"
          >
            <option value="all">Tutte le Sezioni</option>
            <option value="news">Tech Feed</option>
            <option value="ask">Ask DKP</option>
            <option value="show">Show DKP</option>
            <option value="jobs">Tech Jobs</option>
          </select>
        </div>
      </div>

      <div v-if="isLoading" class="py-8 text-center text-xs text-cyan-300 animate-pulse">
        Sincronizzazione segnali HN da Neon DB...
      </div>

      <div v-else-if="filteredPosts.length === 0" class="py-10 text-center bg-[#030712] border border-slate-800 rounded-xl text-xs text-slate-400">
        Nessun segnale trovato con i filtri attuali. Usa il compositore qui sopra per pubblicare il tuo primo contributo HN!
      </div>

      <div v-else class="overflow-x-auto bg-[#030712] border border-slate-800 rounded-xl">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-[#090e1c] border-b border-slate-800 text-slate-400 uppercase text-[10px]">
              <th class="p-3.5">Titolo &amp; Dominio</th>
              <th class="p-3.5">Sezione</th>
              <th class="p-3.5">Punti / XP</th>
              <th class="p-3.5">Data</th>
              <th class="p-3.5 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/80">
            <tr v-for="post in filteredPosts" :key="post.id" class="hover:bg-[#090e1c]/80 transition-colors">
              <td class="p-3.5 max-w-md">
                <NuxtLink :to="getSectionRoute(post.type)" class="font-sans font-bold text-sm text-white hover:text-emerald-400 no-underline block truncate">
                  {{ post.title }}
                </NuxtLink>
                <div class="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                  <span>{{ post.domain || 'devkernelpulse.org' }}</span>
                  <span v-if="post.vaultHash" class="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
                    SHA-256
                  </span>
                </div>
              </td>
              <td class="p-3.5">
                <span :class="['px-2.5 py-1 rounded-lg border text-[10px] font-extrabold uppercase', getSectionBadgeClass(post.type)]">
                  {{ post.type === 'job' ? 'JOBS' : String(post.type || 'NEWS').toUpperCase() }}
                </span>
              </td>
              <td class="p-3.5">
                <div class="text-emerald-400 font-extrabold">&#9650; {{ post.points || 1 }} pt</div>
                <div class="text-[10px] text-slate-400">+{{ post.xpAwarded || 15 }} XP</div>
              </td>
              <td class="p-3.5 text-slate-400">
                {{ post.createdAt ? new Date(post.createdAt).toLocaleDateString('it-IT') : 'Recente' }}
              </td>
              <td class="p-3.5 text-right space-x-2">
                <a
                  v-if="post.url && post.url.startsWith('http')"
                  :href="post.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-block px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 text-[11px] font-bold no-underline"
                >
                  Apri
                </a>
                <button
                  type="button"
                  @click="deletePost(post.id)"
                  class="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 text-[11px] font-bold cursor-pointer"
                >
                  Elimina
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>