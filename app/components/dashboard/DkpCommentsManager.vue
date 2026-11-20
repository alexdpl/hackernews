<!-- app/components/dashboard/DkpCommentsManager.vue -->
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps<{
  username?: string
  userId?: number
}>()

const emit = defineEmits<{
  (e: 'toast', message: string): void
}>()

interface UnifiedCommentItem {
  id: number
  postId: number
  parentId: number | null
  section: 'HN' | 'BLOG' | 'NODE'
  targetType: string
  postTitle: string
  targetUrl: string
  isParentDeleted: boolean
  author: string
  content: string
  text: string
  status: string
  isModerated: boolean
  isEdited: boolean
  sentinelVerdict?: string
  sentinelScore?: number
  sentinelNote?: string
  createdAt: string
  updatedAt: string | null
  date: string
}

const comments = ref<UnifiedCommentItem[]>([])
const isLoading = ref(false)
const searchQuery = ref('')
const sectionFilter = ref<'ALL' | 'HN' | 'BLOG' | 'NODE'>('ALL')
const statusFilter = ref<'ALL' | 'PUBLISHED' | 'MODERATED' | 'ORPHANED' | 'EDITED'>('ALL')
const currentPage = ref(1)
const itemsPerPage = 6

// Stato Modale Modifica Commento
const editingComment = ref<UnifiedCommentItem | null>(null)
const editText = ref('')
const isSavingEdit = ref(false)

// Quadro della situazione (KPI immediati)
const overviewStats = computed(() => {
  return comments.value.reduce(
    (acc, item) => {
      acc.total += 1
      if (item.section === 'HN') acc.hn += 1
      if (item.section === 'BLOG') acc.blog += 1
      if (item.section === 'NODE') acc.node += 1
      if (item.isModerated) acc.moderated += 1
      if (item.isParentDeleted) acc.orphaned += 1
      if (item.isEdited) acc.edited += 1
      return acc
    },
    { total: 0, hn: 0, blog: 0, node: 0, moderated: 0, orphaned: 0, edited: 0 }
  )
})

// Filtraggio combinato (Sezione + Stato Moderazione/Eliminazione + Ricerca)
const filteredComments = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()

  return comments.value.filter((c) => {
    if (sectionFilter.value !== 'ALL' && c.section !== sectionFilter.value) {
      return false
    }

    if (statusFilter.value === 'MODERATED' && !c.isModerated) return false
    if (statusFilter.value === 'ORPHANED' && !c.isParentDeleted) return false
    if (statusFilter.value === 'EDITED' && !c.isEdited) return false
    if (statusFilter.value === 'PUBLISHED' && (c.isModerated || c.isParentDeleted)) return false

    if (!q) return true

    return (
      c.text.toLowerCase().includes(q) ||
      c.postTitle.toLowerCase().includes(q) ||
      String(c.id).includes(q) ||
      String(c.postId).includes(q)
    )
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredComments.value.length / itemsPerPage)))

const paginatedComments = computed(() => {
  const safePage = Math.min(Math.max(1, currentPage.value), totalPages.value)
  const start = (safePage - 1) * itemsPerPage
  return filteredComments.value.slice(start, start + itemsPerPage)
})

const rangeInfo = computed(() => {
  const total = filteredComments.value.length
  if (total === 0) return { start: 0, end: 0, total: 0 }
  const safePage = Math.min(Math.max(1, currentPage.value), totalPages.value)
  const start = (safePage - 1) * itemsPerPage + 1
  const end = Math.min(safePage * itemsPerPage, total)
  return { start, end, total }
})

watch([searchQuery, sectionFilter, statusFilter], () => {
  currentPage.value = 1
})

async function fetchUserComments() {
  isLoading.value = true
  try {
    const res: any = await $fetch('/api/user/comments', {
      query: {
        username: props.username || undefined,
        userId: props.userId || undefined,
        _t: Date.now()
      }
    }).catch(() => null)

    const list = res?.data || res?.comments || []
    comments.value = Array.isArray(list) ? list : []
  } catch (err) {
    console.error('[DkpCommentsManager] Errore fetch commenti:', err)
  } finally {
    isLoading.value = false
  }
}

function openEditModal(comment: UnifiedCommentItem) {
  editingComment.value = comment
  editText.value = comment.text || comment.content || ''
}

async function saveEditedComment() {
  if (!editingComment.value) return
  const nextText = editText.value.trim()
  if (!nextText) {
    return emit('toast', '❌ Il testo del commento non può essere vuoto.')
  }

  isSavingEdit.value = true
  try {
    const res: any = await $fetch(`/api/comments/${editingComment.value.id}`, {
      method: 'PATCH',
      body: { text: nextText }
    })

    if (res?.success) {
      const idx = comments.value.findIndex((c) => c.id === editingComment.value?.id)
      if (idx !== -1) {
        comments.value[idx] = {
          ...comments.value[idx],
          text: nextText,
          content: nextText,
          isEdited: true,
          updatedAt: new Date().toISOString()
        }
      }
      editingComment.value = null
      emit('toast', '✅ Commento modificato e sincronizzato!')
    } else {
      emit('toast', '❌ Impossibile modificare il commento.')
    }
  } catch (err: any) {
    emit('toast', `❌ ${err?.data?.statusMessage || 'Errore aggiornamento commento.'}`)
  } finally {
    isSavingEdit.value = false
  }
}

async function deleteComment(comment: UnifiedCommentItem) {
  if (!confirm(`Eliminare definitivamente questo commento (#${comment.id})?`)) return
  try {
    const res: any = await $fetch(`/api/comments/${comment.id}`, {
      method: 'DELETE'
    })

    if (res?.success) {
      comments.value = comments.value.filter((c) => c.id !== comment.id)
      if (currentPage.value > totalPages.value) {
        currentPage.value = totalPages.value
      }
      emit('toast', '🗑️ Commento eliminato definitivamente.')
    } else {
      emit('toast', '❌ Impossibile eliminare il commento.')
    }
  } catch (err: any) {
    emit('toast', `❌ ${err?.data?.statusMessage || 'Errore durante l\'eliminazione.'}`)
  }
}

function resetFilters() {
  searchQuery.value = ''
  sectionFilter.value = 'ALL'
  statusFilter.value = 'ALL'
  currentPage.value = 1
}

watch(
  () => [props.username, props.userId],
  () => {
    fetchUserComments()
  }
)

onMounted(() => {
  fetchUserComments()
})
</script>

<template>
  <div class="bg-[#090d16] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 font-mono">
    <!-- HEADER & BARRA RICERCA -->
    <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
      <div>
        <div class="flex items-center gap-2.5">
          <h2 class="text-xl font-black text-white font-sans m-0">
            💬 I Miei Commenti Unificati
          </h2>
          <span class="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-black uppercase">
            HN · BLOG · NODES
          </span>
        </div>
        <p class="text-slate-400 text-xs sm:text-sm mt-1 font-sans m-0">
          Quadro completo delle tue discussioni: verifica stato di moderazione, contenuti eliminati, modifica o cancella i tuoi interventi.
        </p>
      </div>

      <div class="flex items-center gap-2.5 w-full lg:w-auto">
        <div class="relative flex-1 lg:w-72">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="🔍 Cerca testo, post o #ID..."
            class="w-full bg-[#020420] border border-slate-700 text-white p-2.5 pr-8 rounded-xl text-xs outline-none focus:border-emerald-400 transition-colors"
          />
          <button
            v-if="searchQuery"
            type="button"
            @click="searchQuery = ''"
            title="Pulisci ricerca"
            class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer bg-transparent border-none"
          >
            ✕
          </button>
        </div>

        <button
          type="button"
          @click="fetchUserComments"
          class="bg-slate-900 hover:bg-emerald-500/15 text-sky-400 hover:text-emerald-400 border border-slate-700 px-3.5 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-colors shrink-0"
        >
          🔄 Aggiorna
        </button>
      </div>
    </div>

    <!-- QUADRO DELLA SITUAZIONE (KPI RAPIDI CLICCABILI) -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
      <button
        type="button"
        @click="sectionFilter = 'ALL'; statusFilter = 'ALL'"
        :class="[
          'p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-0.5',
          sectionFilter === 'ALL' && statusFilter === 'ALL'
            ? 'bg-emerald-500/15 border-emerald-500/50 text-white'
            : 'bg-[#020420] border-slate-800 text-slate-400 hover:border-slate-700'
        ]"
      >
        <span class="text-[10px] uppercase font-bold text-slate-400">Totali</span>
        <span class="text-lg font-black text-emerald-400">{{ overviewStats.total }}</span>
      </button>

      <button
        type="button"
        @click="sectionFilter = 'HN'"
        :class="[
          'p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-0.5',
          sectionFilter === 'HN'
            ? 'bg-sky-500/15 border-sky-500/50 text-white'
            : 'bg-[#020420] border-slate-800 text-slate-400 hover:border-slate-700'
        ]"
      >
        <span class="text-[10px] uppercase font-bold text-slate-400">🚀 HN / News</span>
        <span class="text-lg font-black text-sky-400">{{ overviewStats.hn }}</span>
      </button>

      <button
        type="button"
        @click="sectionFilter = 'BLOG'"
        :class="[
          'p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-0.5',
          sectionFilter === 'BLOG'
            ? 'bg-purple-500/15 border-purple-500/50 text-white'
            : 'bg-[#020420] border-slate-800 text-slate-400 hover:border-slate-700'
        ]"
      >
        <span class="text-[10px] uppercase font-bold text-slate-400">📝 Blog</span>
        <span class="text-lg font-black text-purple-400">{{ overviewStats.blog }}</span>
      </button>

      <button
        type="button"
        @click="sectionFilter = 'NODE'"
        :class="[
          'p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-0.5',
          sectionFilter === 'NODE'
            ? 'bg-indigo-500/15 border-indigo-500/50 text-white'
            : 'bg-[#020420] border-slate-800 text-slate-400 hover:border-slate-700'
        ]"
      >
        <span class="text-[10px] uppercase font-bold text-slate-400">🌐 Forum / Nodi</span>
        <span class="text-lg font-black text-indigo-400">{{ overviewStats.node }}</span>
      </button>

      <button
        type="button"
        @click="statusFilter = statusFilter === 'MODERATED' ? 'ALL' : 'MODERATED'"
        :class="[
          'p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-0.5',
          statusFilter === 'MODERATED'
            ? 'bg-rose-500/20 border-rose-500/60 text-white'
            : 'bg-[#020420] border-slate-800 text-slate-400 hover:border-slate-700'
        ]"
      >
        <span class="text-[10px] uppercase font-bold text-slate-400">🚫 Moderati</span>
        <span class="text-lg font-black" :class="overviewStats.moderated > 0 ? 'text-rose-400' : 'text-slate-500'">
          {{ overviewStats.moderated }}
        </span>
      </button>

      <button
        type="button"
        @click="statusFilter = statusFilter === 'ORPHANED' ? 'ALL' : 'ORPHANED'"
        :class="[
          'p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-0.5',
          statusFilter === 'ORPHANED'
            ? 'bg-amber-500/20 border-amber-500/60 text-white'
            : 'bg-[#020420] border-slate-800 text-slate-400 hover:border-slate-700'
        ]"
      >
        <span class="text-[10px] uppercase font-bold text-slate-400">⚠️ Post Rimossi</span>
        <span class="text-lg font-black" :class="overviewStats.orphaned > 0 ? 'text-amber-400' : 'text-slate-500'">
          {{ overviewStats.orphaned }}
        </span>
      </button>
    </div>

    <!-- BARRA FILTRI STATO DETTAGLIATA -->
    <div class="flex flex-wrap items-center justify-between gap-2 bg-[#020420] p-3 border border-slate-800 rounded-2xl text-[11px]">
      <div class="flex flex-wrap items-center gap-1.5">
        <span class="text-slate-500 font-bold uppercase mr-1">Stato:</span>
        <button
          v-for="st in [
            { id: 'ALL', label: 'Tutti' },
            { id: 'PUBLISHED', label: '✅ Pubblicati' },
            { id: 'MODERATED', label: `🚫 Moderati (${overviewStats.moderated})` },
            { id: 'ORPHANED', label: `⚠️ Post Eliminato (${overviewStats.orphaned})` },
            { id: 'EDITED', label: `✏️ Modificati (${overviewStats.edited})` }
          ] as const"
          :key="st.id"
          type="button"
          @click="statusFilter = st.id"
          :class="[
            'px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer border',
            statusFilter === st.id
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-[#090d16] text-slate-400 border-slate-800 hover:text-white'
          ]"
        >
          {{ st.label }}
        </button>
      </div>

      <button
        v-if="searchQuery || sectionFilter !== 'ALL' || statusFilter !== 'ALL'"
        type="button"
        @click="resetFilters"
        class="text-sky-400 hover:text-emerald-400 font-bold cursor-pointer bg-transparent border-none text-[11px]"
      >
        ↺ Reset Filtri
      </button>
    </div>

    <!-- STATO LOADING -->
    <div v-if="isLoading" class="text-center py-10 text-emerald-400 text-xs animate-pulse">
      ⚡ Sincronizzazione commenti unificati da Neon DB...
    </div>

    <!-- EMPTY STATE -->
    <div
      v-else-if="paginatedComments.length === 0"
      class="text-center py-10 text-slate-400 text-xs bg-[#020420] border border-dashed border-slate-800 rounded-2xl flex flex-col items-center gap-3"
    >
      <span class="text-2xl">💬</span>
      <span>
        {{
          comments.length === 0
            ? 'Non hai ancora pubblicato alcun commento su HN, Blog o Forum.'
            : 'Nessun commento corrisponde ai filtri selezionati.'
        }}
      </span>
      <button
        v-if="comments.length > 0"
        type="button"
        @click="resetFilters"
        class="bg-emerald-500/15 text-emerald-400 border border-emerald-500/35 px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
      >
        Mostra tutti i commenti ({{ comments.length }})
      </button>
    </div>

    <!-- TABELLA UNIFICATA COMMENTI -->
    <div v-else class="flex flex-col gap-4">
      <div class="overflow-x-auto bg-[#020420] border border-slate-800 rounded-2xl">
        <table class="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr class="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
              <th class="p-3.5">Sezione</th>
              <th class="p-3.5">Il Tuo Commento</th>
              <th class="p-3.5">Contenuto Padre</th>
              <th class="p-3.5">Stato</th>
              <th class="p-3.5">Data</th>
              <th class="p-3.5 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 text-slate-300">
            <tr
              v-for="c in paginatedComments"
              :key="c.id"
              :class="[
                'transition-colors',
                c.isModerated
                  ? 'bg-rose-950/15 hover:bg-rose-950/25'
                  : c.isParentDeleted
                    ? 'bg-amber-950/10 hover:bg-amber-950/20'
                    : 'hover:bg-slate-900/40'
              ]"
            >
              <!-- SEZIONE -->
              <td class="p-3.5 whitespace-nowrap align-top">
                <div class="flex flex-col gap-1 items-start">
                  <span
                    :class="[
                      'px-2 py-0.5 rounded text-[10px] font-black uppercase border',
                      c.section === 'HN'
                        ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                        : c.section === 'BLOG'
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                          : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                    ]"
                  >
                    {{ c.section === 'HN' ? '🚀 HN' : c.section === 'BLOG' ? '📝 BLOG' : '🌐 NODE' }}
                  </span>
                  <span v-if="c.parentId" class="text-[10px] text-slate-500">
                    ↳ Risposta #{{ c.parentId }}
                  </span>
                </div>
              </td>

              <!-- TESTO COMMENTO -->
              <td class="p-3.5 font-sans max-w-xs sm:max-w-md align-top">
                <p class="text-slate-100 text-xs sm:text-sm leading-relaxed m-0 line-clamp-3 break-words">
                  {{ c.text }}
                </p>
                <span v-if="c.isModerated" class="inline-block mt-1 text-[10px] font-mono text-rose-400">
                  ⚠️ Intervento moderazione DKP: commento nascosto dal feed pubblico.
                </span>
              </td>

              <!-- CONTENUTO PADRE -->
              <td class="p-3.5 max-w-xs align-top">
                <div v-if="c.isParentDeleted" class="flex flex-col gap-0.5">
                  <span class="text-amber-400 text-xs font-bold font-sans">
                    ⚠️ {{ c.postTitle }}
                  </span>
                  <span class="text-[10px] text-slate-500">ID Padre #{{ c.postId }} non più presente</span>
                </div>
                <NuxtLink
                  v-else
                  :to="c.targetUrl"
                  class="text-sky-400 hover:text-emerald-400 text-xs font-bold font-sans no-underline hover:underline line-clamp-2"
                >
                  {{ c.postTitle }}
                </NuxtLink>
              </td>

              <!-- STATO -->
              <td class="p-3.5 whitespace-nowrap align-top">
                <div class="flex flex-col gap-1 items-start">
                  <span
                    v-if="c.isModerated"
                    class="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-500/15 text-rose-400 border border-rose-500/40"
                  >
                    🚫 Moderato
                  </span>
                  <span
                    v-else-if="c.isParentDeleted"
                    class="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/15 text-amber-400 border border-amber-500/40"
                  >
                    ⚠️ Post Rimosso
                  </span>
                  <span
                    v-else
                    class="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  >
                    ✅ Pubblicato
                  </span>

                  <span
                    v-if="c.isEdited"
                    class="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/30"
                  >
                    ✏️ Modificato
                  </span>
                </div>
              </td>

              <!-- DATA -->
              <td class="p-3.5 text-slate-400 text-xs whitespace-nowrap align-top">
                {{ c.date }}
              </td>

              <!-- AZIONI -->
              <td class="p-3.5 text-right whitespace-nowrap align-top">
                <div class="inline-flex gap-1.5">
                  <NuxtLink
                    v-if="!c.isParentDeleted"
                    :to="c.targetUrl"
                    title="Vai alla discussione"
                    class="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 py-1 px-2 rounded text-[10px] font-bold no-underline"
                  >
                    ↗
                  </NuxtLink>
                  <button
                    type="button"
                    @click="openEditModal(c)"
                    class="bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 py-1 px-2.5 rounded text-[10px] font-bold cursor-pointer"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    type="button"
                    @click="deleteComment(c)"
                    class="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 py-1 px-2.5 rounded text-[10px] font-bold cursor-pointer"
                  >
                    🗑️ Del
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- PAGINAZIONE -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 text-xs text-slate-400">
        <div>
          Mostrando <span class="text-white font-bold">{{ rangeInfo.start }}–{{ rangeInfo.end }}</span>
          di <span class="text-emerald-400 font-bold">{{ rangeInfo.total }}</span> commenti
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            :disabled="currentPage <= 1"
            @click="currentPage--"
            class="px-3 py-1.5 rounded-xl bg-[#020420] border border-slate-700 text-slate-200 hover:border-emerald-400 disabled:opacity-40 disabled:pointer-events-none font-bold cursor-pointer transition-colors"
          >
            ← Precedente
          </button>

          <span class="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-black">
            Pagina {{ currentPage }} / {{ totalPages }}
          </span>

          <button
            type="button"
            :disabled="currentPage >= totalPages"
            @click="currentPage++"
            class="px-3 py-1.5 rounded-xl bg-[#020420] border border-slate-700 text-slate-200 hover:border-emerald-400 disabled:opacity-40 disabled:pointer-events-none font-bold cursor-pointer transition-colors"
          >
            Successiva →
          </button>
        </div>
      </div>
    </div>

    <!-- MODALE MODIFICA COMMENTO -->
    <Teleport to="body">
      <div
        v-if="editingComment"
        class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-mono"
        @click.self="editingComment = null"
      >
        <div class="bg-[#090d16] border border-slate-800 rounded-3xl p-6 w-full max-w-xl shadow-2xl flex flex-col gap-4">
          <div class="flex justify-between items-center border-b border-slate-800 pb-3">
            <div class="flex items-center gap-2">
              <h3 class="text-white font-black text-base font-sans m-0">✏️ Modifica Commento #{{ editingComment.id }}</h3>
              <span class="text-[10px] px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30 font-bold">
                {{ editingComment.section }}
              </span>
            </div>
            <button
              type="button"
              @click="editingComment = null"
              class="text-slate-400 hover:text-white text-sm cursor-pointer bg-transparent border-none"
            >
              ✕
            </button>
          </div>

          <p class="text-xs text-slate-400 m-0 font-sans">
            Su: <strong class="text-slate-200">{{ editingComment.postTitle }}</strong>
          </p>

          <textarea
            v-model="editText"
            rows="5"
            maxlength="5000"
            class="w-full bg-[#020420] border border-slate-700 focus:border-emerald-400 text-white p-3.5 rounded-xl text-xs sm:text-sm font-sans outline-none resize-y leading-relaxed"
            placeholder="Modifica il testo del tuo commento..."
          ></textarea>

          <div class="flex justify-between items-center pt-2 border-t border-slate-800">
            <span class="text-[11px] text-slate-500">{{ editText.length }} / 5000 caratteri</span>
            <div class="flex gap-2">
              <button
                type="button"
                @click="editingComment = null"
                class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs cursor-pointer border-none"
              >
                Annulla
              </button>
              <button
                type="button"
                @click="saveEditedComment"
                :disabled="isSavingEdit"
                class="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer border-none disabled:opacity-50"
              >
                {{ isSavingEdit ? 'Salvataggio...' : '💾 Salva Modifica' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>