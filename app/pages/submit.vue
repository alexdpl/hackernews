<!-- app/pages/submit.vue -->
<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'

useHead({
  title: 'Invia Contenuto — DevKernelPulse v2.6-PURE-SQL',
  meta: [
    { name: 'description', content: 'Pubblica notizie, domande Ask, Showcase progetti o annunci Job nel Kernel DKP.' }
  ]
})

const router = useRouter()
const { currentUser, isAuthenticated } = useAuthCore()

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

// Opzioni Menù a Tendina Sezioni DKP v2.6
const sections: SectionOption[] = [
  { id: 'news', name: '📰 News Feed', description: 'Notizie tech, articoli ed ecosistema', targetRoute: '/feed' },
  { id: 'ask', name: '💬 Ask Community', description: 'Domande tecniche, supporto e dibattiti', targetRoute: '/ask' },
  { id: 'show', name: '⚡ Show DKP', description: 'Showcase e demo di progetti personali', targetRoute: '/show' },
  { id: 'job', name: '💼 Tech Jobs', description: 'Offerte di lavoro e posizioni aperte', targetRoute: '/jobs' },
  { id: 'blog', name: '✍️ DKP Blog', description: 'Usa l\'editor avanzato nella Dashboard', targetRoute: '/user/dashboard?tab=content' }
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

  if (form.type === 'ask' && !form.content.trim()) {
    errors.content = 'La descrizione/testo è obbligatoria per le domande della Ask Community.'
  }

  if (parseInt(form.captchaAnswer) !== captchaExpectedAnswer.value) {
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
        title: form.title,
        url: form.url,
        content: form.content,
        author: currentUser.value?.username || 'alexdpl',
        authorId: currentUser.value?.id || 1
      }
    })

    if (res?.success) {
      successMessage.value = res.message || 'Contenuto pubblicato nel Kernel DKP con successo!'
      setTimeout(() => {
        const selectedSec = sections.find(s => s.id === form.type)
        router.push(selectedSec ? selectedSec.targetRoute : '/')
      }, 1200)
    } else {
      throw new Error(res?.message || 'Errore imprevisto durante la pubblicazione.')
    }
  } catch (err: any) {
    errorMessage.value = err?.data?.message || err?.message || 'Errore durante la pubblicazione. Verifica i dati inseriti.'
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
  <div class="min-h-screen bg-[#020420] text-slate-300 py-12 px-4 sm:px-6 font-sans">
    <div class="max-w-2xl mx-auto bg-[#080d1a] border border-slate-800/80 rounded-2xl p-6 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-md">
      
      <!-- Glows Decorativi Cosmici -->
      <div class="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-20 -left-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <!-- BADGE HEADER -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 font-mono">
        <span class="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/40 px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider shadow-[0_0_12px_rgba(0,220,130,0.25)]">
          DKP KERNEL SUBMIT v2.6-PURE-SQL
        </span>
        <ClientOnly>
          <span v-if="isAuthenticated" class="text-xs text-slate-400">
            Autore: <strong class="text-emerald-400 font-bold">@{{ currentUser?.username }}</strong>
          </span>
        </ClientOnly>
      </div>

      <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
        Condividi nel <span class="text-emerald-400">Kernel DKP</span>
      </h1>
      <p class="text-slate-400 text-xs sm:text-sm leading-relaxed mb-6">
        Scegli la sezione, compila i dati e pubblica all'istante nell'ecosistema tech.
      </p>

      <form @submit.prevent="handleSubmit" class="flex flex-col gap-5 font-mono text-xs" novalidate>
        
        <!-- Campo Honeypot Nascosto -->
        <input 
          type="text" 
          v-model="form.websiteHoneypot" 
          tabindex="-1" 
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
          💡 <strong>Nota:</strong> Gli articoli del Blog richiedono l'Editor Avanzato per tag, formattazione Markdown e categorie. Verrai reindirizzato alla Dashboard per creare il tuo articolo.
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
              placeholder="Es. Rilasciato Nuxt 4: ecco le novità..." 
              :aria-invalid="!!errors.title"
              aria-describedby="err-title"
              class="bg-[#040814] border text-white px-3.5 py-2.5 rounded-xl outline-none transition-all text-xs"
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
              class="bg-[#040814] border text-white px-3.5 py-2.5 rounded-xl outline-none transition-all text-xs"
              :class="errors.url ? 'border-rose-500 focus:border-rose-400' : 'border-slate-800 focus:border-emerald-500'"
            />
            <span v-if="errors.url" id="err-url" class="text-rose-400 text-[11px] font-bold">
              ⚠️ {{ errors.url }}
            </span>
          </div>

          <!-- 4. TESTO / DESCRIZIONE BREVE -->
          <div class="flex flex-col gap-1.5">
            <label for="submit-content" class="text-slate-300 font-bold uppercase tracking-wider">
              Testo / Descrizione (Richiesto per Ask Community)
            </label>
            <textarea 
              id="submit-content"
              v-model="form.content" 
              rows="4" 
              placeholder="Inserisci qui il contesto, il codice o i dettagli della discussione..."
              :aria-invalid="!!errors.content"
              aria-describedby="err-content"
              class="bg-[#040814] border text-white px-3.5 py-2.5 rounded-xl outline-none transition-all text-xs resize-y"
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
          <span v-if="isSubmitting">Elaborazione nel Kernel... ⚡</span>
          <span v-else-if="isBlogSelected">Vai all'Editor Blog ➔</span>
          <span v-else>🚀 Pubblica Contenuto</span>
        </button>

      </form>

      <!-- INFO DASHBOARD UTENTE -->
      <div class="mt-8 pt-4 border-t border-slate-800/80 text-center font-mono text-xs text-slate-500">
        <span>📊 Nota: Potrai gestire i tuoi post dal Control Center della tua </span>
        <NuxtLink to="/user/dashboard?tab=content" class="text-sky-400 hover:text-emerald-400 font-bold transition-colors">
          Dashboard Personale ➔
        </NuxtLink>
      </div>

    </div>
  </div>
</template>