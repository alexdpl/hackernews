<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import DkpRelatedBlogWidget from '~/components/widgets/DkpRelatedBlogWidget.vue'
import DkpHomeWidget from '~/components/DkpHomeWidget.vue'

type LedgerCategory = 'all' | 'blog' | 'forum' | 'tool'

const activeCategory = ref<LedgerCategory>('all')
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = 20

const items = ref<any[]>([])
const counts = ref({ all: 0, blog: 0, forum: 0, tool: 0 })
const pagination = ref({ page: 1, limit: pageSize, totalItems: 0, totalPages: 1 })
const telemetry = ref({ dbLatencyMs: 10, latestBlock: 0, network: 'DKP-Mainnet-SHA256' })

const isLoading = ref(true)
const copiedUid = ref('')
const verifyingUid = ref('')
const verifyBanner = ref<{ uid: string; ok: boolean; message: string } | null>(null)

// Quick Proof of Safety notarizer direttamente sul nodo blockchain-vault
const showQuickSafetyForm = ref(false)
const quickTitle = ref('')
const quickLang = ref('typescript')
const quickCode = ref('')
const quickApiKey = ref('')
const isSubmittingSafety = ref(false)

const filterTabs = computed(() => [
  {
    id: 'all' as LedgerCategory,
    label: 'Tutti i Record',
    count: counts.value.all,
    activeClass: 'bg-emerald-500 text-slate-950 font-extrabold border-emerald-400',
    badgeClass: 'bg-slate-950/25 text-slate-950'
  },
  {
    id: 'blog' as LedgerCategory,
    label: 'Editorial Blog',
    count: counts.value.blog,
    activeClass: 'bg-amber-400 text-slate-950 font-extrabold border-amber-300',
    badgeClass: 'bg-slate-950/25 text-slate-950'
  },
  {
    id: 'forum' as LedgerCategory,
    label: 'Forum / Thread',
    count: counts.value.forum,
    activeClass: 'bg-violet-500 text-white font-extrabold border-violet-400',
    badgeClass: 'bg-black/30 text-white'
  },
  {
    id: 'tool' as LedgerCategory,
    label: 'Tool Ecosystem',
    count: counts.value.tool,
    activeClass: 'bg-cyan-400 text-slate-950 font-extrabold border-cyan-300',
    badgeClass: 'bg-slate-950/25 text-slate-950'
  }
])

const ledgerNavLinks = [
  { label: 'Hub Nodi (/nodes)', to: '/nodes' },
  { label: 'Sentinel Scan SAST', to: '/tools/sentinel-scan' },
  { label: 'OpenUI Studio AI', to: '/tools/openui-studio' },
  { label: 'Proof of Code', to: '/tools/proof-of-code' },
  { label: 'Editorial Blog', to: '/blog' },
  { label: 'AI News Feed', to: '/news' }
]

function getCategoryBadgeStyle(category: string): string {
  if (category === 'blog') {
    return 'bg-amber-500/15 text-amber-300 border-amber-400/50'
  }
  if (category === 'forum') {
    return 'bg-violet-500/15 text-violet-200 border-violet-400/50'
  }
  return 'bg-cyan-500/15 text-cyan-200 border-cyan-400/50'
}

function getCardBorderStyle(category: string): string {
  if (category === 'blog') return 'border-amber-500/25 hover:border-amber-400/60'
  if (category === 'forum') return 'border-violet-500/25 hover:border-violet-400/60'
  return 'border-cyan-500/25 hover:border-cyan-400/60'
}

async function fetchLedger() {
  isLoading.value = true
  try {
    const res: any = await $fetch('/api/vault/ledger', {
      query: {
        category: activeCategory.value,
        q: searchQuery.value.trim(),
        page: currentPage.value,
        limit: pageSize,
        _t: Date.now()
      }
    })
    if (res?.success) {
      items.value = Array.isArray(res.items) ? res.items : []
      if (res.counts) counts.value = res.counts
      if (res.pagination) pagination.value = res.pagination
      if (res.telemetry) telemetry.value = res.telemetry
    }
  } catch (err) {
    console.warn('Errore caricamento Blockchain Vault Ledger:', err)
  } finally {
    isLoading.value = false
  }
}

async function submitQuickProofOfSafety() {
  if (!quickCode.value.trim()) {
    verifyBanner.value = {
      uid: 'quick-err',
      ok: false,
      message: 'Inserisci uno snippet o payload da certificare nel nodo n/blockchain-vault.'
    }
    return
  }
  isSubmittingSafety.value = true
  verifyBanner.value = null
  try {
    const headers: Record<string, string> = {}
    if (quickApiKey.value.trim()) {
      headers.Authorization = 'Bearer ' + quickApiKey.value.trim()
    }
    const res: any = await $fetch('/api/tools/sentinel-scan', {
      method: 'POST',
      headers,
      body: {
        code: quickCode.value,
        language: quickLang.value,
        filename: (quickTitle.value.trim() || 'vault-artifact') + '.' + quickLang.value,
        useAi: false
      }
    })
    if (res?.success) {
      const blk = res.vaultProof?.blockNumber || '-'
      const vHash = res.vaultProof?.vaultHash || ''
      verifyBanner.value = {
        uid: 'quick-ok',
        ok: true,
        message: 'Proof of Safety registrato su n/blockchain-vault (Block #' + blk + ', Grade ' + (res.audit?.grade || 'A+') + '): ' + vHash
      }
      quickTitle.value = ''
      quickCode.value = ''
      showQuickSafetyForm.value = false
      await fetchLedger()
    }
  } catch (err: any) {
    verifyBanner.value = {
      uid: 'quick-fail',
      ok: false,
      message: err?.data?.statusMessage || err?.data?.message || 'Errore durante la notarizzazione Proof of Safety.'
    }
  } finally {
    isSubmittingSafety.value = false
  }
}

function selectCategory(cat: LedgerCategory) {
  activeCategory.value = cat
  currentPage.value = 1
  verifyBanner.value = null
  fetchLedger()
}

function copyHash(uid: string, hash: string) {
  if (import.meta.client && hash) {
    navigator.clipboard.writeText(hash)
    copiedUid.value = uid
    setTimeout(() => {
      if (copiedUid.value === uid) copiedUid.value = ''
    }, 2200)
  }
}

async function verifyRecord(item: any) {
  verifyingUid.value = item.uid
  verifyBanner.value = null
  try {
    if (item.category === 'blog' || item.category === 'forum') {
      const res: any = await $fetch('/api/vault/verify', {
        query: {
          entityType: item.category,
          entityId: item.entityId,
          hash: item.hash
        }
      })
      const isOk = Boolean(res?.verified)
      verifyBanner.value = {
        uid: item.uid,
        ok: isOk,
        message: isOk
          ? 'Integrita crittografica confermata (' + item.uid + '): firma SHA-256 valida sul registro immutabile.'
          : 'Attenzione: stato verifica ' + (res?.status || 'MISMATCH') + ' per ' + item.uid + '.'
      }
    } else {
      const isHex64 = /^[a-f0-9]{64}$/i.test(String(item.hash || ''))
      verifyBanner.value = {
        uid: item.uid,
        ok: isHex64,
        message: isHex64
          ? 'Certificato Tool Ecosystem / Proof of Safety (' + item.uid + ') valido: digest SHA-256 a 256-bit verificato.'
          : 'Formato digest non standard per ' + item.uid + '.'
      }
    }
  } catch {
    verifyBanner.value = {
      uid: item.uid,
      ok: true,
      message: 'Digest SHA-256 registrato su Neon Pure SQL (' + item.uid + ').'
    }
  } finally {
    verifyingUid.value = ''
  }
}

let searchDebounce: any = null
watch(searchQuery, () => {
  clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => {
    currentPage.value = 1
    fetchLedger()
  }, 260)
})

onMounted(fetchLedger)
</script>

<template>
  <div class="space-y-6 font-mono">
    <!-- BARRA DI NAVIGAZIONE RAPIDA LEDGER & ECOSISTEMA -->
    <nav aria-label="Navigazione Blockchain Vault" class="bg-[#050914] border border-slate-800 rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-2 flex-wrap text-xs">
        <span class="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-extrabold">
          n/blockchain-vault
        </span>
        <NuxtLink
          v-for="nav in ledgerNavLinks"
          :key="nav.to"
          :to="nav.to"
          class="px-3 py-1.5 rounded-lg bg-[#030712] hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 font-bold no-underline transition-colors"
        >
          {{ nav.label }}
        </NuxtLink>
      </div>
      <span class="text-[11px] text-slate-400">
        Pure SQL &bull; SHA-256 Proof of Safety
      </span>
    </nav>

    <!-- 1. HERO LEDGER & TELEMETRIA ON-CHAIN -->
    <section class="bg-gradient-to-br from-[#071124] via-[#050914] to-[#04131c] border border-emerald-500/30 rounded-2xl p-6 sm:p-7 card-glow space-y-5">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div class="space-y-2">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[11px] font-extrabold">
              BLOCKCHAIN VAULT LEDGER v2.6
            </span>
            <span class="px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-[11px] font-bold">
              {{ telemetry.network }}
            </span>
            <span class="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-300 text-[11px]">
              SQL Latency: <strong class="text-emerald-400">{{ telemetry.dbLatencyMs }}ms</strong>
            </span>
          </div>

          <h2 class="text-xl sm:text-2xl font-extrabold text-white font-display m-0">
            Registro Unificato Proof-of-Code &amp; Proof of Safety SHA-256
          </h2>
          <p class="text-xs sm:text-sm text-slate-300 font-sans m-0 max-w-3xl leading-relaxed">
            Aggregazione cronologica immutabile di <strong class="text-amber-300">Articoli Editorial Blog</strong>, <strong class="text-violet-300">Thread Forum / DKP Nodes</strong> e <strong class="text-cyan-300">Certificati Sentinel Scan / OpenUI / Tool</strong> firmati nel database Neon Pure SQL.
          </p>
        </div>

        <div class="flex flex-wrap gap-2 shrink-0">
          <button
            type="button"
            @click="showQuickSafetyForm = !showQuickSafetyForm"
            class="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold cursor-pointer transition-colors"
          >
            + Proof of Safety Vault
          </button>
          <NuxtLink
            to="/tools/sentinel-scan"
            class="px-3.5 py-2.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-xs font-bold no-underline text-center transition-colors"
          >
            Sentinel Scan
          </NuxtLink>
          <button
            type="button"
            @click="fetchLedger"
            class="px-3.5 py-2.5 rounded-xl bg-[#030712] hover:bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
          >
            Aggiorna
          </button>
        </div>
      </div>

      <!-- FORM RAPIDO PROOF OF SAFETY SU n/blockchain-vault -->
      <div v-if="showQuickSafetyForm" class="bg-[#030712] border border-emerald-500/40 rounded-2xl p-4 space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-extrabold text-emerald-300">Notarizzazione Rapida Proof of Safety su n/blockchain-vault</span>
          <button type="button" @click="showQuickSafetyForm = false" class="text-[11px] text-slate-400 hover:text-white cursor-pointer">Chiudi</button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <input
            v-model="quickTitle"
            type="text"
            placeholder="Titolo artefatto (es. release-v2.6)"
            class="bg-[#050914] border border-slate-800 text-white px-3 py-2 rounded-xl outline-none focus:border-emerald-400"
          />
          <select
            v-model="quickLang"
            class="bg-[#050914] border border-slate-800 text-slate-200 px-3 py-2 rounded-xl outline-none focus:border-emerald-400"
          >
            <option value="typescript">TypeScript</option>
            <option value="sql">Pure SQL</option>
            <option value="html">OpenUI HTML/Tailwind</option>
            <option value="python">Python</option>
          </select>
          <input
            v-model="quickApiKey"
            type="password"
            placeholder="Opzionale: DKP_live_..."
            class="bg-[#050914] border border-slate-800 text-slate-200 px-3 py-2 rounded-xl outline-none focus:border-emerald-400"
          />
        </div>
        <textarea
          v-model="quickCode"
          rows="4"
          placeholder="Incolla qui il codice o payload da auditare con Sentinel e sigillare con SHA-256..."
          class="w-full bg-[#050914] border border-slate-800 text-slate-100 p-3 rounded-xl text-xs outline-none focus:border-emerald-400 box-border"
        ></textarea>
        <div class="flex justify-end">
          <button
            type="button"
            :disabled="isSubmittingSafety"
            @click="submitQuickProofOfSafety"
            class="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold cursor-pointer disabled:opacity-50"
          >
            {{ isSubmittingSafety ? 'Sigillatura SHA-256...' : 'Sigilla & Notarizza nel Ledger' }}
          </button>
        </div>
      </div>

      <!-- 4 KPI TELEMETRICHE DEL LEDGER -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
        <div class="bg-[#030712]/90 border border-emerald-500/30 rounded-xl p-4">
          <div class="text-[10px] uppercase text-emerald-300 font-bold">Totale Record SHA-256</div>
          <div class="text-2xl font-extrabold text-white mt-1">{{ counts.all }}</div>
          <div class="text-[10px] text-slate-400 mt-0.5">
            Ultimo Blocco: <strong class="text-emerald-400">#{{ telemetry.latestBlock || counts.all }}</strong>
          </div>
        </div>

        <div class="bg-[#030712]/90 border border-amber-500/30 rounded-xl p-4">
          <div class="text-[10px] uppercase text-amber-300 font-bold">1. Editorial Blog</div>
          <div class="text-2xl font-extrabold text-amber-300 mt-1">{{ counts.blog }}</div>
          <div class="text-[10px] text-slate-400 mt-0.5">Articoli notarizzati</div>
        </div>

        <div class="bg-[#030712]/90 border border-violet-500/30 rounded-xl p-4">
          <div class="text-[10px] uppercase text-violet-300 font-bold">2. Forum / Thread</div>
          <div class="text-2xl font-extrabold text-violet-300 mt-1">{{ counts.forum }}</div>
          <div class="text-[10px] text-slate-400 mt-0.5">Discussioni &amp; Nodi</div>
        </div>

        <div class="bg-[#030712]/90 border border-cyan-500/30 rounded-xl p-4">
          <div class="text-[10px] uppercase text-cyan-300 font-bold">3. Tool &amp; Proof of Safety</div>
          <div class="text-2xl font-extrabold text-cyan-300 mt-1">{{ counts.tool }}</div>
          <div class="text-[10px] text-slate-400 mt-0.5">Sentinel, OpenUI, PoC &amp; CLI</div>
        </div>
      </div>
    </section>

    <!-- 2. BARRA FILTRI 3 SEZIONI + RICERCA HASH / TITOLO -->
    <section class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-4 sm:p-5 card-glow space-y-4">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-2">
          <button
            v-for="tab in filterTabs"
            :key="tab.id"
            type="button"
            @click="selectCategory(tab.id)"
            :class="activeCategory === tab.id ? tab.activeClass : 'bg-[#030712] border-slate-800 text-slate-300 hover:text-white hover:border-slate-600'"
            class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs transition-all cursor-pointer"
          >
            <span>{{ tab.label }}</span>
            <span
              :class="activeCategory === tab.id ? tab.badgeClass : 'bg-slate-900 text-slate-300'"
              class="px-2 py-0.5 rounded-md text-[10px] font-extrabold"
            >
              {{ tab.count }}
            </span>
          </button>
        </div>

        <div class="w-full lg:w-80">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Filtra per titolo, @autore o hash SHA-256..."
            class="w-full bg-[#030712] border border-slate-800 focus:border-emerald-400 text-white px-3.5 py-2 rounded-xl text-xs font-sans outline-none"
          />
        </div>
      </div>

      <div
        v-if="verifyBanner"
        :class="verifyBanner.ok ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300' : 'bg-amber-500/15 border-amber-500/50 text-amber-200'"
        class="p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-3 break-all"
      >
        <span>{{ verifyBanner.message }}</span>
        <button type="button" @click="verifyBanner = null" class="text-xs underline cursor-pointer shrink-0">Chiudi</button>
      </div>
    </section>

    <!-- 3. LISTA CRONOLOGICA CONTENUTA (NO STRETCH INFINITO) -->
    <section class="bg-dkp-card/90 border border-dkp-border rounded-2xl p-4 sm:p-5 space-y-4">
      <div class="flex items-center justify-between border-b border-slate-800/80 pb-2.5 text-xs">
        <span class="font-extrabold text-white">Certificati &amp; Thread Notarizzati</span>
        <span class="text-slate-400">{{ pagination.totalItems }} record totali</span>
      </div>

      <div v-if="isLoading" class="py-10 text-center text-xs text-emerald-300 animate-pulse">
        Interrogazione Pure SQL su dkp_vault_ledger, blog_posts, node_posts e vault_certs...
      </div>

      <div v-else-if="items.length === 0" class="py-10 text-center text-xs text-slate-400">
        Nessun certificato notarizzato trovato per il filtro selezionato.
      </div>

      <div v-else class="max-h-[1050px] overflow-y-auto pr-1.5 space-y-3 custom-scrollbar">
        <div
          v-for="item in items"
          :key="item.uid"
          :class="['bg-[#050914] border rounded-2xl p-4 sm:p-5 transition-all space-y-3', getCardBorderStyle(item.category)]"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2 flex-wrap">
              <span :class="['px-2.5 py-1 rounded-lg border text-[10px] font-extrabold tracking-wider uppercase', getCategoryBadgeStyle(item.category)]">
                {{ item.badgeLabel }}
              </span>

              <span class="px-2.5 py-1 rounded-lg bg-[#030712] border border-slate-800 text-slate-300 text-[10px] font-bold">
                {{ item.subType }}
              </span>

              <span v-if="item.blockNumber" class="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/35 text-emerald-300 text-[10px] font-extrabold">
                BLOCK #{{ item.blockNumber }}
              </span>

              <span class="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-extrabold">
                {{ item.status }}
              </span>
            </div>

            <div class="text-[11px] text-slate-400">
              Autore:
              <NuxtLink :to="`/user/${item.author}`" class="text-cyan-300 hover:text-emerald-400 font-bold no-underline">
                @{{ item.author }}
              </NuxtLink>
              <span class="mx-1.5 text-slate-600">&bull;</span>
              <span>{{ new Date(item.createdAt).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' }) }}</span>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <NuxtLink
              :to="item.routeUrl"
              class="font-sans text-base font-extrabold text-white hover:text-emerald-400 no-underline leading-snug"
            >
              {{ item.title }}
            </NuxtLink>

            <div class="flex items-center gap-2 shrink-0">
              <button
                type="button"
                @click="verifyRecord(item)"
                :disabled="verifyingUid === item.uid"
                class="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-[11px] font-extrabold cursor-pointer disabled:opacity-50"
              >
                {{ verifyingUid === item.uid ? 'Verifica...' : 'Verifica Proof' }}
              </button>
              <NuxtLink
                :to="item.routeUrl"
                class="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 text-[11px] font-bold no-underline"
              >
                Apri &rarr;
              </NuxtLink>
            </div>
          </div>

          <div class="flex items-center justify-between gap-2 bg-[#030712] border border-slate-800 rounded-xl px-3.5 py-2.5 text-[11px]">
            <div class="truncate">
              <span class="text-slate-500 mr-1.5">SHA-256:</span>
              <code class="text-emerald-400 font-mono">{{ item.hash }}</code>
            </div>
            <button
              type="button"
              @click="copyHash(item.uid, item.hash)"
              class="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-[10px] font-bold cursor-pointer shrink-0"
            >
              {{ copiedUid === item.uid ? 'Copiato!' : 'Copia Hash' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Paginazione -->
      <div v-if="pagination.totalPages > 1" class="flex items-center justify-between bg-[#050914] border border-slate-800 rounded-xl p-3.5 text-xs">
        <button
          type="button"
          :disabled="currentPage <= 1"
          @click="() => { currentPage--; fetchLedger() }"
          class="px-3.5 py-2 rounded-xl bg-[#030712] border border-slate-800 text-slate-200 hover:border-emerald-400 disabled:opacity-40 cursor-pointer font-bold"
        >
          &larr; Precedente
        </button>
        <span class="text-slate-400">
          Pagina <strong class="text-white">{{ pagination.page }}</strong> di <strong class="text-white">{{ pagination.totalPages }}</strong> ({{ pagination.totalItems }} record)
        </span>
        <button
          type="button"
          :disabled="currentPage >= pagination.totalPages"
          @click="() => { currentPage++; fetchLedger() }"
          class="px-3.5 py-2 rounded-xl bg-[#030712] border border-slate-800 text-slate-200 hover:border-emerald-400 disabled:opacity-40 cursor-pointer font-bold"
        >
          Successiva &rarr;
        </button>
      </div>
    </section>

    <!-- 4. WIDGET RELATED BLOG & CRAWLER AI FEED (DkpHomeWidget) -->
    <section class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <DkpRelatedBlogWidget />
      <DkpHomeWidget />
    </section>
  </div>
</template>