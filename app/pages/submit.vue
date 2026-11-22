<!-- app/pages/submit.vue -->
<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, isRef } from 'vue'
import { useRouter } from 'vue-router'
import DkpLayout from '~/components/DkpLayout.vue'

useDkpSeo({
  title: 'Invia Segnale HN — DevKernelPulse v2.6-PURE-SQL',
  description: 'Pubblica notizie Tech Feed, domande Ask DKP, progetti Show DKP o offerte Tech Jobs nel Kernel Pure SQL di DevKernelPulse.'
})

const router = useRouter()
const auth = typeof useAuthCore === 'function' ? useAuthCore() : null
const currentUser = computed(() => {
  if (!auth) return null
  return isRef(auth.currentUser) ? auth.currentUser.value : (auth.currentUser || null)
})
const isAuthenticated = computed(() => Boolean(currentUser.value?.username || currentUser.value?.id))

interface SectionOption {
  id: 'news' | 'ask' | 'show' | 'jobs' | 'nodes' | 'blog'
  name: string
  badge: string
  xp: number
  description: string
  targetRoute: string
}

const sections: SectionOption[] = [
  { id: 'news', name: 'Tech Feed', badge: 'FEED', xp: 15, description: 'Notizie tech, benchmark e rilasci', targetRoute: '/feed' },
  { id: 'ask', name: 'Ask DKP', badge: 'ASK', xp: 20, description: 'Domande tecniche e dibattiti', targetRoute: '/ask' },
  { id: 'show', name: 'Show DKP', badge: 'SHOW', xp: 30, description: 'Showcase, tool e demo personali', targetRoute: '/show' },
  { id: 'jobs', name: 'Tech Jobs', badge: 'JOBS', xp: 25, description: 'Posizioni aperte e hiring tech', targetRoute: '/jobs' },
  { id: 'nodes', name: 'Node Talks Hub', badge: 'NODES', xp: 25, description: 'Apri thread lungo su DKP Nodes', targetRoute: '/nodes' },
  { id: 'blog', name: 'Editorial Hub', badge: 'BLOG', xp: 150, description: 'Articolo tecnico completo con Editor', targetRoute: '/user/dashboard?tab=content' }
]

const form = reactive({
  type: 'news' as SectionOption['id'],
  title: '',
  url: '',
  content: '',
  notarize: false,
  captchaAnswer: '',
  websiteHoneypot: ''
})

const liveTelemetry = ref<any>({
  dbLatencyMs: 11,
  globalFeedTotal: 0,
  sections: { news: 0, ask: 0, show: 0, jobs: 0 }
})

const errors = reactive<Record<string, string>>({})
const isSubmitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const selectedSection = computed(() => sections.find((s) => s.id === form.type) || sections[0])
const isExternalRedirectType = computed(() => form.type === 'blog' || form.type === 'nodes')
const requiresContent = computed(() => form.type === 'ask' || form.type === 'jobs')
const estimatedXp = computed(() => selectedSection.value.xp + (form.notarize ? 15 : 0))

const extractedDomain = computed(() => {
  const raw = form.url.trim()
  if (!raw) return 'devkernelpulse.org'
  try {
    return new URL(raw).hostname.replace(/^www\./, '')
  } catch {
    return 'formato-url-non-valido'
  }
})

// DKP Kernel Captcha System
const captchaNum1 = ref(0)
const captchaNum2 = ref(0)
const captchaExpectedAnswer = ref(0)

function generateCaptcha() {
  captchaNum1.value = Math.floor(Math.random() * 12) + 1
  captchaNum2.value = Math.floor(Math.random() * 10) + 1
  captchaExpectedAnswer.value = captchaNum1.value + captchaNum2.value
  form.captchaAnswer = ''
}

async function loadKernelTelemetry() {
  try {
    const res: any = await $fetch('/api/pulse/user-stories')
    if (res?.telemetry) liveTelemetry.value = res.telemetry
  } catch {}
}

function validateForm(): boolean {
  Object.keys(errors).forEach((key) => delete errors[key])

  if (isExternalRedirectType.value) return true

  if (!form.title.trim()) {
    errors.title = 'Il titolo del segnale e obbligatorio.'
  } else if (form.title.trim().length < 5) {
    errors.title = 'Il titolo deve contenere almeno 5 caratteri.'
  }

  if (form.url.trim() && !/^https?:\/\/.+/i.test(form.url.trim())) {
    errors.url = 'Inserisci un URL valido che inizi con http:// o https://'
  }

  if (requiresContent.value && !form.content.trim() && !form.url.trim()) {
    errors.content = 'Inserisci una descrizione tecnica o un link per Ask DKP e Tech Jobs.'
  }

  if (parseInt(form.captchaAnswer, 10) !== captchaExpectedAnswer.value) {
    errors.captchaAnswer = 'Risposta al DKP Kernel Captcha errata.'
  }

  if (Object.keys(errors).length > 0) {
    nextTick(() => {
      const firstErrorKey = Object.keys(errors)[0]
      document.getElementById(`submit-${firstErrorKey}`)?.focus()
    })
    return false
  }
  return true
}

async function handleSubmit() {
  if (form.websiteHoneypot) return

  if (isExternalRedirectType.value) {
    router.push(selectedSection.value.targetRoute)
    return
  }

  if (!validateForm()) return

  isSubmitting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const res: any = await $fetch('/api/pulse/submit', {
      method: 'POST',
      body: {
        type: form.type,
        title: form.title.trim(),
        url: form.url.trim(),
        content: form.content.trim(),
        notarize: form.notarize,
        author: currentUser.value?.username || 'community_user',
        authorId: currentUser.value?.id || null
      }
    })

    if (res?.success) {
      successMessage.value = res.message || `Segnale pubblicato su ${selectedSection.value.name}!`
      if (import.meta.client) {
        window.dispatchEvent(new Event('dkp:xp_updated'))
      }
      const target = selectedSection.value.targetRoute || '/feed'
      setTimeout(() => {
        router.push(target)
      }, 950)
    } else {
      throw new Error(res?.message || 'Errore imprevisto durante la pubblicazione.')
    }
  } catch (err: any) {
    errorMessage.value = err?.data?.statusMessage || err?.data?.message || err?.message || 'Errore durante la pubblicazione.'
    generateCaptcha()
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  generateCaptcha()
  loadKernelTelemetry()
})
</script>

<template>
  <DkpLayout
    title="Condividi nel Kernel HN"
    subtitle="Tech Feed, Ask DKP, Show DKP & Tech Jobs | v2.6 Pure SQL & SHA-256 Vault"
    seo-title="Invia Segnale HN — DevKernelPulse v2.6-PURE-SQL"
    seo-description="Pubblica segnali tecnici su Tech Feed, Ask DKP, Show DKP o Tech Jobs con telemetria Kernel in tempo reale."
    :show-sidebar-ads="true"
  >
    <div class="space-y-6 font-mono">
      <!-- TELEMETRIA STATO KERNEL HN -->
      <section class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="bg-[#050914] border border-emerald-500/30 rounded-2xl p-4">
          <div class="text-[10px] uppercase text-emerald-300 font-bold">Tech Feed Live</div>
          <div class="text-xl font-extrabold text-white mt-1">{{ liveTelemetry.sections?.news || 0 }}</div>
          <div class="text-[10px] text-slate-400">Segnali indicizzati</div>
        </div>
        <div class="bg-[#050914] border border-amber-500/30 rounded-2xl p-4">
          <div class="text-[10px] uppercase text-amber-300 font-bold">Ask DKP</div>
          <div class="text-xl font-extrabold text-white mt-1">{{ liveTelemetry.sections?.ask || 0 }}</div>
          <div class="text-[10px] text-slate-400">Domande aperte</div>
        </div>
        <div class="bg-[#050914] border border-cyan-500/30 rounded-2xl p-4">
          <div class="text-[10px] uppercase text-cyan-300 font-bold">Show DKP</div>
          <div class="text-xl font-extrabold text-white mt-1">{{ liveTelemetry.sections?.show || 0 }}</div>
          <div class="text-[10px] text-slate-400">Progetti &amp; Demo</div>
        </div>
        <div class="bg-[#050914] border border-violet-500/30 rounded-2xl p-4">
          <div class="text-[10px] uppercase text-violet-300 font-bold">Tech Jobs</div>
          <div class="text-xl font-extrabold text-white mt-1">{{ liveTelemetry.sections?.jobs || 0 }}</div>
          <div class="text-[10px] text-emerald-400">Kernel SQL {{ liveTelemetry.dbLatencyMs }}ms</div>
        </div>
      </section>

      <!-- MAIN SUBMIT CARD -->
      <section class="bg-gradient-to-br from-[#071124] via-[#050914] to-[#04131c] border border-cyan-500/25 rounded-2xl p-6 sm:p-8 card-glow space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-extrabold">
              DKP KERNEL SUBMIT v2.6
            </span>
            <span v-if="!isExternalRedirectType" class="px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-xs font-bold">
              +{{ estimatedXp }} XP
            </span>
          </div>

          <div class="text-xs text-slate-400">
            <span v-if="isAuthenticated">
              Autore: <strong class="text-emerald-400">@{{ currentUser?.username }}</strong>
            </span>
            <NuxtLink v-else to="/login" class="text-cyan-400 hover:text-emerald-400 font-bold no-underline">
              Accedi per accumulare XP &rarr;
            </NuxtLink>
          </div>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-5 text-xs" novalidate>
          <input
            type="text"
            v-model="form.websiteHoneypot"
            name="website_url"
            tabindex="-1"
            aria-hidden="true"
            class="hidden"
            autocomplete="off"
          />

          <!-- 1. SELETTORE VISUALE SEZIONE -->
          <div class="space-y-2">
            <label class="block text-slate-300 font-bold uppercase tracking-wider">
              1. Seleziona Canale di Pubblicazione *
            </label>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              <button
                v-for="sec in sections"
                :key="sec.id"
                type="button"
                @click="form.type = sec.id"
                :class="form.type === sec.id ? 'border-emerald-400 bg-emerald-500/15 text-white' : 'border-slate-800 bg-[#030712] text-slate-400 hover:text-slate-200'"
                class="p-3.5 rounded-xl border text-left transition-all cursor-pointer space-y-1"
              >
                <div class="flex items-center justify-between">
                  <span class="font-extrabold text-xs">{{ sec.name }}</span>
                  <span class="text-[10px] text-emerald-400 font-bold">+{{ sec.xp }} XP</span>
                </div>
                <div class="text-[11px] font-sans text-slate-400">{{ sec.description }}</div>
              </button>
            </div>
          </div>

          <!-- REINDIRIZZAMENTO PER NODES / BLOG -->
          <div v-if="isExternalRedirectType" class="bg-cyan-500/10 border border-cyan-500/35 text-cyan-200 p-4 rounded-xl text-xs font-sans leading-relaxed">
            Per pubblicare su <strong>{{ selectedSection.name }}</strong> verrai indirizzato all'editor dedicato con formattazione avanzata e allegati tecnici.
          </div>

          <template v-else>
            <!-- 2. TITOLO -->
            <div class="space-y-1.5">
              <label for="submit-title" class="block text-slate-300 font-bold uppercase tracking-wider">
                2. Titolo del Segnale *
              </label>
              <input
                id="submit-title"
                v-model="form.title"
                type="text"
                placeholder="Es. Rilasciato Postgres 18: benchmark su query JSONB e vettori..."
                class="w-full bg-[#030712] border text-white px-3.5 py-2.5 rounded-xl outline-none transition-all text-xs font-sans"
                :class="errors.title ? 'border-rose-500' : 'border-slate-800 focus:border-emerald-400'"
              />
              <span v-if="errors.title" class="text-rose-400 text-[11px] font-bold block">{{ errors.title }}</span>
            </div>

            <!-- 3. URL ESTERNO -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <label for="submit-url" class="text-slate-300 font-bold uppercase tracking-wider">
                  3. URL / Link Esterno
                </label>
                <span class="text-[10px] text-cyan-400">Dominio rilevato: {{ extractedDomain }}</span>
              </div>
              <input
                id="submit-url"
                v-model="form.url"
                type="url"
                placeholder="https://github.com/tuo-progetto"
                class="w-full bg-[#030712] border text-white px-3.5 py-2.5 rounded-xl outline-none transition-all text-xs font-sans"
                :class="errors.url ? 'border-rose-500' : 'border-slate-800 focus:border-emerald-400'"
              />
              <span v-if="errors.url" class="text-rose-400 text-[11px] font-bold block">{{ errors.url }}</span>
            </div>

            <!-- 4. TESTO / CONTESTO -->
            <div class="space-y-1.5">
              <label for="submit-content" class="block text-slate-300 font-bold uppercase tracking-wider">
                4. Contesto Tecnico {{ requiresContent ? '*' : '(Opzionale)' }}
              </label>
              <textarea
                id="submit-content"
                v-model="form.content"
                rows="4"
                placeholder="Inserisci dettagli tecnici, stack utilizzato, domanda per la community o requisiti del ruolo..."
                class="w-full bg-[#030712] border text-white px-3.5 py-2.5 rounded-xl outline-none transition-all text-xs font-sans resize-y"
                :class="errors.content ? 'border-rose-500' : 'border-slate-800 focus:border-emerald-400'"
              ></textarea>
              <span v-if="errors.content" class="text-rose-400 text-[11px] font-bold block">{{ errors.content }}</span>
            </div>

            <!-- OPZIONE NOTARIZZAZIONE SHA-256 -->
            <div class="bg-[#030712] border border-emerald-500/25 p-3.5 rounded-xl">
              <label class="inline-flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer select-none">
                <input
                  v-model="form.notarize"
                  type="checkbox"
                  class="w-4 h-4 rounded border-slate-700 bg-[#030712] text-emerald-500"
                />
                <span>Notarizza il segnale con certificato <strong class="text-emerald-400">SHA-256 Vault</strong> (+15 XP extra)</span>
              </label>
            </div>

            <!-- 5. DKP KERNEL CAPTCHA -->
            <div class="bg-[#030712] border border-slate-800 p-4 rounded-xl space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-cyan-400 font-extrabold text-xs uppercase">DKP Kernel Captcha</span>
                <button
                  type="button"
                  @click="generateCaptcha"
                  class="text-slate-400 hover:text-emerald-400 font-bold text-[11px] cursor-pointer"
                >
                  Rigenera
                </button>
              </div>
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <label for="submit-captchaAnswer" class="text-slate-300 text-xs">
                  Verifica Anti-Bot: <strong class="text-emerald-400 text-sm">{{ captchaNum1 }} + {{ captchaNum2 }} = ?</strong>
                </label>
                <input
                  id="submit-captchaAnswer"
                  v-model="form.captchaAnswer"
                  type="number"
                  placeholder="Risultato"
                  class="w-28 bg-[#050914] border text-center text-emerald-400 font-bold py-2 rounded-lg outline-none text-xs"
                  :class="errors.captchaAnswer ? 'border-rose-500' : 'border-slate-700 focus:border-emerald-400'"
                />
              </div>
              <span v-if="errors.captchaAnswer" class="text-rose-400 text-[11px] font-bold block">{{ errors.captchaAnswer }}</span>
            </div>
          </template>

          <div v-if="errorMessage" role="alert" class="p-3.5 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-bold">
            {{ errorMessage }}
          </div>

          <div v-if="successMessage" role="status" class="p-3.5 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold">
            {{ successMessage }}
          </div>

          <button
            type="submit"
            :disabled="isSubmitting"
            class="w-full py-3.5 px-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl text-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <span v-if="isSubmitting">Registrazione Pure SQL nel Kernel...</span>
            <span v-else-if="isExternalRedirectType">Apri {{ selectedSection.name }} &rarr;</span>
            <span v-else>Pubblica su {{ selectedSection.name }} (+{{ estimatedXp }} XP)</span>
          </button>
        </form>

        <div class="pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
          Gestisci e monitora i tuoi segnali HN dalla
          <NuxtLink to="/user/dashboard?tab=content" class="text-cyan-400 hover:text-emerald-400 font-bold no-underline">
            Dashboard Personale &rarr;
          </NuxtLink>
        </div>
      </section>
    </div>
  </DkpLayout>
</template>