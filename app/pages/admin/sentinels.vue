<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DkpAdminShell from '~/components/admin/DkpAdminShell.vue'

definePageMeta({
  middleware: 'admin-only'
})

const isLoading = ref(true)
const permissions = ref<any[]>([])
const bots = ref<any[]>([])
const scans = ref<any[]>([])
const totals = ref({
  scansTotal: 0,
  docKeeperFindings: 0,
  archGuardFindings: 0,
  autoCommentsPublished: 0
})

const statusBanner = ref<{ ok: boolean; text: string } | null>(null)
const savingRole = ref('')
const isBatchRunning = ref(false)

// Sandbox & Target Scanner
const scanMode = ref<'snippet' | 'forum' | 'blog'>('snippet')
const sandboxTitle = ref('Test Migrazione Stack Nuxt + Node')
const sandboxContent = ref(
  "```ts\nimport moment from 'moment'\nimport fetch from 'node-fetch'\n\nconst res = await db.execute(`SELECT * FROM users WHERE id = ${userId}`)\nelement.innerHTML = userInput\n```"
)
const targetThreadId = ref('')
const targetBlogSlug = ref('')
const publishAutoComment = ref(true)
const isScanning = ref(false)
const liveResult = ref<any>(null)

async function loadDependabotData() {
  isLoading.value = true
  try {
    const res: any = await $fetch('/api/admin/dependabot', { query: { _t: Date.now() } })
    if (res?.success) {
      permissions.value = res.permissions || []
      bots.value = res.bots || []
      scans.value = res.scans || []
      if (res.totals) totals.value = res.totals
    }
  } catch (err: any) {
    statusBanner.value = { ok: false, text: err?.data?.statusMessage || 'Errore caricamento Sentinel Dependabot.' }
  } finally {
    isLoading.value = false
  }
}

async function saveRolePermissions(perm: any) {
  savingRole.value = perm.roleKey
  statusBanner.value = null
  try {
    const res: any = await $fetch('/api/admin/dependabot', {
      method: 'POST',
      body: {
        action: 'update_permissions',
        ...perm
      }
    })
    statusBanner.value = { ok: true, text: res?.message || 'Permessi aggiornati su NeonDB.' }
  } catch (err: any) {
    statusBanner.value = { ok: false, text: err?.data?.statusMessage || 'Errore salvataggio permessi.' }
  } finally {
    savingRole.value = ''
  }
}

async function runLiveScan() {
  isScanning.value = true
  statusBanner.value = null
  liveResult.value = null
  try {
    const payload =
      scanMode.value === 'snippet'
        ? {
            action: 'scan_snippet',
            title: sandboxTitle.value,
            content: sandboxContent.value
          }
        : {
            action: 'scan_target',
            targetType: scanMode.value,
            threadId: Number(targetThreadId.value || 0),
            blogSlug: targetBlogSlug.value.trim(),
            autoComment: publishAutoComment.value
          }

    const res: any = await $fetch('/api/admin/dependabot', {
      method: 'POST',
      body: payload
    })
    liveResult.value = res?.result || null
    statusBanner.value = { ok: true, text: res?.message || 'Scansione completata.' }
    await loadDependabotData()
  } catch (err: any) {
    statusBanner.value = { ok: false, text: err?.data?.statusMessage || 'Errore durante la scansione.' }
  } finally {
    isScanning.value = false
  }
}

async function runBatchAudit() {
  isBatchRunning.value = true
  statusBanner.value = null
  try {
    const res: any = await $fetch('/api/admin/dependabot', {
      method: 'POST',
      body: { action: 'run_batch_audit' }
    })
    statusBanner.value = { ok: true, text: res?.message || 'Audit batch completato.' }
    await loadDependabotData()
  } catch (err: any) {
    statusBanner.value = { ok: false, text: err?.data?.statusMessage || 'Errore audit batch.' }
  } finally {
    isBatchRunning.value = false
  }
}

onMounted(loadDependabotData)
</script>

<template>
  <DkpAdminShell
    title="Sentinel Network — Knowledge Dependabot"
    subtitle="Sentinel DocKeeper (Code-Block & Dependency Parser) + Sentinel ArchGuard (Architecture & Updated Docs)"
    badge="PHASE 4 • RBAC & AUTO-COMMENT"
  >
    <template #actions>
      <button
        type="button"
        @click="runBatchAudit"
        :disabled="isBatchRunning"
        class="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold cursor-pointer disabled:opacity-50"
      >
        {{ isBatchRunning ? 'Audit in corso...' : 'Audit Retroattivo Blog & Forum' }}
      </button>
      <button
        type="button"
        @click="loadDependabotData"
        class="px-3.5 py-2 rounded-xl bg-[#030712] border border-slate-700 text-cyan-300 font-bold cursor-pointer"
      >
        Aggiorna
      </button>
    </template>

    <div class="space-y-6 font-mono">
      <!-- Banner Esito -->
      <div
        v-if="statusBanner"
        :class="statusBanner.ok ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300' : 'bg-rose-500/15 border-rose-500/50 text-rose-300'"
        class="p-4 rounded-2xl border text-xs font-bold flex items-center justify-between"
      >
        <span>{{ statusBanner.text }}</span>
        <button type="button" @click="statusBanner = null" class="underline cursor-pointer">Chiudi</button>
      </div>

      <!-- 4 KPI -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-dkp-card/95 border border-cyan-500/35 rounded-2xl p-5 card-glow">
          <div class="text-[10px] uppercase text-cyan-300 font-bold">Scansioni Semantiche</div>
          <div class="text-3xl font-extrabold text-white mt-1">{{ totals.scansTotal }}</div>
          <div class="text-[10px] text-slate-400 mt-1">Code block &amp; manifest analizzati</div>
        </div>

        <div class="bg-dkp-card/95 border border-amber-500/35 rounded-2xl p-5 card-glow">
          <div class="text-[10px] uppercase text-amber-300 font-bold">DocKeeper Findings</div>
          <div class="text-3xl font-extrabold text-amber-300 mt-1">{{ totals.docKeeperFindings }}</div>
          <div class="text-[10px] text-slate-400 mt-1">Dipendenze obsolete / API legacy</div>
        </div>

        <div class="bg-dkp-card/95 border border-violet-500/35 rounded-2xl p-5 card-glow">
          <div class="text-[10px] uppercase text-violet-300 font-bold">ArchGuard Findings</div>
          <div class="text-3xl font-extrabold text-violet-300 mt-1">{{ totals.archGuardFindings }}</div>
          <div class="text-[10px] text-slate-400 mt-1">Pattern architetturali &amp; doc</div>
        </div>

        <div class="bg-dkp-card/95 border border-emerald-500/35 rounded-2xl p-5 card-glow">
          <div class="text-[10px] uppercase text-emerald-300 font-bold">Auto-Commenti Pubblicati</div>
          <div class="text-3xl font-extrabold text-emerald-400 mt-1">{{ totals.autoCommentsPublished }}</div>
          <div class="text-[10px] text-slate-400 mt-1">Forum Threads &amp; Editorial Blog</div>
        </div>
      </div>

      <!-- 1. MATRICE RUOLI E PERMESSI NEL DB (sentinel_role_permissions) -->
      <section class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-6 card-glow space-y-4">
        <div>
          <h2 class="text-lg font-extrabold text-white font-display m-0">
            1. Ruoli &amp; Permessi Dedicati nel DB (Pure SQL RBAC)
          </h2>
          <p class="text-xs text-slate-400 font-sans m-0 mt-1">
            Configurazione persistente su <code>sentinel_role_permissions</code> e <code>users.role</code>. Nessuna Sentinel dispone di permessi distruttivi sul core DB (<code>can_modify_core_db = FALSE</code>).
          </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div
            v-for="perm in permissions"
            :key="perm.roleKey"
            :class="perm.roleKey === 'sentinel_dockeeper' ? 'border-amber-500/40' : 'border-violet-500/40'"
            class="bg-[#050914] border rounded-2xl p-5 space-y-4"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="flex items-center gap-2">
                  <span
                    :class="perm.roleKey === 'sentinel_dockeeper' ? 'bg-amber-500/15 text-amber-300 border-amber-400/50' : 'bg-violet-500/15 text-violet-300 border-violet-400/50'"
                    class="px-2.5 py-0.5 rounded-lg border text-[10px] font-extrabold uppercase"
                  >
                    ROLE: {{ perm.roleKey }}
                  </span>
                  <span class="px-2 py-0.5 rounded bg-slate-900 text-slate-300 text-[10px]">
                    @{{ perm.botUsername }}
                  </span>
                </div>
                <h3 class="text-base font-extrabold text-white font-display m-0 mt-2">{{ perm.displayName }}</h3>
                <p class="text-xs text-slate-400 font-sans m-0 mt-1">{{ perm.specialty }}</p>
              </div>

              <label class="inline-flex items-center gap-2 text-xs font-bold text-emerald-300 cursor-pointer shrink-0">
                <input v-model="perm.isEnabled" type="checkbox" class="accent-emerald-400 w-4 h-4" />
                <span>Attiva</span>
              </label>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs pt-2 border-t border-slate-800/80">
              <label class="flex items-center gap-2 text-slate-200 cursor-pointer">
                <input v-model="perm.canParseCodeBlocks" type="checkbox" class="accent-cyan-400" />
                <span>Parse Code Blocks</span>
              </label>
              <label class="flex items-center gap-2 text-slate-200 cursor-pointer">
                <input v-model="perm.canDetectObsoleteDeps" type="checkbox" class="accent-amber-400" />
                <span>Detect Obsolete Deps</span>
              </label>
              <label class="flex items-center gap-2 text-slate-200 cursor-pointer">
                <input v-model="perm.canInspectArchitecture" type="checkbox" class="accent-violet-400" />
                <span>Inspect Architecture</span>
              </label>
              <label class="flex items-center gap-2 text-slate-200 cursor-pointer">
                <input v-model="perm.canSuggestDocUpdates" type="checkbox" class="accent-cyan-400" />
                <span>Suggest Updated Docs</span>
              </label>
              <label class="flex items-center gap-2 text-slate-200 cursor-pointer">
                <input v-model="perm.canAutoCommentThreads" type="checkbox" class="accent-emerald-400" />
                <span>Auto-Comment Threads</span>
              </label>
              <label class="flex items-center gap-2 text-slate-200 cursor-pointer">
                <input v-model="perm.canAutoCommentBlog" type="checkbox" class="accent-emerald-400" />
                <span>Auto-Comment Blog</span>
              </label>
            </div>

            <div class="flex items-center justify-between pt-2">
              <span class="text-[10px] text-rose-400 font-bold">Core DB Write: LOCKED (FALSE)</span>
              <button
                type="button"
                @click="saveRolePermissions(perm)"
                :disabled="savingRole === perm.roleKey"
                class="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-extrabold cursor-pointer disabled:opacity-50"
              >
                {{ savingRole === perm.roleKey ? 'Salvataggio...' : 'Salva Permessi DB' }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- 2. SANDBOX SEMANTICO & SCANSIONE TARGET (FORUM / BLOG) -->
      <section class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-6 card-glow space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="text-lg font-extrabold text-white font-display m-0">
              2. Parser Semantico Live &amp; Auto-Commento On-Demand
            </h2>
            <p class="text-xs text-slate-400 font-sans m-0 mt-1">
              Testa il motore su uno snippet Markdown oppure avvia l'analisi + auto-commento su un Thread Forum o Articolo Blog esistente.
            </p>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="scanMode = 'snippet'"
              :class="scanMode === 'snippet' ? 'bg-cyan-400 text-slate-950 font-extrabold' : 'bg-[#030712] text-slate-300 border border-slate-800'"
              class="px-3 py-1.5 rounded-xl text-xs cursor-pointer"
            >
              Snippet Sandbox
            </button>
            <button
              type="button"
              @click="scanMode = 'forum'"
              :class="scanMode === 'forum' ? 'bg-violet-500 text-white font-extrabold' : 'bg-[#030712] text-slate-300 border border-slate-800'"
              class="px-3 py-1.5 rounded-xl text-xs cursor-pointer"
            >
              Thread Forum ID
            </button>
            <button
              type="button"
              @click="scanMode = 'blog'"
              :class="scanMode === 'blog' ? 'bg-amber-400 text-slate-950 font-extrabold' : 'bg-[#030712] text-slate-300 border border-slate-800'"
              class="px-3 py-1.5 rounded-xl text-xs cursor-pointer"
            >
              Articolo Blog Slug
            </button>
          </div>
        </div>

        <div v-if="scanMode === 'snippet'" class="space-y-3">
          <input
            v-model="sandboxTitle"
            type="text"
            placeholder="Titolo contesto tecnico..."
            class="w-full px-3.5 py-2.5 rounded-xl border text-xs"
          />
          <textarea
            v-model="sandboxContent"
            rows="6"
            placeholder="Incolla markdown con code block ```ts ... ```"
            class="w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono"
          ></textarea>
        </div>

        <div v-else-if="scanMode === 'forum'" class="flex flex-col sm:flex-row gap-3">
          <input
            v-model="targetThreadId"
            type="number"
            placeholder="ID Thread Forum (es. 12)"
            class="flex-1 px-3.5 py-2.5 rounded-xl border text-xs"
          />
          <label class="inline-flex items-center gap-2 text-xs text-emerald-300 font-bold">
            <input v-model="publishAutoComment" type="checkbox" class="accent-emerald-400" />
            <span>Pubblica auto-commento nel thread se rileva problemi</span>
          </label>
        </div>

        <div v-else class="flex flex-col sm:flex-row gap-3">
          <input
            v-model="targetBlogSlug"
            type="text"
            placeholder="Slug articolo blog (es. architettura-pure-sql-neon)"
            class="flex-1 px-3.5 py-2.5 rounded-xl border text-xs"
          />
          <label class="inline-flex items-center gap-2 text-xs text-emerald-300 font-bold">
            <input v-model="publishAutoComment" type="checkbox" class="accent-emerald-400" />
            <span>Pubblica auto-commento nell'articolo se rileva problemi</span>
          </label>
        </div>

        <button
          type="button"
          @click="runLiveScan"
          :disabled="isScanning"
          class="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold cursor-pointer disabled:opacity-50"
        >
          {{ isScanning ? 'Analisi Semantica in corso...' : 'Esegui Scansione DocKeeper + ArchGuard' }}
        </button>

        <!-- Risultato Live -->
        <div v-if="liveResult" class="bg-[#050914] border border-cyan-500/35 rounded-2xl p-4 space-y-3 text-xs">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="text-cyan-300 font-extrabold">
              Code Blocks Rilevati: {{ liveResult.codeBlocksCount }} &bull; Fingerprint: {{ liveResult.fingerprint }}
            </span>
            <span v-if="liveResult.autoCommented" class="px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
              Auto-Commento Pubblicato!
            </span>
          </div>

          <div
            v-for="(f, idx) in [...(liveResult.docKeeperFindings || []), ...(liveResult.archGuardFindings || [])]"
            :key="idx"
            class="bg-[#030712] border border-slate-800 rounded-xl p-3 space-y-1"
          >
            <div class="flex items-center gap-2">
              <span
                :class="f.agent === 'sentinel_dockeeper' ? 'text-amber-300' : 'text-violet-300'"
                class="font-extrabold uppercase text-[10px]"
              >
                [{{ f.agent }}]
              </span>
              <span class="text-white font-bold">{{ f.title }}</span>
            </div>
            <p class="text-slate-300 font-sans m-0">{{ f.recommendation }}</p>
            <div class="text-emerald-400 text-[11px]">Fix: <code>{{ f.modernReplacement }}</code></div>
          </div>
        </div>
      </section>

      <!-- 3. STORICO SCANSIONI KNOWLEDGE DEPENDABOT -->
      <section class="bg-dkp-card/95 border border-dkp-border rounded-2xl p-6 card-glow space-y-3">
        <h2 class="text-lg font-extrabold text-white font-display m-0">
          3. Registro Audit Knowledge Dependabot (Ultimi 40 Rilevamenti)
        </h2>

        <div v-if="scans.length === 0" class="text-xs text-slate-400 py-4">
          Nessuna scansione registrata finora. Pubblica un thread/articolo con code block o esegui un Audit Retroattivo.
        </div>

        <div v-else class="space-y-2.5">
          <div
            v-for="s in scans"
            :key="s.id"
            class="bg-[#050914] border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
          >
            <div class="space-y-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300 text-[10px] font-bold uppercase">
                  {{ s.entityType }}
                </span>
                <span class="font-bold text-white font-sans text-sm">{{ s.entityTitle }}</span>
                <span v-if="s.autoCommented" class="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 text-[10px] font-extrabold">
                  AUTO-COMMENTED
                </span>
              </div>
              <div class="text-[11px] text-slate-400">
                Code Blocks: <strong class="text-white">{{ s.codeBlocksCount }}</strong> &bull;
                DocKeeper: <strong class="text-amber-300">{{ s.docKeeperCount }}</strong> &bull;
                ArchGuard: <strong class="text-violet-300">{{ s.archGuardCount }}</strong>
              </div>
            </div>

            <div class="text-[11px] text-slate-400 shrink-0">
              {{ new Date(s.createdAt).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' }) }}
            </div>
          </div>
        </div>
      </section>
    </div>
  </DkpAdminShell>
</template>