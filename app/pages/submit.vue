<!-- app/pages/submit.vue -->
<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'

useDkpSeo({
  title: 'Invia Contenuto — DevKernelPulse v2.6-PURE-SQL',
  description: 'Pubblica notizie, discussioni Node Talks, domande Ask, Showcase progetti o annunci Job nel Kernel Pure SQL di DevKernelPulse.'
})

const router = useRouter()
const { currentUser, isAuthenticated, openAuthModal } = useAuthCore()

interface SectionOption {
  id: string
  name: string
  description: string
  targetRoute: string
}

interface SubmitFormState {
  type: string
  title: string
  url: string
  content: string
  captchaAnswer: string
  websiteHoneypot: string
}

// Opzioni Menù a Tendina Sezioni DKP v2.6-PURE-SQL
const sections: SectionOption[] = [
  { id: 'news', name: '📰 News Feed', description: 'Notizie tech, articoli ed ecosistema', targetRoute: '/feed' },
  { id: 'nodes', name: '💬 Node Talks Hub', description: 'Discussioni e thread tecnici verticali', targetRoute: '/nodes' },
  { id: 'ask', name: '💭 Ask Community', description: 'Domande tecniche, supporto e dibattiti', targetRoute: '/ask' },
  { id: 'show', name: '🚀 Show DKP', description: 'Showcase e demo di progetti personali', targetRoute: '/show' },
  { id: 'job', name: '💼 Tech Jobs', description: 'Offerte di lavoro e posizioni aperte', targetRoute: '/jobs' },
  { id: 'blog', name: '✍️ DKP Editorial Hub', description: 'Usa l\'editor avanzato nella Dashboard', targetRoute: '/user/dashboard?tab=content' }
]

const form = reactive<SubmitFormState>({
  type: 'news',
  title: '',
  url: '',
  content: '',
  captchaAnswer: '',
  websiteHoneypot: ''
})

const errors = reactive<Record<string, string>>({})
const isSubmitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const isBlogSelected = computed(() => form.type === 'blog')
const requiresContent = computed(() => form.type === 'ask' || form.type === 'nodes')

// DKP Kernel Captcha System (Anti-Bot Engine)
const captchaNum1 = ref(0)
const captchaNum2 = ref(0)
const captchaExpectedAnswer = ref(0)

function generateCaptcha() {
  captchaNum1.value = Math.floor(Math.random() * 12) + 1
  captchaNum2.value = Math.floor(Math.random() * 10) + 1
  captchaExpectedAnswer.value = captchaNum1.value + captchaNum2.value
  form.captchaAnswer = ''
}

// Validazione Client-Side rigorosa conforme WCAG 2.1 AA
function validateForm(): boolean {
  Object.keys(errors).forEach(key => delete errors[key])

  if (isBlogSelected.value) return true

  if (!form.title.trim()) {
    errors.title = 'Il titolo del contenuto è obbligatorio.'
  } else if (form.title.trim().length < 5) {
    errors.title = 'Il titolo deve contenere almeno 5 caratteri.'
  }

  if (form.url.trim() && !/^https?:\/\/.+/i.test(form.url.trim())) {
    errors.url = 'Inserisci un URL valido che inizi con http:// o https://'
  }

  if (requiresContent.value && !form.content.trim()) {
    errors.content = 'Il testo/contesto è obbligatorio per le discussioni Ask Community e Node Talks.'
  }

  if (parseInt(form.captchaAnswer, 10) !== captchaExpectedAnswer.value) {
    errors.captchaAnswer = 'Risposta al DKP Kernel Captcha errata.'
  }

  const hasErrors = Object.keys(errors).length > 0
  if (hasErrors) {
    nextTick(() => {
      const firstErrorKey = Object.keys(errors)[0]
      const el = document.getElementById(`submit-${firstErrorKey}`)
      el?.focus()
    })
  }

  return !hasErrors
}

async function handleSubmit() {
  // Anti-Spam Check 1: Honeypot silenzioso
  if (form.websiteHoneypot) {
    return
  }

  if (isBlogSelected.value) {
    router.push('/user/dashboard?tab=content')
    return
  }

  if (!validateForm()) {
    return
  }

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
        captchaAnswer: form.captchaAnswer,
        captchaExpected: captchaExpectedAnswer.value,
        author: currentUser.value?.username || 'alexdpl',
        authorId: currentUser.value?.id || 1
      }
    })

    if (res?.success) {
      successMessage.value = res.message || 'Contenuto pubblicato nel Kernel DKP con successo! (+XP accreditati)'
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('dkp:xp_updated'))
      }
      const target = sections.find(s => s.id === form.type)?.targetRoute || '/'
      setTimeout(() => {
        router.push(target)
      }, 1100)
    } else {
      throw new Error(res?.message || 'Errore imprevisto durante la pubblicazione.')
    }
  } catch (err: any) {
    errorMessage.value = err?.data?.statusMessage || err?.data?.message || err?.message || 'Errore durante la pubblicazione. Verifica i dati inseriti.'
    generateCaptcha()
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  generateCaptcha()
})
</script>

<template>
  <div class="min-h-screen bg-[#020420] text-slate-300 py-10 px-4 sm:px-6 pb-20 font-sans">
    <div class="max-w-3xl mx-auto flex flex-col gap-7">

      <!-- BARRA 4 PILASTRI ECOSISTEMA DKP v2.6 -->
      <nav aria-label="Navigazione Ecosistema DKP" class="flex flex-wrap gap-2.5 justify-center font-mono bg-[#090d16] border border-slate-800 p-3 rounded-2xl shadow-lg">
        <NuxtLink
          to="/news"
          class="px-4 py-2 bg-[#020420] border border-slate-700 hover:border-emerald-400 text-emerald-400 font-extrabold text-xs rounded-xl transition-all no-underline"
        >
          🌍 DKP Tech Feed
        </NuxtLink>

        <NuxtLink
          to="/nodes"
          class="px-4 py-2 bg-[#020420] border border-slate-700 hover:border-purple-400 text-purple-400 font-extrabold text-xs rounded-xl transition-all no-underline"
        >
          💬 DKP Talks Hub
        </NuxtLink>

        <NuxtLink
          to="/tools"
          class="px-4 py-2 bg-[#020420] border border-slate-700 hover:border-sky-400 text-sky-400 font-extrabold text-xs rounded-xl transition-all no-underline"
        >
          🛠️ Developer Tools
        </NuxtLink>

        <NuxtLink
          to="/blog"
          class="px-4 py-2 bg-[#020420] border border-slate-700 hover:border-emerald-400 text-emerald-300 font-extrabold text-xs rounded-xl transition-all no-underline"
        >
          ✍️ DKP Editorial Hub
        </NuxtLink>
      </nav>

      <!-- MAIN SUBMIT CARD -->
      <div class="bg-[#080d1a] border border-slate-800/80 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-md">
        
        <!-- Glows Decorativi Cosmici -->
        <div class="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-20 -left-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <!-- BADGE HEADER -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 font-mono relative z-10">
          <span class="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/40 px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider shadow-[0_0_12px_rgba(0,220,130,0.25)]">
            DKP KERNEL SUBMIT v2.6-PURE-SQL
          </span>
          <ClientOnly>
            <span v-if="isAuthenticated" class="text-xs text-slate-400">
              Autore: <strong class="text-emerald-400 font-bold">@{{ currentUser?.username }}</strong>
            </span>
            <button
              v-else
              type="button"
              @click="openAuthModal?.()"
              class="text-xs text-sky-400 hover:text-emerald-400 underline font-bold cursor-pointer"
            >
              Accedi per accumulare XP →
            </button>
          </ClientOnly>
        </div>

        <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2 relative z-10">
          Condividi nel <span class="text-emerald-400">Kernel DKP</span>
        </h1>
        <p class="text-slate-400 text-xs sm:text-sm leading-relaxed mb-6 relative z-10">
          Scegli la sezione di destinazione, compila i metadati e pubblica all'istante nel database Pure SQL dell'ecosistema.
        </p>

        <form @submit.prevent="handleSubmit" class="flex flex-col gap-5 font-mono text-xs relative z-10" novalidate>
          
          <!-- Campo Honeypot Nascosto Anti-Bot -->
          <input
            type="text"
            v-model="form.websiteHoneypot"
            name="website_url"
            tabindex="-1"
            aria-hidden="true"
            class="hidden"
            autocomplete="off"
          />

          <!-- 1. SEZIONE DESTINAZIONE -->
          <div class="flex flex-col gap-1.5">
            <label for="submit-type" class="text-slate-300 font-bold uppercase tracking-wider">
              🎯 Sezione Destinazione *
            </label>
            <select
              id="submit-type"
              v-model="form.type"
              class="bg-[#040814] border border-slate-800 text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-emerald-500 transition-all cursor-pointer text-xs font-bold"
            >
              <option v-for="sec in sections" :key="sec.id" :value="sec.id">
                {{ sec.name }} — {{ sec.description }}
              </option>
            </select>
          </div>

          <!-- NOTA REINDIRIZZAMENTO BLOG -->
          <div v-if="isBlogSelected" class="bg-sky-500/10 border border-sky-500/30 text-sky-300 p-4 rounded-xl text-xs leading-relaxed">
            💡 <strong>Nota Editorial Hub:</strong> Gli articoli lunghi del DKP Blog utilizzano l'Editor Avanzato con anteprima Markdown, tag tecnici e notarizzazione Vault. Clicca il pulsante qui sotto per aprire direttamente l'editor nella tua Dashboard.
          </div>

          <template v-else>
            <!-- 2. TITOLO DEL CONTENUTO -->
            <div class="flex flex-col gap-1.5">
              <label for="submit-title" class="text-slate-300 font-bold uppercase tracking-wider">
                Titolo del Contenuto *
              </label>
              <input
                id="submit-title"
                v-model="form.title"
                type="text"
                placeholder="Es. Rilasciato Nuxt 4: benchmark Nitro & Neon Pure SQL..."
                :aria-invalid="!!errors.title"
                aria-describedby="err-title"
                class="bg-[#040814] border text-white px-3.5 py-2.5 rounded-xl outline-none transition-all text-xs font-sans"
                :class="errors.title ? 'border-rose-500 focus:border-rose-400' : 'border-slate-800 focus:border-emerald-500'"
              />
              <span v-if="errors.title" id="err-title" class="text-rose-400 text-[11px] font-bold">
                ⚠️ {{ errors.title }}
              </span>
            </div>

            <!-- 3. URL ESTERNO -->
            <div class="flex flex-col gap-1.5">
              <label for="submit-url" class="text-slate-300 font-bold uppercase tracking-wider">
                URL / Link Esterno (Opzionale per News, Show e Jobs)
              </label>
              <input
                id="submit-url"
                v-model="form.url"
                type="url"
                placeholder="https://github.com/tuo-progetto o https://articolo..."
                :aria-invalid="!!errors.url"
                aria-describedby="err-url"
                class="bg-[#040814] border text-white px-3.5 py-2.5 rounded-xl outline-none transition-all text-xs font-sans"
                :class="errors.url ? 'border-rose-500 focus:border-rose-400' : 'border-slate-800 focus:border-emerald-500'"
              />
              <span v-if="errors.url" id="err-url" class="text-rose-400 text-[11px] font-bold">
                ⚠️ {{ errors.url }}
              </span>
            </div>

            <!-- 4. TESTO / DESCRIZIONE BREVE -->
            <div class="flex flex-col gap-1.5">
              <label for="submit-content" class="text-slate-300 font-bold uppercase tracking-wider">
                Testo / Descrizione {{ requiresContent ? '*' : '(Richiesto per Ask & Node Talks)' }}
              </label>
              <textarea
                id="submit-content"
                v-model="form.content"
                rows="4"
                placeholder="Inserisci qui il contesto, lo stack tecnico, snippet di codice o i dettagli della discussione..."
                :aria-invalid="!!errors.content"
                aria-describedby="err-content"
                class="bg-[#040814] border text-white px-3.5 py-2.5 rounded-xl outline-none transition-all text-xs font-sans resize-y"
                :class="errors.content ? 'border-rose-500 focus:border-rose-400' : 'border-slate-800 focus:border-emerald-500'"
              ></textarea>
              <span v-if="errors.content" id="err-content" class="text-rose-400 text-[11px] font-bold">
                ⚠️ {{ errors.content }}
              </span>
            </div>

            <!-- 5. DKP KERNEL CAPTCHA ENGINE -->
            <div class="bg-[#040814] border border-slate-800 p-4 rounded-xl flex flex-col gap-3 my-1">
              <div class="flex justify-between items-center">
                <span class="text-sky-400 font-black text-xs tracking-wider uppercase">
                  🛡️ DKP KERNEL CAPTCHA
                </span>
                <button
                  type="button"
                  @click="generateCaptcha"
                  class="text-slate-400 hover:text-emerald-400 font-bold text-[11px] transition-colors cursor-pointer"
                  title="Genera nuovo quesito"
                >
                  🔄 Rigenera
                </button>
              </div>
              
              <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <label for="submit-captchaAnswer" class="text-slate-300 text-xs">
                  Risolvi l'equazione di sicurezza:
                  <strong class="text-emerald-400 text-sm font-bold ml-1">{{ captchaNum1 }} + {{ captchaNum2 }} = ?</strong>
                </label>
                <input
                  id="submit-captchaAnswer"
                  v-model="form.captchaAnswer"
                  type="number"
                  placeholder="Risultato"
                  :aria-invalid="!!errors.captchaAnswer"
                  aria-describedby="err-captcha"
                  class="w-28 bg-[#080d1a] border text-center text-emerald-400 font-bold py-2 rounded-lg outline-none transition-all text-xs"
                  :class="errors.captchaAnswer ? 'border-rose-500' : 'border-slate-700 focus:border-emerald-500'"
                />
              </div>
              <span v-if="errors.captchaAnswer" id="err-captcha" class="text-rose-400 text-[11px] font-bold">
                ⚠️ {{ errors.captchaAnswer }}
              </span>
            </div>
          </template>

          <!-- BANNER MESSAGGI DI ERRORE O SUCCESSO -->
          <div v-if="errorMessage" role="alert" class="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-mono">
            ⚠️ {{ errorMessage }}
          </div>

          <div v-if="successMessage" role="status" class="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-mono">
            ⚡ {{ successMessage }}
          </div>

          <!-- SUBMIT BUTTON -->
          <button
            type="submit"
            class="w-full mt-2 py-3.5 px-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm transition-all shadow-[0_0_15px_rgba(0,220,130,0.25)] cursor-pointer disabled:opacity-50"
            :disabled="isSubmitting"
          >
            <span v-if="isSubmitting">Elaborazione Pure SQL nel Kernel... ⚡</span>
            <span v-else-if="isBlogSelected">Vai all'Editor Blog ➔</span>
            <span v-else>🚀 Pubblica Contenuto</span>
          </button>

        </form>

        <!-- INFO DASHBOARD UTENTE -->
        <div class="mt-8 pt-4 border-t border-slate-800/80 text-center font-mono text-xs text-slate-500">
          <span>📊 Potrai modificare o monitorare i tuoi post dalla </span>
          <NuxtLink to="/user/dashboard?tab=content" class="text-sky-400 hover:text-emerald-400 font-bold transition-colors no-underline">
            Dashboard Personale ➔
          </NuxtLink>
        </div>

      </div>
    </div>
  </div>
</template>