<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import DkpAdminShell from '~/components/admin/DkpAdminShell.vue'

definePageMeta({
  middleware: 'admin-only'
})

interface BountyItem {
  id: number
  title: string
  category: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'CRITICAL'
  rewardEur: number
  rewardXp: number
  status: 'OPEN' | 'CLAIMED' | 'IN_REVIEW' | 'COMPLETED' | 'CANCELLED'
  claimedBy: string
  repoUrl: string
  description: string
  createdAt?: string
}

const bounties = ref<BountyItem[]>([])
const isLoading = ref(true)
const searchQuery = ref('')
const statusFilter = ref('ALL')
const showCreateModal = ref(false)
const isSaving = ref(false)
const feedbackMsg = ref('')

const newBounty = ref({
  title: '',
  category: 'Security & SAST',
  difficulty: 'MEDIUM' as 'EASY' | 'MEDIUM' | 'HARD' | 'CRITICAL',
  rewardEur: 250,
  rewardXp: 800,
  repoUrl: 'https://github.com/devkernelpulse',
  description: ''
})

function notify(msg: string) {
  feedbackMsg.value = msg
  setTimeout(() => {
    feedbackMsg.value = ''
  }, 4000)
}

async function fetchBounties() {
  isLoading.value = true
  try {
    const res: any = await $fetch(`/api/admin/bounties?_t=${Date.now()}`)
    if (res?.success) {
      bounties.value = res.data || []
    }
  } finally {
    isLoading.value = false
  }
}

const metrics = computed(() => {
  const openCount = bounties.value.filter(b => b.status === 'OPEN').length
  const reviewCount = bounties.value.filter(b => ['CLAIMED', 'IN_REVIEW'].includes(b.status)).length
  const completedCount = bounties.value.filter(b => b.status === 'COMPLETED').length
  const activePoolEur = bounties.value
    .filter(b => !['COMPLETED', 'CANCELLED'].includes(b.status))
    .reduce((acc, b) => acc + Number(b.rewardEur || 0), 0)
  return { openCount, reviewCount, completedCount, activePoolEur }
})

const filteredBounties = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  return bounties.value.filter((b) => {
    const matchStatus = statusFilter.value === 'ALL' || b.status === statusFilter.value
    const matchQuery = !q ||
      b.title.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q) ||
      (b.claimedBy || '').toLowerCase().includes(q)
    return matchStatus && matchQuery
  })
})

async function createBounty() {
  if (!newBounty.value.title.trim()) return
  isSaving.value = true
  try {
    const res: any = await $fetch('/api/admin/bounties', {
      method: 'POST',
      body: { action: 'create', ...newBounty.value }
    })
    if (res?.success) {
      showCreateModal.value = false
      newBounty.value = {
        title: '',
        category: 'Security & SAST',
        difficulty: 'MEDIUM',
        rewardEur: 250,
        rewardXp: 800,
        repoUrl: 'https://github.com/devkernelpulse',
        description: ''
      }
      notify(res.message || 'Bounty creato!')
      await fetchBounties()
    }
  } finally {
    isSaving.value = false
  }
}

async function changeStatus(item: BountyItem, nextStatus: BountyItem['status']) {
  const prev = item.status
  item.status = nextStatus
  const res: any = await $fetch('/api/admin/bounties', {
    method: 'POST',
    body: { action: 'update_status', id: item.id, status: nextStatus }
  }).catch(() => null)

  if (res?.success) {
    notify(res.message)
  } else {
    item.status = prev
  }
}

async function assignBuilder(item: BountyItem) {
  const handle = prompt('Inserisci username builder assegnatario (es. @alex_dev):', item.claimedBy || '')
  if (handle === null) return
  const clean = handle.trim().replace(/^@/, '')
  const nextStatus: BountyItem['status'] = clean ? 'CLAIMED' : 'OPEN'

  const res: any = await $fetch('/api/admin/bounties', {
    method: 'POST',
    body: { action: 'update_status', id: item.id, status: nextStatus, claimedBy: clean }
  }).catch(() => null)

  if (res?.success) {
    item.claimedBy = clean
    item.status = nextStatus
    notify(clean ? `Bounty #${item.id} assegnato a @${clean}.` : `Assegnazione rimossa da Bounty #${item.id}.`)
  }
}

async function deleteBounty(item: BountyItem) {
  if (!confirm(`Eliminare definitivamente il Bounty "${item.title}"?`)) return
  const backup = [...bounties.value]
  bounties.value = bounties.value.filter(b => b.id !== item.id)

  const res: any = await $fetch('/api/admin/bounties', {
    method: 'POST',
    body: { action: 'delete', id: item.id }
  }).catch(() => null)

  if (res?.success) {
    notify(res.message)
  } else {
    bounties.value = backup
  }
}

onMounted(fetchBounties)
</script>

<template>
  <DkpAdminShell
    title="DKP Security & Code Bounties"
    subtitle="Gestisci sfide tecniche, bug bounty SAST, ricompense in EUR/XP e validazioni Pull Request su Neon Pure SQL."
    badge="BOUNTY ESCROW & VAULT REWARDS"
    seo-title="Bounties Management — DKP Admin v2.6"
  >
    <template #actions>
      <button
        type="button"
        @click="fetchBounties"
        :disabled="isLoading"
        class="px-3.5 py-2.5 rounded-xl bg-dkp-bg border border-dkp-border text-cyan-400 hover:border-cyan-400 font-bold cursor-pointer"
      >
         Aggiorna
      </button>
      <button
        type="button"
        @click="showCreateModal = true"
        class="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold border-none cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.25)]"
      >
        + Nuovo Bounty
      </button>
    </template>

    <div v-if="feedbackMsg" class="bg-emerald-500/15 border border-emerald-400 text-emerald-300 font-mono text-xs font-bold px-4 py-3 rounded-xl">
       {{ feedbackMsg }}
    </div>

    <!-- KPI Cards -->
    <section class="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
      <div class="bg-dkp-card/95 border border-emerald-500/35 rounded-2xl p-4 card-glow">
        <div class="text-[10px] text-emerald-400 font-bold uppercase mb-1">BOUNTY APERTI (OPEN)</div>
        <div class="text-2xl font-extrabold text-emerald-400">{{ metrics.openCount }}</div>
      </div>
      <div class="bg-dkp-card/95 border border-amber-500/35 rounded-2xl p-4 card-glow">
        <div class="text-[10px] text-amber-400 font-bold uppercase mb-1">IN CORSO / REVIEW</div>
        <div class="text-2xl font-extrabold text-amber-300">{{ metrics.reviewCount }}</div>
      </div>
      <div class="bg-dkp-card/95 border border-cyan-500/35 rounded-2xl p-4 card-glow">
        <div class="text-[10px] text-cyan-400 font-bold uppercase mb-1">POOL REWARD ATTIVO</div>
        <div class="text-2xl font-extrabold text-white">&euro; {{ metrics.activePoolEur.toLocaleString() }}</div>
      </div>
      <div class="bg-dkp-card/95 border border-violet-500/35 rounded-2xl p-4 card-glow">
        <div class="text-[10px] text-violet-400 font-bold uppercase mb-1">COMPLETATI &amp; PAGATI</div>
        <div class="text-2xl font-extrabold text-violet-300">{{ metrics.completedCount }}</div>
      </div>
    </section>

    <!-- Filtri -->
    <section class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-4 flex flex-col sm:flex-row gap-3 font-mono text-xs card-glow">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Cerca bounty per titolo, categoria o builder assegnato..."
        class="flex-1 bg-dkp-bg border border-dkp-border text-white px-4 py-2.5 rounded-xl outline-none focus:border-cyan-400 box-border"
      />
      <select
        v-model="statusFilter"
        class="bg-dkp-bg border border-dkp-border text-cyan-300 font-bold px-3.5 py-2.5 rounded-xl outline-none cursor-pointer"
      >
        <option value="ALL">Tutti gli Stati</option>
        <option value="OPEN">OPEN</option>
        <option value="CLAIMED">CLAIMED</option>
        <option value="IN_REVIEW">IN_REVIEW</option>
        <option value="COMPLETED">COMPLETED</option>
        <option value="CANCELLED">CANCELLED</option>
      </select>
    </section>

    <!-- Tabella Bounties -->
    <section class="bg-dkp-card/95 border border-dkp-border rounded-2xl overflow-hidden card-glow font-mono text-xs">
      <div v-if="isLoading" class="p-10 text-center text-cyan-400">
        Sincronizzazione Bounties con Neon Pure SQL...
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-dkp-bg border-b border-dkp-border text-slate-400 uppercase text-[11px]">
              <th class="p-4">Bounty &amp; Descrizione</th>
              <th class="p-4">Categoria / Difficolt&agrave;</th>
              <th class="p-4">Reward</th>
              <th class="p-4">Builder</th>
              <th class="p-4">Stato</th>
              <th class="p-4 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-dkp-border/60">
            <tr v-for="b in filteredBounties" :key="b.id" class="hover:bg-slate-900/50 transition-colors">
              <td class="p-4 max-w-md">
                <div class="font-bold text-white text-sm mb-1">{{ b.title }}</div>
                <div class="text-slate-400 text-[11px] line-clamp-2">{{ b.description }}</div>
              </td>
              <td class="p-4 space-y-1.5">
                <div class="text-cyan-300 font-bold">{{ b.category }}</div>
                <span
                  :class="[
                    'inline-block px-2 py-0.5 rounded text-[10px] font-extrabold border',
                    b.difficulty === 'CRITICAL' ? 'bg-rose-500/15 border-rose-500/40 text-rose-400' :
                    b.difficulty === 'HARD' ? 'bg-amber-500/15 border-amber-500/40 text-amber-300' :
                    'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                  ]"
                >
                  {{ b.difficulty }}
                </span>
              </td>
              <td class="p-4">
                <div class="text-emerald-400 font-extrabold text-sm">&euro; {{ Number(b.rewardEur || 0) }}</div>
                <div class="text-violet-300 text-[11px]">+{{ Number(b.rewardXp || 0) }} XP</div>
              </td>
              <td class="p-4">
                <button
                  type="button"
                  @click="assignBuilder(b)"
                  class="px-2.5 py-1 rounded-lg bg-dkp-bg border border-dkp-border hover:border-cyan-400 text-slate-200 font-bold cursor-pointer"
                >
                  {{ b.claimedBy ? `@${b.claimedBy}` : '+ Assegna' }}
                </button>
              </td>
              <td class="p-4">
                <select
                  :value="b.status"
                  @change="changeStatus(b, ($event.target as HTMLSelectElement).value as BountyItem['status'])"
                  class="bg-dkp-bg border border-dkp-border text-amber-300 font-bold px-2.5 py-1.5 rounded-lg outline-none cursor-pointer"
                >
                  <option value="OPEN">OPEN</option>
                  <option value="CLAIMED">CLAIMED</option>
                  <option value="IN_REVIEW">IN_REVIEW</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </td>
              <td class="p-4 text-right">
                <button
                  type="button"
                  @click="deleteBounty(b)"
                  class="px-2.5 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/35 text-rose-300 hover:bg-rose-500 hover:text-white font-bold cursor-pointer"
                >
                  Elimina
                </button>
              </td>
            </tr>
            <tr v-if="filteredBounties.length === 0">
              <td colspan="6" class="p-8 text-center text-slate-400">
                Nessun bounty trovato con i filtri selezionati.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Modale Creazione Bounty -->
    <Teleport to="body">
      <div
        v-if="showCreateModal"
        class="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
        @click.self="showCreateModal = false"
      >
        <div class="bg-dkp-card border border-dkp-border rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 font-mono">
          <div class="flex items-center justify-between border-b border-dkp-border pb-3">
            <h3 class="text-white font-bold text-base m-0 font-display">Pubblica Nuovo DKP Bounty</h3>
            <button type="button" @click="showCreateModal = false" class="bg-transparent border-none text-slate-400 hover:text-white text-lg cursor-pointer">
              
            </button>
          </div>

          <div class="space-y-3 text-xs">
            <div class="flex flex-col gap-1">
              <label class="text-slate-300 font-bold uppercase">Titolo Bounty *</label>
              <input
                v-model="newBounty.title"
                type="text"
                placeholder="es. Audit Crittografico Ed25519 DKP Vault"
                class="bg-dkp-bg border border-dkp-border text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-emerald-400 box-border"
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="flex flex-col gap-1">
                <label class="text-slate-300 font-bold uppercase">Categoria</label>
                <select v-model="newBounty.category" class="bg-dkp-bg border border-dkp-border text-cyan-300 font-bold px-3 py-2.5 rounded-xl">
                  <option value="Security & SAST">Security &amp; SAST</option>
                  <option value="Core Kernel">Core Kernel</option>
                  <option value="AI Sentinel">AI Sentinel</option>
                  <option value="Frontend UI/UX">Frontend UI/UX</option>
                </select>
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-slate-300 font-bold uppercase">Difficolt&agrave;</label>
                <select v-model="newBounty.difficulty" class="bg-dkp-bg border border-dkp-border text-amber-300 font-bold px-3 py-2.5 rounded-xl">
                  <option value="EASY">EASY</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HARD">HARD</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="flex flex-col gap-1">
                <label class="text-slate-300 font-bold uppercase">Reward EUR (&euro;)</label>
                <input
                  v-model.number="newBounty.rewardEur"
                  type="number"
                  min="0"
                  step="50"
                  class="bg-dkp-bg border border-dkp-border text-emerald-400 font-bold px-3.5 py-2.5 rounded-xl outline-none box-border"
                />
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-slate-300 font-bold uppercase">Reward XP</label>
                <input
                  v-model.number="newBounty.rewardXp"
                  type="number"
                  min="50"
                  step="100"
                  class="bg-dkp-bg border border-dkp-border text-violet-300 font-bold px-3.5 py-2.5 rounded-xl outline-none box-border"
                />
              </div>
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-slate-300 font-bold uppercase">Repository / Issue URL</label>
              <input
                v-model="newBounty.repoUrl"
                type="url"
                class="bg-dkp-bg border border-dkp-border text-white px-3.5 py-2.5 rounded-xl outline-none box-border"
              />
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-slate-300 font-bold uppercase">Specifiche Tecniche &amp; Criteri di Accettazione</label>
              <textarea
                v-model="newBounty.description"
                rows="3"
                placeholder="Descrivi i requisiti tecnici per completare il bounty..."
                class="bg-dkp-bg border border-dkp-border text-white px-3.5 py-2.5 rounded-xl outline-none box-border"
              ></textarea>
            </div>
          </div>

          <div class="flex justify-end gap-3 border-t border-dkp-border pt-4">
            <button type="button" @click="showCreateModal = false" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 border-none font-bold text-xs cursor-pointer">
              Annulla
            </button>
            <button
              type="button"
              :disabled="isSaving"
              @click="createBounty"
              class="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-none font-extrabold text-xs cursor-pointer"
            >
              {{ isSaving ? 'Pubblicazione...' : 'Pubblica Bounty' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </DkpAdminShell>
</template>